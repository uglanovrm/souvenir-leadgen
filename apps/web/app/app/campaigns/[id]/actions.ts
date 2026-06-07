"use server";

import { revalidatePath } from "next/cache";
import { importCampaignCsv } from "../../../../lib/campaigns";

export async function importCampaignCsvAction(id: string, formData: FormData) {
  const file = formData.get("csv");
  await importCampaignCsv(id, file instanceof File ? file : null);
  revalidatePath(`/app/campaigns/${id}`);
}
