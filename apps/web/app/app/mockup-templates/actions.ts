"use server";

import { revalidatePath } from "next/cache";
import { createRuntimeMockupTemplate } from "../../../lib/runtime-mockups";

function numberValue(formData: FormData, name: string, fallback = 0) {
  const value = Number(formData.get(name) || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function parseTemplateForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    sourceId: String(formData.get("sourceId") || ""),
    productPackageId: String(formData.get("productPackageId") || ""),
    productType: String(formData.get("productType") || ""),
    technology: String(formData.get("technology") || ""),
    tags: String(formData.get("tags") || ""),
    qualityScore: numberValue(formData, "qualityScore"),
    status: String(formData.get("status") || "draft") as "draft" | "certified" | "rejected",
    isActive: formData.get("isActive") === "on",
    safeAreaX: numberValue(formData, "safeAreaX"),
    safeAreaY: numberValue(formData, "safeAreaY"),
    safeAreaWidth: numberValue(formData, "safeAreaWidth", 40),
    safeAreaHeight: numberValue(formData, "safeAreaHeight", 30),
    placementX: numberValue(formData, "placementX"),
    placementY: numberValue(formData, "placementY"),
    placementWidth: numberValue(formData, "placementWidth", 40),
    placementHeight: numberValue(formData, "placementHeight", 30),
    placementRotation: numberValue(formData, "placementRotation"),
  };
}

function fileValue(formData: FormData, name: string) {
  const file = formData.get(name);
  return file instanceof File ? file : null;
}

export async function createRuntimeMockupTemplateAction(formData: FormData) {
  await createRuntimeMockupTemplate(parseTemplateForm(formData), {
    base: fileValue(formData, "base"),
    mask: fileValue(formData, "mask"),
    shadow: fileValue(formData, "shadow"),
    highlight: fileValue(formData, "highlight"),
    preview: fileValue(formData, "preview"),
  });
  revalidatePath("/app/mockup-templates");
}
