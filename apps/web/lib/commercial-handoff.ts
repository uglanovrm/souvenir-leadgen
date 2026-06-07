import { getCurrentProfile } from "./auth";
import { canApproveOutbound } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

type HandoffOffer = {
  id: string;
  title: string;
  status: string;
  summary: string;
  body: string;
  organizationId: string | null;
  organizationName: string;
  packageName: string;
  priceFrom: number;
  marginPercent: number;
};

export type CommercialHandoffView = {
  offer: HandoffOffer;
  exports: Array<{ id: string; kind: string; storagePath: string; url: string | null }>;
  messages: Array<{ id: string; status: string; subject: string; attachmentCount: number; manualSendRequired: boolean }>;
  deals: Array<{ id: string; status: string; amount: number; margin: number; commissionAmount: number; commissionRate: number }>;
  approvedPrototypeCount: number;
  canManage: boolean;
  source: "supabase" | "demo";
  warning: string | null;
};

const demoHandoff: CommercialHandoffView = {
  offer: {
    id: "demo-offer",
    title: "Welcome merch for Acme Education",
    status: "approved",
    summary: "A compact onboarding merch offer based on the selected starter package.",
    body: "Offer Acme Education a welcome merch starter pack. Sending remains manual.",
    organizationId: "00000000-0000-4000-8000-000000000401",
    organizationName: "Acme Education",
    packageName: "Welcome merch starter pack",
    priceFrom: 790,
    marginPercent: 20,
  },
  exports: [{ id: "demo-export", kind: "html", storagePath: "demo/offer.html", url: null }],
  messages: [{
    id: "demo-message",
    status: "prepared",
    subject: "Welcome merch for Acme Education",
    attachmentCount: 1,
    manualSendRequired: true,
  }],
  deals: [{ id: "demo-deal", status: "open", amount: 790, margin: 158, commissionAmount: 15.8, commissionRate: 10 }],
  approvedPrototypeCount: 1,
  canManage: true,
  source: "demo",
  warning: "Supabase env is not configured; commercial handoff actions are disabled and demo data is shown.",
};

function metadataRecord(value: unknown) {
  return typeof value === "object" && value ? value as Record<string, unknown> : {};
}

function relation(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function relationName(value: unknown, fallback: string) {
  const typed = metadataRecord(relation(value));
  return typeof typed.name === "string" ? typed.name : fallback;
}

function draftBody(row: Record<string, unknown>) {
  const draft = metadataRecord(row.draft);
  return typeof draft.body === "string" ? draft.body : "";
}

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char] ?? char));
}

function renderOfferHtml(offer: HandoffOffer, assetLinks: string[]) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(offer.title)}</title>
  <style>
    body { color: #18212f; font-family: Arial, sans-serif; margin: 40px; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .muted { color: #64748b; }
    .box { border: 1px solid #dbe3ec; border-radius: 8px; margin-top: 20px; padding: 18px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <p class="muted">Manual commercial preview. Automatic sending is disabled.</p>
  <h1>${escapeHtml(offer.title)}</h1>
  <p><strong>${escapeHtml(offer.organizationName)}</strong> / ${escapeHtml(offer.packageName)}</p>
  <div class="box">
    <h2>Summary</h2>
    <p>${escapeHtml(offer.summary)}</p>
  </div>
  <div class="box">
    <h2>Offer text</h2>
    <p>${escapeHtml(offer.body).replace(/\n/g, "<br />")}</p>
  </div>
  <div class="box">
    <h2>Approved prototype assets</h2>
    <ul>${assetLinks.map((link) => `<li>${escapeHtml(link)}</li>`).join("") || "<li>No approved prototype assets linked yet.</li>"}</ul>
  </div>
</body>
</html>`;
}

function mapOffer(row: Record<string, unknown>): HandoffOffer {
  const productPackage = metadataRecord(relation(row.product_packages));

  return {
    id: String(row.id),
    title: String(row.title),
    status: String(row.status),
    summary: row.summary ? String(row.summary) : "",
    body: draftBody(row),
    organizationId: row.organization_id ? String(row.organization_id) : null,
    organizationName: relationName(row.organizations, "Unknown organization"),
    packageName: typeof productPackage.name === "string" ? productPackage.name : "No package selected",
    priceFrom: productPackage.price_from === null || productPackage.price_from === undefined ? 0 : Number(productPackage.price_from),
    marginPercent: productPackage.margin_percent === null || productPackage.margin_percent === undefined ? 0 : Number(productPackage.margin_percent),
  };
}

async function loadOfferForHandoff(offerId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase, offer: demoHandoff.offer, error: null };
  }

  const { data, error } = await supabase
    .from("offers")
    .select("id,title,status,summary,draft,organization_id,organizations(name),product_packages(name,price_from,margin_percent)")
    .eq("id", offerId)
    .maybeSingle();

  return { supabase, offer: data ? mapOffer(data) : null, error };
}

export async function getCommercialHandoff(offerId: string): Promise<CommercialHandoffView> {
  const profile = await getCurrentProfile();
  const canManage = canApproveOutbound(profile.role);
  const { supabase, offer, error } = await loadOfferForHandoff(offerId);

  if (!supabase) {
    return { ...demoHandoff, canManage };
  }

  if (error || !offer) {
    return {
      ...demoHandoff,
      offer: { ...demoHandoff.offer, id: offerId, title: "Offer not found", status: "draft" },
      exports: [],
      messages: [],
      deals: [],
      approvedPrototypeCount: 0,
      canManage,
      source: "supabase",
      warning: error?.message ?? "Offer not found.",
    };
  }

  const { data: assets } = await supabase
    .from("offer_assets")
    .select("id,asset_kind,storage_bucket,storage_path,metadata")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: false });
  const { data: messages } = await supabase
    .from("messages")
    .select("id,status,subject,metadata")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: false });
  const { data: deals } = await supabase
    .from("deals")
    .select("id,status,amount,margin,commissions(rate_percent,amount)")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: false });

  return {
    offer,
    exports: (assets ?? [])
      .filter((asset) => String(asset.asset_kind) === "export")
      .map((asset) => {
        const metadata = metadataRecord(asset.metadata);
        const { data: urlData } = supabase.storage.from(String(asset.storage_bucket)).getPublicUrl(String(asset.storage_path));
        return {
          id: String(asset.id),
          kind: typeof metadata.export_kind === "string" ? metadata.export_kind : "export",
          storagePath: String(asset.storage_path),
          url: urlData.publicUrl,
        };
      }),
    messages: (messages ?? []).map((message) => {
      const metadata = metadataRecord(message.metadata);
      const attachments = Array.isArray(metadata.attachment_links) ? metadata.attachment_links : [];
      return {
        id: String(message.id),
        status: String(message.status),
        subject: message.subject ? String(message.subject) : "",
        attachmentCount: attachments.length,
        manualSendRequired: metadata.manual_send_required !== false,
      };
    }),
    deals: (deals ?? []).map((deal) => {
      const commission = metadataRecord(relation(deal.commissions));
      return {
        id: String(deal.id),
        status: String(deal.status),
        amount: deal.amount === null || deal.amount === undefined ? 0 : Number(deal.amount),
        margin: deal.margin === null || deal.margin === undefined ? 0 : Number(deal.margin),
        commissionAmount: commission.amount === null || commission.amount === undefined ? 0 : Number(commission.amount),
        commissionRate: commission.rate_percent === null || commission.rate_percent === undefined ? 0 : Number(commission.rate_percent),
      };
    }),
    approvedPrototypeCount: (assets ?? []).filter((asset) => String(asset.asset_kind) === "prototype_render").length,
    canManage,
    source: "supabase",
    warning: null,
  };
}

function ensureApproved(offer: HandoffOffer | null) {
  if (!offer) {
    return "Offer not found.";
  }

  return offer.status === "approved" ? null : "Offer must be approved before commercial handoff.";
}

export async function exportOfferHtml(offerId: string) {
  const { supabase, offer, error } = await loadOfferForHandoff(offerId);

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo exports are read-only." };
  }

  const approvalError = ensureApproved(offer);

  if (error || approvalError || !offer) {
    return { ok: false, message: error?.message ?? approvalError ?? "Offer not found." };
  }

  const { data: prototypeAssets } = await supabase
    .from("offer_assets")
    .select("storage_bucket,storage_path")
    .eq("offer_id", offerId)
    .eq("asset_kind", "prototype_render");
  const assetLinks = (prototypeAssets ?? []).map((asset) => `${asset.storage_bucket}/${asset.storage_path}`);
  const html = renderOfferHtml(offer, assetLinks);
  const storagePath = `offers/${offerId}/offer.html`;
  const upload = await supabase.storage.from("offer-exports").upload(storagePath, new Blob([html], { type: "text/html" }), {
    contentType: "text/html",
    upsert: true,
  });

  if (upload.error) {
    return { ok: false, message: upload.error.message };
  }

  await supabase.from("offer_assets").delete().eq("offer_id", offerId).eq("asset_kind", "export").eq("storage_path", storagePath);
  const { error: assetError } = await supabase.from("offer_assets").insert({
    offer_id: offerId,
    asset_kind: "export",
    storage_bucket: "offer-exports",
    storage_path: storagePath,
    sendable: false,
    metadata: { export_kind: "html", manual_download_only: true },
  });

  return assetError ? { ok: false, message: assetError.message } : { ok: true, message: "HTML offer export created." };
}

export async function enqueueOfferPdfExport(offerId: string) {
  const profile = await getCurrentProfile();
  const { supabase, offer, error } = await loadOfferForHandoff(offerId);

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo PDF jobs are read-only." };
  }

  const approvalError = ensureApproved(offer);

  if (error || approvalError || !offer) {
    return { ok: false, message: error?.message ?? approvalError ?? "Offer not found." };
  }

  const { error: jobError } = await supabase.from("jobs").insert({
    type: "offer.render_pdf",
    status: "queued",
    payload: { offerId },
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return jobError ? { ok: false, message: jobError.message } : { ok: true, message: "PDF export job queued." };
}

export async function prepareOfferMessage(offerId: string) {
  const profile = await getCurrentProfile();
  const { supabase, offer, error } = await loadOfferForHandoff(offerId);

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo messages are read-only." };
  }

  const approvalError = ensureApproved(offer);

  if (error || approvalError || !offer) {
    return { ok: false, message: error?.message ?? approvalError ?? "Offer not found." };
  }

  const { data: exports } = await supabase
    .from("offer_assets")
    .select("storage_bucket,storage_path,metadata")
    .eq("offer_id", offerId)
    .eq("asset_kind", "export");
  const attachmentLinks = (exports ?? []).map((asset) => `${asset.storage_bucket}/${asset.storage_path}`);
  const subject = offer.title;
  const body = [
    `Здравствуйте! Подготовили предложение: ${offer.title}.`,
    "",
    offer.summary,
    "",
    "Отправка этого сообщения вручную: автоматическая рассылка в системе заблокирована до явного legal basis и человеческого подтверждения.",
  ].join("\n");
  const { error: messageError } = await supabase.from("messages").insert({
    offer_id: offerId,
    status: "prepared",
    channel: "email",
    subject,
    body,
    prepared_by: profile.id === "demo-user" ? null : profile.id,
    metadata: {
      attachment_links: attachmentLinks,
      manual_send_required: true,
      automatic_send_blocked: true,
      legal_basis_required: true,
    },
  });

  return messageError ? { ok: false, message: messageError.message } : { ok: true, message: "Prepared message created with manual send gate." };
}

export async function createDealFromOffer(offerId: string) {
  const profile = await getCurrentProfile();

  if (!canApproveOutbound(profile.role)) {
    return { ok: false, message: "Only admin and manager roles can create deals." };
  }

  const { supabase, offer, error } = await loadOfferForHandoff(offerId);

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo deals are read-only." };
  }

  const approvalError = ensureApproved(offer);

  if (error || approvalError || !offer) {
    return { ok: false, message: error?.message ?? approvalError ?? "Offer not found." };
  }

  const amount = offer.priceFrom;
  const cost = Math.max(0, amount * (1 - offer.marginPercent / 100));
  const margin = Math.max(0, amount - cost);
  const commissionRate = 10;
  const { data: existing } = await supabase.from("deals").select("id").eq("offer_id", offerId).limit(1).maybeSingle();

  if (existing) {
    return { ok: true, message: "Deal already exists." };
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
      offer_id: offerId,
      organization_id: offer.organizationId,
      status: "open",
      amount,
      cost,
      margin,
      owner_id: profile.id === "demo-user" ? null : profile.id,
    })
    .select("id")
    .single();

  if (dealError || !deal) {
    return { ok: false, message: dealError?.message ?? "Deal creation failed." };
  }

  const { error: commissionError } = await supabase.from("commissions").insert({
    deal_id: deal.id,
    profile_id: profile.id === "demo-user" ? null : profile.id,
    basis_amount: margin,
    rate_percent: commissionRate,
  });

  return commissionError ? { ok: false, message: commissionError.message } : { ok: true, message: "Deal and commission created." };
}
