import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True only when both client-safe Supabase env vars are present. When false,
// the app falls back to the local seed data (see fetchSpots) so local dev works
// with no backend configured.
export const hasSupabaseConfig = Boolean(url && anonKey);

// Only construct a client when configured — otherwise stays null and callers
// use the offline fallback.
export const supabase = hasSupabaseConfig ? createClient(url, anonKey) : null;
