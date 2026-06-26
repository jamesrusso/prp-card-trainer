import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// New Supabase API uses a publishable key (sb_publishable_…); fall back to the legacy anon key.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing, the app still runs (quiz uses the bundled fallback deck).
export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;
