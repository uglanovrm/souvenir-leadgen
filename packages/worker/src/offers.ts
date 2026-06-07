import type { SupabaseClient } from "@supabase/supabase-js";
import {
  offerDraftSchema,
  offerGeneratePayloadSchema,
  type OfferDraft,
  type OfferGeneratePayload,
} from "@souvenir-leadgen/shared";
import { generateJson, type CompletionProvider } from "./llm/generate-json.js";

type CampaignLeadContext = {
  id: string;
  status: string;
  score: number | null;
  evidence: Record<string, unknown>;
  campaign: {
    id: string;
    name: string;
    description: string | null;
    target_industries: string[] | null;
  } | null;
  organization: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    city: string | null;
    notes: string | null;
  } | null;
  contact: {
    id: string;
    full_name: string;
    role_title: string | null;
    email: string | null;
  } | null;
};

type ProductPackageContext = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  technology: string;
  min_quantity: number;
  price_from: number;
  production_days: number;
  target_industries: string[] | null;
};

type PortfolioAssetContext = {
  id: string;
  package_id: string | null;
  title: string;
  storage_bucket: string;
  storage_path: string;
  allowed_for_offer: boolean;
  metadata: Record<string, unknown>;
};

export type OfferContext = {
  lead: CampaignLeadContext;
  packages: ProductPackageContext[];
  portfolioAssets: PortfolioAssetContext[];
  warnings: string[];
};

function evidenceHasAvitoLink(evidence: Record<string, unknown>) {
  const direct = evidence.avito_url ?? evidence.avitoUrl ?? evidence.avito_link ?? evidence.avitoLink;

  if (typeof direct === "string" && direct.trim()) {
    return true;
  }

  const links = evidence.links;

  if (Array.isArray(links)) {
    return links.some((link) => typeof link === "string" && link.includes("avito."));
  }

  return false;
}

export async function buildOfferContext(
  supabase: SupabaseClient,
  payload: OfferGeneratePayload,
): Promise<OfferContext> {
  const { data: lead, error: leadError } = await supabase
    .from("campaign_leads")
    .select(`
      id,
      status,
      score,
      evidence,
      campaign:campaigns(id,name,description,target_industries),
      organization:organizations(id,name,website,industry,city,notes),
      contact:contacts(id,full_name,role_title,email)
    `)
    .eq("id", payload.campaignLeadId)
    .maybeSingle();

  if (leadError) {
    throw leadError;
  }

  if (!lead) {
    throw new Error(`Campaign lead not found: ${payload.campaignLeadId}`);
  }

  const warnings: string[] = [];
  const typedLead = lead as unknown as CampaignLeadContext;

  if (!evidenceHasAvitoLink(typedLead.evidence ?? {})) {
    warnings.push("Missing Avito link in lead evidence.");
  }

  const packageQuery = supabase
    .from("product_packages")
    .select("id,name,slug,description,technology,min_quantity,price_from,production_days,target_industries")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const { data: packages, error: packageError } = payload.selectedPackageIds.length > 0
    ? await packageQuery.in("id", payload.selectedPackageIds)
    : await packageQuery.limit(3);

  if (packageError) {
    throw packageError;
  }

  if (!packages?.length) {
    throw new Error("No eligible product packages found for offer.generate.");
  }

  const packageIds = payload.selectedPackageIds.length > 0
    ? payload.selectedPackageIds
    : (packages as ProductPackageContext[]).map((item) => item.id);

  const assetQuery = supabase
    .from("portfolio_assets")
    .select("id,package_id,title,storage_bucket,storage_path,allowed_for_offer,metadata")
    .eq("allowed_for_offer", true)
    .order("created_at", { ascending: true });

  const { data: portfolioAssets, error: assetError } = payload.selectedPortfolioAssetIds.length > 0
    ? await assetQuery.in("id", payload.selectedPortfolioAssetIds)
    : await assetQuery.in("package_id", packageIds).limit(5);

  if (assetError) {
    throw assetError;
  }

  return {
    lead: typedLead,
    packages: packages as ProductPackageContext[],
    portfolioAssets: (portfolioAssets ?? []) as PortfolioAssetContext[],
    warnings,
  };
}

function buildOfferPrompt(context: OfferContext) {
  return [
    "Generate a structured B2B souvenir offer draft as JSON.",
    "Use only the supplied database context. Do not invent prices, production schedules, discounts, URLs, assets, or capabilities.",
    "If context is missing, add a warning instead of filling it with assumptions.",
    "Return JSON with keys: title, summary, body, selectedPackageIds, selectedPortfolioAssetIds, warnings, confidence, sourceIdsUsed.",
    "Use camelCase keys exactly.",
    JSON.stringify(context),
  ].join("\n\n");
}

function mergeWarnings(draft: OfferDraft, context: OfferContext): OfferDraft {
  return {
    ...draft,
    warnings: Array.from(new Set([...context.warnings, ...draft.warnings])),
  };
}

function assertDraftUsesContext(draft: OfferDraft, context: OfferContext) {
  const packageIds = new Set(context.packages.map((item) => item.id));
  const portfolioAssetIds = new Set(context.portfolioAssets.map((item) => item.id));
  const unknownPackageId = draft.selectedPackageIds.find((id) => !packageIds.has(id));
  const unknownAssetId = draft.selectedPortfolioAssetIds.find((id) => !portfolioAssetIds.has(id));

  if (unknownPackageId) {
    throw new Error(`Offer draft selected package outside context: ${unknownPackageId}`);
  }

  if (unknownAssetId) {
    throw new Error(`Offer draft selected portfolio asset outside context: ${unknownAssetId}`);
  }
}

export async function generateDraftOffer(
  supabase: SupabaseClient,
  provider: CompletionProvider,
  rawPayload: Record<string, unknown>,
) {
  const payload = offerGeneratePayloadSchema.parse(rawPayload);
  const context = await buildOfferContext(supabase, payload);
  const generated = await generateJson(provider, offerDraftSchema, buildOfferPrompt(context));
  const draft = mergeWarnings(generated, context);
  assertDraftUsesContext(draft, context);
  const productPackageId = draft.selectedPackageIds[0] ?? context.packages[0]?.id;

  if (!productPackageId) {
    throw new Error("Offer draft did not select a product package.");
  }

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      campaign_lead_id: payload.campaignLeadId,
      organization_id: context.lead.organization?.id ?? null,
      product_package_id: productPackageId,
      status: "draft",
      title: draft.title,
      summary: draft.summary,
      draft,
      warnings: draft.warnings,
      created_by: payload.createdBy ?? null,
    })
    .select("id")
    .single();

  if (offerError) {
    throw offerError;
  }

  const offerId = (offer as { id: string }).id;
  const selectedAssets = context.portfolioAssets.filter((asset) => draft.selectedPortfolioAssetIds.includes(asset.id));

  if (selectedAssets.length > 0) {
    const { error: assetInsertError } = await supabase.from("offer_assets").insert(
      selectedAssets.map((asset) => ({
        offer_id: offerId,
        asset_kind: "portfolio",
        storage_bucket: asset.storage_bucket,
        storage_path: asset.storage_path,
        sendable: false,
        metadata: {
          portfolio_asset_id: asset.id,
          title: asset.title,
        },
      })),
    );

    if (assetInsertError) {
      throw assetInsertError;
    }
  }

  return {
    offerId,
    draft,
    contextWarnings: context.warnings,
    selectedPortfolioAssetCount: selectedAssets.length,
  };
}
