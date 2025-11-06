import { useState, useCallback, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile, logger } from "@/shared/lib";
import { SessionService } from "@/app/services/session-service";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { sessionQueries } from "@/entities/session/api";
import { ModelTier } from "@/entities/agent/domain/agent";

export interface AgentModelTierInfo {
  agentId: string;
  agentName: string;
  modelName: string;
  recommendedTier: ModelTier;
  selectedTier: ModelTier;
}

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

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    sessionId: null,
    title: "",
  });

  const [exportDialogState, setExportDialogState] = useState<ExportDialogState>({
    isOpen: false,
    sessionId: null,
    title: "",
    agents: [],
  });

  const [copyDialogState, setCopyDialogState] = useState<CopyDialogState>({
    isOpen: false,
    sessionId: null,
    title: "",
    includeChatHistory: false,
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog and fetch agent info from flow
   */
  const handleExportClick = useCallback(
    (sessionId: string, title: string, flowId: UniqueEntityID | undefined) =>
      async (e: MouseEvent) => {
        e.stopPropagation();

        setLoadingStates((prev) => ({
          ...prev,
          [sessionId]: { ...prev[sessionId] ?? {}, exporting: true },
        }));

        try {
          if (!flowId) {
            toast.error("No flow associated with this session");
            return;
          }

          // Get flow to find agents
          const flowQuery = await queryClient.fetchQuery({
            queryKey: ["flow", flowId.toString()],
            queryFn: async () => {
              const result = await FlowService.getFlow.execute(flowId);
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
          for (const node of flowQuery.props.nodes) {
            if (node.type === "agent") {
              const agentId = node.id;

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
                agents.push({
                  agentId: agentId,
                  agentName: agentQuery.props.name,
                  modelName: agentQuery.props.modelName || "",
                  recommendedTier: ModelTier.Light,
                  selectedTier: agentQuery.props.modelTier || ModelTier.Light,
                });
              }
            }
          }

          setExportDialogState({ isOpen: true, sessionId, title, agents });
        } catch (error) {
          logger.error("Failed to prepare export:", error);
          toast.error("Failed to prepare export", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [sessionId]: { ...prev[sessionId] ?? {}, exporting: false },
          }));
        }
      },
    [queryClient],
  );

  /**
   * Export session with tier selections and optional chat history
   */
  const handleExportConfirm = useCallback(
    async (
      sessionId: string,
      title: string,
      modelTierSelections: Map<string, ModelTier>,
      includeHistory: boolean,
    ) => {
      try {
        // Export session to file with model tier selections
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

        setExportDialogState({ isOpen: false, sessionId: null, title: "", agents: [] });
      } catch (error) {
        logger.error(error);
        toast.error("Failed to export", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [],
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
      [sessionId]: { ...prev[sessionId] ?? {}, copying: true },
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
        [sessionId]: { ...prev[sessionId] ?? {}, copying: false },
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
      [sessionId]: { ...prev[sessionId] ?? {}, deleting: true },
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
        [sessionId]: { ...prev[sessionId] ?? {}, deleting: false },
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
    setExportDialogState({ isOpen: false, sessionId: null, title: "", agents: [] });
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
