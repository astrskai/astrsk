/**
 * OAuth Token Interceptor
 *
 * This runs IMMEDIATELY when the app loads (before main.tsx, before React)
 * to detect OAuth callback and set a flag for better UX messaging.
 *
 * The actual optimization happens in main.tsx, which skips all database
 * initialization during OAuth callback to avoid worker conflicts.
 */

import { logger } from "@/shared/lib/logger";

// Only run on /auth/callback route
if (window.location.pathname === "/auth/callback") {
  logger.debug("OAuth interceptor: Running on /auth/callback");

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get("code");

  if (accessToken && refreshToken) {
    logger.info("🔥 OAuth interceptor: Detected OAuth tokens in URL");

    // Set flag for better UX messaging during initialization
    sessionStorage.setItem("oauth-login-in-progress", "true");
    logger.info("✅ OAuth interceptor ready, tokens will be processed by callback component");
  } else if (code) {
    logger.info("🔥 OAuth interceptor: Detected OAuth code in URL (PKCE flow)");

    // Set flag for better UX messaging during initialization
    sessionStorage.setItem("oauth-login-in-progress", "true");
    logger.info("✅ OAuth interceptor ready, code will be processed by callback component");
  } else {
    logger.info("ℹ️ OAuth interceptor: No tokens or code found on /auth/callback");
  }
}
