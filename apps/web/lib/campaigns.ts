import { campaignFormSchema, csvLeadRowSchema, type CampaignFormInput, type CsvLeadRowInput } from "@souvenir-leadgen/shared";
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
  }>;
};

const demoCampaign: CampaignDetailView = {
  id: "demo-campaign",
  name: "Demo HR onboarding leads",
  description: "Demo campaign for CSV import and lead scoring.",
  status: "draft",
  targetIndustries: ["hr", "education"],
  leadCount: 1,
  leads: [{ id: "demo-lead", organizationName: "Acme Education", status: "new", score: null }],
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
    .select("id,status,score,organizations(name)")
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
        };
      }),
    },
    source: "supabase" as const,
    warning: null,
  };
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
