import { scoreLogoQuality } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageAssets } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

export type BrandAssetView = {
  id: string;
  organizationId: string | null;
  organizationName: string;
  status: string;
  originalBucket: string;
  originalPath: string;
  imageUrl: string | null;
  qualityScore: number;
  warnings: string[];
  metadata: {
    width?: number | null;
    height?: number | null;
    aspectRatio?: number | null;
    hasAlpha?: boolean;
    renderBlocked?: boolean;
    mimeType?: string;
  };
};

type OrganizationOption = {
  id: string;
  name: string;
};

const demoOrganizations: OrganizationOption[] = [{
  id: "00000000-0000-4000-8000-000000000401",
  name: "Acme Education",
}];

const demoLogos: BrandAssetView[] = [{
  id: "demo-logo",
  organizationId: demoOrganizations[0]?.id ?? null,
  organizationName: "Acme Education",
  status: "candidate",
  originalBucket: "company-logos",
  originalPath: "demo/acme/logo.png",
  imageUrl: null,
  qualityScore: 52,
  warnings: ["Raster logo has no detected transparency; background removal may be needed."],
  metadata: {
    width: 180,
    height: 120,
    aspectRatio: 1.5,
    hasAlpha: false,
    renderBlocked: true,
    mimeType: "image/png",
  },
}];

function uint32be(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] ?? 0) << 24) | ((bytes[offset + 1] ?? 0) << 16) | ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
}

function hasPngTransparencyChunk(bytes: Uint8Array) {
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = uint32be(bytes, offset);
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));

    if (type === "tRNS") {
      return true;
    }

    offset += 12 + length;
  }

  return false;
}

function parsePng(bytes: Uint8Array) {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  if (!isPng || bytes.length < 26) {
    return null;
  }

  const colorType = bytes[25] ?? 0;

  return {
    width: uint32be(bytes, 16),
    height: uint32be(bytes, 20),
    hasAlpha: colorType === 4 || colorType === 6 || hasPngTransparencyChunk(bytes),
  };
}

function parseJpeg(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1] ?? 0;
    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        width: ((bytes[offset + 7] ?? 0) << 8) | (bytes[offset + 8] ?? 0),
        height: ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0),
        hasAlpha: false,
      };
    }

    offset += 2 + length;
  }

  return null;
}

async function parseSvg(file: File) {
  const text = await file.text();
  const viewBox = text.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.-]+)\s+([\d.-]+)/i);
  const widthMatch = text.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = text.match(/\bheight=["']([\d.]+)/i);
  const width = widthMatch?.[1] ? Number(widthMatch[1]) : viewBox?.[1] ? Number(viewBox[1]) : null;
  const height = heightMatch?.[1] ? Number(heightMatch[1]) : viewBox?.[2] ? Number(viewBox[2]) : null;

  return {
    width,
    height,
    hasAlpha: /opacity=|fill-opacity=|rgba\(/i.test(text),
  };
}

async function inspectLogoFile(file: File) {
  const mimeType = file.type || (file.name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "application/octet-stream");

  if (mimeType === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    const svg = await parseSvg(file);
    return { ...svg, mimeType: "image/svg+xml", isSvg: true, fileSize: file.size };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const parsed = mimeType === "image/png" || file.name.toLowerCase().endsWith(".png")
    ? parsePng(bytes)
    : parseJpeg(bytes);

  return {
    width: parsed?.width ?? null,
    height: parsed?.height ?? null,
    hasAlpha: parsed?.hasAlpha ?? false,
    mimeType,
    isSvg: false,
    fileSize: file.size,
  };
}

function toView(row: Record<string, unknown>, imageUrl: string | null): BrandAssetView {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata as BrandAssetView["metadata"] : {};
  const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  const organizationName = typeof org === "object" && org && "name" in org ? String(org.name) : "Unknown organization";

  return {
    id: String(row.id),
    organizationId: row.organization_id ? String(row.organization_id) : null,
    organizationName,
    status: String(row.status),
    originalBucket: String(row.original_bucket),
    originalPath: String(row.original_path),
    imageUrl,
    qualityScore: row.quality_score === null || row.quality_score === undefined ? 0 : Number(row.quality_score),
    warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [],
    metadata,
  };
}

export async function getBrandAssetLibrary() {
  const profile = await getCurrentProfile();
  const canManage = canManageAssets(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      logos: demoLogos,
      organizations: demoOrganizations,
      canManage,
      source: "demo" as const,
      warning: "Supabase env is not configured; logo actions are disabled and demo data is shown.",
    };
  }

  const { data: logos, error: logoError } = await supabase
    .from("brand_assets")
    .select("id,organization_id,status,original_bucket,original_path,quality_score,warnings,metadata,organizations(name)")
    .order("created_at", { ascending: false });
  const { data: organizations } = await supabase.from("organizations").select("id,name").order("name", { ascending: true });

  return {
    logos: (logos ?? []).map((row) => {
      const { data: urlData } = supabase.storage.from(String(row.original_bucket)).getPublicUrl(String(row.original_path));
      return toView(row, urlData.publicUrl);
    }),
    organizations: (organizations ?? []).map((org) => ({ id: String(org.id), name: String(org.name) })),
    canManage,
    source: "supabase" as const,
    warning: logoError?.message ?? null,
  };
}

export async function uploadBrandLogo(organizationId: string, file: File | null) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can manage logos." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo logos are read-only." };
  }

  if (!organizationId) {
    return { ok: false, message: "Organization is required." };
  }

  if (!file || file.size === 0) {
    return { ok: false, message: "Logo file is required." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";

  if (!["png", "jpg", "jpeg", "svg"].includes(extension)) {
    return { ok: false, message: "Only PNG, JPG, and SVG logos are accepted." };
  }

  const info = await inspectLogoFile(file);
  const quality = scoreLogoQuality(info);
  const logoId = crypto.randomUUID();
  const originalPath = `organizations/${organizationId}/logos/${logoId}/original.${extension}`;
  const upload = await supabase.storage.from("company-logos").upload(originalPath, file, {
    contentType: info.mimeType,
    upsert: false,
  });

  if (upload.error) {
    return { ok: false, message: upload.error.message };
  }

  const { error } = await supabase.from("brand_assets").insert({
    id: logoId,
    organization_id: organizationId,
    status: "candidate",
    original_bucket: "company-logos",
    original_path: originalPath,
    quality_score: quality.score,
    warnings: quality.warnings,
    metadata: {
      ...info,
      aspectRatio: quality.aspectRatio,
      renderBlocked: quality.renderBlocked,
    },
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: `Logo uploaded with score ${quality.score}.` };
}

export async function approveBrandLogo(id: string, organizationId: string | null) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can approve logos." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo logos are read-only." };
  }

  if (organizationId) {
    await supabase.from("brand_assets").update({ status: "rejected", approved_by: null, approved_at: null }).eq("organization_id", organizationId).eq("status", "approved");
  }

  const { error } = await supabase
    .from("brand_assets")
    .update({
      status: "approved",
      approved_by: profile.id === "demo-user" ? null : profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Logo approved." };
}

export async function rejectBrandLogo(id: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can reject logos." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo logos are read-only." };
  }

  const { error } = await supabase.from("brand_assets").update({
    status: "rejected",
    approved_by: null,
    approved_at: null,
  }).eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Logo rejected." };
}
