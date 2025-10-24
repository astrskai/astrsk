import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { sessionQueries } from "@/app/queries/session-queries";
import { CardService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { useValidationStore } from "@/shared/stores/validation-store";
import { logger } from "@/shared/lib";

export function useSessionValidation(sessionId?: UniqueEntityID | null) {
  // Get flow validation
  const [flowId, setFlowId] = useState<UniqueEntityID | null>(null);
  const { isValid: isFlowValid, isFetched: isFlowFetched } =
    useFlowValidation(flowId);

  // Validate session
  const { data: isSessionValid, isFetched: isSessionFetched } = useQuery({
    queryKey: [
      ...sessionQueries.detail(sessionId || undefined).queryKey,
      "validation",
    ],
    queryFn: async () => {
      // Check session id
      if (!sessionId) {
        return false;
      }

      // Get session
      const sessionOrError = await SessionService.getSession.execute(sessionId);
      if (sessionOrError.isFailure) {
        return false;
      }
      const session = sessionOrError.getValue();
      setFlowId(session.flowId ?? null);

      // Check session cards exist
      const deletedCardIds: UniqueEntityID[] = [];

      // Collect all deleted cards first without modifying session
      for (const cardItem of session.allCards) {
        try {
          // Get card
          const cardOrError = await CardService.getCard.execute(cardItem.id);
          if (cardOrError.isFailure) {
            console.warn(`Card not found: ${cardItem.id}`);
            deletedCardIds.push(cardItem.id);
          }
        } catch (error) {
          console.warn(`Failed to load card ${cardItem.id}:`, error);
          deletedCardIds.push(cardItem.id);
        }
      }

      // If any cards were deleted, remove them and save
      if (deletedCardIds.length > 0) {
        // Remove all deleted cards at once
        for (const cardId of deletedCardIds) {
          session.deleteCard(cardId);
        }

        // Save session
        try {
          const saveResult = await SessionService.saveSession.execute({
            session,
          });
          if (saveResult.isFailure) {
            console.warn(
              `Failed to save session after cleanup: ${sessionId}`,
              saveResult.getError(),
            );
          }
        } catch (error) {
          console.warn(
            `Error saving session after cleanup: ${sessionId}`,
            error,
          );
        }
        return false;
      }

      // Check session has AI character cards
      if (session.aiCharacterCardIds.length === 0) {
        return false;
      }

      // Session is valid
      return true;
    },
  });

  // Update validation store
  const isValid = isSessionValid && isFlowValid;
  const { setInvalid } = useValidationStore();
  useEffect(() => {
    if (!sessionId) {
      return;
    }
    logger.debug({
      sessionId: sessionId.toString(),
      isValid,
      isSessionValid,
      isFlowValid,
    });
    setInvalid("sessions", sessionId, !isValid);
  }, [isFlowValid, isSessionValid, isValid, sessionId, setInvalid]);

  // Return session validation result
  const isFetched = isSessionFetched || isFlowFetched;
  return { isValid, isFetched } as const;
}
