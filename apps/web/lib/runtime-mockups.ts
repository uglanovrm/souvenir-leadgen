import { runtimeTemplateFormSchema, type RuntimeTemplateFormInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageAssets } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

export type RuntimeMockupTemplateView = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  productType: string;
  technology: string;
  tags: string[];
  qualityScore: number;
  sourceId: string | null;
  packageId: string | null;
  templateBucket: string;
  templatePrefix: string;
  previewPath: string | null;
  previewUrl: string | null;
  safeArea: { x: number; y: number; width: number; height: number };
  placement: { x: number; y: number; width: number; height: number; rotation: number };
};

type SelectOption = {
  id: string;
  name: string;
};

const demoTemplate: RuntimeMockupTemplateView = {
  id: "00000000-0000-4000-8000-000000000302",
  name: "Demo mug front view",
  status: "draft",
  isActive: true,
  productType: "mug",
  technology: "UV print",
  tags: ["hr", "education"],
  qualityScore: 82,
  sourceId: "00000000-0000-4000-8000-000000000301",
  packageId: "00000000-0000-4000-8000-000000000101",
  templateBucket: "mockup-templates",
  templatePrefix: "demo/mug/front",
  previewPath: "demo/mug/front/preview.png",
  previewUrl: null,
  safeArea: { x: 42, y: 31, width: 52, height: 36 },
  placement: { x: 42, y: 31, width: 52, height: 36, rotation: 0 },
};

function numericMetadata(metadata: Record<string, unknown>, key: string, fallback: number) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function geometry(metadata: Record<string, unknown>, key: "safe_area" | "placement", fallback: RuntimeMockupTemplateView["safeArea"]) {
  const value = typeof metadata[key] === "object" && metadata[key] ? metadata[key] as Record<string, unknown> : {};

  return {
    x: numericMetadata(value, "x", fallback.x),
    y: numericMetadata(value, "y", fallback.y),
    width: numericMetadata(value, "width", fallback.width),
    height: numericMetadata(value, "height", fallback.height),
    rotation: numericMetadata(value, "rotation", "rotation" in fallback ? Number(fallback.rotation) : 0),
  };
}

function toTemplateView(row: Record<string, unknown>, previewUrl: string | null): RuntimeMockupTemplateView {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata as Record<string, unknown> : {};
  const safeArea = geometry(metadata, "safe_area", demoTemplate.safeArea);
  const placement = geometry(metadata, "placement", demoTemplate.placement);

  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status ?? "draft"),
    isActive: Boolean(row.is_active),
    productType: String(row.product_type ?? ""),
    technology: String(row.technology ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    qualityScore: row.quality_score === null || row.quality_score === undefined ? 0 : Number(row.quality_score),
    sourceId: row.source_id ? String(row.source_id) : null,
    packageId: row.product_package_id ? String(row.product_package_id) : null,
    templateBucket: String(row.template_bucket),
    templatePrefix: String(row.template_prefix),
    previewPath: row.preview_path ? String(row.preview_path) : null,
    previewUrl,
    safeArea,
    placement,
  };
}

function metadataFromInput(input: RuntimeTemplateFormInput, paths: Record<string, string | null>) {
  return {
    required_files: ["base.png", "template.json"],
    layers: paths,
    safe_area: {
      x: input.safeAreaX,
      y: input.safeAreaY,
      width: input.safeAreaWidth,
      height: input.safeAreaHeight,
    },
    placement: {
      x: input.placementX,
      y: input.placementY,
      width: input.placementWidth,
      height: input.placementHeight,
      rotation: input.placementRotation,
    },
  };
}

async function uploadLayer(bucket: ReturnType<NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>["storage"]["from"]>, path: string, file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const upload = await bucket.upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (upload.error) {
    throw upload.error;
  }

  return path;
}

export async function getRuntimeMockupManager() {
  const profile = await getCurrentProfile();
  const canManage = canManageAssets(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      templates: [demoTemplate],
      sources: [{ id: "00000000-0000-4000-8000-000000000301", name: "Demo mug PSD source" }],
      packages: [{ id: "00000000-0000-4000-8000-000000000101", name: "Welcome merch starter pack" }],
      canManage,
      source: "demo" as const,
      warning: "Supabase env is not configured; runtime mockup actions are disabled and demo data is shown.",
    };
  }

  const { data: templates, error: templateError } = await supabase
    .from("mockup_templates")
    .select("id,name,status,source_id,product_package_id,template_bucket,template_prefix,preview_path,metadata,is_active,product_type,technology,tags,quality_score")
    .order("created_at", { ascending: false });
  const { data: sources } = await supabase.from("mockup_template_sources").select("id,name").order("name", { ascending: true });
  const { data: packages } = await supabase.from("product_packages").select("id,name").eq("is_active", true).order("name", { ascending: true });

  return {
    templates: (templates ?? []).map((row) => {
      const { data: urlData } = row.preview_path
        ? supabase.storage.from(String(row.template_bucket)).getPublicUrl(String(row.preview_path))
        : { data: { publicUrl: null } };

      return toTemplateView(row, urlData.publicUrl);
    }),
    sources: (sources ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })) satisfies SelectOption[],
    packages: (packages ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })) satisfies SelectOption[],
    canManage,
    source: "supabase" as const,
    warning: templateError?.message ?? null,
  };
}

export async function createRuntimeMockupTemplate(input: RuntimeTemplateFormInput, files: Record<string, File | null>) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can manage runtime mockup templates." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo runtime templates are read-only." };
  }

  const parsed = runtimeTemplateFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid runtime template." };
  }

  if (!files.base || files.base.size === 0 || !files.preview || files.preview.size === 0) {
    return { ok: false, message: "base.png and preview image are required." };
  }

  const templateId = crypto.randomUUID();
  const prefix = `runtime/${templateId}`;
  const bucket = supabase.storage.from("mockup-templates");

  try {
    const paths = {
      base: await uploadLayer(bucket, `${prefix}/base.png`, files.base),
      mask: await uploadLayer(bucket, `${prefix}/mask.png`, files.mask ?? null),
      shadow: await uploadLayer(bucket, `${prefix}/shadow.png`, files.shadow ?? null),
      highlight: await uploadLayer(bucket, `${prefix}/highlight.png`, files.highlight ?? null),
      preview: await uploadLayer(bucket, `${prefix}/preview.jpg`, files.preview),
    };
    const tags = parsed.data.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    const { error } = await supabase.from("mockup_templates").insert({
      id: templateId,
      source_id: parsed.data.sourceId || null,
      name: parsed.data.name,
      product_package_id: parsed.data.productPackageId || null,
      template_bucket: "mockup-templates",
      template_prefix: prefix,
      preview_path: paths.preview,
      metadata: metadataFromInput(parsed.data, paths),
      is_active: parsed.data.isActive,
      status: parsed.data.status,
      product_type: parsed.data.productType,
      technology: parsed.data.technology,
      tags,
      quality_score: parsed.data.qualityScore,
      created_by: profile.id === "demo-user" ? null : profile.id,
    });

    return error ? { ok: false, message: error.message } : { ok: true, message: "Runtime mockup template created." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
