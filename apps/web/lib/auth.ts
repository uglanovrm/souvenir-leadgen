import type { AppRole } from "@souvenir-leadgen/shared";
import { appRoleSchema } from "@souvenir-leadgen/shared";
import { createSupabaseServerClient } from "./supabase/server";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string;
  role: AppRole;
  source: "supabase" | "demo";
};

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: "demo-user",
      email: null,
      fullName: "Demo producer",
      role: "producer",
      source: "demo",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      id: "anonymous",
      email: null,
      fullName: "Unauthenticated",
      role: "agent",
      source: "supabase",
    };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    fullName: data?.full_name ?? user.email ?? "User",
    role: appRoleSchema.catch("agent").parse(data?.role),
    source: "supabase",
  };
}
