import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode or on mobile Safari
    if (hasRun.current) {
      logger.debug("Auth callback already running, skipping duplicate execution");
      return;
    }
    hasRun.current = true;

    const handleCallback = async () => {
      const supabase = getSupabaseAuthClient();

      try {
        // Get the auth code from URL if present
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = queryParams.get("code");
        const error_description = queryParams.get("error_description");

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Debug logging for troubleshooting
        logger.info("OAuth callback received:", {
          hasCode: !!code,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          errorDescription: error_description,
          isSafari,
          url: window.location.href,
        });

        // If there's an error in the URL, handle it
        if (error_description) {
          logger.error("OAuth error from provider:", error_description);
          navigate({ to: "/sign-in" });
          return;
        }

        // Handle PKCE flow (code in query params)
        if (code) {
          logger.info("Exchanging PKCE code for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error("PKCE code exchange failed:", {
              message: exchangeError.message,
              status: exchangeError.status,
              code: exchangeError.code,
            });

            // For Safari, try to get session anyway (may be cached)
            if (isSafari) {
              logger.info("Safari detected, checking for cached session...");
              const { data: { session: cachedSession } } = await supabase.auth.getSession();
              if (cachedSession) {
                logger.info("Found cached session, proceeding");
                redirectAfterLogin(cachedSession);
                return;
              }
            }

            navigate({ to: "/sign-in" });
            return;
          }

          if (data?.session) {
            logger.info("PKCE exchange successful");
            redirectAfterLogin(data.session);
            return;
          }
        }

        // Handle implicit flow (tokens in hash)
        if (accessToken && refreshToken) {
          logger.info("Setting session from implicit flow tokens...");
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            logger.error("Failed to set session from tokens:", setSessionError);
            navigate({ to: "/sign-in" });
            return;
          }

          if (data?.session) {
            logger.info("Implicit flow session set successfully");
            redirectAfterLogin(data.session);
            return;
          }
        }

        // No code or tokens found
        logger.warn("No auth code or tokens found in callback URL");
        navigate({ to: "/sign-in" });
      } catch (error) {
        logger.error("OAuth callback error:", error);
        navigate({ to: "/sign-in" });
      }
    };

    // Helper function to handle redirect after successful login
    function redirectAfterLogin(session: any) {
      logger.info("Redirecting after successful login", { userId: session.user?.id });

      // Check if there's a stored redirect path (e.g., from play session login)
      const redirectPath = localStorage.getItem("authRedirectPath");
      if (redirectPath) {
        localStorage.removeItem("authRedirectPath");
        logger.info("Redirecting to stored path:", redirectPath);
        window.location.href = redirectPath;
      } else {
        logger.info("Redirecting to home");
        // Use window.location.href instead of navigate() for better mobile Safari compatibility
        // This ensures a full page reload and clears the auth callback URL from history
        window.location.href = window.location.origin + "/";
      }
    }

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
