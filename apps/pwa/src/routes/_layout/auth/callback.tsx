import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

export const Route = createFileRoute("/_layout/auth/callback")({
  component: AuthCallback,
});

/**
 * OAuth callback handler for Supabase
 * Handles the redirect from OAuth providers (Google, Discord, Apple)
 *
 * Flow:
 * 1. Process OAuth tokens/code from URL
 * 2. Hard redirect to clean URL (window.location.href)
 *
 * Why we use hard redirect instead of navigate():
 * - OAuth callback URL contains tokens/code in query params or hash
 * - On iOS Chrome, PGlite initialization hangs when these params are present
 * - Hard redirect to clean URL triggers fresh page load with proper initialization
 * - This is more reliable than SPA navigation for OAuth flows
 */
function AuthCallback() {
  const [status, setStatus] = useState<string>("Processing...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabaseAuthClient();

      // Get the auth code from URL if present
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = queryParams.get("code");

      try {
        setStatus("Exchanging tokens...");

        if (code) {
          // Exchange code for session (PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            logger.error("Code exchange error:", error);
            setStatus("Error: " + error.message);
            setTimeout(() => (window.location.href = "/sign-in"), 2000);
            return;
          }
        } else if (accessToken && refreshToken) {
          // Set session from tokens (implicit flow)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            logger.error("Set session error:", error);
            setStatus("Error: " + error.message);
            setTimeout(() => (window.location.href = "/sign-in"), 2000);
            return;
          }
        }

        // Check if we have a valid session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          logger.debug("OAuth login successful, redirecting to settings...");
          setStatus("Success! Redirecting...");

          // Hard redirect to settings page - this ensures fresh page load
          // and proper PGlite initialization on iOS Chrome
          window.location.href = "/settings";
        } else {
          logger.warn("No session after OAuth callback");
          setStatus("No session found");
          setTimeout(() => (window.location.href = "/sign-in"), 2000);
        }
      } catch (error) {
        logger.error("OAuth callback error:", error);
        setStatus("Error: " + (error instanceof Error ? error.message : "Unknown error"));
        setTimeout(() => (window.location.href = "/sign-in"), 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-fg-subtle text-sm">Completing sign in...</span>
      </div>
      <div className="text-fg-muted text-xs font-mono">{status}</div>
    </div>
  );
}
