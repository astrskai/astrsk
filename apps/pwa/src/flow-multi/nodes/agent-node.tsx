// Agent node component with efficient state management
// Uses granular queries for optimal performance
import { type Node, type NodeProps } from "@xyflow/react";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Copy, Trash2, AlertCircle } from "lucide-react";
import { CustomHandle } from "@/flow-multi/components/custom-handle";

import { traverseFlowCached } from "@/flow-multi/utils/flow-traversal";
import { useFlowValidation } from "@/app/hooks/use-flow-validation";

import { useAgentStore } from "@/app/stores/agent-store";
import { ApiType } from "@/modules/agent/domain/agent";
import { AgentModels } from "@/flow-multi/components/model-selection";

import { toast } from "sonner";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { PANEL_TYPES } from "@/flow-multi/components/panel-types";
import { useAgentColor } from "@/flow-multi/hooks/use-agent-color";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  Input,
  SvgIcon,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { agentKeys } from "@/app/queries/agent/query-factory";
import { UniqueEntityID } from "@/shared/domain";
import { flowQueries } from "@/app/queries/flow-queries";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { useAgentReferenceMutations } from "@/flow-multi/hooks/use-agent-reference-mutations";

// Import new efficient mutations
import { useUpdateAgentName } from "@/app/queries/agent/mutations/agent-node-mutations";
import { useUpdateAgentModel } from "@/app/queries/agent/mutations/model-mutations";

/**
 * Agent node data type definition
 */
export type AgentNodeData = {
  label?: string;
  agentId?: string;
};

/**
 * Props for the AgentNodeComponent
 */
interface AgentNodeComponentProps {
  agentId: string;
  flow: any;
  nodeId: string;
  selected?: boolean;
}

/**
 * The main component for rendering an agent node in the flow
 * Now uses efficient granular queries instead of loading entire agent
 */
function AgentNodeComponent({
  agentId,
  flow,
  nodeId,
  selected,
}: AgentNodeComponentProps) {
  // Get store functions from unified AgentStore
  const notifyAgentUpdate = useAgentStore.use.notifyAgentUpdate();
  const updateAllTabTitles = useAgentStore.use.updateAllTabTitles();
  const queryClient = useQueryClient();

  // Listen for agent updates to ensure re-render when agent data changes
  const agentUpdateTimestamp = useAgentStore.use.agentUpdateTimestamp();
  const lastUpdatedAgentId = useAgentStore.use.lastUpdatedAgentId();

  // ========== EFFICIENT MUTATIONS with isEditing ==========
  const updateNameMutation = useUpdateAgentName(agentId);
  const updateModelMutation = useUpdateAgentModel(flow.id.toString(), agentId);

  // ========== EFFICIENT QUERIES - Only fetch what we need ==========
  // Get full agent for color calculation (needed by useAgentColor hook)
  const { data: agent, isLoading: isAgentLoading } = useQuery({
    ...agentQueries.detail(new UniqueEntityID(agentId)),
    enabled: !!agentId,
  });

  // 1. Name query - just the name field
  const { data: nameData } = useQuery({
    ...agentQueries.name(agentId),
    // Don't refetch while mutation is pending OR while user is editing
    enabled:
      !!agentId &&
      !updateNameMutation.isPending &&
      !updateNameMutation.isEditing,
  });

  // 2. Model query - model fields only
  const { data: modelData } = useQuery({
    ...agentQueries.model(agentId),
    // Model updates are dropdown selections, no need to pause refetch
    enabled: !!agentId,
  });

  // 3. Prompt query - for targetApiType
  const { data: promptData } = useQuery({
    ...agentQueries.prompt(agentId),
    enabled: !!agentId,
  });

  // 4. Parameters query - for parameter count
  const { data: paramData } = useQuery({
    ...agentQueries.parameters(agentId),
    enabled: !!agentId,
  });

  // 5. Output query - for output format
  const { data: outputData } = useQuery({
    ...agentQueries.output(agentId),
    enabled: !!agentId,
  });

  // Local state for name input
  const [editingName, setEditingName] = useState("");
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // Get panel open states and flowId from dockview context
  const { flowId, openPanel, closePanel, isPanelOpen, updateAgentPanelStates } =
    useFlowPanelContext();

  // Get the function for updating agent references
  const { updateAgentNameReferences } = useAgentReferenceMutations();

  // Use flow validation hook
  const { isValid: isFlowValid } = useFlowValidation(
    flowId ? new UniqueEntityID(flowId) : null,
  );

  // TEMPORARILY DISABLED: Model validation
  const hasModel = true; // Always show as having model

  // Use centralized color hook with flow validity
  const { hexColor: agentColor, opacity: agentOpacity } = useAgentColor({
    agent: agent || null,
    flow,
    withAlpha: false,
    isFlowValid,
  });

  // Apply opacity to the color for disconnected state
  // Use a default color while agent is loading to prevent gray flash
  const colorWithOpacity = useMemo(() => {
    // If agent is still loading, use a default blue color
    if (isAgentLoading && !agent) {
      return "#A5B4FC"; // Default blue color
    }

    // Otherwise use the calculated color with opacity
    return agentOpacity < 1
      ? `${agentColor}${Math.round(agentOpacity * 255)
          .toString(16)
          .padStart(2, "0")}`
      : agentColor;
  }, [isAgentLoading, agent, agentColor, agentOpacity]);

  // Check agent-specific panel states
  const panelStates = {
    prompt: isPanelOpen(PANEL_TYPES.PROMPT, agentId),
    parameter: isPanelOpen(PANEL_TYPES.PARAMETER, agentId),
    structuredOutput: isPanelOpen(PANEL_TYPES.STRUCTURED_OUTPUT, agentId),
    preview: isPanelOpen(PANEL_TYPES.PREVIEW, agentId),
  };

  // Calculate stats for display - using efficient queries
  const {
    promptType,
    parameterCount,
    hasPrompt,
    hasAgentName,
    hasStructuredOutput,
    isConnectedStartToEnd,
  } = useMemo(() => {
    const isChat = promptData?.targetApiType === ApiType.Chat;
    const hasPromptContent = true; // TEMPORARILY DISABLED validation
    const hasName = true; // TEMPORARILY DISABLED validation
    const hasOutput = true; // TEMPORARILY DISABLED validation

    // Check if agent is connected from start to end
    let isConnected = false;
    if (flow && flow.props?.nodes && flow.props?.edges) {
      try {
        const traversalResult = traverseFlowCached(flow);
        const agentPosition = traversalResult.agentPositions.get(agentId);
        isConnected = !!(
          agentPosition &&
          agentPosition.isConnectedToStart &&
          agentPosition.isConnectedToEnd
        );
      } catch (error) {
        console.warn("[AGENT-NODE] Flow traversal error:", error);
      }
    }

    return {
      promptType: isChat ? "Chat" : "Text",
      parameterCount: paramData?.enabledParameters
        ? Array.from(paramData.enabledParameters.values()).filter(
            (enabled) => enabled === true,
          ).length
        : 0,
      hasPrompt: hasPromptContent,
      hasAgentName: hasName,
      hasStructuredOutput: hasOutput,
      isConnectedStartToEnd: isConnected,
    };
  }, [
    agentId,
    flow?.props?.nodes,
    flow?.props?.edges,
    promptData?.targetApiType,
    paramData?.enabledParameters,
    outputData,
    // React to agent update notifications for this specific agent
    lastUpdatedAgentId === agentId ? agentUpdateTimestamp : 0,
  ]);

  // Track previous connectivity state to only update when it changes
  const prevIsConnectedRef = useRef<boolean | undefined>(undefined);

  // Update agent panel states when connectivity changes
  useEffect(() => {
    if (prevIsConnectedRef.current !== isConnectedStartToEnd) {
      prevIsConnectedRef.current = isConnectedStartToEnd;
      updateAgentPanelStates(agentId);
    }
  }, [isConnectedStartToEnd, updateAgentPanelStates, agentId]);

  // Initialize editing name whenever nameData changes
  useEffect(() => {
    if (agentId && nameData?.name) {
      setEditingName(nameData.name);
    }
  }, [agentId, nameData?.name]);

  // Save agent name with reference updates
  const saveAgentName = useCallback(
    async (newName: string, currentName: string) => {
      const trimmedName = newName.trim();

      // Validation
      if (!trimmedName || trimmedName === currentName) return;

      if (trimmedName.length < 3) {
        toast.error("Agent name must be at least 3 characters long");
        setEditingName(currentName);
        return;
      }

      if (/^[0-9]/.test(trimmedName)) {
        toast.error("Agent name cannot start with a number");
        setEditingName(currentName);
        return;
      }

      try {
        // Get fresh flow data
        if (!flowId) {
          toast.error("No flow selected");
          setEditingName(currentName);
          return;
        }
        const flowResult = await FlowService.getFlow.execute(
          new UniqueEntityID(flowId),
        );
        if (flowResult.isFailure) {
          throw new Error("Flow not found");
        }
        const currentFlow = flowResult.getValue();

        // Update agent name references in other agents and flow
        const {
          updatedAgents,
          responseTemplateChanged,
          totalReferencesUpdated,
          updatedResponseTemplate,
          updatedNodes,
        } = await updateAgentNameReferences(
          currentName,
          trimmedName,
          agentId,
          currentFlow,
        );

        // Save the agent's new name first
        await updateNameMutation.mutateAsync(trimmedName);

        // Invalidate only the agent name query to update variables panel
        await queryClient.invalidateQueries({
          queryKey: agentKeys.name(agentId),
        });

        // Save all agents that had their references updated
        // We use the services directly and rely on the panels' mutations to handle invalidation
        // when they refetch their data
        for (const agentWithUpdatedRefs of updatedAgents) {
          const targetAgentId = agentWithUpdatedRefs.id.toString();

          // Update prompts and text prompts
          if (
            agentWithUpdatedRefs.props.promptMessages ||
            agentWithUpdatedRefs.props.textPrompt !== undefined
          ) {
            const result = await AgentService.updateAgentPrompt.execute({
              agentId: targetAgentId,
              ...(agentWithUpdatedRefs.props.promptMessages && {
                promptMessages: agentWithUpdatedRefs.props.promptMessages,
              }),
              ...(agentWithUpdatedRefs.props.textPrompt !== undefined && {
                textPrompt: agentWithUpdatedRefs.props.textPrompt,
              }),
            });
            if (result.isFailure) {
              console.error(
                `Failed to update prompt for agent ${targetAgentId}:`,
                result.getError(),
              );
            } else {
              // Manually invalidate queries to trigger UI updates
              await queryClient.invalidateQueries({
                queryKey: agentKeys.prompt(targetAgentId),
              });
            }
          }

          // Update schema fields
          if (agentWithUpdatedRefs.props.schemaFields) {
            const result = await AgentService.updateAgentOutput.execute({
              agentId: targetAgentId,
              schemaFields: agentWithUpdatedRefs.props.schemaFields,
            });
            if (result.isFailure) {
              console.error(
                `Failed to update output for agent ${targetAgentId}:`,
                result.getError(),
              );
            } else {
              // Manually invalidate queries to trigger UI updates
              await queryClient.invalidateQueries({
                queryKey: agentKeys.output(targetAgentId),
              });
            }
          }
        }

        // Save the updated flow response template if changed
        if (responseTemplateChanged && updatedResponseTemplate) {
          const result = await FlowService.updateResponseTemplate.execute({
            flowId,
            responseTemplate: updatedResponseTemplate,
          });
          if (result.isFailure) {
            console.error(
              `Failed to update response template:`,
              result.getError(),
            );
          } else {
            // Manually invalidate queries to trigger UI updates
            await queryClient.invalidateQueries({
              queryKey: flowKeys.response(flowId),
            });
          }
        }

        // Save updated if-nodes and data-store nodes
        if (updatedNodes && updatedNodes.length > 0) {
          for (const node of updatedNodes) {
            if (node.type === "if" && node.data?.conditions) {
              // Update if-node conditions
              const result = await FlowService.updateIfNodeConditions.execute({
                flowId,
                nodeId: node.id,
                conditions: node.data.conditions,
                draftConditions:
                  node.data.draftConditions || node.data.conditions,
                logicOperator: node.data.logicOperator,
              });
              if (result.isFailure) {
                console.error(
                  `Failed to update if-node ${node.id}:`,
                  result.getError(),
                );
              } else {
                // Invalidate if-node queries
                await queryClient.invalidateQueries({
                  queryKey: flowKeys.node(flowId, node.id),
                });
              }
            } else if (
              node.type === "dataStore" &&
              node.data?.dataStoreFields
            ) {
              // Update data-store node fields
              const result =
                await FlowService.updateNodeDataStoreFields.execute({
                  flowId,
                  nodeId: node.id,
                  fields: node.data.dataStoreFields,
                });
              if (result.isFailure) {
                console.error(
                  `Failed to update data-store node ${node.id}:`,
                  result.getError(),
                );
              } else {
                // Invalidate data-store node queries
                await queryClient.invalidateQueries({
                  queryKey: flowKeys.dataStoreRuntime(flowId, node.id),
                });
              }
            }
          }
        }

        // Notify updates
        notifyAgentUpdate(agentId);
        updatedAgents.forEach((agent) => {
          notifyAgentUpdate(agent.id.toString());
        });

        // Update panel states to reflect new name in tabs
        updateAgentPanelStates(agentId);

        // Show success message
        if (totalReferencesUpdated > 0) {
          const changes = [];
          if (updatedAgents.length > 0) {
            changes.push(`${updatedAgents.length} agent(s)`);
          }
          if (responseTemplateChanged) {
            changes.push("response design");
          }
          toast.success(
            `Agent name updated and ${totalReferencesUpdated} reference(s) in ${changes.join(" and ")} were updated`,
          );
        } else {
          toast.success("Agent name updated");
        }
      } catch (error) {
        toast.error("Failed to update agent name", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setEditingName(currentName);
      }
    },
    [
      agentId,
      flowId,
      updateNameMutation,
      notifyAgentUpdate,
      updateAgentPanelStates,
      updateAgentNameReferences,
      queryClient,
    ],
  );

  // Handle name input changes - ONLY update local state, don't save
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setEditingName(newName);
    },
    [],
  );

  // Save name only on blur if it changed
  const handleNameBlur = useCallback(() => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      // Reset to original name if empty
      setEditingName(nameData?.name || "");
    } else if (trimmedName !== nameData?.name) {
      // Save only if name has actually changed
      saveAgentName(trimmedName, nameData?.name || "");
    }
  }, [editingName, nameData?.name, saveAgentName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur(); // Blur will trigger the save via handleNameBlur
      } else if (e.key === "Escape") {
        setEditingName(nameData?.name || ""); // Reset to original name
        e.currentTarget.blur();
      }
    },
    [nameData?.name],
  );

  // Handle model change
  const handleModelChange = useCallback(
    async (
      modelName?: string,
      _isDirtyFromModel?: boolean,
      modelInfo?: { apiSource?: string; modelId?: string },
    ) => {
      if (!modelName) return;

      updateModelMutation.mutate({
        modelName,
        apiSource: modelInfo?.apiSource as any, // Cast to any since it's already a valid ApiSource string
        modelId: modelInfo?.modelId,
      });

      // Notify that agent was updated for preview panel refresh
      notifyAgentUpdate(agentId);
    },
    [agentId, updateModelMutation, notifyAgentUpdate],
  );

  // Panel button handlers
  const handlePromptClick = useCallback(() => {
    openPanel(PANEL_TYPES.PROMPT, agentId);
  }, [agentId, openPanel]);

  const handleParametersClick = useCallback(() => {
    openPanel(PANEL_TYPES.PARAMETER, agentId);
  }, [agentId, openPanel]);

  const handleStructuredOutputClick = useCallback(() => {
    openPanel(PANEL_TYPES.STRUCTURED_OUTPUT, agentId);
  }, [agentId, openPanel]);

  const handlePreviewClick = useCallback(() => {
    openPanel(PANEL_TYPES.PREVIEW, agentId);
  }, [agentId, openPanel]);

  const handleCopyClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if ((window as any).flowPanelCopyNode) {
        (window as any).flowPanelCopyNode(agentId);
      } else {
        toast.error("Copy function not available");
      }
    },
    [agentId],
  );

  const handleDeleteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpenDelete(true);
  }, []);

  const handleDelete = useCallback(async () => {
    setIsOpenDelete(false);
    if ((window as any).flowPanelDeleteNode) {
      (window as any).flowPanelDeleteNode(agentId);
    } else {
      toast.error("Delete function not available");
    }
  }, [agentId]);

  // TEMPORARILY DISABLED: Agent validation in node display
  const shouldShowValidation = isConnectedStartToEnd;
  const isCurrentAgentValid = true; // Always show as valid

  return (
    <div
      className={`group/node inline-flex w-80 items-center justify-between rounded-lg ${
        !isCurrentAgentValid
          ? "bg-background-surface-2 outline-status-destructive-light outline-2"
          : selected
            ? "bg-background-surface-3 outline-accent-primary shadow-lg outline-2"
            : "bg-background-surface-3 outline-border-light outline-1"
      }`}
    >
      <div className="inline-flex flex-1 flex-col items-start justify-start gap-4 p-4">
        {/* Agent Name Section - Direct Input */}
        <div className="flex flex-col items-start justify-start gap-2 self-stretch">
          <div className="inline-flex items-center justify-start gap-1 self-stretch">
            {shouldShowValidation && !hasAgentName && (
              <AlertCircle className="text-status-destructive-light min-h-4 min-w-4" />
            )}
            <div className="justify-start">
              <span className="text-text-body text-[10px] font-medium">
                Agent node name
              </span>
              <span className="text-status-required text-[10px] font-medium">
                *
              </span>
            </div>
          </div>
          <Input
            value={editingName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onBlur={handleNameBlur}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Enter agent name"
            disabled={updateNameMutation.isPending}
            className={`nodrag ${shouldShowValidation && !hasAgentName ? "outline-status-destructive-light" : ""}`}
          />
        </div>

        {/* Model Selection Section */}
        <div className="flex flex-col items-start justify-start gap-2 self-stretch">
          <div className="inline-flex items-center justify-start gap-1 self-stretch">
            {shouldShowValidation && !hasModel && (
              <AlertCircle className="text-status-destructive-light min-h-4 min-w-4" />
            )}
            <div className="justify-start">
              <span className="text-text-body text-[10px] font-medium">
                Model
              </span>
              <span className="text-status-required text-xs font-medium">
                *
              </span>
            </div>
          </div>
          <div className="nodrag min-w-0 self-stretch">
            <AgentModels
              agent={
                {
                  id: new UniqueEntityID(agentId),
                  props: {
                    modelName: modelData?.modelName || undefined,
                    apiSource: modelData?.apiSource || undefined,
                    modelId: modelData?.modelId || undefined,
                  },
                } as any
              }
              modelChanged={handleModelChange}
            />
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="flex flex-col gap-2 self-stretch">
          <div className="flex gap-2">
            {/* Prompt Button */}
            <button
              onClick={handlePromptClick}
              className={`inline-flex h-20 flex-1 flex-col items-center justify-center rounded-lg px-2 pt-1.5 pb-2.5 outline outline-offset-[-1px] transition-all ${
                shouldShowValidation && !hasPrompt
                  ? panelStates.prompt
                    ? "bg-background-surface-light outline-status-destructive-light hover:opacity-70"
                    : "bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5"
                  : panelStates.prompt
                    ? "bg-background-surface-light outline-border-light hover:opacity-70"
                    : "bg-background-surface-4 outline-border-light hover:bg-background-surface-5"
              }`}
            >
              <div
                className={`justify-start self-stretch text-center text-2xl leading-10 font-medium ${
                  panelStates.prompt
                    ? "text-text-contrast-text"
                    : "text-text-primary"
                }`}
              >
                {promptType}
              </div>
              <div className="justify-start self-stretch text-center">
                <span
                  className={`text-xs font-medium ${panelStates.prompt ? "text-text-info" : "text-text-secondary"}`}
                >
                  Prompt
                </span>
                <span className="text-status-required text-xs font-medium">
                  *
                </span>
              </div>
            </button>

            {/* Parameters Button */}
            <button
              onClick={handleParametersClick}
              className={`inline-flex h-20 flex-1 flex-col items-center justify-center rounded-lg px-2 pt-1.5 pb-2.5 outline outline-offset-[-1px] transition-all ${
                panelStates.parameter
                  ? "bg-background-surface-light outline-border-light hover:opacity-70"
                  : "bg-background-surface-4 outline-border-light hover:bg-background-surface-5"
              }`}
            >
              <div
                className={`justify-start self-stretch text-center text-2xl leading-10 font-medium ${
                  panelStates.parameter
                    ? "text-text-contrast-text"
                    : "text-text-primary"
                }`}
              >
                {parameterCount}
              </div>
              <div
                className={`justify-start self-stretch text-center text-xs font-medium ${
                  panelStates.parameter
                    ? "text-text-info"
                    : "text-text-secondary"
                }`}
              >
                Parameters
              </div>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Structured Output Button */}
            <button
              onClick={handleStructuredOutputClick}
              className={`inline-flex h-20 flex-1 flex-col items-center justify-center rounded-lg px-2 pt-1.5 pb-2.5 outline outline-offset-[-1px] transition-all ${
                shouldShowValidation &&
                outputData?.enabledStructuredOutput &&
                !hasStructuredOutput
                  ? panelStates.structuredOutput
                    ? "bg-background-surface-light outline-status-destructive-light hover:opacity-70"
                    : "bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5"
                  : panelStates.structuredOutput
                    ? "bg-background-surface-light outline-border-light hover:opacity-70"
                    : "bg-background-surface-4 outline-border-light hover:bg-background-surface-5"
              }`}
            >
              <div
                className={`justify-start self-stretch text-center text-xl leading-9 font-medium ${
                  panelStates.structuredOutput
                    ? "text-text-contrast-text"
                    : "text-text-primary"
                }`}
              >
                {!outputData?.enabledStructuredOutput
                  ? "Response"
                  : "Structured"}
              </div>
              <div className="justify-start self-stretch text-center">
                <span
                  className={`text-xs font-medium ${panelStates.structuredOutput ? "text-text-info" : "text-text-secondary"}`}
                >
                  Output
                </span>
                <span className="text-status-required text-xs font-medium">
                  *
                </span>
              </div>
            </button>

            {/* Preview Button */}
            <button
              onClick={handlePreviewClick}
              className={`inline-flex h-20 flex-1 flex-col items-center justify-center gap-2 rounded-lg px-2 pt-1.5 pb-2.5 outline outline-offset-[-1px] transition-all ${
                panelStates.preview
                  ? "bg-background-surface-light outline-border-light hover:opacity-70"
                  : "bg-background-surface-4 outline-border-light hover:bg-background-surface-5"
              }`}
            >
              <div className="pt-[1px]" />
              <div className="relative h-6 w-6 overflow-hidden">
                <SvgIcon
                  name="preview"
                  className={`min-h-4 min-w-4 ${
                    panelStates.preview
                      ? "text-text-contrast-text"
                      : "text-text-primary"
                  }`}
                />
              </div>
              <div
                className={`justify-start self-stretch text-center text-xs font-medium ${
                  panelStates.preview ? "text-text-info" : "text-text-secondary"
                }`}
              >
                Preview
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div
        className="inline-flex flex-col items-start justify-start gap-3 self-stretch rounded-tr-lg rounded-br-lg px-2 py-4"
        style={{ backgroundColor: colorWithOpacity }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopyClick}
              className="group/copy relative h-6 w-6 overflow-hidden transition-opacity hover:opacity-80"
            >
              <Copy className="text-text-contrast-text min-h-5 min-w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" variant="button">
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDeleteClick}
              className="group/delete relative h-6 w-6 overflow-hidden transition-opacity hover:opacity-80"
            >
              <Trash2 className="text-text-contrast-text min-h-5 min-w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" variant="button">
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Delete agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agent "
              {nameData?.name || "Unnamed"}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" size="lg" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* React Flow Handles */}
      <CustomHandle variant="output" nodeId={nodeId} />
      <CustomHandle variant="input" nodeId={nodeId} />
    </div>
  );
}

export type AgentNode = Node<AgentNodeData>;

/**
 * Default export for ReactFlow node registration
 * This version uses efficient granular queries
 */
export default function AgentNode({
  id,
  data,
  selected,
}: NodeProps<AgentNode>) {
  // Get the selected flow ID from agent store
  const selectedFlowId = useAgentStore.use.selectedFlowId();

  // Use React Query to get the flow data
  const { data: selectedFlow } = useQuery({
    ...flowQueries.detail(
      selectedFlowId ? new UniqueEntityID(selectedFlowId) : undefined,
    ),
    enabled: !!selectedFlowId,
  });

  // Use the agentId from node data, fallback to node id for backward compatibility
  const agentId = data?.agentId || id;

  // Check if agent exists using name query (lightweight)
  const {
    data: nameData,
    isLoading,
    error,
  } = useQuery({
    ...agentQueries.name(agentId),
    retry: false,
  });

  if (!selectedFlow) {
    return (
      <div className="w-80 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
        <div className="text-sm text-[#6b7280]">Loading flow...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-80 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
        <div className="text-sm text-[#6b7280]">Loading agent...</div>
      </div>
    );
  }

  if (!nameData || error) {
    return (
      <div className="w-80 rounded-lg border-2 border-[#ef4444] bg-[#fee2e2] p-4">
        <div className="flex items-center gap-2 font-medium text-[#dc2626]">
          <AlertCircle className="h-4 w-4" />
          <span>Agent not found</span>
        </div>
        <div className="mt-2 text-sm text-[#7f1d1d]">
          This agent has been deleted. Remove this node to fix the flow.
        </div>
        <CustomHandle variant="output" nodeId={id} />
        <CustomHandle variant="input" nodeId={id} />
      </div>
    );
  }

  // Pass the agentId to the component
  return (
    <AgentNodeComponent
      agentId={agentId}
      flow={selectedFlow}
      nodeId={id}
      selected={selected}
    />
  );
}
