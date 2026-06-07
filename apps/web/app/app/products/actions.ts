"use server";

import { revalidatePath } from "next/cache";
import { createProductPackage, deactivateProductPackage } from "../../../lib/catalog";

export async function createPackageAction(formData: FormData) {
  await createProductPackage({
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    description: String(formData.get("description") || ""),
    technology: String(formData.get("technology") || ""),
    minQuantity: Number(formData.get("minQuantity") || 0),
    priceFrom: Number(formData.get("priceFrom") || 0),
    productionDays: Number(formData.get("productionDays") || 0),
    targetIndustries: String(formData.get("targetIndustries") || ""),
    marginPercent: Number(formData.get("marginPercent") || 0),
  });

  revalidatePath("/app/products");
}

export async function deactivatePackageAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  await deactivateProductPackage(id);

  revalidatePath("/app/products");
}
