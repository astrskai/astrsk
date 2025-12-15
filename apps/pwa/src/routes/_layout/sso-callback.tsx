import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { logger } from "@/shared/lib/logger";

export const Route = createFileRoute("/_layout/sso-callback")({
  component: SSOCallback,
});

/**
 * OAuth callback handler for Supabase
 * Supabase automatically handles the OAuth code exchange via URL hash
 */
function SSOCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabaseAuthClient();

      // Supabase handles the code exchange automatically from the URL
      // We just need to check if there's a session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error("OAuth callback error:", error);
        navigate({ to: "/sign-in" });
        return;
      }

      if (session) {
        logger.debug("OAuth login successful");
        navigate({ to: "/" });
      } else {
        // No session yet, wait for auth state change
        logger.debug("Waiting for session...");
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
