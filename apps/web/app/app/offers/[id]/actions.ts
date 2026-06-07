"use server";

import { revalidatePath } from "next/cache";
import { createDealFromOffer, enqueueOfferPdfExport, exportOfferHtml, prepareOfferMessage } from "../../../../lib/commercial-handoff";
import { approveOffer, saveOfferDraft } from "../../../../lib/offers";

function stringList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

function offerInputFromForm(formData: FormData) {
  const warnings = String(formData.get("warnings") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: String(formData.get("title") || ""),
    summary: String(formData.get("summary") || ""),
    body: String(formData.get("body") || ""),
    productPackageId: String(formData.get("productPackageId") || ""),
    portfolioAssetIds: stringList(formData, "portfolioAssetIds"),
    warnings,
    warningsAccepted: formData.get("warningsAccepted") === "on",
  };
}

export async function saveOfferDraftAction(id: string, formData: FormData) {
  await saveOfferDraft(id, offerInputFromForm(formData));
  revalidatePath("/app/offers");
  revalidatePath(`/app/offers/${id}`);
}

export async function approveOfferAction(id: string, formData: FormData) {
  await approveOffer(id, offerInputFromForm(formData));
  revalidatePath("/app/offers");
  revalidatePath(`/app/offers/${id}`);
}

export async function exportOfferHtmlAction(id: string) {
  await exportOfferHtml(id);
  revalidatePath(`/app/offers/${id}`);
}

export async function enqueueOfferPdfExportAction(id: string) {
  await enqueueOfferPdfExport(id);
  revalidatePath(`/app/offers/${id}`);
}

export async function prepareOfferMessageAction(id: string) {
  await prepareOfferMessage(id);
  revalidatePath(`/app/offers/${id}`);
}

export async function createDealFromOfferAction(id: string) {
  await createDealFromOffer(id);
  revalidatePath(`/app/offers/${id}`);
}
