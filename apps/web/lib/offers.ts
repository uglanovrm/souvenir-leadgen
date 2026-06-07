import { offerEditFormSchema, type OfferEditFormInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { createSupabaseServerClient } from "./supabase/server";

export type OfferListItemView = {
  id: string;
  title: string;
  status: string;
  organizationName: string;
  packageName: string;
  warningCount: number;
  updatedAt: string;
};

export type OfferEditorView = OfferListItemView & {
  summary: string;
  body: string;
  productPackageId: string;
  selectedPortfolioAssetIds: string[];
  warnings: string[];
  packages: Array<{
    id: string;
    name: string;
    priceFrom: number;
    productionDays: number;
  }>;
  portfolioAssets: Array<{
    id: string;
    title: string;
    packageId: string | null;
    allowedForOffer: boolean;
  }>;
};

const demoOffer: OfferEditorView = {
  id: "demo-offer",
  title: "Welcome merch for Acme Education",
  status: "draft",
  organizationName: "Acme Education",
  packageName: "Welcome merch starter pack",
  warningCount: 1,
  updatedAt: new Date("2026-06-07T12:40:00.000Z").toISOString(),
  summary: "A compact onboarding merch offer based on the selected starter package.",
  body: "Offer Acme Education a welcome merch starter pack using the catalog-backed minimum quantity, starting price, and production days. Keep this as a review draft until a human approves the wording and warnings.",
  productPackageId: "00000000-0000-4000-8000-000000000101",
  selectedPortfolioAssetIds: ["00000000-0000-4000-8000-000000000601"],
  warnings: ["Missing Avito link in lead evidence."],
  packages: [{
    id: "00000000-0000-4000-8000-000000000101",
    name: "Welcome merch starter pack",
    priceFrom: 790,
    productionDays: 7,
  }],
  portfolioAssets: [{
    id: "00000000-0000-4000-8000-000000000601",
    title: "Demo branded mug",
    packageId: "00000000-0000-4000-8000-000000000101",
    allowedForOffer: true,
  }],
};

function draftText(row: Record<string, unknown>, key: "body") {
  const draft = typeof row.draft === "object" && row.draft ? row.draft as Record<string, unknown> : {};
  return typeof draft[key] === "string" ? draft[key] : "";
}

function warningList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function relationName(value: unknown, fallback: string) {
  const relation = Array.isArray(value) ? value[0] : value;

  if (typeof relation === "object" && relation && "name" in relation) {
    return String(relation.name);
  }

  return fallback;
}

function mapOfferList(row: Record<string, unknown>): OfferListItemView {
  const warnings = warningList(row.warnings);

  return {
    id: String(row.id),
    title: String(row.title),
    status: String(row.status),
    organizationName: relationName(row.organizations, "Unknown organization"),
    packageName: relationName(row.product_packages, "No package selected"),
    warningCount: warnings.length,
    updatedAt: String(row.updated_at),
  };
}

export async function listOffers() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      offers: [demoOffer],
      source: "demo" as const,
      warning: "Supabase env is not configured; offer actions are disabled and demo data is shown.",
    };
  }

  const { data, error } = await supabase
    .from("offers")
    .select("id,title,status,warnings,updated_at,organizations(name),product_packages(name)")
    .order("updated_at", { ascending: false });

  if (error) {
    return { offers: [], source: "supabase" as const, warning: error.message };
  }

  return { offers: (data ?? []).map(mapOfferList), source: "supabase" as const, warning: null };
}

export async function getOfferEditor(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      offer: id === demoOffer.id ? demoOffer : null,
      source: "demo" as const,
      warning: "Supabase env is not configured; demo offer is read-only.",
    };
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .select("id,title,summary,draft,warnings,status,updated_at,product_package_id,organizations(name),product_packages(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !offer) {
    return { offer: null, source: "supabase" as const, warning: error?.message ?? "Offer not found." };
  }

  const { data: packages } = await supabase
    .from("product_packages")
    .select("id,name,price_from,production_days")
    .eq("is_active", true)
    .order("name", { ascending: true });
  const { data: portfolioAssets } = await supabase
    .from("portfolio_assets")
    .select("id,title,package_id,allowed_for_offer")
    .eq("allowed_for_offer", true)
    .order("created_at", { ascending: false });
  const { data: offerAssets } = await supabase
    .from("offer_assets")
    .select("metadata")
    .eq("offer_id", id)
    .eq("asset_kind", "portfolio");

  const selectedPortfolioAssetIds = (offerAssets ?? [])
    .map((asset) => {
      const metadata = typeof asset.metadata === "object" && asset.metadata ? asset.metadata as Record<string, unknown> : {};
      return typeof metadata.portfolio_asset_id === "string" ? metadata.portfolio_asset_id : null;
    })
    .filter((assetId): assetId is string => Boolean(assetId));

  return {
    offer: {
      ...mapOfferList(offer),
      summary: offer.summary ? String(offer.summary) : "",
      body: draftText(offer, "body"),
      productPackageId: String(offer.product_package_id ?? ""),
      selectedPortfolioAssetIds,
      warnings: warningList(offer.warnings),
      packages: (packages ?? []).map((item) => ({
        id: String(item.id),
        name: String(item.name),
        priceFrom: Number(item.price_from),
        productionDays: Number(item.production_days),
      })),
      portfolioAssets: (portfolioAssets ?? []).map((asset) => ({
        id: String(asset.id),
        title: String(asset.title),
        packageId: asset.package_id ? String(asset.package_id) : null,
        allowedForOffer: Boolean(asset.allowed_for_offer),
      })),
    },
    source: "supabase" as const,
    warning: null,
  };
}

export async function saveOfferDraft(id: string, input: OfferEditFormInput) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo offer is read-only." };
  }

  const parsed = offerEditFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid offer draft." };
  }

  const profile = await getCurrentProfile();
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("offers")
    .select("draft")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false, message: existingError?.message ?? "Offer not found." };
  }

  const currentDraft = typeof existing.draft === "object" && existing.draft ? existing.draft as Record<string, unknown> : {};
  const nextDraft = {
    ...currentDraft,
    title: parsed.data.title,
    summary: parsed.data.summary,
    body: parsed.data.body,
    selectedPackageIds: [parsed.data.productPackageId],
    selectedPortfolioAssetIds: parsed.data.portfolioAssetIds,
    warnings: parsed.data.warnings,
    editedAt: now,
  };

  const { error: updateError } = await supabase
    .from("offers")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary,
      product_package_id: parsed.data.productPackageId,
      draft: nextDraft,
      warnings: parsed.data.warnings,
      status: "draft",
    })
    .eq("id", id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await supabase.from("offer_assets").delete().eq("offer_id", id).eq("asset_kind", "portfolio");

  if (parsed.data.portfolioAssetIds.length > 0) {
    const { data: assets, error: assetError } = await supabase
      .from("portfolio_assets")
      .select("id,title,storage_bucket,storage_path")
      .in("id", parsed.data.portfolioAssetIds)
      .eq("allowed_for_offer", true);

    if (assetError) {
      return { ok: false, message: assetError.message };
    }

    const { error: insertError } = await supabase.from("offer_assets").insert((assets ?? []).map((asset) => ({
      offer_id: id,
      asset_kind: "portfolio",
      storage_bucket: String(asset.storage_bucket),
      storage_path: String(asset.storage_path),
      sendable: false,
      metadata: { portfolio_asset_id: String(asset.id), title: String(asset.title) },
    })));

    if (insertError) {
      return { ok: false, message: insertError.message };
    }
  }

  await supabase.from("audit_events").insert({
    actor_id: profile.id === "demo-user" ? null : profile.id,
    action: "offer.save_draft",
    entity_type: "offer",
    entity_id: id,
    metadata: { warning_count: parsed.data.warnings.length },
  });

  return { ok: true, message: "Offer draft saved." };
}

export async function approveOffer(id: string, input: OfferEditFormInput) {
  const saved = await saveOfferDraft(id, input);

  if (!saved.ok) {
    return saved;
  }

  if (input.warnings.length > 0 && !input.warningsAccepted) {
    return { ok: false, message: "Warnings must be explicitly accepted before approval." };
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo offer is read-only." };
  }

  const { error } = await supabase
    .from("offers")
    .update({
      status: "approved",
      approved_by: profile.id === "demo-user" ? null : profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Offer approved." };
}
