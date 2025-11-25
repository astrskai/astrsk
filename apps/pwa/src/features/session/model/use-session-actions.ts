import { useState, useCallback, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile, logger } from "@/shared/lib";
import {
  DEFAULT_SHARE_EXPIRATION_DAYS,
  ExportType,
} from "@/shared/lib/cloud-upload-helpers";
import { SessionService } from "@/app/services/session-service";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { sessionQueries } from "@/entities/session/api";
import { ModelTier, AgentModelTierInfo } from "@/entities/agent/domain";
import { fetchBackgrounds } from "@/shared/stores/background-store";

interface DeleteDialogState {
  isOpen: boolean;
  sessionId: string | null;
  title: string;
}

interface ExportDialogState {
  isOpen: boolean;
  sessionId: string | null;
  title: string;
  agents: AgentModelTierInfo[];
  exportType: ExportType;
}

interface CopyDialogState {
  isOpen: boolean;
  sessionId: string | null;
  title: string;
  includeChatHistory: boolean;
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
 *
 * Similar to useCardActions and useFlowActions but for sessions with:
 * - 2-step export process (fetch agents → select tiers → export)
 * - Copy with optional chat history inclusion
 * - Delete confirmation
 *
 * @example
 * ```tsx
 * const {
 *   loadingStates,
 *   deleteDialogState,
 *   exportDialogState,
 *   copyDialogState,
 *   handleExportClick,
 *   handleExportConfirm,
 *   handleCopyClick,
 *   handleCopyConfirm,
 *   handleDeleteClick,
 *   handleDeleteConfirm,
 *   closeDeleteDialog,
 *   closeExportDialog,
 *   closeCopyDialog
 * } = useSessionActions({ onCopySuccess });
 *
 * const actions = [
 *   { icon: Upload, onClick: handleExportClick(sessionId, title, flowId), loading: loadingStates[sessionId]?.exporting },
 *   { icon: Copy, onClick: handleCopyClick(sessionId, title), loading: loadingStates[sessionId]?.copying },
 *   { icon: Trash2, onClick: handleDeleteClick(sessionId, title), loading: loadingStates[sessionId]?.deleting },
 * ];
 * ```
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
      agents: [],
      exportType: "file",
    },
  );

  const [copyDialogState, setCopyDialogState] = useState<CopyDialogState>({
    isOpen: false,
    sessionId: null,
    title: "",
    includeChatHistory: false,
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog and fetch agent info from flow
   * @param exportType - "file" for JSON download, "cloud" for Harpy cloud upload
   */
  const handleExportClick = useCallback(
    (sessionId: string, title: string, flowId: UniqueEntityID | undefined, exportType: ExportType = "file") =>
      async (e: MouseEvent) => {
        e.stopPropagation();

        setLoadingStates((prev) => ({
          ...prev,
          [sessionId]: { ...(prev[sessionId] ?? {}), exporting: true },
        }));

        try {
          if (!flowId) {
            toast.error("No flow associated with this session");
            return;
          }

          // Get flow with nodes to find agents
          const flowQuery = await queryClient.fetchQuery({
            queryKey: ["flow-with-nodes", flowId.toString()],
            queryFn: async () => {
              const result = await FlowService.getFlowWithNodes.execute(flowId);
              if (result.isFailure) throw new Error(result.getError());
              return result.getValue();
            },
          });

          if (!flowQuery) {
            toast.error("Failed to load flow");
            return;
          }

          // Get agents for this flow
          const agents: AgentModelTierInfo[] = [];

          // Handle both domain format (props.nodes) and persistence format (nodes)
          const nodes = flowQuery.props?.nodes || (flowQuery as any).nodes || [];

          for (const node of nodes) {
            if (node.type === "agent") {
              // Agent nodes store agentId in node.data.agentId, fallback to node.id
              const agentId = (node.data as any)?.agentId || node.id;

              if (!agentId) {
                continue;
              }

              // Fetch agent data
              const agentQuery = await queryClient.fetchQuery({
                queryKey: ["agent", agentId],
                queryFn: async () => {
                  const result = await AgentService.getAgent.execute(
                    new UniqueEntityID(agentId),
                  );
                  if (result.isFailure) throw new Error(result.getError());
                  return result.getValue();
                },
              });

              if (agentQuery) {
                // Handle both domain format (props.X) and persistence format (direct X)
                const agentProps = agentQuery.props || agentQuery;
                agents.push({
                  agentId: agentId,
                  agentName: agentProps.name || (agentQuery as any).name || "",
                  modelName: agentProps.modelName || (agentQuery as any).model_name || "",
                  recommendedTier: ModelTier.Light,
                  selectedTier: agentProps.modelTier || (agentQuery as any).model_tier || ModelTier.Light,
                });
              }
            }
          }

          setExportDialogState({ isOpen: true, sessionId, title, agents, exportType });
        } catch (error) {
          logger.error("Failed to prepare export:", error);
          toast.error("Failed to prepare export", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [sessionId]: { ...(prev[sessionId] ?? {}), exporting: false },
          }));
        }
      },
    [queryClient],
  );

  /**
   * Export session (either to file or cloud) with tier selections and optional chat history
   */
  const handleExportConfirm = useCallback(
    async (
      sessionId: string,
      title: string,
      modelTierSelections: Map<string, ModelTier>,
      includeHistory: boolean,
    ) => {
      const { exportType } = exportDialogState;

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

          // Try to copy share URL to clipboard, but don't fail if it doesn't work
          // (clipboard access may be blocked after async operations)
          let clipboardSuccess = false;
          try {
            await navigator.clipboard.writeText(shareLink.shareUrl);
            clipboardSuccess = true;
          } catch (clipboardError) {
            // Clipboard access failed - user will need to copy manually
            logger.warn("Clipboard access denied:", clipboardError);
          }

          toast.success("Successfully exported to cloud!", {
            description: clipboardSuccess
              ? `Share link copied to clipboard. Expires: ${shareLink.expiresAt.toLocaleDateString()}`
              : `${shareLink.shareUrl}\n\nExpires: ${shareLink.expiresAt.toLocaleDateString()}`,
            duration: 10000, // Longer duration to allow manual copy
          });
        } else {
          // Export session to file (JSON download)
          const fileOrError = await SessionService.exportSessionToFile.execute({
            sessionId: new UniqueEntityID(sessionId),
            includeHistory,
            modelTierSelections,
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

          toast.success("Successfully exported!", {
            description: `"${title}" exported`,
          });
        }

        setExportDialogState({
          isOpen: false,
          sessionId: null,
          title: "",
          agents: [],
          exportType: "file",
        });
      } catch (error) {
        logger.error(error);
        toast.error(
          `Failed to export ${exportType === "cloud" ? "to cloud" : "to file"}`,
          {
            description:
              error instanceof Error ? error.message : "Unknown error",
          },
        );
      }
    },
    [exportDialogState],
  );

  /**
   * Open copy dialog
   */
  const handleCopyClick = useCallback(
    (sessionId: string, title: string) => (e: MouseEvent) => {
      e.stopPropagation();
      setCopyDialogState({
        isOpen: true,
        sessionId,
        title,
        includeChatHistory: false,
      });
    },
    [],
  );

  /**
   * Toggle include chat history option
   */
  const toggleIncludeChatHistory = useCallback(() => {
    setCopyDialogState((prev) => ({
      ...prev,
      includeChatHistory: !prev.includeChatHistory,
    }));
  }, []);

  /**
   * Clone/copy session with optional chat history
   */
  const handleCopyConfirm = useCallback(async () => {
    const { sessionId, title, includeChatHistory } = copyDialogState;
    if (!sessionId) return;

    setLoadingStates((prev) => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), copying: true },
    }));

    try {
      // Clone session
      const copiedSessionOrError = await SessionService.cloneSession.execute({
        sessionId: new UniqueEntityID(sessionId),
        includeHistory: includeChatHistory,
      });

      if (copiedSessionOrError.isFailure) {
        throw new Error(copiedSessionOrError.getError());
      }

      const copiedSession = copiedSessionOrError.getValue();

      // Fetch backgrounds for the newly cloned session
      await fetchBackgrounds(copiedSession.id);

      // Notify parent of successful copy for animation
      onCopySuccess?.(copiedSession.id.toString());

      toast.success("Session copied", {
        description: `Created copy of "${title}"`,
      });

      await queryClient.invalidateQueries({ queryKey: sessionQueries.lists() });

      setCopyDialogState({
        isOpen: false,
        sessionId: null,
        title: "",
        includeChatHistory: false,
      });
    } catch (error) {
      logger.error(error);
      toast.error("Failed to copy", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [sessionId]: { ...(prev[sessionId] ?? {}), copying: false },
      }));
    }
  }, [copyDialogState, queryClient, onCopySuccess]);

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

      toast.success("Session deleted", {
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
      toast.error("Failed to delete", {
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
      agents: [],
      exportType: "file",
    });
  }, []);

  /**
   * Close copy dialog without copying
   */
  const closeCopyDialog = useCallback(() => {
    setCopyDialogState({
      isOpen: false,
      sessionId: null,
      title: "",
      includeChatHistory: false,
    });
  }, []);

  return {
    // State
    loadingStates,
    deleteDialogState,
    exportDialogState,
    copyDialogState,

    // Handlers
    handleExportClick,
    handleExportConfirm,
    handleCopyClick,
    handleCopyConfirm,
    toggleIncludeChatHistory,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
    closeCopyDialog,
  };
}
