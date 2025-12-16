/**
 * OAuth Token Interceptor
 *
 * This runs IMMEDIATELY when the app loads (before main.tsx, before React)
 * to intercept OAuth tokens in the URL and establish a session before
 * the long PGLite DB initialization starts.
 *
 * This prevents "stale token" errors on Safari where tokens expire
 * after 120 seconds but our app initialization takes 30-100 seconds.
 */

import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

// Only run on /auth/callback route
if (window.location.pathname === "/auth/callback") {
  logger.debug("OAuth interceptor: Running on /auth/callback");

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    logger.info("🔥 OAuth interceptor: Processing tokens immediately");

    (async () => {
      const supabase = getSupabaseAuthClient();

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        logger.error("❌ OAuth interceptor: Failed to set session:", error);
        return;
      }

      if (data?.session) {
        logger.info("🎉 OAuth interceptor: Session established successfully", {
          userId: data.session.user?.id,
        });

        // Wait for session to persist to storage
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify session is in localStorage
        const storedSession = localStorage.getItem("astrsk-auth");
        logger.info("📦 OAuth interceptor: Session in localStorage:", {
          exists: !!storedSession,
          length: storedSession?.length,
        });

        // Session is saved, ready to redirect

        // Redirect to home or saved path
        const redirectPath = localStorage.getItem("authRedirectPath");
        if (redirectPath) {
          localStorage.removeItem("authRedirectPath");
          logger.info("🔄 OAuth interceptor: Redirecting to stored path:", redirectPath);
          window.location.href = redirectPath;
        } else {
          logger.info("🔄 OAuth interceptor: Redirecting to home");
          window.location.href = window.location.origin + "/";
        }
      } else {
        logger.warn("⚠️ OAuth interceptor: No session data after setSession");
      }
    })().catch(err => {
      logger.error("OAuth interceptor error:", err);
    });
  } else {
    logger.info("ℹ️ OAuth interceptor: No tokens found on /auth/callback");
  }
}
