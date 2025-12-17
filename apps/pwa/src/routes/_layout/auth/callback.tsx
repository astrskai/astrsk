import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

export const Route = createFileRoute("/_layout/auth/callback")({
  component: AuthCallback,
});

/**
 * OAuth callback handler for Supabase
 * Handles the redirect from OAuth providers (Google, Discord, Apple)
 *
 * Note: Uses window.location.href instead of TanStack Router's navigate()
 * because navigate() may not work reliably in OAuth callback on iOS Chrome.
 */
function AuthCallback() {
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
        if (code) {
          // Exchange code for session (PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            logger.error("Code exchange error:", error);
            window.location.href = "/sign-in";
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
            window.location.href = "/sign-in";
            return;
          }
        }

        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          logger.debug("OAuth login successful");

          // Check if there's a stored redirect path (e.g., from play session login)
          const redirectPath = localStorage.getItem("authRedirectPath");
          if (redirectPath) {
            localStorage.removeItem("authRedirectPath");
          }
          // Use window.location.href for full page reload to ensure proper app state
          window.location.href = redirectPath || "/";
        } else {
          logger.warn("No session after OAuth callback");
          window.location.href = "/sign-in";
        }
      } catch (error) {
        logger.error("OAuth callback error:", error);
        window.location.href = "/sign-in";
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-fg-subtle text-sm">Completing sign in...</span>
      </div>
    </div>
  );
}
