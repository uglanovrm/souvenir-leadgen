"use server";

import { revalidatePath } from "next/cache";
import { createPortfolioAsset, updatePortfolioAssetMetadata } from "../../../lib/assets";

function parseAssetForm(formData: FormData) {
  return {
    title: String(formData.get("title") || ""),
    packageId: String(formData.get("packageId") || ""),
    technology: String(formData.get("technology") || ""),
    industry: String(formData.get("industry") || ""),
    productType: String(formData.get("productType") || ""),
    material: String(formData.get("material") || ""),
    qualityScore: Number(formData.get("qualityScore") || 0),
    allowedForOffer: formData.get("allowedForOffer") === "on",
  };
}

export async function uploadPortfolioAssetAction(formData: FormData) {
  const file = formData.get("image");
  await createPortfolioAsset(parseAssetForm(formData), file instanceof File ? file : null);
  revalidatePath("/app/assets");
}

export async function updatePortfolioAssetAction(id: string, formData: FormData) {
  await updatePortfolioAssetMetadata(id, parseAssetForm(formData));
  revalidatePath("/app/assets");
}
