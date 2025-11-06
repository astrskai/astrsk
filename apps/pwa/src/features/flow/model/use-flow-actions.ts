import { useState, useCallback, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile, logger } from "@/shared/lib";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { AgentService } from "@/app/services/agent-service";
import { Session } from "@/entities/session/domain/session";
import { ModelTier, AgentModelTierInfo } from "@/entities/agent/domain";
import {
  useDeleteFlowWithNodes,
  useCloneFlowWithNodes,
} from "@/entities/flow/api/mutations/flow-mutations";

interface DeleteDialogState {
  isOpen: boolean;
  flowId: string | null;
  title: string;
  usedSessions: Session[];
}

interface ExportDialogState {
  isOpen: boolean;
  flowId: string | null;
  title: string;
  agents: AgentModelTierInfo[];
}

interface LoadingStates {
  [key: string]: {
    exporting?: boolean;
    copying?: boolean;
    deleting?: boolean;
  };
}

/**
 * Hook for flow action handlers (export, copy, delete)
 * Provides state management and handlers for flow operations
 *
 * Similar to useCardActions but for flows with specific export requirements
 *
 * @example
 * ```tsx
 * const {
 *   loadingStates,
 *   deleteDialogState,
 *   exportDialogState,
 *   handleExportClick,
 *   handleExportConfirm,
 *   handleCopy,
 *   handleDeleteClick,
 *   handleDeleteConfirm,
 *   closeDeleteDialog,
 *   closeExportDialog
 * } = useFlowActions({ onCopySuccess });
 *
 * const actions = [
 *   { icon: Upload, onClick: handleExportClick(flowId, title, flow), loading: loadingStates[flowId]?.exporting },
 *   { icon: Copy, onClick: handleCopy(flowId, title), loading: loadingStates[flowId]?.copying },
 *   { icon: Trash2, onClick: handleDeleteClick(flowId, title), loading: loadingStates[flowId]?.deleting },
 * ];
 * ```
 */
export function useFlowActions(
  options: { onCopySuccess?: (flowId: string) => void } = {},
) {
  const { onCopySuccess } = options;
  const queryClient = useQueryClient();

  const deleteFlowMutation = useDeleteFlowWithNodes();
  const cloneFlowMutation = useCloneFlowWithNodes();

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>(
    {
      isOpen: false,
      flowId: null,
      title: "",
      usedSessions: [],
    },
  );

  const [exportDialogState, setExportDialogState] = useState<ExportDialogState>(
    {
      isOpen: false,
      flowId: null,
      title: "",
      agents: [],
    },
  );

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog and fetch agent info
   */
  const handleExportClick = useCallback(
    (
      flowId: string,
      title: string,
      flowNodes: { type: string; id: string }[],
    ) =>
      async (e: MouseEvent) => {
        e.stopPropagation();

        setLoadingStates((prev) => ({
          ...prev,
          [flowId]: { ...(prev[flowId] ?? {}), exporting: true },
        }));

        try {
          // Get agents for this flow
          const agents: AgentModelTierInfo[] = [];

          // Get agent data from flow nodes
          for (const node of flowNodes) {
            if (node.type === "agent") {
              // Agent nodes store agentId in node.data.agentId, fallback to node.id
              const agentId =
                (node as { data?: { agentId?: string } }).data?.agentId ??
                node.id;

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

          setExportDialogState({ isOpen: true, flowId, title, agents });
        } catch (error) {
          logger.error("Failed to prepare export:", error);
          toast.error("Failed to prepare export", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [flowId]: { ...(prev[flowId] ?? {}), exporting: false },
          }));
        }
      },
    [queryClient],
  );

  /**
   * Export flow with tier selections
   */
  const handleExportConfirm = useCallback(
    async (
      flowId: string,
      title: string,
      modelTierSelections: Map<string, ModelTier>,
    ) => {
      try {
        // Export flow to file with model tier selections
        const fileOrError = await FlowService.exportFlowWithNodes.execute({
          flowId: new UniqueEntityID(flowId),
          modelTierSelections,
        });

        if (fileOrError.isFailure) {
          throw new Error(fileOrError.getError());
        }

        const file = fileOrError.getValue();
        if (!file) {
          throw new Error("Export returned empty file");
        }

        // Export flow file
        downloadFile(file);

        toast.success("Successfully exported!", {
          description: `"${title}" exported`,
        });

        setExportDialogState({
          isOpen: false,
          flowId: null,
          title: "",
          agents: [],
        });
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
   * Clone/copy flow
   */
  const handleCopy = useCallback(
    (flowId: string, title: string) => async (e: MouseEvent) => {
      e.stopPropagation();

      setLoadingStates((prev) => ({
        ...prev,
        [flowId]: { ...(prev[flowId] ?? {}), copying: true },
      }));

      try {
        // Clone flow with all nodes
        const copiedFlow = await cloneFlowMutation.mutateAsync(flowId);

        // Notify parent of successful copy for animation
        onCopySuccess?.(copiedFlow.id.toString());

        toast.success("Flow copied", {
          description: `Created copy of "${title}"`,
        });
      } catch (error) {
        logger.error(error);
        toast.error("Failed to copy", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [flowId]: { ...(prev[flowId] ?? {}), copying: false },
        }));
      }
    },
    [cloneFlowMutation, onCopySuccess],
  );

  /**
   * Open delete confirmation dialog
   * Fetches sessions using this flow
   */
  const handleDeleteClick = useCallback(
    (flowId: string, title: string) => async (e: MouseEvent) => {
      e.stopPropagation();

      try {
        const sessionsOrError = await SessionService.listSessionByFlow.execute({
          flowId: new UniqueEntityID(flowId),
        });

        const usedSessions = sessionsOrError.isSuccess
          ? sessionsOrError.getValue()
          : [];

        setDeleteDialogState({
          isOpen: true,
          flowId,
          title,
          usedSessions,
        });
      } catch (error) {
        logger.error("Failed to check used sessions:", error);
        setDeleteDialogState({
          isOpen: true,
          flowId,
          title,
          usedSessions: [],
        });
      }
    },
    [],
  );

  /**
   * Confirm and execute flow deletion
   */
  const handleDeleteConfirm = useCallback(async () => {
    const { flowId, title } = deleteDialogState;
    if (!flowId) return;

    setLoadingStates((prev) => ({
      ...prev,
      [flowId]: { ...(prev[flowId] ?? {}), deleting: true },
    }));

    try {
      // Delete flow with all nodes
      await deleteFlowMutation.mutateAsync(flowId);

      toast.success("Flow deleted", {
        description: `"${title}" deleted`,
      });

      setDeleteDialogState({
        isOpen: false,
        flowId: null,
        title: "",
        usedSessions: [],
      });
    } catch (error) {
      logger.error(error);
      toast.error("Failed to delete", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [flowId]: { ...(prev[flowId] ?? {}), deleting: false },
      }));
    }
  }, [deleteDialogState, deleteFlowMutation]);

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
      flowId: null,
      title: "",
      agents: [],
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
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  };
}
