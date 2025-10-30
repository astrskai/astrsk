import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { UniqueEntityID } from "@/shared/domain";
import { useFlowValidation } from "@/shared/hooks/use-flow-validation";
import { sessionQueries } from "@/app/queries/session-queries";
import { useValidationStore } from "@/shared/stores/validation-store";
import { logger } from "@/shared/lib";

/**
 * Session validation hook (refactored to match flows pattern)
 *
 * Validation logic:
 * 1. Session must exist
 * 2. Session must have at least one AI character card
 * 3. Session's flow must be valid (checked via useFlowValidation)
 *
 * Performance:
 * - Depends on sessionQueries.detail() with staleTime: 0 (auto-refetch)
 * - No separate validation query (computed from session data)
 * - Automatically updates when session data changes
 */
export function useSessionValidation(sessionId?: UniqueEntityID | null) {
  // Get session detail data (auto-refetch on stale)
  const { data: session, isFetched: isSessionFetched } = useQuery(
    sessionQueries.detail(sessionId || undefined),
  );
  // Get flow validation
  const { isValid: isFlowValid, isFetched: isFlowFetched } = useFlowValidation(
    session?.flowId ?? null,
  );
  // Validate session (computed from session data, no separate query)
  const isSessionValid = useMemo(() => {
    if (!session) return false;
    // Check session has AI character cards
    if (session.aiCharacterCardIds.length === 0) {
      return false;
    }
    // Session is valid
    return true;
  }, [session]);
  // Combined validation result
  const isValid = isSessionValid && isFlowValid;
  const isFetched = isSessionFetched && isFlowFetched;
  // Update validation store
  const { setInvalid } = useValidationStore();
  useEffect(() => {
    if (!sessionId || !isFetched) {
      return;
    }
    logger.debug({
      sessionId: sessionId.toString(),
      isValid,
      isSessionValid,
      isFlowValid,
    });
    setInvalid("sessions", sessionId, !isValid);
  }, [isFlowValid, isSessionValid, isValid, sessionId, setInvalid, isFetched]);
  // Return session validation result
  return { isValid, isFetched } as const;
}
