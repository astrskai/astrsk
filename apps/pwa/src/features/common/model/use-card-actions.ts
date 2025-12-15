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

interface ExportDialogState {
  isOpen: boolean;
  cardId: string | null;
  title: string;
  exportType: ExportType;
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

  const [exportDialogState, setExportDialogState] = useState<ExportDialogState>(
    {
      isOpen: false,
      cardId: null,
      title: "",
      exportType: "file",
    },
  );

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog for card
   */
  const handleExportClick = useCallback(
    (cardId: string, title: string, exportType: ExportType = "file") =>
      (e: MouseEvent) => {
        e.stopPropagation();
        // Open dialog - export starts automatically in the dialog
        setExportDialogState({ isOpen: true, cardId, title, exportType });
      },
    [],
  );

  /**
   * Export card (either to file or cloud)
   * Returns share URL for cloud exports
   */
  const handleExportConfirm = useCallback(
    async (): Promise<string | void> => {
      const { cardId, title, exportType } = exportDialogState;
      if (!cardId) return;

      try {
        if (exportType === "cloud") {
          // Export to cloud and wait for completion
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

          // Return share URL to dialog
          return shareResult.getValue().shareUrl;
        } else {
          // Export to file (PNG)
          const result = await CardService.exportCardToFile.execute({
            cardId: new UniqueEntityID(cardId),
            options: { format: "png" },
          });

          if (result.isFailure) {
            throw new Error(result.getError());
          }

          downloadFile(result.getValue());
          // Close dialog immediately for file exports
        }
      } catch (error) {
        throw error;
      }
    },
    [exportDialogState, entityType],
  );

  /**
   * Close export dialog
   */
  const closeExportDialog = useCallback(() => {
    setExportDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

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
    exportDialogState,

    // Handlers
    handleExportClick,
    handleExportConfirm,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  };
}
