import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

// IMMEDIATE TOKEN PROCESSING
// Process OAuth tokens BEFORE React renders to prevent "stale token" errors
// caused by the long app initialization time (PGLite DB can take 30-100 seconds)
const processTokensImmediately = async () => {
  logger.info("🔥 Module loaded, checking for OAuth tokens in URL...", {
    fullUrl: window.location.href,
    hash: window.location.hash,
    search: window.location.search,
    pathname: window.location.pathname,
  });

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  logger.info("🔍 Token check:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length,
    refreshTokenLength: refreshToken?.length,
  });

  if (accessToken && refreshToken) {
    logger.info("✅ Processing OAuth tokens immediately (before React mount)");
    const supabase = getSupabaseAuthClient();

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      logger.error("❌ Failed to set session from OAuth tokens:", error);
      return;
    }

    if (data?.session) {
      logger.info("🎉 OAuth session established successfully", {
        userId: data.session.user?.id,
        email: data.session.user?.email,
      });
      // Redirect immediately
      const redirectPath = localStorage.getItem("authRedirectPath");
      if (redirectPath) {
        localStorage.removeItem("authRedirectPath");
        logger.info("🔄 Redirecting to stored path:", redirectPath);
        window.location.href = redirectPath;
      } else {
        logger.info("🔄 Redirecting to home");
        window.location.href = window.location.origin + "/";
      }
    } else {
      logger.warn("⚠️ No session data after setSession");
    }
  } else {
    logger.info("ℹ️ No tokens in URL hash, skipping immediate processing");
  }
};

// Process tokens immediately (non-blocking)
processTokensImmediately().catch(err => {
  logger.error("Error processing OAuth tokens:", err);
});

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

          // Check if there's a stored redirect path (e.g., from play session login)
          const redirectPath = localStorage.getItem("authRedirectPath");
          if (redirectPath) {
            localStorage.removeItem("authRedirectPath");
            logger.info("Redirecting to stored path:", redirectPath);
            window.location.href = redirectPath;
          } else {
            logger.info("Redirecting to home");
            navigate({ to: "/" });
          }
        } else {
          logger.warn("No session after OAuth callback");
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
