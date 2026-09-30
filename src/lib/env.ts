/** Is Supabase configured? When false, repos fall back to const data in src/data/*.ts. */
export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
