/**
 * AuthProvider - Supabase authentication provider for Astrsk PWA
 *
 * Provides authentication context with:
 * - Session management
 * - User state
 * - Auth state change subscription
 */

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseAuthClient } from "@/shared/lib/supabase-client";
import { AuthContext } from "@/shared/contexts/auth-context";
import { logger } from "@/shared/lib/logger";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseAuthClient();

    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        logger.error("Failed to get initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        logger.debug("Auth state changed:", event);

        setSession(newSession);
        setUser(newSession?.user ?? null);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseAuthClient();
    await supabase.auth.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    const supabase = getSupabaseAuthClient();
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();

    if (refreshedSession) {
      setSession(refreshedSession);
      setUser(refreshedSession.user);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated: !!session,
      signOut,
      refreshSession,
    }),
    [session, user, isLoading, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
