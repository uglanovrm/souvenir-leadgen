import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { z } from "zod";

const prototypeRenderPayloadSchema = z.object({
  prototypeBriefId: z.string().uuid(),
  brandAssetId: z.string().uuid(),
  templateIds: z.array(z.string().uuid()).min(1).max(5),
  watermarkText: z.string().trim().default("Generated preview"),
});

type Geometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

type RenderTemplate = {
  id: string;
  name: string;
  product_type: string | null;
  technology: string | null;
  template_bucket: string;
  metadata: Record<string, unknown>;
};

type BrandAsset = {
  id: string;
  original_bucket: string;
  original_path: string;
};

function geometryFromMetadata(metadata: Record<string, unknown>, key: "placement" | "safe_area"): Geometry {
  const value = typeof metadata[key] === "object" && metadata[key] ? metadata[key] as Record<string, unknown> : {};

  return {
    x: typeof value.x === "number" ? value.x : 0,
    y: typeof value.y === "number" ? value.y : 0,
    width: typeof value.width === "number" ? value.width : 50,
    height: typeof value.height === "number" ? value.height : 50,
    rotation: typeof value.rotation === "number" ? value.rotation : 0,
  };
}

function percentToPixels(value: number, total: number) {
  return Math.round((value / 100) * total);
}

function layerPath(metadata: Record<string, unknown>, key: string) {
  const layers = typeof metadata.layers === "object" && metadata.layers ? metadata.layers as Record<string, unknown> : {};
  const value = layers[key];
  return typeof value === "string" && value ? value : null;
}

function watermarkSvg(width: number, height: number, text: string) {
  const escaped = text.replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "\"": "&quot;",
    "'": "&apos;",
  }[char] ?? char));

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - 18}" y="${height - 18}" text-anchor="end"
        font-family="Arial, sans-serif" font-size="18" font-weight="700"
        fill="rgba(255,255,255,0.86)" stroke="rgba(0,0,0,0.42)" stroke-width="3"
        paint-order="stroke">${escaped}</text>
    </svg>
  `);
}

export async function renderMockupImage(input: {
  base: Buffer;
  logo: Buffer;
  mask?: Buffer | null;
  shadow?: Buffer | null;
  highlight?: Buffer | null;
  placement: Geometry;
  watermarkText: string;
}) {
  const baseMeta = await sharp(input.base).metadata();
  const width = baseMeta.width ?? 1200;
  const height = baseMeta.height ?? 900;
  const left = percentToPixels(input.placement.x, width);
  const top = percentToPixels(input.placement.y, height);
  const logoWidth = Math.max(1, percentToPixels(input.placement.width, width));
  const logoHeight = Math.max(1, percentToPixels(input.placement.height, height));
  let logo = await sharp(input.logo)
    .resize({ width: logoWidth, height: logoHeight, fit: "inside", withoutEnlargement: true })
    .rotate(input.placement.rotation ?? 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (input.mask) {
    const mask = await sharp(input.mask).resize({ width: logoWidth, height: logoHeight, fit: "fill" }).png().toBuffer();
    logo = await sharp(logo).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  }

  const composites: sharp.OverlayOptions[] = [{ input: logo, left, top }];

  if (input.shadow) {
    composites.push({ input: input.shadow, left: 0, top: 0, blend: "multiply" });
  }

  if (input.highlight) {
    composites.push({ input: input.highlight, left: 0, top: 0, blend: "screen" });
  }

  composites.push({ input: watermarkSvg(width, height, input.watermarkText), left: 0, top: 0 });

  return sharp(input.base).composite(composites).png().toBuffer();
}

async function downloadStorageObject(supabase: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(error?.message ?? `Storage object not found: ${bucket}/${path}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function downloadOptionalLayer(supabase: SupabaseClient, bucket: string, path: string | null) {
  return path ? downloadStorageObject(supabase, bucket, path) : null;
}

async function loadTemplateRows(supabase: SupabaseClient, templateIds: string[]) {
  const { data, error } = await supabase
    .from("mockup_templates")
    .select("id,name,product_type,technology,template_bucket,metadata,is_active")
    .in("id", templateIds)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as RenderTemplate[];
}

async function loadBrandAsset(supabase: SupabaseClient, brandAssetId: string) {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("id,original_bucket,original_path,status,metadata")
    .eq("id", brandAssetId)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Approved brand asset not found.");
  }

  const metadata = typeof data.metadata === "object" && data.metadata ? data.metadata as Record<string, unknown> : {};

  if (metadata.renderBlocked === true) {
    throw new Error("Approved brand asset is blocked from automatic render.");
  }

  return data as BrandAsset;
}

export async function renderPrototypeJob(supabase: SupabaseClient, rawPayload: Record<string, unknown>) {
  const payload = prototypeRenderPayloadSchema.parse(rawPayload);
  const brandAsset = await loadBrandAsset(supabase, payload.brandAssetId);
  const templates = await loadTemplateRows(supabase, payload.templateIds);

  if (templates.length === 0) {
    throw new Error("No active runtime templates found for prototype.render.");
  }

  const logo = await downloadStorageObject(supabase, brandAsset.original_bucket, brandAsset.original_path);
  const rendered: Array<{ templateId: string; renderId: string; storagePath: string }> = [];

  for (const template of templates) {
    const metadata = typeof template.metadata === "object" && template.metadata ? template.metadata : {};
    const basePath = layerPath(metadata, "base");

    if (!basePath) {
      throw new Error(`Template ${template.id} has no base layer path.`);
    }

    const placement = geometryFromMetadata(metadata, "placement");
    const safeArea = geometryFromMetadata(metadata, "safe_area");
    const base = await downloadStorageObject(supabase, template.template_bucket, basePath);
    const output = await renderMockupImage({
      base,
      logo,
      mask: await downloadOptionalLayer(supabase, template.template_bucket, layerPath(metadata, "mask")),
      shadow: await downloadOptionalLayer(supabase, template.template_bucket, layerPath(metadata, "shadow")),
      highlight: await downloadOptionalLayer(supabase, template.template_bucket, layerPath(metadata, "highlight")),
      placement,
      watermarkText: payload.watermarkText,
    });
    const renderId = crypto.randomUUID();
    const storagePath = `prototype-renders/${payload.prototypeBriefId}/${template.id}/${renderId}.png`;
    const upload = await supabase.storage.from("generated-mockups").upload(storagePath, output, {
      contentType: "image/png",
      upsert: false,
    });

    if (upload.error) {
      throw upload.error;
    }

    const { error: insertError } = await supabase.from("prototype_renders").insert({
      id: renderId,
      prototype_brief_id: payload.prototypeBriefId,
      status: "generated",
      storage_bucket: "generated-mockups",
      storage_path: storagePath,
      preview_watermarked: true,
      metadata: {
        template_id: template.id,
        brand_asset_id: brandAsset.id,
        template_product_type: template.product_type,
        template_technology: template.technology,
        placement,
        safe_area: safeArea,
        watermark: payload.watermarkText,
        final_offer_eligible: false,
      },
    });

    if (insertError) {
      throw insertError;
    }

    rendered.push({ templateId: template.id, renderId, storagePath });
  }

  return {
    renderedCount: rendered.length,
    rendered,
  };
}
