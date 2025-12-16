import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

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
      const supabase = getSupabaseAuthClient();

      // Get the auth code from URL if present
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = queryParams.get("code");
      const error_description = queryParams.get("error_description");

      // Debug logging for Safari troubleshooting
      logger.debug("OAuth callback received:", {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        errorDescription: error_description,
        userAgent: navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
      });

      try {
        // If there's an error in the URL, handle it
        if (error_description) {
          logger.error("OAuth error from provider:", error_description);
          navigate({ to: "/sign-in" });
          return;
        }

        if (code) {
          // Exchange code for session (PKCE flow)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            logger.error("Code exchange error:", exchangeError);

            // Safari ITP workaround: If code exchange fails, wait for detectSessionInUrl
            // to automatically handle the session (configured in supabase-client.ts)
            logger.info("Waiting for detectSessionInUrl to handle session...");

            // Give detectSessionInUrl time to process (500ms)
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else if (accessToken && refreshToken) {
          // Set session from tokens (implicit flow)
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            logger.error("Set session error:", setSessionError);
            navigate({ to: "/sign-in" });
            return;
          }
        } else {
          // No code or tokens - let detectSessionInUrl handle it
          logger.info("No explicit auth params, waiting for detectSessionInUrl...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if we have a valid session (may have been set by detectSessionInUrl)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          logger.debug("OAuth login successful", { userId: session.user?.id });

          // Check if there's a stored redirect path (e.g., from play session login)
          const redirectPath = localStorage.getItem("authRedirectPath");
          if (redirectPath) {
            localStorage.removeItem("authRedirectPath");
            window.location.href = redirectPath; // Use window.location for full page reload
          } else {
            navigate({ to: "/" });
          }
        } else {
          logger.warn("No session after OAuth callback, redirecting to sign-in");
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
