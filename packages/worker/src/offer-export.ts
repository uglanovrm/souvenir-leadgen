import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const offerExportPayloadSchema = z.object({
  offerId: z.string().uuid(),
});

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function renderSimplePdf(title: string, lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 20 Tf",
    "72 760 Td",
    `(${escapePdfText(title)}) Tj`,
    "/F1 11 Tf",
    ...lines.flatMap((line) => ["0 -20 Td", `(${escapePdfText(line).slice(0, 120)}) Tj`]),
    "ET",
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = [0];
  const body = objects.map((object) => {
    xref.push(offset);
    offset += Buffer.byteLength(`${object}\n`);
    return object;
  }).join("\n");
  const xrefStart = offset;
  const table = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    ...xref.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `),
    "trailer << /Size 6 /Root 1 0 R >>",
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");

  return Buffer.from(`%PDF-1.4\n${body}\n${table}\n`);
}

function metadataRecord(value: unknown) {
  return typeof value === "object" && value ? value as Record<string, unknown> : {};
}

export async function renderOfferPdfJob(supabase: SupabaseClient, rawPayload: Record<string, unknown>) {
  const payload = offerExportPayloadSchema.parse(rawPayload);
  const { data: offer, error } = await supabase
    .from("offers")
    .select("id,title,status,summary,draft,organizations(name),product_packages(name)")
    .eq("id", payload.offerId)
    .maybeSingle();

  if (error || !offer) {
    throw new Error(error?.message ?? "Offer not found.");
  }

  if (offer.status !== "approved") {
    throw new Error("Offer must be approved before PDF export.");
  }

  const draft = metadataRecord(offer.draft);
  const org = metadataRecord(Array.isArray(offer.organizations) ? offer.organizations[0] : offer.organizations);
  const productPackage = metadataRecord(Array.isArray(offer.product_packages) ? offer.product_packages[0] : offer.product_packages);
  const pdf = renderSimplePdf(String(offer.title), [
    `Organization: ${org.name ?? "Unknown organization"}`,
    `Package: ${productPackage.name ?? "No package selected"}`,
    `Summary: ${offer.summary ?? ""}`,
    String(draft.body ?? ""),
    "Manual send gate: automatic outbound sending is blocked.",
  ]);
  const storagePath = `offers/${payload.offerId}/offer.pdf`;
  const upload = await supabase.storage.from("offer-exports").upload(storagePath, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (upload.error) {
    throw upload.error;
  }

  await supabase.from("offer_assets").delete().eq("offer_id", payload.offerId).eq("asset_kind", "export").eq("storage_path", storagePath);
  const { error: assetError } = await supabase.from("offer_assets").insert({
    offer_id: payload.offerId,
    asset_kind: "export",
    storage_bucket: "offer-exports",
    storage_path: storagePath,
    sendable: false,
    metadata: { export_kind: "pdf", manual_download_only: true },
  });

  if (assetError) {
    throw assetError;
  }

  return { storageBucket: "offer-exports", storagePath };
}
