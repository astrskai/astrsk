import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// HARPY HUB DATA CLIENT (harpy-hub project)
// Used for: Shared data (assets, cards, sessions - no auth required)
// =============================================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
}

// Create Supabase client for data access (anonymous, no auth)
// This client is used for reading/writing shared data to Harpy Hub database
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Getter function for consistency with auth client
export function getSupabaseDataClient(): SupabaseClient {
  return supabaseClient;
}

// =============================================================================
// ASTRSK AUTH CLIENT (astrsk-dev project)
// Used for: Authentication (sign up, sign in, password reset, OAuth)
// =============================================================================
const SUPABASE_ASTRSK_URL = import.meta.env.VITE_SUPABASE_ASTRSK_URL;
const SUPABASE_ASTRSK_ANON_KEY = import.meta.env.VITE_SUPABASE_ASTRSK_ANON_KEY;

if (!SUPABASE_ASTRSK_URL || !SUPABASE_ASTRSK_ANON_KEY) {
  throw new Error(
    "Missing Supabase Astrsk Auth environment variables. Please set VITE_SUPABASE_ASTRSK_URL and VITE_SUPABASE_ASTRSK_ANON_KEY",
  );
}

// Create Supabase client for authentication
// This client handles user sessions and auth state
let supabaseAuthClient: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient {
  if (!supabaseAuthClient) {
    supabaseAuthClient = createClient(SUPABASE_ASTRSK_URL, SUPABASE_ASTRSK_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: "astrsk-auth",
        storage: window.localStorage,
        // Let Supabase auto-detect the flow type from URL
        // detectSessionInUrl will handle both PKCE and implicit flow automatically
      },
    });
  }
  return supabaseAuthClient;
}

// Storage bucket name for assets
export const ASSETS_BUCKET = "astrsk-assets";

// Default expiration time for shared links (1 hour = 1/24 day)
export const DEFAULT_SHARE_EXPIRATION_DAYS = 1 / 24;

// App source identifier for email-based users
export const APP_SOURCE = "astrsk" as const;

// Harpy Hub URL for share links
export const HARPY_HUB_URL = import.meta.env.VITE_HARPY_HUB_URL || "https://harpy.chat";
