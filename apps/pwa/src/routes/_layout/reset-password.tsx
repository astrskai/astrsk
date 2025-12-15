import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/pages/auth";

// Search params type for reset password token
interface ResetPasswordSearchParams {
  token?: string;
}

export const Route = createFileRoute("/_layout/reset-password")({
  validateSearch: (
    search: Record<string, unknown>,
  ): ResetPasswordSearchParams => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    };
  },
  // Access allowed for:
  // 1. Email link with token (forgot password flow)
  // 2. Logged-in user without token (settings flow - will check auth in component)
  component: ResetPasswordPage,
});
