import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// New Supabase projects use a "publishable" key (sb_publishable_...). Older projects use the
// legacy "anon" key — accept either so this works on any project.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing, the app still runs (quiz uses the bundled fallback deck).
export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;
