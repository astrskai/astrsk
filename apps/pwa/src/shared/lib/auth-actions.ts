/**
 * Auth actions for Supabase Auth
 * Handles authentication for Astrsk PWA with shared Supabase database
 *
 * Key features:
 * - Social login (Google, Discord, Apple) - shared across Hub and Astrsk
 * - Email login - app-specific with app_source metadata
 * - Hub redirect login - authenticate via Hub and redirect back
 */

import { getSupabaseAuthClient, APP_SOURCE } from "./supabase-client";
import { logger } from "./logger";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  name?: string;
}

/**
 * Sign in with email/password
 * Only allows users who registered with Astrsk (app_source: "astrsk")
 */
export async function signIn(credentials: SignInCredentials) {
  const supabase = getSupabaseAuthClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { error: error.message, data: null };
  }

  // Check if this is an Astrsk user (for email users only)
  // Social login users can access both apps
  const provider = data.user?.app_metadata?.provider;
  const appSource = data.user?.user_metadata?.app_source;

  if (provider === "email" && appSource !== APP_SOURCE) {
    // Sign out the user - they registered with Hub
    await supabase.auth.signOut();
    return {
      error: "This email is registered with Harpy Hub. Please use 'Login with Harpy Hub' or sign up with a different email.",
      data: null,
    };
  }

  return { error: null, data };
}

/**
 * Sign up with email/password
 * Stores app_source metadata to distinguish Astrsk users from Hub users
 */
export async function signUp(credentials: SignUpCredentials) {
  const supabase = getSupabaseAuthClient();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        name: credentials.name,
        app_source: APP_SOURCE, // Mark as Astrsk user
      },
    },
  });

  // Debug logging
  logger.debug("SignUp response:", { data, error });
  console.log("SignUp response:", { data, error });

  if (error) {
    // Handle duplicate email
    if (error.message.includes("already registered")) {
      return {
        error: "This email is already registered. Please sign in or use a different email.",
        data: null,
      };
    }
    return { error: error.message, data: null };
  }

  // Check if user already exists (identities will be empty for existing users)
  // This happens when the email is registered via Hub
  if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
    return {
      error: "This email is already registered with Harpy Hub. Please use 'Login with Harpy Hub' or sign in with your existing password.",
      data: null,
    };
  }

  return { error: null, data };
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabaseAuthClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Sign in with OAuth provider
 * Supports: Google, Discord, Apple
 * OAuth users can access both Hub and Astrsk (shared identity)
 */
export async function signInWithOAuth(
  provider: "google" | "discord" | "apple",
) {
  const supabase = getSupabaseAuthClient();

  // Build callback URL
  const callbackUrl = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data };
}

/**
 * Redirect to Harpy Hub for login
 * After Hub login, Hub will redirect back with tokens
 */
export function redirectToHubLogin() {
  const hubUrl = import.meta.env.VITE_HARPY_HUB_URL || "https://hub.harpychat.com";
  const returnUrl = `${window.location.origin}/auth/hub-callback`;

  // Redirect to Hub login with return URL
  window.location.href = `${hubUrl}/login?redirectTo=${encodeURIComponent(returnUrl)}&source=astrsk`;
}

/**
 * Handle Hub redirect callback
 * Sets the session from tokens passed by Hub
 */
export async function handleHubCallback(accessToken: string, refreshToken: string) {
  const supabase = getSupabaseAuthClient();

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      logger.error("Failed to set session from Hub:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err) {
    logger.error("Hub callback error:", err);
    return { error: "Failed to authenticate with Harpy Hub", data: null };
  }
}

/**
 * Reset password request
 */
export async function resetPasswordRequest(email: string) {
  const supabase = getSupabaseAuthClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseAuthClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = getSupabaseAuthClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { error: error.message, session: null };
  }

  return { error: null, session };
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = getSupabaseAuthClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { error: error.message, user: null };
  }

  return { error: null, user };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  const supabase = getSupabaseAuthClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );

  return subscription;
}
