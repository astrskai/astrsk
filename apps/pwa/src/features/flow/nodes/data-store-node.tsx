// Data Store node component for flow-multi system
// Manages data storage and variables within the flow
import { type Node, type NodeProps } from "@xyflow/react";
import { useState, useCallback, useMemo } from "react";
import { Copy, Trash2, Pencil } from "lucide-react";
import { CustomHandle } from "@/features/flow/ui/custom-handle";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
  Input,
  SimpleFieldBadges,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { useFlowPanelContext } from "@/features/flow/ui/flow-panel-provider";
import { useUpdateNodeTitle } from "@/entities/flow/api/mutations/node-mutations";
import { useAgentStore } from "@/shared/stores/agent-store";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/entities/flow/api/query-factory";
import { dataStoreNodeQueries } from "@/app/queries/data-store-node/query-factory";
import { useUpdateDataStoreNodeName } from "@/app/queries/data-store-node/mutations";
// Removed flow validation imports as validation is disabled
import {
  getDataStoreNodeHexColor,
  getDataStoreNodeOpacity,
  applyOpacityToHexColor,
} from "@/features/flow/utils/node-color-assignment";
import { toast } from "sonner";
import type {
  DataStoreSchemaField,
  DataStoreField,
} from "@/entities/flow/domain/flow";

/**
 * Data Store node data type definition
 */
export type DataStoreNodeData = {
  name?: string;
  color?: string; // Hex color for the node
  dataStoreFields?: DataStoreField[]; // Runtime field values with logic
  flowId?: string; // Used in new data structure for query key
};

// Re-export types from flow domain
export type {
  DataStoreField,
  DataStoreSchemaField,
} from "@/entities/flow/domain/flow";

/**
 * Data Store node type
 */
export type DataStoreNode = Node<DataStoreNodeData, "dataStore">;

/**
 * Props for the DataStoreNodeComponent
 */
interface DataStoreNodeComponentProps {
  data: DataStoreNodeData;
  id: string;
  selected?: boolean;
}

/**
 * Inner Data Store node component that gets flow from data.flowId
 */
function DataStoreNodeComponent({
  data,
  id,
  selected,
}: DataStoreNodeComponentProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { openPanel, isPanelOpen, updateNodePanelStates } =
    useFlowPanelContext();

  // Get flow ID from data (new structure) or fall back to agent store (old structure)
  const flowIdFromData = data?.flowId;
  const selectedFlowIdFromStore = useAgentStore.use.selectedFlowId();
  const selectedFlowId = flowIdFromData || selectedFlowIdFromStore;

  // Get flow data when needed (for schema access, validation, etc.)
  const { data: flow } = useQuery({
    ...flowQueries.detail(selectedFlowId!),
    enabled: !!selectedFlowId,
  });

  // Try to get separate data store node data with fallback
  const { data: dataStoreNodeData } = useQuery({
    ...dataStoreNodeQueries.detail(id.toString()),
    enabled: !!selectedFlowId && !!id, // Query whenever we have flowId and nodeId
  });

  // Use separate data if available, fallback to embedded data
  const displayName = dataStoreNodeData?.name || data.name || "Data Update";
  const displayColor = dataStoreNodeData?.color || data.color;
  const displayFields =
    dataStoreNodeData?.dataStoreFields || data.dataStoreFields || [];

  const [title, setTitle] = useState(displayName);
  const [editingTitle, setEditingTitle] = useState(displayName);

  // Get node title mutation - use new mutation if separate data exists, otherwise fall back to old
  const updateNodeTitle = useUpdateNodeTitle(selectedFlowId!, id);
  const updateDataStoreNodeName = useUpdateDataStoreNodeName(
    selectedFlowId!,
    id,
  );

  // Check if the data-store panel is open
  const isPanelActive = isPanelOpen("dataStore", id);

  // Get node color using unified color assignment
  const nodeColor = useMemo(() => {
    return getDataStoreNodeHexColor(displayColor);
  }, [displayColor]);

  // Calculate color with opacity using unified node color assignment
  const colorWithOpacity = useMemo(() => {
    if (!flow) return nodeColor;

    const opacity = getDataStoreNodeOpacity(id, flow);
    return applyOpacityToHexColor(nodeColor, opacity);
  }, [nodeColor, flow, id]);

  // Save node name - use new mutation if separate data exists, otherwise fall back to old
  const saveNodeName = useCallback(
    async (newName: string) => {
      // Determine which mutation to use based on data structure
      const useNewMutation = !!dataStoreNodeData || !!data?.flowId;
      const mutation = useNewMutation
        ? updateDataStoreNodeName
        : updateNodeTitle;

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
      updateDataStoreNodeName,
      updateNodePanelStates,
      dataStoreNodeData,
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
    console.log(`[DataStore Node] Edit button clicked for node: ${id}`);
    console.log(`[DataStore Node] Calling openPanel("dataStore", "${id}")`);
    console.log(`[DataStore Node] Current selectedFlowId: ${selectedFlowId}`);
    console.log(
      `[DataStore Node] isPanelActive before opening: ${isPanelActive}`,
    );

    // Open Data Store Panel with nodeId
    openPanel("dataStore", id);

    console.log(`[DataStore Node] openPanel called successfully`);
  }, [id, openPanel, selectedFlowId, isPanelActive]);

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

  // Note: Schema is stored in flow.dataStoreSchema
  // Get fields for display - use the displayFields from new data or fallback
  const fieldsForDisplay = useMemo(() => {
    const fields: Array<{ id: string; name: string }> = [];

    // Get the node's configured fields from new or old data structure
    const nodeFields = displayFields;
    if (nodeFields && nodeFields.length > 0) {
      // We need to get the field names from the schema using the schemaFieldId
      nodeFields.forEach((field: any) => {
        // Find the corresponding schema field to get the name
        // Get the schema from flow props
        const schema = flow?.props?.dataStoreSchema;
        const schemaField = schema?.fields?.find(
          (sf: any) => sf.id === field.schemaFieldId,
        );
        if (schemaField) {
          fields.push({ id: field.schemaFieldId, name: schemaField.name });
        }
      });
    }

    return fields;
  }, [displayFields, flow?.props?.dataStoreSchema]);

  // TEMPORARILY DISABLED: Data store node field validation
  // Check if node has configured fields (not schema fields)
  // const hasNoFields = !data.dataStoreFields || data.dataStoreFields.length === 0;
  const hasNoFields = false; // Always show as having fields

  return (
    <div
      className={`group/node relative inline-flex w-80 items-center justify-between rounded-lg ${
        // "bg-background-surface-3 outline-2 outline-status-destructive-light"
        // isNodeInvalid
        // ? "bg-background-surface-3 outline-2 outline-status-destructive-light"
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
                Data update node name
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
            placeholder="Enter data update name"
            disabled={
              updateNodeTitle.isPending || updateDataStoreNodeName.isPending
            }
            className="nodrag"
          />
        </div>

        {/* Edit Fields Button */}
        <button
          onClick={handleEditClick}
          className={`flex h-20 flex-col items-center justify-center gap-2 self-stretch rounded-lg px-2 outline outline-offset-[-1px] transition-all ${
            hasNoFields
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
            Edit data fields
          </div>
        </button>

        {/* Fields Badges Section - only show if there are fields */}
        {fieldsForDisplay.length > 0 && (
          <SimpleFieldBadges
            fields={fieldsForDisplay}
            maxVisible={8}
            className="self-stretch"
          />
        )}
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
      <CustomHandle variant="output" nodeId={id} />
      <CustomHandle variant="input" nodeId={id} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Delete data update</DialogTitle>
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

/**
 * Data Store node component that handles both old and new data structures
 */
export default function DataStoreNode({
  id,
  data,
  selected,
}: NodeProps<DataStoreNode>) {
  return <DataStoreNodeComponent data={data} id={id} selected={selected} />;
}
