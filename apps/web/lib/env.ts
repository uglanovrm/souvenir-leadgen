export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey.startsWith("replace-with")) {
    return null;
  }

  return { url, anonKey };
}

export function hasSupabaseEnv() {
  return getSupabaseEnv() !== null;
}
