import { createClient } from "@supabase/supabase-js";

// Supabase configuration
// These should be set in environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
}

// Create Supabase client for anonymous access
// This client can only INSERT (per RLS policies)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage bucket name for assets
export const ASSETS_BUCKET = "astrsk-assets";

// Default expiration time for shared links (1 hour = 1/24 day)
export const DEFAULT_SHARE_EXPIRATION_DAYS = 1 / 24;
