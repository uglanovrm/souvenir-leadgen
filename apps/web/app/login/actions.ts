"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const next = String(formData.get("next") || "/app");

  if (!supabase) {
    redirect(`/login?error=${encodeURIComponent("Supabase env is not configured")}&next=${encodeURIComponent(next)}`);
  }

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
