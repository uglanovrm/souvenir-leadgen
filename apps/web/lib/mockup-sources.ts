import { mockupSourceFormSchema, type MockupSourceFormInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageAssets } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

export type MockupSourceView = {
  id: string;
  name: string;
  status: string;
  author: string | null;
  license: string | null;
  notes: string | null;
  sourceBucket: string;
  sourcePath: string;
  sourceKind: string;
};

export type RuntimeTemplateView = {
  id: string;
  name: string;
  sourceId: string | null;
  templatePrefix: string;
};

const demoSources: MockupSourceView[] = [{
  id: "00000000-0000-4000-8000-000000000301",
  name: "Demo mug PSD source",
  status: "draft",
  author: "Internal demo",
  license: "Internal only",
  notes: "PSD is source-only; runtime uses exported mockup pack.",
  sourceBucket: "mockup-sources",
  sourcePath: "demo/mug/source.psd",
  sourceKind: "psd",
}];

const demoTemplates: RuntimeTemplateView[] = [{
  id: "00000000-0000-4000-8000-000000000302",
  name: "Demo mug front view",
  sourceId: "00000000-0000-4000-8000-000000000301",
  templatePrefix: "demo/mug/front",
}];

function toSourceView(row: Record<string, unknown>): MockupSourceView {
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status ?? "draft"),
    author: row.author ? String(row.author) : null,
    license: row.license ? String(row.license) : null,
    notes: row.notes ? String(row.notes) : null,
    sourceBucket: String(row.source_bucket),
    sourcePath: String(row.source_path),
    sourceKind: String(row.source_kind),
  };
}

function toTemplateView(row: Record<string, unknown>): RuntimeTemplateView {
  return {
    id: String(row.id),
    name: String(row.name),
    sourceId: row.source_id ? String(row.source_id) : null,
    templatePrefix: String(row.template_prefix),
  };
}

function metadataFromInput(input: MockupSourceFormInput) {
  return {
    author: input.author || null,
    license: input.license || null,
  };
}

export async function getMockupSourceLibrary() {
  const profile = await getCurrentProfile();
  const canManage = canManageAssets(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      sources: demoSources,
      templates: demoTemplates,
      canManage,
      source: "demo" as const,
      warning: "Supabase env is not configured; PSD source actions are disabled and demo data is shown.",
    };
  }

  const { data: sources, error: sourceError } = await supabase
    .from("mockup_template_sources")
    .select("id,name,status,author,license,notes,source_bucket,source_path,source_kind")
    .order("created_at", { ascending: false });
  const { data: templates, error: templateError } = await supabase
    .from("mockup_templates")
    .select("id,name,source_id,template_prefix")
    .order("created_at", { ascending: false });

  return {
    sources: (sources ?? []).map(toSourceView),
    templates: (templates ?? []).map(toTemplateView),
    canManage,
    source: "supabase" as const,
    warning: sourceError?.message ?? templateError?.message ?? null,
  };
}

export async function uploadMockupSource(input: MockupSourceFormInput, file: File | null) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can manage mockup sources." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo PSD sources are read-only." };
  }

  const parsed = mockupSourceFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid PSD source." };
  }

  if (!file || file.size === 0) {
    return { ok: false, message: "PSD file is required." };
  }

  if (!file.name.toLowerCase().endsWith(".psd")) {
    return { ok: false, message: "Only .psd source files are accepted for this library." };
  }

  const sourceId = crypto.randomUUID();
  const storagePath = `sources/${sourceId}/source.psd`;
  const upload = await supabase.storage.from("mockup-sources").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (upload.error) {
    return { ok: false, message: upload.error.message };
  }

  const { error } = await supabase.from("mockup_template_sources").insert({
    id: sourceId,
    name: parsed.data.name,
    source_bucket: "mockup-sources",
    source_path: storagePath,
    source_kind: "psd",
    status: parsed.data.status,
    author: parsed.data.author || null,
    license: parsed.data.license || null,
    notes: parsed.data.notes || null,
    metadata: metadataFromInput(parsed.data),
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "PSD source uploaded." };
}

export async function updateMockupSource(id: string, input: MockupSourceFormInput) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can edit mockup sources." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo PSD sources are read-only." };
  }

  const parsed = mockupSourceFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid PSD source." };
  }

  const { error } = await supabase
    .from("mockup_template_sources")
    .update({
      name: parsed.data.name,
      status: parsed.data.status,
      author: parsed.data.author || null,
      license: parsed.data.license || null,
      notes: parsed.data.notes || null,
      metadata: metadataFromInput(parsed.data),
    })
    .eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "PSD source updated." };
}

export async function linkRuntimeTemplateSource(templateId: string, sourceId: string) {
  const profile = await getCurrentProfile();

  if (!canManageAssets(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can link runtime templates." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo templates are read-only." };
  }

  const { error } = await supabase
    .from("mockup_templates")
    .update({ source_id: sourceId || null })
    .eq("id", templateId);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Runtime template linked to PSD source." };
}
