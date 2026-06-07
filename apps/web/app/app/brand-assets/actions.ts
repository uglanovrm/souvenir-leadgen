"use server";

import { revalidatePath } from "next/cache";
import { approveBrandLogo, rejectBrandLogo, uploadBrandLogo } from "../../../lib/brand-assets";

export async function uploadBrandLogoAction(formData: FormData) {
  const file = formData.get("logo");
  await uploadBrandLogo(String(formData.get("organizationId") || ""), file instanceof File ? file : null);
  revalidatePath("/app/brand-assets");
}

export async function approveBrandLogoAction(formData: FormData) {
  await approveBrandLogo(String(formData.get("id") || ""), String(formData.get("organizationId") || "") || null);
  revalidatePath("/app/brand-assets");
}

export async function rejectBrandLogoAction(formData: FormData) {
  await rejectBrandLogo(String(formData.get("id") || ""));
  revalidatePath("/app/brand-assets");
}
