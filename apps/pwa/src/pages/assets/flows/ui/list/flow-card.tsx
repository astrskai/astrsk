import { useCallback, useState } from "react";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";
import { cn, logger } from "@/shared/lib";
import { IconFlow } from "@/shared/assets/icons";
import { CircleAlert, Copy, Download, Trash2 } from "lucide-react";
import { useFlowValidation } from "@/shared/hooks/use-flow-validation";
import {
  useDeleteFlowWithNodes,
  useCloneFlowWithNodes,
} from "@/app/queries/flow/mutations/flow-mutations";
import { SessionService } from "@/app/services/session-service";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Session } from "@/entities/session/domain/session";
import { ModelTier } from "@/entities/agent/domain/agent";
import { ActionConfirm } from "@/shared/ui/dialogs";
import {
  FlowExportDialog,
  AgentModelTierInfo,
} from "@/features/flow/components/flow-export-dialog";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAgentStore } from "@/shared/stores/agent-store";
import { useQueryClient } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { downloadFile } from "@/shared/lib";

interface FlowCardProps {
  flow: Flow;
  isSelected: boolean;
  onClick: () => void;
  showActions?: boolean;
  isNewlyCreated?: boolean; // External trigger for animation
  onCopySuccess?: (copiedFlowId: string) => void; // Callback when copy succeeds
}

/**
 * Flow card component for selection
 * Shows flow metadata in card format
 */
export function FlowCard({
  flow,
  isSelected,
  onClick,
  showActions = false,
  isNewlyCreated = false,
  onCopySuccess,
}: FlowCardProps) {
  const nodeCount = flow.props.nodes.length;
  const agentCount = flow.props.nodes.filter(
    (node) => node.type === "agent",
  ).length;

  // Validate flow
  const { isValid, isFetched } = useFlowValidation(flow.id);
  const isInvalid = isFetched && !isValid;

  // Get dataStore field names
  const dataStoreFields = flow.props.dataStoreSchema?.fields || [];
  const hasDataStoreFields = dataStoreFields.length > 0;

  // Navigation and store
  const navigate = useNavigate();
  const selectedFlowId = useAgentStore.use.selectedFlowId();
  const selectFlowId = useAgentStore.use.selectFlowId();

  // Mutations
  const deleteFlowMutation = useDeleteFlowWithNodes();
  const cloneFlowMutation = useCloneFlowWithNodes();

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);
  const [exportAgents, setExportAgents] = useState<AgentModelTierInfo[]>([]);

  // Query client
  const queryClient = useQueryClient();

  // Fetch sessions using this flow
  const getUsedSessions = useCallback(async () => {
    try {
      const sessionsOrError = await SessionService.listSessionByFlow.execute({
        flowId: flow.id,
      });
      if (sessionsOrError.isSuccess) {
        setUsedSessions(sessionsOrError.getValue());
      }
    } catch (error) {
      // Continue with delete even if session check fails
      logger.error("Failed to check used sessions:", error);
    }
  }, [flow.id]);

  // Handle export dialog open - fetch agents info
  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        // Get agents for this flow
        const agents: AgentModelTierInfo[] = [];

        // Get agent data from flow nodes
        for (const node of flow.props.nodes) {
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

        setExportAgents(agents);
        setIsExportDialogOpen(true);
      } catch (error) {
        logger.error("Failed to prepare export:", error);
        toast.error("Failed to prepare export", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [flow.props.nodes, queryClient],
  );

  // Handle export with tier selections
  const handleExport = useCallback(
    async (modelTierSelections: Map<string, ModelTier>) => {
      try {
        // Export flow to file with model tier selections
        const fileOrError = await FlowService.exportFlowWithNodes.execute({
          flowId: flow.id,
          modelTierSelections,
        });

        if (fileOrError.isFailure) {
          throw new Error(fileOrError.getError());
        }

        const file = fileOrError.getValue();
        if (!file) {
          throw new Error("Export returned empty file");
        }

        // Download flow file
        downloadFile(file);

        toast.success("Flow exported successfully", {
          description: flow.props.name || "Untitled Flow",
        });

        setIsExportDialogOpen(false);
      } catch (error) {
        logger.error(error);
        toast.error("Failed to export flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [flow.id, flow.props.name],
  );

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        // Clone flow with all nodes
        const copiedFlow = await cloneFlowMutation.mutateAsync(
          flow.id.toString(),
        );

        // Notify parent of successful copy for animation
        onCopySuccess?.(copiedFlow.id.toString());

        toast.success("Flow copied successfully", {
          description: copiedFlow.props.name || "Untitled Flow",
        });
      } catch (error) {
        logger.error(error);
        toast.error("Failed to copy flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [flow.id, cloneFlowMutation, onCopySuccess],
  );

  const handleDeleteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await getUsedSessions();
      setIsDeleteDialogOpen(true);
    },
    [getUsedSessions],
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      // Delete flow with all nodes
      await deleteFlowMutation.mutateAsync(flow.id.toString());

      // Navigate away from deleted flow if currently viewing it
      if (selectedFlowId === flow.id.toString()) {
        selectFlowId(null);
        navigate({ to: "/" });
      }

      toast.success("Flow deleted successfully", {
        description: flow.props.name || "Untitled Flow",
      });
    } catch (error) {
      logger.error(error);
      toast.error("Failed to delete flow", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  }, [
    flow.id,
    flow.props.name,
    deleteFlowMutation,
    selectedFlowId,
    selectFlowId,
    navigate,
  ]);

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "group relative h-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-300",
          "bg-background-surface-4 border-2 p-6",
          "hover:border-primary/50 hover:shadow-lg",
          isSelected ? "border-primary shadow-lg" : "border-border",
          // New flow animation - green pulse effect
          isNewlyCreated && [
            "!border-green-500",
            "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
            "animate-pulse",
          ],
        )}
      >
        {/* Flow Name with Status */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-text-primary flex items-start gap-2 text-lg font-semibold">
            <IconFlow className="h-5 w-5 shrink-0" />
            <span className="line-clamp-2">
              {flow.props.name || "Untitled Flow"}
            </span>
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {/* Invalid Indicator */}
            {isInvalid && (
              <div className="text-status-destructive-light">
                <CircleAlert size={16} />
              </div>
            )}
            {/* Ready State Badge */}
            <div
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                flow.props.readyState === ReadyState.Ready
                  ? "bg-status-ready-dark/10 text-status-ready-dark"
                  : flow.props.readyState === ReadyState.Error
                    ? "bg-status-destructive-light/10 text-status-destructive-light"
                    : "bg-background-surface-3 text-text-placeholder",
              )}
            >
              {flow.props.readyState === ReadyState.Ready
                ? "Ready"
                : flow.props.readyState === ReadyState.Error
                  ? "Error"
                  : "Draft"}
            </div>
          </div>
        </div>

        {/* Flow Metadata */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">Nodes:</span>
            <span className="text-text-primary font-medium">{nodeCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">Agents:</span>
            <span className="text-text-primary font-medium">{agentCount}</span>
          </div>

          {/* DataStore Fields */}
          {hasDataStoreFields && (
            <div className="mt-3 flex flex-col gap-2">
              <span className="text-text-secondary text-sm font-medium">
                Session stats
              </span>
              <div className="flex flex-wrap gap-1">
                {dataStoreFields.slice(0, 3).map((field, index) => (
                  <span
                    key={index}
                    className="bg-background-surface-3 text-text-secondary rounded-md px-2 py-0.5 text-xs"
                  >
                    {field.name}
                  </span>
                ))}
                {dataStoreFields.length > 3 && (
                  <span className="bg-background-surface-3 text-text-secondary rounded-md px-2 py-0.5 text-xs">
                    +{dataStoreFields.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Bottom Right (appears on hover from bottom) */}
        {showActions && (
          <>
            {/* Gradient overlay for better button visibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Action buttons */}
            <div className="text-button-foreground-primary absolute right-4 bottom-4 flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                onClick={handleDownload}
                aria-label={`Download ${flow.props.name}`}
                className="hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={cloneFlowMutation.isPending}
                aria-label={`Copy ${flow.props.name}`}
                className={cn(
                  "hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-colors",
                  cloneFlowMutation.isPending &&
                    "cursor-not-allowed opacity-50",
                )}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={deleteFlowMutation.isPending}
                aria-label={`Delete ${flow.props.name}`}
                className={cn(
                  "hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-colors",
                  deleteFlowMutation.isPending &&
                    "cursor-not-allowed opacity-50",
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Dialogs - Outside card to prevent click interference */}
      <FlowExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        agents={exportAgents}
        onExport={handleExport}
      />

      <ActionConfirm
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Flow"
        description={
          usedSessions.length > 0 ? (
            <>
              This flow is used in{" "}
              <span className="text-secondary-normal font-semibold">
                {usedSessions.length}{" "}
                {usedSessions.length === 1 ? "session" : "sessions"}
              </span>
              .
              <br />
              Deleting it might corrupt or disable these sessions.
            </>
          ) : (
            "Are you sure you want to delete this flow? This action cannot be undone."
          )
        }
        confirmLabel="Yes, delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
