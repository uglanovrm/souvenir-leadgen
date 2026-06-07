import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { z } from "zod";

const prototypeQcPayloadSchema = z.object({
  prototypeBriefId: z.string().uuid().optional(),
  renderIds: z.array(z.string().uuid()).default([]),
});

type QcIssue = {
  code: string;
  message: string;
  penalty: number;
};

type QcInput = {
  placement: { x: number; y: number; width: number; height: number };
  safeArea: { x: number; y: number; width: number; height: number };
  hasWatermark: boolean;
  contrastStdev: number;
  templateProductType?: string | null;
  briefProductType?: string | null;
  duplicateProductType?: boolean;
};

function issue(code: string, message: string, penalty: number): QcIssue {
  return { code, message, penalty };
}

export function scorePrototypeQc(input: QcInput) {
  const issues: QcIssue[] = [];

  if (input.placement.width < 8 || input.placement.height < 8) {
    issues.push(issue("logo_too_small", "Logo placement is too small for review.", 25));
  }

  if (input.placement.width > 70 || input.placement.height > 70) {
    issues.push(issue("logo_too_large", "Logo placement is too large for the mockup.", 20));
  }

  const overflowsSafeArea = input.placement.x < input.safeArea.x
    || input.placement.y < input.safeArea.y
    || input.placement.x + input.placement.width > input.safeArea.x + input.safeArea.width
    || input.placement.y + input.placement.height > input.safeArea.y + input.safeArea.height;

  if (overflowsSafeArea) {
    issues.push(issue("safe_area_overflow", "Logo placement exceeds the configured safe area.", 30));
  }

  if (!input.hasWatermark) {
    issues.push(issue("missing_watermark", "Generated preview is missing a watermark.", 30));
  }

  if (input.contrastStdev < 18) {
    issues.push(issue("low_contrast", "Rendered preview has low contrast.", 15));
  }

  if (input.briefProductType && input.templateProductType && input.briefProductType !== input.templateProductType) {
    issues.push(issue("template_mismatch", "Template product type does not match the brief.", 25));
  }

  if (input.duplicateProductType) {
    issues.push(issue("duplicate_product_type", "Another render already uses this product type.", 10));
  }

  const score = Math.max(0, 100 - issues.reduce((sum, item) => sum + item.penalty, 0));
  const status = score < 35 ? "rejected" : score < 55 ? "needs_review" : "generated";

  return { score, status, issues };
}

function metadataRecord(value: unknown) {
  return typeof value === "object" && value ? value as Record<string, unknown> : {};
}

function geometry(value: unknown, fallback: QcInput["placement"]) {
  const typed = metadataRecord(value);

  return {
    x: typeof typed.x === "number" ? typed.x : fallback.x,
    y: typeof typed.y === "number" ? typed.y : fallback.y,
    width: typeof typed.width === "number" ? typed.width : fallback.width,
    height: typeof typed.height === "number" ? typed.height : fallback.height,
  };
}

async function downloadStorageObject(supabase: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(error?.message ?? `Storage object not found: ${bucket}/${path}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function contrastStdev(buffer: Buffer) {
  const stats = await sharp(buffer).grayscale().stats();
  return stats.channels[0]?.stdev ?? 0;
}

async function loadRenderRows(supabase: SupabaseClient, payload: z.infer<typeof prototypeQcPayloadSchema>) {
  let query = supabase
    .from("prototype_renders")
    .select("id,prototype_brief_id,status,storage_bucket,storage_path,preview_watermarked,metadata");

  if (payload.renderIds.length > 0) {
    query = query.in("id", payload.renderIds);
  } else if (payload.prototypeBriefId) {
    query = query.eq("prototype_brief_id", payload.prototypeBriefId);
  } else {
    throw new Error("prototype.qc requires renderIds or prototypeBriefId.");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function runPrototypeQcJob(supabase: SupabaseClient, rawPayload: Record<string, unknown>) {
  const payload = prototypeQcPayloadSchema.parse(rawPayload);
  const renders = await loadRenderRows(supabase, payload);
  const productTypeCounts = new Map<string, number>();

  for (const render of renders) {
    const metadata = metadataRecord(render.metadata);
    const productType = typeof metadata.template_product_type === "string" ? metadata.template_product_type : "";

    if (productType) {
      productTypeCounts.set(productType, (productTypeCounts.get(productType) ?? 0) + 1);
    }
  }

  const results: Array<{ renderId: string; score: number; status: string; warnings: string[] }> = [];

  for (const render of renders) {
    const metadata = metadataRecord(render.metadata);
    const image = await downloadStorageObject(supabase, String(render.storage_bucket), String(render.storage_path));
    const templateProductType = typeof metadata.template_product_type === "string" ? metadata.template_product_type : null;
    const briefProductType = typeof metadata.brief_product_type === "string" ? metadata.brief_product_type : null;
    const qc = scorePrototypeQc({
      placement: geometry(metadata.placement, { x: 0, y: 0, width: 50, height: 50 }),
      safeArea: geometry(metadata.safe_area, { x: 0, y: 0, width: 100, height: 100 }),
      hasWatermark: render.preview_watermarked === true && typeof metadata.watermark === "string" && metadata.watermark.length > 0,
      contrastStdev: await contrastStdev(image),
      templateProductType,
      briefProductType,
      duplicateProductType: templateProductType ? (productTypeCounts.get(templateProductType) ?? 0) > 1 : false,
    });
    const warnings = qc.issues.map((item) => `${item.code}: ${item.message}`);
    const { error } = await supabase
      .from("prototype_renders")
      .update({
        status: qc.status,
        qc_score: qc.score,
        qc_warnings: warnings,
        metadata: {
          ...metadata,
          qc_issues: qc.issues,
          final_offer_eligible: false,
        },
      })
      .eq("id", render.id);

    if (error) {
      throw error;
    }

    results.push({ renderId: String(render.id), score: qc.score, status: qc.status, warnings });
  }

  return {
    checkedCount: results.length,
    results,
  };
}
