import { productPackageFormSchema, type ProductPackageFormInput } from "@souvenir-leadgen/shared";
import { getCurrentProfile } from "./auth";
import { canManageCatalog } from "./permissions";
import { createSupabaseServerClient } from "./supabase/server";

export type ProductPackageView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  technology: string;
  minQuantity: number;
  priceFrom: number;
  productionDays: number;
  targetIndustries: string[];
  marginPercent: number | null;
  isActive: boolean;
};

export type CatalogViewModel = {
  packages: ProductPackageView[];
  canManage: boolean;
  source: "supabase" | "demo";
  warning: string | null;
};

const demoPackages: ProductPackageView[] = [
  {
    id: "demo-welcome-pack",
    name: "Welcome merch starter pack",
    slug: "welcome-merch-starter-pack",
    description: "Mug, sticker sheet, and notebook for onboarding or events.",
    technology: "UV print and digital transfer",
    minQuantity: 50,
    priceFrom: 790,
    productionDays: 7,
    targetIndustries: ["hr", "events", "education"],
    marginPercent: 25,
    isActive: true,
  },
];

function toView(row: Record<string, unknown>): ProductPackageView {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    technology: String(row.technology),
    minQuantity: Number(row.min_quantity),
    priceFrom: Number(row.price_from),
    productionDays: Number(row.production_days),
    targetIndustries: Array.isArray(row.target_industries) ? row.target_industries.map(String) : [],
    marginPercent: row.margin_percent === null || row.margin_percent === undefined ? null : Number(row.margin_percent),
    isActive: Boolean(row.is_active),
  };
}

export async function getCatalogViewModel(): Promise<CatalogViewModel> {
  const profile = await getCurrentProfile();
  const canManage = canManageCatalog(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      packages: demoPackages,
      canManage,
      source: "demo",
      warning: "Supabase env is not configured; catalog actions are disabled and demo data is shown.",
    };
  }

  const { data, error } = await supabase
    .from("product_packages")
    .select("id,name,slug,description,technology,min_quantity,price_from,production_days,target_industries,margin_percent,is_active")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      packages: [],
      canManage,
      source: "supabase",
      warning: error.message,
    };
  }

  return {
    packages: (data ?? []).map(toView),
    canManage,
    source: "supabase",
    warning: null,
  };
}

export async function getProductPackageForEdit(id: string): Promise<{
  package: ProductPackageView | null;
  canManage: boolean;
  source: "supabase" | "demo";
  warning: string | null;
}> {
  const profile = await getCurrentProfile();
  const canManage = canManageCatalog(profile.role);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      package: demoPackages.find((item) => item.id === id) ?? null,
      canManage,
      source: "demo",
      warning: "Supabase env is not configured; demo catalog is read-only.",
    };
  }

  const { data, error } = await supabase
    .from("product_packages")
    .select("id,name,slug,description,technology,min_quantity,price_from,production_days,target_industries,margin_percent,is_active")
    .eq("id", id)
    .maybeSingle();

  return {
    package: data ? toView(data) : null,
    canManage,
    source: "supabase",
    warning: error?.message ?? null,
  };
}

export async function createProductPackage(input: ProductPackageFormInput) {
  const profile = await getCurrentProfile();

  if (!canManageCatalog(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can manage product packages." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo catalog is read-only." };
  }

  const parsed = productPackageFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid product package." };
  }

  const targetIndustries = parsed.data.targetIndustries
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase.from("product_packages").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    technology: parsed.data.technology,
    min_quantity: parsed.data.minQuantity,
    price_from: parsed.data.priceFrom,
    production_days: parsed.data.productionDays,
    target_industries: targetIndustries,
    margin_percent: parsed.data.marginPercent,
    is_active: true,
    created_by: profile.id === "demo-user" ? null : profile.id,
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "Package created." };
}

export async function updateProductPackage(id: string, input: ProductPackageFormInput) {
  const profile = await getCurrentProfile();

  if (!canManageCatalog(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can edit product packages." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo catalog is read-only." };
  }

  const parsed = productPackageFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid product package." };
  }

  const targetIndustries = parsed.data.targetIndustries
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("product_packages")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      technology: parsed.data.technology,
      min_quantity: parsed.data.minQuantity,
      price_from: parsed.data.priceFrom,
      production_days: parsed.data.productionDays,
      target_industries: targetIndustries,
      margin_percent: parsed.data.marginPercent,
    })
    .eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Package updated." };
}

export async function deactivateProductPackage(id: string) {
  const profile = await getCurrentProfile();

  if (!canManageCatalog(profile.role)) {
    return { ok: false, message: "Only admin and producer roles can deactivate product packages." };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase env is not configured; demo catalog is read-only." };
  }

  const { error } = await supabase.from("product_packages").update({ is_active: false }).eq("id", id);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Package deactivated." };
}
