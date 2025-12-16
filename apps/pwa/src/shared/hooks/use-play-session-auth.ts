/**
 * Hook to check if user needs authentication for play sessions
 *
 * A user needs to authenticate if:
 * 1. The session is a play session (isPlaySession = true)
 * 2. User is not authenticated
 * 3. Default lite OR heavy model is still set to astrsk provider (ApiSource.AstrskAi)
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useModelStore } from "@/shared/stores/model-store";
import { sessionQueries } from "@/entities/session/api";
import { ApiSource } from "@/entities/api/domain";
import { UniqueEntityID } from "@/shared/domain";

export interface PlaySessionAuthState {
  needsAuth: boolean;
  isPlaySession: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAstrskProvider: boolean;
}

/**
 * Check if user needs authentication to access a play session
 */
export function usePlaySessionAuth(sessionId?: UniqueEntityID): PlaySessionAuthState {
  // Auth state
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Session data
  const { data: session, isLoading: isSessionLoading } = useQuery({
    ...sessionQueries.detail(sessionId),
    enabled: !!sessionId,
  });

  // Model store state
  const defaultLiteModel = useModelStore.use.defaultLiteModel();
  const defaultStrongModel = useModelStore.use.defaultStrongModel();

  // Check if user needs auth
  const authState = useMemo((): PlaySessionAuthState => {
    const isLoading = isAuthLoading || (!!sessionId && isSessionLoading);

    // Wait for data to load
    if (isLoading || !session) {
      return {
        needsAuth: false,
        isPlaySession: false,
        isAuthenticated,
        isLoading,
        hasAstrskProvider: false,
      };
    }

    const isPlaySession = session.isPlaySession;

    // Check if default models are using AstrskAi provider
    const hasAstrskProvider =
      !defaultLiteModel ||
      !defaultStrongModel ||
      defaultLiteModel?.apiSource === ApiSource.AstrskAi ||
      defaultStrongModel?.apiSource === ApiSource.AstrskAi;

    // User needs auth if:
    // 1. It's a play session
    // 2. User is not authenticated
    // 3. Using AstrskAi provider for default models
    const needsAuth = isPlaySession && !isAuthenticated && hasAstrskProvider;

    return {
      needsAuth,
      isPlaySession,
      isAuthenticated,
      isLoading: false,
      hasAstrskProvider,
    };
  }, [
    isAuthLoading,
    isSessionLoading,
    session,
    isAuthenticated,
    defaultLiteModel,
    defaultStrongModel,
    sessionId,
  ]);

  return authState;
}
