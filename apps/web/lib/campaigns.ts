import { campaignFormSchema, csvLeadRowSchema, scoreLead, type CampaignFormInput, type CsvLeadRowInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { parseCsv } from "./csv";
import { createSupabaseServerClient } from "./supabase/server";

export type CampaignView = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetIndustries: string[];
  leadCount: number;
};

export type CampaignDetailView = CampaignView & {
  leads: Array<{
    id: string;
    organizationName: string;
    status: string;
    score: number | null;
    explanation: string | null;
  }>;
};

const demoCampaign: CampaignDetailView = {
  id: "demo-campaign",
  name: "Demo HR onboarding leads",
  description: "Demo campaign for CSV import and lead scoring.",
  status: "draft",
  targetIndustries: ["hr", "education"],
  leadCount: 1,
  leads: [{ id: "demo-lead", organizationName: "Acme Education", status: "new", score: 75, explanation: "industry matches campaign; website present; contact missing; portfolio fit available; not previously contacted; not blocked" }],
};

function mapCampaign(row: Record<string, unknown>, leadCount = 0): CampaignView {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    status: String(row.status),
    targetIndustries: Array.isArray(row.target_industries) ? row.target_industries.map(String) : [],
    leadCount,
  };
}

export async function listCampaigns() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      campaigns: [demoCampaign],
      source: "demo" as const,
      warning: "Supabase env is not configured; campaign actions are disabled and demo data is shown.",
    };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("id,name,description,status,target_industries,campaign_leads(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return { campaigns: [], source: "supabase" as const, warning: error.message };
  }

  return {
    campaigns: (data ?? []).map((row) => mapCampaign(row, Number(row.campaign_leads?.[0]?.count ?? 0))),
    source: "supabase" as const,
    warning: null,
  };
}

export async function getCampaignDetail(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      campaign: id === demoCampaign.id ? demoCampaign : null,
      source: "demo" as const,
      warning: "Supabase env is not configured; campaign import is disabled and demo data is shown.",
    };
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id,name,description,status,target_industries")
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign) {
    return { campaign: null, source: "supabase" as const, warning: error?.message ?? "Campaign not found." };
  }

  const { data: leads } = await supabase
    .from("campaign_leads")
    .select("id,status,score,score_breakdown,evidence,organizations(name,website,industry,city)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  return {
    campaign: {
      ...mapCampaign(campaign, leads?.length ?? 0),
      leads: (leads ?? []).map((lead) => {
        const organization = Array.isArray(lead.organizations) ? lead.organizations[0] : lead.organizations;

        return {
          id: String(lead.id),
          organizationName: String(organization?.name ?? "Unknown organization"),
          status: String(lead.status),
          score: lead.score === null || lead.score === undefined ? null : Number(lead.score),
          explanation: typeof lead.score_breakdown === "object" && lead.score_breakdown && "explanation" in lead.score_breakdown
            ? String(lead.score_breakdown.explanation)
            : null,
        };
      }),
    },
    source: "supabase" as const,
    warning: null,
  };
}

export async function scoreCampaignLead(leadId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; lead scoring is disabled in demo mode." };
  }

  const { data: lead, error } = await supabase
    .from("campaign_leads")
    .select("id,status,evidence,campaigns(target_industries),organizations(id,website,industry,city),contacts(id,email)")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !lead) {
    return { ok: false, message: error?.message ?? "Lead not found." };
  }

  const organization = Array.isArray(lead.organizations) ? lead.organizations[0] : lead.organizations;
  const campaign = Array.isArray(lead.campaigns) ? lead.campaigns[0] : lead.campaigns;
  const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts;
  const { data: brandAssets } = organization?.id
    ? await supabase.from("brand_assets").select("id").eq("organization_id", organization.id).eq("status", "approved").limit(1)
    : { data: [] };
  const { data: portfolioAssets } = await supabase.from("portfolio_assets").select("id").eq("allowed_for_offer", true).limit(1);

  const result = scoreLead({
    industry: String(organization?.industry ?? ""),
    targetIndustries: Array.isArray(campaign?.target_industries) ? campaign.target_industries.map(String) : [],
    hasWebsite: Boolean(organization?.website),
    hasLogo: Boolean(brandAssets?.length),
    hasContact: Boolean(contact?.id || (typeof lead.evidence === "object" && lead.evidence && "contact_email" in lead.evidence)),
    hasGeo: Boolean(organization?.city),
    hasPortfolioFit: Boolean(portfolioAssets?.length),
    previouslyContacted: false,
    blocked: lead.status === "rejected",
  });

  const { error: updateError } = await supabase
    .from("campaign_leads")
    .update({
      score: result.score,
      score_breakdown: {
        ...result.breakdown,
        eligible: result.eligible,
        explanation: result.explanation,
      },
    })
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: profile.id === "demo-user" ? null : profile.id,
    action: "lead.score",
    entity_type: "campaign_lead",
    entity_id: leadId,
    metadata: { score: result.score, eligible: result.eligible },
  });

  return { ok: true, message: `Lead scored: ${result.score}.` };
}

export async function createCampaign(input: CampaignFormInput) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo campaigns are read-only." };
  }

  const parsed = campaignFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid campaign." };
  }

  const { error } = await supabase.from("campaigns").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    target_industries: parsed.data.targetIndustries.split(",").map((item) => item.trim()).filter(Boolean),
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "Campaign created." };
}

function normalizeCsvRow(row: Record<string, string>): CsvLeadRowInput {
  return csvLeadRowSchema.parse({
    name: row.name || row.company || row.organization || "",
    website: row.website || row.url || "",
    inn: row.inn || row.tax_id || "",
    contactName: row.contactName || row.contact_name || row.person || "",
    contactEmail: row.contactEmail || row.contact_email || row.email || "",
    industry: row.industry || "",
  });
}

export async function importCampaignCsv(campaignId: string, file: File | null) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; CSV import is disabled in demo mode." };
  }

  if (!file || file.size === 0) {
    return { ok: false, message: "CSV file is required." };
  }

  const text = await file.text();
  const parsedCsv = parseCsv(text);

  if (parsedCsv.errors.length > 0) {
    return { ok: false, message: parsedCsv.errors.join(" ") };
  }

  const importPath = `campaigns/${campaignId}/imports/${crypto.randomUUID()}.csv`;
  const upload = await supabase.storage.from("imports").upload(importPath, file, {
    contentType: file.type || "text/csv",
    upsert: false,
  });

  if (upload.error) {
    return { ok: false, message: upload.error.message };
  }

  let created = 0;
  let skipped = 0;

  for (const rawRow of parsedCsv.rows) {
    const row = normalizeCsvRow(rawRow);
    const existingByInn = row.inn
      ? await supabase.from("organizations").select("id").eq("inn", row.inn).maybeSingle()
      : { data: null };
    const existingByName = !existingByInn.data
      ? row.website
        ? await supabase
          .from("organizations")
          .select("id")
          .eq("name", row.name)
          .eq("website", row.website)
          .maybeSingle()
        : await supabase
          .from("organizations")
          .select("id")
          .eq("name", row.name)
          .is("website", null)
          .maybeSingle()
      : { data: null };
    const existing = existingByInn.data ?? existingByName.data;
    const organizationId = existing?.id ?? crypto.randomUUID();

    if (!existing) {
      const { error } = await supabase.from("organizations").insert({
        id: organizationId,
        name: row.name,
        website: row.website || null,
        inn: row.inn || null,
        industry: row.industry || null,
        created_by: profile.id === "demo-user" ? null : profile.id,
      });

      if (error) {
        skipped += 1;
        continue;
      }
    }

    const { error: leadError } = await supabase.from("campaign_leads").upsert({
      campaign_id: campaignId,
      organization_id: organizationId,
      status: "new",
      evidence: {
        csv_import_path: importPath,
        inn: row.inn,
        contact_name: row.contactName,
        contact_email: row.contactEmail,
      },
      assigned_to: profile.id === "demo-user" ? null : profile.id,
    }, { onConflict: "campaign_id,organization_id,contact_id" });

    if (leadError) {
      skipped += 1;
    } else {
      created += 1;
    }
  }

  return { ok: true, message: `Imported ${created} leads, skipped ${skipped}.` };
}
