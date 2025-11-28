/**
 * Auth hooks for Supabase authentication
 */

import { useContext, useCallback, useMemo } from "react";
import { AuthContext } from "@/shared/contexts/auth-context";

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for Convex auth integration (optional, for future use)
 * Returns the interface expected by ConvexProviderWithAuth
 */
export function useSupabaseAuthForConvex() {
  const { isLoading, isAuthenticated, session, refreshSession } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        await refreshSession();
      }
      return session?.access_token ?? null;
    },
    [session, refreshSession],
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, fetchAccessToken],
  );
}

/**
 * Hook to get JWT token for external services
 * Can be used for Convex or other services that need JWT
 */
export function useAccessToken() {
  const { session } = useAuth();
  return session?.access_token ?? null;
}
