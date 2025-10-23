// If node component for flow-multi system
// Provides conditional branching logic in the flow
import { type Node, type NodeProps } from "@xyflow/react";
import { useState, useCallback, useMemo } from "react";
import { Copy, Trash2, Pencil } from "lucide-react";
import {
  CustomHandle,
  CustomIfHandle,
} from "@/flow-multi/components/custom-handle";
import {
  ConditionDataType,
  ConditionOperator,
} from "@/flow-multi/types/condition-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Input } from "@/components-v2/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { useUpdateNodeTitle } from "@/app/queries/flow/mutations/node-mutations";
import { useAgentStore } from "@/app/stores/agent-store";
import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { UniqueEntityID } from "@/shared/domain";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { ifNodeQueries } from "@/app/queries/if-node/query-factory";
import { useUpdateIfNodeName } from "@/app/queries/if-node/mutations";
import {
  getIfNodeOpacity,
  applyOpacityToHexColor,
} from "@/flow-multi/utils/node-color-assignment";
import { traverseFlowCached } from "@/flow-multi/utils/flow-traversal";
import { toast } from "sonner";

/**
 * If node condition definition
 */
export interface IfCondition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

/**
 * Centralized predicate to check if a condition is valid
 */
const isValidCondition = (c: IfCondition): boolean => {
  return c.value1?.trim() !== "" && c.operator !== null && c.dataType !== null;
};

/**
 * If node data type definition
 */
export type IfNodeData = {
  name?: string;
  logicOperator?: "AND" | "OR";
  conditions?: IfCondition[];
  color?: string; // Hex color for the node
  flowId?: string; // Used in new data structure for query key
};

/**
 * If node type
 */
export type IfNode = Node<IfNodeData, "if">;

/**
 * If node component
 */
export default function IfNode({ data, id, selected }: NodeProps<IfNode>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { openPanel, isPanelOpen, updateNodePanelStates } =
    useFlowPanelContext();

  // Get flow ID from data (new structure) or fall back to agent store (old structure)
  const flowIdFromData = data?.flowId;
  const selectedFlowIdFromStore = useAgentStore.use.selectedFlowId();
  const selectedFlowId = flowIdFromData || selectedFlowIdFromStore;

  // Get flow from query when needed (for schema access, validation, etc.)
  const { data: flow } = useQuery({
    ...flowQueries.detail(
      selectedFlowId ? new UniqueEntityID(selectedFlowId) : undefined,
    ),
    enabled: !!selectedFlowId,
  });

  // Try to get separate if node data with fallback
  const { data: ifNodeData } = useQuery({
    ...ifNodeQueries.detail(id.toString()),
    enabled: !!selectedFlowId && !!id, // Query whenever we have flowId and nodeId
  });

  // Use separate data if available, fallback to embedded data
  const displayName = ifNodeData?.name || data.name || "If Condition";
  const displayColor = ifNodeData?.color || data.color;
  const displayLogicOperator =
    ifNodeData?.logicOperator || data.logicOperator || "AND";
  const displayConditions = ifNodeData?.conditions || data.conditions || [];

  const [title, setTitle] = useState(displayName);
  const [editingTitle, setEditingTitle] = useState(displayName);

  // Get node title mutation - use new mutation if separate data exists, otherwise fall back to old
  const updateNodeTitle = useUpdateNodeTitle(selectedFlowId || "", id);
  const updateIfNodeName = useUpdateIfNodeName(selectedFlowId || "", id);

  // Check if the if-node panel is open
  const isPanelActive = isPanelOpen("ifNode", id);

  // Get node color with opacity based on connection state
  const nodeColor = useMemo(() => {
    // Use the assigned color from separate data or embedded data
    const baseColor = displayColor || "#A5B4FC"; // fallback to indigo-300 if not set
    return baseColor;
  }, [displayColor]);

  // Apply opacity to the color based on connection state
  const colorWithOpacity = useMemo(() => {
    if (!flow) return nodeColor;

    const opacity = getIfNodeOpacity(id, flow);
    return applyOpacityToHexColor(nodeColor, opacity);
  }, [nodeColor, flow, id]);

  // Use flow validation hook
  const { isValid: isFlowValid, invalidNodeReasons } = useFlowValidation(
    selectedFlowId ? new UniqueEntityID(selectedFlowId) : null,
  );

  // Check if node is connected from start to end
  const isFullyConnected = useMemo(() => {
    if (!flow || !flow.props?.nodes || !flow.props?.edges) return false;
    try {
      const traversalResult = traverseFlowCached(flow);
      const nodePosition = traversalResult.processNodePositions.get(id);
      return nodePosition
        ? nodePosition.isConnectedToStart && nodePosition.isConnectedToEnd
        : false;
    } catch (error) {
      console.warn("[IF-NODE] Flow traversal error:", error);
      return false;
    }
  }, [flow, id]);

  // Save node name - use new mutation if separate data exists, otherwise fall back to old
  const saveNodeName = useCallback(
    async (newName: string) => {
      // Determine which mutation to use based on data structure
      const useNewMutation = !!ifNodeData || !!data?.flowId;
      const mutation = useNewMutation ? updateIfNodeName : updateNodeTitle;

      if (mutation.isPending) return;

      try {
        await mutation.mutateAsync(newName);
        setTitle(newName);

        // Update panel states to reflect the new name
        updateNodePanelStates(id, newName);

        // Show success toast
        toast.success("Node name updated");
      } catch (error) {
        // Reset to original title on error
        setEditingTitle(title);
        toast.error("Failed to update node name");
      }
    },
    [
      id,
      title,
      updateNodeTitle,
      updateIfNodeName,
      updateNodePanelStates,
      ifNodeData,
      data?.flowId,
    ],
  );

  // Handle title changes
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingTitle(e.target.value);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (editingTitle.trim()) {
          saveNodeName(editingTitle.trim());
        }
      } else if (e.key === "Escape") {
        setEditingTitle(title);
      }
    },
    [editingTitle, title, saveNodeName],
  );

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    // Open If Node Panel with nodeId
    openPanel("ifNode", id);
  }, [id, openPanel]);

  // Handle copy action
  const handleCopyClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Use flow panel's copy method if available
      if ((window as any).flowPanelCopyNode) {
        (window as any).flowPanelCopyNode(id);
      } else {
        console.error("Copy function not available");
      }
    },
    [id],
  );

  // Handle delete action
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm delete action
  const handleConfirmDelete = useCallback(() => {
    // Use flow panel's delete method if available
    if ((window as any).flowPanelDeleteNode) {
      (window as any).flowPanelDeleteNode(id);
    } else {
      console.error("Delete function not available");
    }
    setIsDeleteDialogOpen(false);
  }, [id]);

  // Use centralized predicate to check valid conditions
  // TEMPORARILY DISABLED: If node condition validation
  const hasValidConditions =
    displayConditions?.some((c: IfCondition) => isValidCondition(c)) ?? false;
  const displayCount = hasValidConditions
    ? (displayConditions?.filter((c: IfCondition) => isValidCondition(c))
        .length ?? 0)
    : 0;
  // const hasConditions = hasValidConditions;
  const hasConditions = true; // Always show as having conditions

  return (
    <div
      className={`group/node relative inline-flex w-80 items-center justify-between rounded-lg ${
        selected
          ? "bg-background-surface-3 outline-accent-primary shadow-lg outline-2"
          : "bg-background-surface-3 outline-border-light outline-1"
      }`}
    >
      <div className="inline-flex flex-1 flex-col items-start justify-start gap-4 p-4">
        {/* Node Name Section */}
        <div className="flex flex-col items-start justify-start gap-2 self-stretch">
          <div className="inline-flex items-center justify-start gap-2 self-stretch">
            <div className="justify-start">
              <span className="text-text-body text-[10px] font-medium">
                If node name
              </span>
              <span className="text-secondary-normal text-[10px] font-medium">
                *
              </span>
            </div>
          </div>
          <Input
            value={editingTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (editingTitle.trim() && editingTitle.trim() !== title) {
                saveNodeName(editingTitle.trim());
              } else if (!editingTitle.trim()) {
                setEditingTitle(title);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Enter condition name"
            disabled={updateNodeTitle.isPending || updateIfNodeName.isPending}
            className="nodrag"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 self-stretch">
          <div className="flex gap-2">
            {/* Edit Condition Button */}
            <button
              onClick={handleEditClick}
              className={`flex h-20 flex-1 flex-col items-center justify-center gap-2 rounded-lg px-2 outline outline-offset-[-1px] transition-all ${
                !hasConditions && isFullyConnected
                  ? isPanelActive
                    ? "bg-background-surface-light outline-status-destructive-light hover:opacity-70"
                    : "bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5"
                  : isPanelActive
                    ? "bg-background-surface-light outline-border-light hover:opacity-70"
                    : "bg-background-surface-4 outline-border-light hover:bg-background-surface-5"
              }`}
            >
              <Pencil
                className={`h-5 w-5 ${isPanelActive ? "text-text-contrast-text" : "text-text-primary"}`}
              />
              <div
                className={`justify-start self-stretch text-center text-xs font-medium ${
                  isPanelActive ? "text-text-info" : "text-text-secondary"
                }`}
              >
                Edit condition
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Side Actions - matching agent node style */}
      <div
        className="inline-flex flex-col items-start justify-start gap-3 self-stretch rounded-tr-lg rounded-br-lg px-2 py-4"
        style={{ backgroundColor: colorWithOpacity }}
      >
        <TooltipProvider>
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
        </TooltipProvider>

        <TooltipProvider>
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
        </TooltipProvider>
      </div>

      {/* React Flow Handles */}
      {/* Two source handles for true/false branches */}
      <CustomIfHandle nodeId={id} handleId="true" label="True" position="60%" />
      <CustomIfHandle
        nodeId={id}
        handleId="false"
        label="False"
        position="80%"
      />

      {/* Target handle */}
      <CustomHandle variant="input" nodeId={id} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Delete if node</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
