import { useState, useCallback, MouseEvent } from "react";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile } from "@/shared/lib";
import {
  DEFAULT_SHARE_EXPIRATION_DAYS,
  ExportType,
} from "@/shared/lib/cloud-upload-helpers";
import { HARPY_HUB_URL } from "@/shared/lib/supabase-client";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { characterKeys } from "@/entities/character/api";
import { scenarioKeys } from "@/entities/scenario/api";
import { TableName } from "@/db/schema/table-name";
import { CardType } from "@/entities/card/domain";

interface UseCardActionsOptions {
  /**
   * Entity type name for toast messages (e.g., CardType.Character, CardType.Scenario)
   * Defaults to "card"
   */
  entityType?: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  cardId: string | null;
  title: string;
  usedSessionsCount: number;
}

interface LoadingStates {
  [key: string]: {
    exporting?: boolean;
    copying?: boolean;
    deleting?: boolean;
  };
}

/**
 * Hook for card action handlers (export, copy, delete)
 * Provides state management and handlers for card operations
 *
 * Used by: characters-grid.tsx, scenarios-grid.tsx (CardDisplay)
 *
 * @example
 * ```tsx
 * const {
 *   loadingStates,
 *   deleteDialogState,
 *   handleExport,
 *   handleCopy,
 *   handleDeleteClick,
 *   handleDeleteConfirm,
 *   closeDeleteDialog
 * } = useCardActions({ entityType: CardType.Character });
 *
 * const actions = [
 *   { icon: Upload, onClick: handleExport(cardId, title), loading: loadingStates[cardId]?.exporting },
 *   { icon: Copy, onClick: handleCopy(cardId, title), loading: loadingStates[cardId]?.copying },
 *   { icon: Trash2, onClick: handleDeleteClick(cardId, title), loading: loadingStates[cardId]?.deleting },
 * ];
 * ```
 */
export function useCardActions(options: UseCardActionsOptions = {}) {
  const { entityType = "card" } = options;
  const queryClient = useQueryClient();

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>(
    {
      isOpen: false,
      cardId: null,
      title: "",
      usedSessionsCount: 0,
    },
  );

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Export card (either to file or cloud)
   * @param exportType - "file" for PNG download, "cloud" for Harpy cloud upload
   */
  const handleExport = useCallback(
    (cardId: string, title: string, exportType: ExportType = "file") =>
      async (e: MouseEvent) => {
        e.stopPropagation();

        setLoadingStates((prev) => ({
          ...prev,
          [cardId]: { ...(prev[cardId] ?? {}), exporting: true },
        }));

        try {
          if (exportType === "cloud") {
            // Generate cloned card ID upfront so we can open window immediately
            const clonedCardId = new UniqueEntityID();
            const resourceType = entityType === CardType.Character ? "character" : "scenario";
            const shareUrl = `${HARPY_HUB_URL}/shared/${resourceType}/${clonedCardId.toString()}`;

            // Open HarpyChat immediately with the cloned card ID (avoid popup blocker)
            const newWindow = window.open(shareUrl, "_blank");

            // Check if pop-up was blocked
            if (!newWindow || newWindow.closed) {
              toastError("Pop-up blocked!", {
                description: "Please allow pop-ups for this site to open HarpyChat.",
              });
            } else {
              toastSuccess("Opening HarpyChat...", {
                description: "Export is processing in the background.",
              });
            }

            // Export to cloud in the background (don't await)
            // Export will use the predefined clonedCardId
            const exportMethod =
              entityType === CardType.Character
                ? CardService.exportCharacterToCloud
                : CardService.exportScenarioToCloud;

            exportMethod.execute({
              cardId: new UniqueEntityID(cardId),
              expirationDays: DEFAULT_SHARE_EXPIRATION_DAYS,
              clonedCardId, // Pass predefined ID
            }).then((shareResult) => {
              if (shareResult.isFailure) {
                toastError("Export failed", {
                  description: shareResult.getError(),
                });
              }
            }).catch((error) => {
              toastError("Export failed", {
                description: error instanceof Error ? error.message : "Unknown error",
              });
            });
          } else {
            // Export to file (PNG)
            const result = await CardService.exportCardToFile.execute({
              cardId: new UniqueEntityID(cardId),
              options: { format: "png" },
            });

            if (result.isFailure) {
              toastError("Failed to export", {
                description: result.getError(),
              });
              return;
            }

            downloadFile(result.getValue());
            toastSuccess("Successfully exported!", {
              description: `"${title}" exported`,
            });
          }
        } catch (error) {
          toastError(
            `Failed to export ${exportType === "cloud" ? "to cloud" : "to file"}`,
            {
              description:
                error instanceof Error ? error.message : "Unknown error",
            },
          );
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [cardId]: { ...(prev[cardId] ?? {}), exporting: false },
          }));
        }
      },
    [entityType],
  );

  /**
   * Clone/copy card
   */
  const handleCopy = useCallback(
    (cardId: string, title: string) => async (e: MouseEvent) => {
      e.stopPropagation();

      setLoadingStates((prev) => ({
        ...prev,
        [cardId]: { ...(prev[cardId] ?? {}), copying: true },
      }));

      const entityTypeText =
        entityType === CardType.Plot ? "scenario" : entityType;

      try {
        const result = await CardService.cloneCard.execute({
          cardId: new UniqueEntityID(cardId),
        });

        if (result.isFailure) {
          toastError(`Failed to copy ${entityTypeText}`, {
            description: result.getError(),
          });
          return;
        }

        toastSuccess(
          `${entityTypeText.charAt(0).toUpperCase() + entityTypeText.slice(1)} copied`,
          {
            description: `Created copy of "${title}"`,
          },
        );
        // Invalidate based on entity type
        if (entityType === "character") {
          await queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
        } else if (entityType === "plot") {
          await queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() });
        }
      } catch (error) {
        toastError(`Failed to copy ${entityTypeText}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [cardId]: { ...(prev[cardId] ?? {}), copying: false },
        }));
      }
    },
    [entityType, queryClient],
  );

  /**
   * Open delete confirmation dialog
   * Fetches sessions using this card
   */
  const handleDeleteClick = useCallback(
    (cardId: string, title: string) => async (e: MouseEvent) => {
      e.stopPropagation();

      try {
        const result = await SessionService.listSessionByCard.execute({
          cardId: new UniqueEntityID(cardId),
        });
        const usedSessionsCount = result.isSuccess
          ? result.getValue().length
          : 0;

        setDeleteDialogState({
          isOpen: true,
          cardId,
          title,
          usedSessionsCount,
        });
      } catch (error) {
        console.error("Failed to check used sessions:", error);
        setDeleteDialogState({
          isOpen: true,
          cardId,
          title,
          usedSessionsCount: 0,
        });
      }
    },
    [],
  );

  /**
   * Confirm and execute card deletion
   */
  const handleDeleteConfirm = useCallback(async () => {
    const { cardId, title, usedSessionsCount } = deleteDialogState;
    if (!cardId) return;

    setLoadingStates((prev) => ({
      ...prev,
      [cardId]: { ...(prev[cardId] ?? {}), deleting: true },
    }));

    const entityTypeText =
      entityType === CardType.Plot ? "scenario" : entityType;

    try {
      const result = await CardService.deleteCard.execute(
        new UniqueEntityID(cardId),
      );

      if (result.isFailure) {
        toastError(`Failed to delete ${entityTypeText}`, {
          description: result.getError(),
        });
        return;
      }

      toastSuccess(
        `${entityTypeText.charAt(0).toUpperCase() + entityTypeText.slice(1)} deleted`,
        {
          description: title,
        },
      );
      // Invalidate based on entity type
      if (entityType === "character") {
        await queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      } else if (entityType === "plot") {
        await queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() });
      }

      if (usedSessionsCount > 0) {
        await queryClient.invalidateQueries({
          queryKey: [TableName.Sessions],
        });
      }

      setDeleteDialogState({
        isOpen: false,
        cardId: null,
        title: "",
        usedSessionsCount: 0,
      });
    } catch (error) {
      toastError(`Failed to delete ${entityTypeText}`, {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [cardId]: { ...(prev[cardId] ?? {}), deleting: false },
      }));
    }
  }, [deleteDialogState, entityType, queryClient]);

  /**
   * Close delete dialog without deleting
   */
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // State
    loadingStates,
    deleteDialogState,

    // Handlers
    handleExport,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  };
}
