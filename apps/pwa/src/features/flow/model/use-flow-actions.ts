import { useState, useCallback, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile, logger } from "@/shared/lib";
import {
  DEFAULT_SHARE_EXPIRATION_DAYS,
  ExportType,
} from "@/shared/lib/cloud-upload-helpers";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { AgentService } from "@/app/services/agent-service";
import { Session } from "@/entities/session/domain/session";
import { ModelTier, AgentModelTierInfo } from "@/entities/agent/domain";
import {
  useDeleteFlowWithNodes,
  useCloneFlow,
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
 *   { icon: Upload, onClick: handleExportClick(flowId, title), loading: loadingStates[flowId]?.exporting },
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
  const cloneFlowMutation = useCloneFlow();

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
      exportType: "file",
    },
  );

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  /**
   * Open export dialog and fetch agent info
   * @param exportType - "file" for JSON download, "cloud" for Harpy cloud upload
   */
  const handleExportClick = useCallback(
    (flowId: string, title: string, exportType: ExportType = "file") =>
      async (e: MouseEvent) => {
        e.stopPropagation();

        setLoadingStates((prev) => ({
          ...prev,
          [flowId]: { ...(prev[flowId] ?? {}), exporting: true },
        }));

        try {
          // Get flow with nodes to access node graph
          const flowQuery = await queryClient.fetchQuery({
            queryKey: ["flow-with-nodes", flowId.toString()],
            queryFn: async () => {
              const result = await FlowService.getFlowWithNodes.execute(
                new UniqueEntityID(flowId),
              );
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

          // Get agent data from flow nodes
          for (const node of flowQuery.props.nodes) {
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

          setExportDialogState({
            isOpen: true,
            flowId,
            title,
            agents,
            exportType,
          });
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
   * Export flow (either to file or cloud) with tier selections
   */
  const handleExportConfirm = useCallback(
    async (
      flowId: string,
      title: string,
      modelTierSelections: Map<string, ModelTier>,
    ) => {
      const { exportType } = exportDialogState;

      try {
        if (exportType === "cloud") {
          // Export flow to cloud (Supabase)
          const shareResult = await FlowService.exportFlowToCloud.execute({
            flowId: new UniqueEntityID(flowId),
            expirationDays: DEFAULT_SHARE_EXPIRATION_DAYS, // 1 hour expiration
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
          // Export flow to file (JSON download)
          const result = await FlowService.exportFlowToFile.execute(
            new UniqueEntityID(flowId),
          );

          if (result.isFailure) {
            throw new Error(result.getError());
          }

          const file = result.getValue();
          downloadFile(file);

          toast.success("Flow exported to file", {
            description: `"${title}" downloaded as ${file.name}`,
          });
        }

        setExportDialogState({
          isOpen: false,
          flowId: null,
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
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  };
}
