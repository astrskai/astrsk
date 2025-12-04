/**
 * Auth actions for Supabase Auth
 * Handles authentication for Astrsk PWA with shared Supabase database
 *
 * Key features:
 * - Social login (Google, Discord, Apple) - shared across Hub and Astrsk
 * - Email login - app-specific with app_source metadata
 * - Hub redirect login - authenticate via Hub and redirect back
 */

import { getSupabaseAuthClient, APP_SOURCE, HARPY_HUB_URL } from "./supabase-client";
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

  return { error: null, data };
}

/**
 * Sign up with email/password
 * Stores app_source metadata to identify the user
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
        app_source: APP_SOURCE,
      },
    },
  });

  logger.debug("SignUp response:", { data, error });

  if (error) {
    return { error: error.message, data: null };
  }

  // Check if user already exists (identities will be empty for existing users)
  if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
    return {
      error: "EXISTING_USER",
      data: null,
    };
  }

  return { error: null, data };
}

/**
 * Unified sign in or sign up flow
 * - If user exists: tries to sign in with password
 * - If user doesn't exist: creates account and sends confirmation email
 */
export async function signInOrSignUp(credentials: SignInCredentials): Promise<{
  error: string | null;
  data: unknown;
  action: "signed_in" | "signed_up" | "invalid_password" | "error";
}> {
  const supabase = getSupabaseAuthClient();

  // First, try to sign in
  const signInResult = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  // If sign in succeeds, user exists and password is correct
  if (!signInResult.error) {
    return { error: null, data: signInResult.data, action: "signed_in" };
  }

  // Check the error type
  const errorMessage = signInResult.error.message.toLowerCase();

  // "Invalid login credentials" means either:
  // 1. User exists but wrong password
  // 2. User doesn't exist
  if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid credentials")) {
    // Try to sign up to check if user exists
    const signUpResult = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          app_source: APP_SOURCE,
        },
      },
    });

    if (signUpResult.error) {
      logger.error("SignUp error:", signUpResult.error);
      return { error: signUpResult.error.message, data: null, action: "error" };
    }

    // If identities is empty, user already exists - password was wrong
    if (signUpResult.data.user && (!signUpResult.data.user.identities || signUpResult.data.user.identities.length === 0)) {
      return {
        error: "Invalid password. You already have an account with this email.",
        data: null,
        action: "invalid_password",
      };
    }

    // User was created successfully - needs email confirmation
    return {
      error: null,
      data: signUpResult.data,
      action: "signed_up",
    };
  }

  // Email not confirmed
  if (errorMessage.includes("email not confirmed")) {
    return {
      error: "Please check your email and confirm your account before signing in.",
      data: null,
      action: "error",
    };
  }

  // Other errors
  return { error: signInResult.error.message, data: null, action: "error" };
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
  const returnUrl = `${window.location.origin}/auth/hub-callback`;

  // Redirect to Hub login with return URL
  window.location.href = `${HARPY_HUB_URL}/login?redirectTo=${encodeURIComponent(returnUrl)}&source=astrsk`;
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
