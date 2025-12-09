import { useCallback } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { CardType } from "@/entities/card/domain";
import { fetchSession, useSaveSession } from "@/entities/session/api";
import { CardService } from "@/app/services/card-service";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { Session } from "@/entities/session/domain/session";

interface SessionUpdateParams {
  flowId?: string;
  backgroundId?: UniqueEntityID | null;
  chatStyles?: any;
  coverId?: UniqueEntityID | null;
}

/**
 * Comprehensive hook for all session settings operations
 * Combines character management and session property updates
 * following domain-driven design patterns
 */
export function useSessionSettingsHandlers(session: Session | null | undefined) {
  const saveSessionMutation = useSaveSession();

  // ============================================
  // User Character Handlers
  // ============================================

  /**
   * Delete user character card and clear userCharacterCardId
   */
  const handleDeleteUserCharacter = useCallback(async () => {
    if (!session?.userCharacterCardId) return;

    try {
      const latestSession = await fetchSession(session.id);
      latestSession.deleteCard(session.userCharacterCardId);
      const setResult = latestSession.setUserCharacterCardId(null);

      if (setResult.isFailure) {
        toastError("Failed to remove user character", {
          description: setResult.getError(),
        });
        return;
      }

      await saveSessionMutation.mutateAsync({ session: latestSession });
      toastSuccess("User character removed successfully");
    } catch (error) {
      toastError("Failed to remove user character", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session, saveSessionMutation]);

  /**
   * Set or clear user character
   */
  const handleSetUserCharacter = useCallback(
    async (characterId: string | null) => {
      if (!session) return;

      try {
        const latestSession = await fetchSession(session.id);

        if (!characterId) {
          // Clear user character
          if (latestSession.userCharacterCardId) {
            latestSession.deleteCard(latestSession.userCharacterCardId);
          }
          const setResult = latestSession.setUserCharacterCardId(null);

          if (setResult.isFailure) {
            toastError("Failed to clear user character", {
              description: setResult.getError(),
            });
            return;
          }
        } else {
          const cardId = new UniqueEntityID(characterId);
          const existingCard = latestSession.allCards.find((card) =>
            card.id.equals(cardId),
          );

          let sessionCardId = cardId;

          // Clone card with sessionId if it doesn't exist (create session-local copy)
          if (!existingCard) {
            const cloneResult = await CardService.cloneCard.execute({
              cardId,
              sessionId: latestSession.id, // Create session-local copy
            });

            if (cloneResult.isFailure) {
              toastError("Failed to clone character", {
                description: cloneResult.getError(),
              });
              return;
            }

            const clonedCard = cloneResult.getValue();
            sessionCardId = clonedCard.id;

            const addResult = latestSession.addCard(sessionCardId, CardType.Character);
            if (addResult.isFailure) {
              toastError("Failed to add character", {
                description: addResult.getError(),
              });
              return;
            }
          }

          // Set as user character
          const setResult = latestSession.setUserCharacterCardId(sessionCardId);
          if (setResult.isFailure) {
            toastError("Failed to set user character", {
              description: setResult.getError(),
            });
            return;
          }
        }

        await saveSessionMutation.mutateAsync({ session: latestSession });
        toastSuccess("User character updated successfully");
      } catch (error) {
        toastError("Failed to update user character", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation],
  );

  // ============================================
  // AI Character Handlers
  // ============================================

  /**
   * Delete AI character card
   */
  const handleDeleteAICharacter = useCallback(
    async (cardId: UniqueEntityID) => {
      if (!session) return;

      try {
        const latestSession = await fetchSession(session.id);
        latestSession.deleteCard(cardId);

        await saveSessionMutation.mutateAsync({ session: latestSession });
        toastSuccess("AI character removed successfully");
      } catch (error) {
        toastError("Failed to remove AI character", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation],
  );

  /**
   * Add AI character card
   */
  const handleAddAICharacter = useCallback(
    async (characterId: string) => {
      if (!session) return;

      try {
        const latestSession = await fetchSession(session.id);
        const cardId = new UniqueEntityID(characterId);
        const existingCard = latestSession.allCards.find((card) =>
          card.id.equals(cardId),
        );

        // Only add if it doesn't already exist - clone to create session-local copy
        if (!existingCard) {
          const cloneResult = await CardService.cloneCard.execute({
            cardId,
            sessionId: latestSession.id, // Create session-local copy
          });

          if (cloneResult.isFailure) {
            toastError("Failed to clone AI character", {
              description: cloneResult.getError(),
            });
            return;
          }

          const clonedCard = cloneResult.getValue();

          const addResult = latestSession.addCard(clonedCard.id, CardType.Character);
          if (addResult.isFailure) {
            toastError("Failed to add AI character", {
              description: addResult.getError(),
            });
            return;
          }

          await saveSessionMutation.mutateAsync({ session: latestSession });
          toastSuccess("AI character added successfully");
        }
      } catch (error) {
        toastError("Failed to add AI character", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation],
  );

  // ============================================
  // Session Property Update Handler
  // ============================================

  /**
   * Update session properties (workflow, background, styling, cover)
   */
  const handleUpdateSession = useCallback(
    async (updates: SessionUpdateParams) => {
      if (!session) return;

      try {
        const latestSession = await fetchSession(session.id);

        // Apply updates using domain methods
        if (updates.flowId !== undefined) {
          latestSession.update({
            flowId: updates.flowId
              ? new UniqueEntityID(updates.flowId)
              : undefined,
          });
        }
        if (updates.backgroundId !== undefined) {
          latestSession.setBackgroundId(updates.backgroundId);
        }
        if (updates.coverId !== undefined) {
          latestSession.setCoverId(updates.coverId);
        }
        if (updates.chatStyles !== undefined) {
          latestSession.update({ chatStyles: updates.chatStyles });
        }

        await saveSessionMutation.mutateAsync({ session: latestSession });
      } catch (error) {
        toastError("Failed to update session", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation],
  );

  return {
    // User character handlers
    handleDeleteUserCharacter,
    handleSetUserCharacter,
    // AI character handlers
    handleDeleteAICharacter,
    handleAddAICharacter,
    // Session update handler
    handleUpdateSession,
  };
}
