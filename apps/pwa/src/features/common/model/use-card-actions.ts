import { useState, useCallback, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile } from "@/shared/lib";
import {
  DEFAULT_SHARE_EXPIRATION_DAYS,
  ExportType,
} from "@/shared/lib/cloud-upload-helpers";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { cardQueries } from "@/entities/card/api/card-queries";
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

        const entityTypeText =
          entityType === CardType.Plot ? "scenario" : entityType;

        try {
          if (exportType === "cloud") {
            // Export to cloud (Supabase)
            const exportMethod =
              entityType === CardType.Character
                ? CardService.exportCharacterToCloud
                : CardService.exportScenarioToCloud;

            const shareResult = await exportMethod.execute({
              cardId: new UniqueEntityID(cardId),
              expirationDays: DEFAULT_SHARE_EXPIRATION_DAYS,
            });

            if (shareResult.isFailure) {
              throw new Error(shareResult.getError());
            }

            const shareLink = shareResult.getValue();

            // Copy share URL to clipboard
            await navigator.clipboard.writeText(shareLink.shareUrl);

            toast.success("Successfully exported to cloud!", {
              description: `Share link copied to clipboard. Expires: ${shareLink.expiresAt.toLocaleDateString()}`,
              duration: 5000,
            });
          } else {
            // Export to file (PNG)
            const result = await CardService.exportCardToFile.execute({
              cardId: new UniqueEntityID(cardId),
              options: { format: "png" },
            });

            if (result.isFailure) {
              toast.error("Failed to export", {
                description: result.getError(),
              });
              return;
            }

            downloadFile(result.getValue());
            toast.success("Successfully exported!", {
              description: `"${title}" exported`,
            });
          }
        } catch (error) {
          toast.error(
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
          toast.error(`Failed to copy ${entityTypeText}`, {
            description: result.getError(),
          });
          return;
        }

        toast.success(
          `${entityTypeText.charAt(0).toUpperCase() + entityTypeText.slice(1)} copied`,
          {
            description: `Created copy of "${title}"`,
          },
        );
        await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });
      } catch (error) {
        toast.error(`Failed to copy ${entityTypeText}`, {
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
        toast.error(`Failed to delete ${entityTypeText}`, {
          description: result.getError(),
        });
        return;
      }

      toast.success(
        `${entityTypeText.charAt(0).toUpperCase() + entityTypeText.slice(1)} deleted`,
        {
          description: title,
        },
      );
      await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });

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
      toast.error(`Failed to delete ${entityTypeText}`, {
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
