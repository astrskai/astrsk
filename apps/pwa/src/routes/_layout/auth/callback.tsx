import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

// Note: oauth-interceptor.ts runs at app entry point (before main.tsx)
// It detects OAuth tokens and sets a flag for better UX messaging
// main.tsx skips all initialization during OAuth callback to avoid worker conflicts
// This component processes tokens after React mounts, then triggers full page reload to home

export const Route = createFileRoute("/_layout/auth/callback")({
  component: AuthCallback,
});

/**
 * OAuth callback handler for Supabase
 * Handles the redirect from OAuth providers (Google, Discord, Apple)
 */
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      logger.info("🔥 AuthCallback component mounted (React useEffect running)");
      const supabase = getSupabaseAuthClient();

      // Get the auth code from URL if present
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = queryParams.get("code");

      logger.info("📋 OAuth callback received:", {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        url: window.location.href,
      });

      try {
        if (code) {
          // Exchange code for session (PKCE flow)
          logger.info("Exchanging PKCE code for session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            logger.error("Code exchange error:", error);
            navigate({ to: "/sign-in" });
            return;
          }
        } else if (accessToken && refreshToken) {
          // Set session from tokens (implicit flow) - handled by immediate processing above
          // This is a fallback in case immediate processing didn't run
          logger.info("Setting session from tokens (fallback)...");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            logger.error("Set session error:", error);
            navigate({ to: "/sign-in" });
            return;
          }
        }

        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          logger.info("OAuth login successful", { userId: session.user?.id });

          // Clear OAuth login flag
          sessionStorage.removeItem("oauth-login-in-progress");

          // Check if there's a stored redirect path (e.g., from play session login)
          const redirectPath = localStorage.getItem("authRedirectPath");
          if (redirectPath) {
            localStorage.removeItem("authRedirectPath");
            logger.info("Redirecting to stored path:", redirectPath);
            window.location.href = redirectPath;
          } else {
            logger.info("Redirecting to home");
            // Use window.location for full page reload to trigger initialization
            window.location.href = "/";
          }
        } else {
          logger.warn("No session after OAuth callback");
          // Clear OAuth login flag on error too
          sessionStorage.removeItem("oauth-login-in-progress");
          navigate({ to: "/sign-in" });
        }
      } catch (error) {
        logger.error("OAuth callback error:", error);
        navigate({ to: "/sign-in" });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-fg-subtle text-sm">Completing sign in...</span>
      </div>
    </div>
  );
}
