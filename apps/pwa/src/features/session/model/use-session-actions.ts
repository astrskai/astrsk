import { useState, useCallback, MouseEvent } from "react";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile, logger } from "@/shared/lib";
import {
  DEFAULT_SHARE_EXPIRATION_DAYS,
  ExportType,
} from "@/shared/lib/cloud-upload-helpers";
import { SessionService } from "@/app/services/session-service";
import { sessionQueries } from "@/entities/session/api";

interface DeleteDialogState {
  isOpen: boolean;
  sessionId: string | null;
  title: string;
}

interface ExportDialogState {
  isOpen: boolean;
  sessionId: string | null;
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

interface UseSessionActionsOptions {
  /**
   * Callback when copy succeeds (for animation)
   */
  onCopySuccess?: (sessionId: string) => void;
}

/**
 * Hook for session action handlers (export, copy, delete)
 * Provides state management and handlers for session operations
 */
export function useSessionActions(options: UseSessionActionsOptions = {}) {
  const { onCopySuccess } = options;
  const queryClient = useQueryClient();

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>(
    {
      isOpen: false,
      sessionId: null,
      title: "",
    },
  );

  const [exportDialogState, setExportDialogState] = useState<ExportDialogState>(
    {
      isOpen: false,
      sessionId: null,
      title: "",
      exportType: "file",
    },
  );

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog - export will start automatically
   * @param exportType - "file" for JSON download, "cloud" for Harpy cloud upload
   */
  const handleExportClick = useCallback(
    (sessionId: string, title: string, _flowId: UniqueEntityID | undefined, exportType: ExportType = "file") =>
      (e: MouseEvent) => {
        e.stopPropagation();
        // Open dialog - export starts automatically in the dialog
        setExportDialogState({ isOpen: true, sessionId, title, exportType });
      },
    [],
  );

  /**
   * Export session (either to file or cloud)
   */
  const handleExportConfirm = useCallback(
    async () => {
      const { sessionId, title, exportType } = exportDialogState;
      if (!sessionId) return;

      try {
        if (exportType === "cloud") {
          // Export session to cloud (Supabase)
          const shareResult = await SessionService.exportSessionToCloud.execute({
            sessionId: new UniqueEntityID(sessionId),
            expirationDays: DEFAULT_SHARE_EXPIRATION_DAYS,
          });

          if (shareResult.isFailure) {
            throw new Error(shareResult.getError());
          }

          const shareLink = shareResult.getValue();

          toastSuccess("Successfully exported to cloud!", {
            description: `Opening share page. Expires: ${shareLink.expiresAt.toLocaleDateString()}`,
          });

          // Open the share URL in a new tab
          window.open(shareLink.shareUrl, "_blank");
        } else {
          // Export session to file (JSON download)
          const fileOrError = await SessionService.exportSessionToFile.execute({
            sessionId: new UniqueEntityID(sessionId),
            // TODO: These are commented out for now - export as-is
            // includeHistory: false,
            // modelTierSelections: new Map(),
          });

          if (fileOrError.isFailure) {
            throw new Error(fileOrError.getError());
          }

          const file = fileOrError.getValue();
          if (!file) {
            throw new Error("Export returned empty file");
          }

          // Download session file
          downloadFile(file);

          toastSuccess("Successfully exported!", {
            description: `"${title}" exported`,
          });
        }
      } catch (error) {
        logger.error(error);
        toastError(
          `Failed to export ${exportType === "cloud" ? "to cloud" : "to file"}`,
          {
            description:
              error instanceof Error ? error.message : "Unknown error",
          },
        );
        throw error; // Re-throw so dialog knows export failed
      }
    },
    [exportDialogState],
  );

  /**
   * Copy session directly (no dialog, like character cards)
   */
  const handleCopyClick = useCallback(
    (sessionId: string, title: string) => async (e: MouseEvent) => {
      e.stopPropagation();

      setLoadingStates((prev) => ({
        ...prev,
        [sessionId]: { ...(prev[sessionId] ?? {}), copying: true },
      }));

      try {
        // Clone session (without chat history)
        const copiedSessionOrError = await SessionService.cloneSession.execute({
          sessionId: new UniqueEntityID(sessionId),
          includeHistory: false,
        });

        if (copiedSessionOrError.isFailure) {
          throw new Error(copiedSessionOrError.getError());
        }

        const copiedSession = copiedSessionOrError.getValue();

        // Notify parent of successful copy for animation
        onCopySuccess?.(copiedSession.id.toString());

        toastSuccess("Session copied", {
          description: `Created copy of "${title}"`,
        });

        await queryClient.invalidateQueries({ queryKey: sessionQueries.lists() });
      } catch (error) {
        logger.error(error);
        toastError("Failed to copy", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [sessionId]: { ...(prev[sessionId] ?? {}), copying: false },
        }));
      }
    },
    [queryClient, onCopySuccess],
  );

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = useCallback(
    (sessionId: string, title: string) => (e: MouseEvent) => {
      e.stopPropagation();
      setDeleteDialogState({
        isOpen: true,
        sessionId,
        title,
      });
    },
    [],
  );

  /**
   * Confirm and execute session deletion
   */
  const handleDeleteConfirm = useCallback(async () => {
    const { sessionId, title } = deleteDialogState;
    if (!sessionId) return;

    setLoadingStates((prev) => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), deleting: true },
    }));

    try {
      // Delete session
      const deleteSessionOrError = await SessionService.deleteSession.execute(
        new UniqueEntityID(sessionId),
      );

      if (deleteSessionOrError.isFailure) {
        throw new Error(deleteSessionOrError.getError());
      }

      toastSuccess("Session deleted", {
        description: `"${title}" deleted`,
      });

      await queryClient.invalidateQueries({ queryKey: sessionQueries.lists() });

      setDeleteDialogState({
        isOpen: false,
        sessionId: null,
        title: "",
      });
    } catch (error) {
      logger.error(error);
      toastError("Failed to delete", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [sessionId]: { ...(prev[sessionId] ?? {}), deleting: false },
      }));
    }
  }, [deleteDialogState, queryClient]);

  /**
   * Close delete dialog without deleting
   */
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Close export dialog without exporting
   */
  const closeExportDialog = useCallback(() => {
    setExportDialogState({
      isOpen: false,
      sessionId: null,
      title: "",
      exportType: "file",
    });
  }, []);

  return {
    // State
    loadingStates,
    deleteDialogState,
    exportDialogState,

    // Handlers
    handleExportClick,
    handleExportConfirm,
    handleCopyClick,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  };
}
