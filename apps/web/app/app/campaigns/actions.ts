"use server";

import { revalidatePath } from "next/cache";
import { createCampaign } from "../../../lib/campaigns";

export async function createCampaignAction(formData: FormData) {
  await createCampaign({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    targetIndustries: String(formData.get("targetIndustries") || ""),
  });

  revalidatePath("/app/campaigns");
}
