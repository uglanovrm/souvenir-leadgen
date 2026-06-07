import { selectMockupTemplates, type RankedTemplate, type TemplateSelectorBrief, type TemplateSelectorCandidate } from "@souvenir-leadgen/shared";
import { createSupabaseServerClient } from "./supabase/server";

export type PrototypeStudioView = {
  brief: TemplateSelectorBrief;
  rankedTemplates: RankedTemplate[];
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

function placementAspectRatio(metadata: unknown) {
  const typed = typeof metadata === "object" && metadata ? metadata as Record<string, unknown> : {};
  const placement = typeof typed.placement === "object" && typed.placement ? typed.placement as Record<string, unknown> : {};
  const width = typeof placement.width === "number" ? placement.width : null;
  const height = typeof placement.height === "number" ? placement.height : null;

  return width && height ? width / height : null;
}

export async function getPrototypeStudioView(): Promise<PrototypeStudioView> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      brief: demoBrief,
      rankedTemplates: selectMockupTemplates(demoBrief, demoCandidates, 5),
      source: "demo",
      warning: "Supabase env is not configured; selector is shown with demo data.",
    };
  }

  const { data: logo } = await supabase
    .from("brand_assets")
    .select("metadata")
    .in("status", ["approved", "candidate"])
    .order("approved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const logoMetadata = typeof logo?.metadata === "object" && logo.metadata ? logo.metadata as Record<string, unknown> : {};
  const brief: TemplateSelectorBrief = {
    productType: "mug",
    technology: "UV print",
    industryTags: ["education", "hr"],
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

  return {
    brief,
    rankedTemplates: selectMockupTemplates(brief, candidates, 5),
    source: "supabase",
    warning: error?.message ?? null,
  };
}
