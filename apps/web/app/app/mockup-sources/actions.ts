"use server";

import { revalidatePath } from "next/cache";
import { linkRuntimeTemplateSource, updateMockupSource, uploadMockupSource } from "../../../lib/mockup-sources";

function parseSourceForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    author: String(formData.get("author") || ""),
    license: String(formData.get("license") || ""),
    notes: String(formData.get("notes") || ""),
    status: String(formData.get("status") || "draft") as "draft" | "normalized" | "certified" | "rejected",
  };
}

export async function uploadMockupSourceAction(formData: FormData) {
  const file = formData.get("source");
  await uploadMockupSource(parseSourceForm(formData), file instanceof File ? file : null);
  revalidatePath("/app/mockup-sources");
}

export async function updateMockupSourceAction(id: string, formData: FormData) {
  await updateMockupSource(id, parseSourceForm(formData));
  revalidatePath("/app/mockup-sources");
}

export async function linkRuntimeTemplateSourceAction(templateId: string, formData: FormData) {
  await linkRuntimeTemplateSource(templateId, String(formData.get("sourceId") || ""));
  revalidatePath("/app/mockup-sources");
}
