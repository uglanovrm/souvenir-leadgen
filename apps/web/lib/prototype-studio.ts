import { selectMockupTemplates, type RankedTemplate, type TemplateSelectorBrief, type TemplateSelectorCandidate } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageAssets } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

type LogoCandidateView = {
  id: string;
  organizationId: string | null;
  organizationName: string;
  status: string;
  qualityScore: number;
  warnings: string[];
  imageUrl: string | null;
};

type PrototypeBriefView = {
  id: string;
  offerId: string | null;
  offerTitle: string;
  organizationName: string;
  brandAssetId: string | null;
  selectedTemplateId: string | null;
  status: string;
};

type MockupRenderView = {
  id: string;
  status: string;
  imageUrl: string | null;
  qcScore: number | null;
  qcWarnings: string[];
  templateProductType: string | null;
  finalOfferEligible: boolean;
};

export type PrototypeStudioView = {
  brief: TemplateSelectorBrief;
  activeBrief: PrototypeBriefView | null;
  logos: LogoCandidateView[];
  rankedTemplates: RankedTemplate[];
  renders: MockupRenderView[];
  canManage: boolean;
  source: "supabase" | "demo";
  warning: string | null;
};

const demoBrief: TemplateSelectorBrief = {
  productType: "mug",
  technology: "UV print",
  industryTags: ["education", "hr"],
  logoAspectRatio: 1.5,
};

const demoCandidates: TemplateSelectorCandidate[] = [
  {
    id: "00000000-0000-4000-8000-000000000302",
    name: "Demo mug front view",
    isActive: true,
    productType: "mug",
    technology: "UV print",
    tags: ["education", "hr"],
    qualityScore: 82,
    placementAspectRatio: 1.44,
  },
  {
    id: "demo-bottle-wide",
    name: "Demo bottle wrap",
    isActive: true,
    productType: "bottle",
    technology: "Laser",
    tags: ["events"],
    qualityScore: 68,
    placementAspectRatio: 5.5,
  },
];

const demoLogo: LogoCandidateView = {
  id: "demo-logo",
  organizationId: "00000000-0000-4000-8000-000000000401",
  organizationName: "Acme Education",
  status: "candidate",
  qualityScore: 52,
  warnings: ["Raster logo has no detected transparency; background removal may be needed."],
  imageUrl: null,
};

const demoActiveBrief: PrototypeBriefView = {
  id: "demo-brief",
  offerId: "demo-offer",
  offerTitle: "Welcome merch for Acme Education",
  organizationName: "Acme Education",
  brandAssetId: demoLogo.id,
  selectedTemplateId: demoCandidates[0]?.id ?? null,
  status: "generated",
};

const demoRenders: MockupRenderView[] = [{
  id: "demo-render",
  status: "needs_review",
  imageUrl: null,
  qcScore: 52,
  qcWarnings: ["low_contrast: Rendered preview has low contrast."],
  templateProductType: "mug",
  finalOfferEligible: false,
}];

function placementAspectRatio(metadata: unknown) {
  const typed = typeof metadata === "object" && metadata ? metadata as Record<string, unknown> : {};
  const placement = typeof typed.placement === "object" && typed.placement ? typed.placement as Record<string, unknown> : {};
  const width = typeof placement.width === "number" ? placement.width : null;
  const height = typeof placement.height === "number" ? placement.height : null;

  return width && height ? width / height : null;
}

function relationName(value: unknown, fallback: string) {
  const relation = Array.isArray(value) ? value[0] : value;

  if (typeof relation === "object" && relation && "name" in relation) {
    return String(relation.name);
  }

  return fallback;
}

function offerInfo(value: unknown) {
  const offer = Array.isArray(value) ? value[0] : value;
  const typed = metadataRecord(offer);

  return {
    title: typeof typed.title === "string" ? typed.title : "No offer linked",
    organizationName: relationName(typed.organizations, "Unknown organization"),
  };
}

function warningList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function metadataRecord(value: unknown) {
  return typeof value === "object" && value ? value as Record<string, unknown> : {};
}

export async function getPrototypeStudioView(): Promise<PrototypeStudioView> {
  const profile = await getCurrentProfile();
  const canManage = canManageAssets(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      brief: demoBrief,
      activeBrief: demoActiveBrief,
      logos: [demoLogo],
      rankedTemplates: selectMockupTemplates(demoBrief, demoCandidates, 5),
      renders: demoRenders,
      canManage,
      source: "demo",
      warning: "Supabase env is not configured; prototype actions are disabled and demo data is shown.",
    };
  }

  const { data: logos, error: logoError } = await supabase
    .from("brand_assets")
    .select("id,organization_id,status,original_bucket,original_path,quality_score,warnings,metadata,organizations(name)")
    .in("status", ["approved", "candidate"])
    .order("approved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(6);
  const primaryLogo = logos?.[0] ?? null;
  const logoMetadata = metadataRecord(primaryLogo?.metadata);
  const { data: activeBriefRow } = await supabase
    .from("prototype_briefs")
    .select("id,offer_id,brand_asset_id,mockup_template_id,status,brief,warnings,offers(title,organizations(name))")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const activeBriefData = metadataRecord(activeBriefRow?.brief);
  const brief: TemplateSelectorBrief = {
    productType: typeof activeBriefData.productType === "string" ? activeBriefData.productType : "mug",
    technology: typeof activeBriefData.technology === "string" ? activeBriefData.technology : "UV print",
    industryTags: Array.isArray(activeBriefData.industryTags) ? activeBriefData.industryTags.map(String) : ["education", "hr"],
    logoAspectRatio: typeof logoMetadata.aspectRatio === "number" ? logoMetadata.aspectRatio : null,
  };
  const { data: templates, error } = await supabase
    .from("mockup_templates")
    .select("id,name,is_active,product_type,technology,tags,quality_score,metadata")
    .order("created_at", { ascending: false });

  const candidates: TemplateSelectorCandidate[] = (templates ?? []).map((template) => ({
    id: String(template.id),
    name: String(template.name),
    isActive: Boolean(template.is_active),
    productType: String(template.product_type ?? ""),
    technology: String(template.technology ?? ""),
    tags: Array.isArray(template.tags) ? template.tags.map(String) : [],
    qualityScore: template.quality_score === null || template.quality_score === undefined ? 0 : Number(template.quality_score),
    placementAspectRatio: placementAspectRatio(template.metadata),
  }));
  const activeBriefOffer = offerInfo(activeBriefRow?.offers);
  const activeBrief = activeBriefRow ? {
    id: String(activeBriefRow.id),
    offerId: activeBriefRow.offer_id ? String(activeBriefRow.offer_id) : null,
    offerTitle: activeBriefOffer.title,
    organizationName: activeBriefOffer.organizationName,
    brandAssetId: activeBriefRow.brand_asset_id ? String(activeBriefRow.brand_asset_id) : null,
    selectedTemplateId: activeBriefRow.mockup_template_id ? String(activeBriefRow.mockup_template_id) : null,
    status: String(activeBriefRow.status),
  } : null;
  const { data: renders } = activeBrief
    ? await supabase
      .from("prototype_renders")
      .select("id,status,storage_bucket,storage_path,qc_score,qc_warnings,metadata")
      .eq("prototype_brief_id", activeBrief.id)
      .order("created_at", { ascending: false })
    : { data: [] };

  return {
    brief,
    activeBrief,
    logos: (logos ?? []).map((row) => {
      const { data: urlData } = supabase.storage.from(String(row.original_bucket)).getPublicUrl(String(row.original_path));
      return {
        id: String(row.id),
        organizationId: row.organization_id ? String(row.organization_id) : null,
        organizationName: relationName(row.organizations, "Unknown organization"),
        status: String(row.status),
        qualityScore: row.quality_score === null || row.quality_score === undefined ? 0 : Number(row.quality_score),
        warnings: warningList(row.warnings),
        imageUrl: urlData.publicUrl,
      };
    }),
    rankedTemplates: selectMockupTemplates(brief, candidates, 5),
    renders: (renders ?? []).map((row) => {
      const metadata = metadataRecord(row.metadata);
      const { data: urlData } = supabase.storage.from(String(row.storage_bucket)).getPublicUrl(String(row.storage_path));
      return {
        id: String(row.id),
        status: String(row.status),
        imageUrl: urlData.publicUrl,
        qcScore: row.qc_score === null || row.qc_score === undefined ? null : Number(row.qc_score),
        qcWarnings: warningList(row.qc_warnings),
        templateProductType: typeof metadata.template_product_type === "string" ? metadata.template_product_type : null,
        finalOfferEligible: metadata.final_offer_eligible === true,
      };
    }),
    canManage,
    source: "supabase",
    warning: logoError?.message ?? error?.message ?? null,
  };
}

export async function approvePrototypeRender(renderId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can approve mockups." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo mockups are read-only." };
  }

  const { data: render, error: renderError } = await supabase
    .from("prototype_renders")
    .select("id,prototype_brief_id,storage_bucket,storage_path,qc_score,metadata,prototype_briefs(offer_id)")
    .eq("id", renderId)
    .maybeSingle();

  if (renderError || !render) {
    return { ok: false, message: renderError?.message ?? "Prototype render not found." };
  }

  const metadata = metadataRecord(render.metadata);
  const { error: updateError } = await supabase
    .from("prototype_renders")
    .update({
      status: "approved",
      approved_by: profile.id === "demo-user" ? null : profile.id,
      approved_at: new Date().toISOString(),
      metadata: { ...metadata, final_offer_eligible: true },
    })
    .eq("id", renderId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const brief = Array.isArray(render.prototype_briefs) ? render.prototype_briefs[0] : render.prototype_briefs;
  const offerId = typeof brief === "object" && brief && "offer_id" in brief && brief.offer_id ? String(brief.offer_id) : null;

  if (offerId) {
    await supabase.from("offer_assets").delete().eq("offer_id", offerId).eq("asset_kind", "prototype_render").eq("storage_bucket", String(render.storage_bucket)).eq("storage_path", String(render.storage_path));
    const { error: assetError } = await supabase.from("offer_assets").insert({
      offer_id: offerId,
      asset_kind: "prototype_render",
      storage_bucket: String(render.storage_bucket),
      storage_path: String(render.storage_path),
      sendable: false,
      metadata: { prototype_render_id: renderId, qc_score: render.qc_score ?? null },
    });

    if (assetError) {
      return { ok: false, message: assetError.message };
    }
  }

  return { ok: true, message: "Mockup approved and linked to offer assets." };
}

export async function rejectPrototypeRender(renderId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can reject mockups." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo mockups are read-only." };
  }

  const { data: render, error: renderError } = await supabase
    .from("prototype_renders")
    .select("id,storage_bucket,storage_path,metadata")
    .eq("id", renderId)
    .maybeSingle();

  if (renderError || !render) {
    return { ok: false, message: renderError?.message ?? "Prototype render not found." };
  }

  const metadata = metadataRecord(render.metadata);
  const { error } = await supabase
    .from("prototype_renders")
    .update({
      status: "rejected",
      approved_by: null,
      approved_at: null,
      metadata: { ...metadata, final_offer_eligible: false },
    })
    .eq("id", renderId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase
    .from("offer_assets")
    .delete()
    .eq("asset_kind", "prototype_render")
    .eq("storage_bucket", String(render.storage_bucket))
    .eq("storage_path", String(render.storage_path));

  return { ok: true, message: "Mockup rejected and removed from offer assets." };
}

export async function switchPrototypeTemplate(briefId: string, templateId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can switch templates." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo briefs are read-only." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("prototype_briefs")
    .select("brief")
    .eq("id", briefId)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false, message: existingError?.message ?? "Prototype brief not found." };
  }

  const currentBrief = metadataRecord(existing.brief);
  const { error } = await supabase
    .from("prototype_briefs")
    .update({
      mockup_template_id: templateId,
      status: "draft",
      brief: { ...currentBrief, selectedTemplateId: templateId, switchedAt: new Date().toISOString() },
    })
    .eq("id", briefId);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Template switched." };
}

export async function enqueuePrototypeRerender(briefId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can rerender mockups." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo briefs are read-only." };
  }

  const { data: brief, error: briefError } = await supabase
    .from("prototype_briefs")
    .select("id,brand_asset_id,mockup_template_id")
    .eq("id", briefId)
    .maybeSingle();

  if (briefError || !brief) {
    return { ok: false, message: briefError?.message ?? "Prototype brief not found." };
  }

  if (!brief.brand_asset_id || !brief.mockup_template_id) {
    return { ok: false, message: "Approved logo and selected template are required before rerender." };
  }

  const { error } = await supabase.from("jobs").insert({
    type: "prototype.render",
    status: "queued",
    payload: {
      prototypeBriefId: briefId,
      brandAssetId: String(brief.brand_asset_id),
      templateIds: [String(brief.mockup_template_id)],
      watermarkText: "Generated preview",
    },
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "Prototype rerender queued." };
}
