import { portfolioAssetFormSchema, type PortfolioAssetFormInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageAssets } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

export type PortfolioAssetView = {
  id: string;
  title: string;
  packageId: string | null;
  storageBucket: string;
  storagePath: string;
  imageUrl: string | null;
  metadata: {
    technology?: string;
    industry?: string;
    productType?: string;
    material?: string;
    qualityScore?: number;
  };
  allowedForOffer: boolean;
};

export type AssetLibraryViewModel = {
  assets: PortfolioAssetView[];
  canManage: boolean;
  source: "supabase" | "demo";
  warning: string | null;
};

const demoAssets: PortfolioAssetView[] = [
  {
    id: "demo-asset-mug",
    title: "Demo branded mug",
    packageId: "demo-welcome-pack",
    storageBucket: "portfolio-assets",
    storagePath: "demo/mug.png",
    imageUrl: null,
    metadata: {
      technology: "UV print",
      industry: "events",
      productType: "mug",
      material: "ceramic",
      qualityScore: 84,
    },
    allowedForOffer: true,
  },
];

function metadataFromInput(input: PortfolioAssetFormInput) {
  return {
    technology: input.technology,
    industry: input.industry,
    productType: input.productType,
    material: input.material,
    qualityScore: input.qualityScore,
  };
}

function toView(row: Record<string, unknown>, publicUrl: string | null): PortfolioAssetView {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata as PortfolioAssetView["metadata"] : {};

  return {
    id: String(row.id),
    title: String(row.title),
    packageId: row.package_id ? String(row.package_id) : null,
    storageBucket: String(row.storage_bucket),
    storagePath: String(row.storage_path),
    imageUrl: publicUrl,
    metadata,
    allowedForOffer: Boolean(row.allowed_for_offer),
  };
}

export async function getAssetLibraryViewModel(): Promise<AssetLibraryViewModel> {
  const profile = await getCurrentProfile();
  const canManage = canManageAssets(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      assets: demoAssets,
      canManage,
      source: "demo",
      warning: "Supabase env is not configured; asset library actions are disabled and demo data is shown.",
    };
  }

  const { data, error } = await supabase
    .from("portfolio_assets")
    .select("id,title,package_id,storage_bucket,storage_path,metadata,allowed_for_offer")
    .order("created_at", { ascending: false });

  if (error) {
    return { assets: [], canManage, source: "supabase", warning: error.message };
  }

  const assets = (data ?? []).map((row) => {
    const { data: urlData } = supabase.storage.from(String(row.storage_bucket)).getPublicUrl(String(row.storage_path));
    return toView(row, urlData.publicUrl);
  });

  return { assets, canManage, source: "supabase", warning: null };
}

export async function listAllowedPortfolioAssets() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoAssets.filter((asset) => asset.allowedForOffer);
  }

  const { data } = await supabase
    .from("portfolio_assets")
    .select("id,title,package_id,storage_bucket,storage_path,metadata,allowed_for_offer")
    .eq("allowed_for_offer", true)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => toView(row, null));
}

export async function createPortfolioAsset(input: PortfolioAssetFormInput, file: File | null) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can manage portfolio assets." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo asset library is read-only." };
  }

  const parsed = portfolioAssetFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid portfolio asset." };
  }

  if (!file || file.size === 0) {
    return { ok: false, message: "Image file is required." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const assetId = crypto.randomUUID();
  const storagePath = `assets/${assetId}/original.${extension}`;
  const upload = await supabase.storage.from("portfolio-assets").upload(storagePath, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (upload.error) {
    return { ok: false, message: upload.error.message };
  }

  const { error } = await supabase.from("portfolio_assets").insert({
    id: assetId,
    package_id: parsed.data.packageId || null,
    title: parsed.data.title,
    storage_bucket: "portfolio-assets",
    storage_path: storagePath,
    mime_type: file.type || null,
    allowed_for_offer: parsed.data.allowedForOffer,
    metadata: metadataFromInput(parsed.data),
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "Asset uploaded." };
}

export async function updatePortfolioAssetMetadata(id: string, input: PortfolioAssetFormInput) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can edit portfolio assets." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo asset library is read-only." };
  }

  const parsed = portfolioAssetFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid portfolio asset metadata." };
  }

  const { error } = await supabase
    .from("portfolio_assets")
    .update({
      title: parsed.data.title,
      package_id: parsed.data.packageId || null,
      allowed_for_offer: parsed.data.allowedForOffer,
      metadata: metadataFromInput(parsed.data),
    })
    .eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Asset metadata updated." };
}
