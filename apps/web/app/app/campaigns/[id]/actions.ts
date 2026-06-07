"use server";

import { revalidatePath } from "next/cache";
import { importCampaignCsv, scoreCampaignLead } from "../../../../lib/campaigns";

export async function importCampaignCsvAction(id: string, formData: FormData) {
  const file = formData.get("csv");
  await importCampaignCsv(id, file instanceof File ? file : null);
  revalidatePath(`/app/campaigns/${id}`);
}

export async function scoreCampaignLeadAction(campaignId: string, formData: FormData) {
  await scoreCampaignLead(String(formData.get("leadId") || ""));
  revalidatePath(`/app/campaigns/${campaignId}`);
}
