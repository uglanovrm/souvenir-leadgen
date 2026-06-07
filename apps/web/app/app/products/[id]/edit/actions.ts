"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateProductPackage } from "../../../../../lib/catalog";

export async function updatePackageAction(id: string, formData: FormData) {
  await updateProductPackage(id, {
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
  redirect("/app/products");
}
