import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { handleHubCallback } from "@/shared/lib/auth-actions";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { logger } from "@/shared/lib/logger";

export const Route = createFileRoute("/_layout/auth/hub-callback")({
  component: HubCallback,
});

/**
 * Callback handler for "Login with Harpy Hub"
 * Hub redirects back here with access_token and refresh_token
 */
function HubCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const processHubCallback = async () => {
      // Get tokens from URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Tokens can be in query params or hash
      const accessToken =
        searchParams.get("access_token") || hashParams.get("access_token");
      const refreshToken =
        searchParams.get("refresh_token") || hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        logger.error("Missing tokens in Hub callback");
        toastError("Login failed", {
          description: "No authentication tokens received from Harpy Hub.",
        });
        navigate({ to: "/sign-in" });
        return;
      }

      try {
        const { error } = await handleHubCallback(accessToken, refreshToken);

        if (error) {
          toastError("Login failed", { description: error });
          navigate({ to: "/sign-in" });
          return;
        }

        toastSuccess("Welcome! Logged in via Harpy Hub.");
        navigate({ to: "/" });
      } catch (error) {
        logger.error("Hub callback error:", error);
        toastError("Login failed", {
          description: "Failed to authenticate with Harpy Hub.",
        });
        navigate({ to: "/sign-in" });
      }
    };

    processHubCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-fg-subtle text-sm">
          Signing in from Harpy Hub...
        </span>
      </div>
    </div>
  );
}
