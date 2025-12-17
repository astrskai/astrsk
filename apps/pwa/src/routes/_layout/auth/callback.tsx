import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";
import { useAppStore } from "@/shared/stores/app-store";

export const Route = createFileRoute("/_layout/auth/callback")({
  component: AuthCallback,
});

/**
 * OAuth callback handler for Supabase
 * Handles the redirect from OAuth providers (Google, Discord, Apple)
 *
 * Flow:
 * 1. Process OAuth tokens/code from URL
 * 2. Wait for app initialization to complete (isOfflineReady)
 * 3. Navigate to destination using TanStack Router (no page reload)
 *
 * Why we wait for isOfflineReady:
 * - OAuth redirect causes a full page reload, resetting isOfflineReady to false
 * - main.tsx runs PGlite initialization in parallel
 * - We wait for initialization to complete before navigating
 * - This avoids triggering another page reload which can cause issues on iOS Chrome
 */
function AuthCallback() {
  // 1. State hooks
  const [authComplete, setAuthComplete] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/");

  // 2. Store hooks
  const isOfflineReady = useAppStore.use.isOfflineReady();

  // 3. Navigation hooks
  const navigate = useNavigate();

  // Step 1: Process OAuth callback (runs once on mount)
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
          logger.debug("OAuth login successful, waiting for app initialization...");

          // Get redirect path before marking auth complete
          const storedPath = localStorage.getItem("authRedirectPath");
          if (storedPath) {
            localStorage.removeItem("authRedirectPath");
            setRedirectPath(storedPath);
          }

          setAuthComplete(true);
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

  // Step 2: Navigate after auth complete
  // Use polling to check isOfflineReady since Zustand subscription may not work reliably
  useEffect(() => {
    if (!authComplete) return;

    logger.debug("[AuthCallback] Auth complete, waiting for initialization...");

    const checkAndNavigate = () => {
      const ready = useAppStore.getState().isOfflineReady;
      logger.debug("[AuthCallback] Polling isOfflineReady:", ready);

      if (ready) {
        logger.debug("App initialized, navigating to:", redirectPath);
        navigate({ to: redirectPath, replace: true });
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkAndNavigate()) return;

    // Poll every 100ms for up to 30 seconds
    let attempts = 0;
    const maxAttempts = 300;
    const interval = setInterval(() => {
      attempts++;
      if (checkAndNavigate() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          logger.error("[AuthCallback] Timeout waiting for initialization, forcing navigation");
          window.location.href = redirectPath;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [authComplete, redirectPath, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-fg-subtle text-sm">Completing sign in...</span>
      </div>
    </div>
  );
}
