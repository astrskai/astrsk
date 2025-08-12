// Data Store node component for flow-multi system
// Manages data storage and variables within the flow
import { type Node, type NodeProps } from "@xyflow/react";
import { useState, useCallback, useMemo } from "react";
import { Copy, Trash2, Pencil } from "lucide-react";
import { CustomHandle } from "@/flow-multi/components/custom-handle";
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
import { Button } from "@/components-v2/ui/button";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { useFlowPanel } from "@/flow-multi/hooks/use-flow-panel";
import { useAgentStore } from "@/app/stores/agent-store";
import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { UniqueEntityID } from "@/shared/domain";
import { traverseFlow } from "@/flow-multi/utils/flow-traversal";
import { SimpleFieldBadges } from "@/components-v2/ui/field-badges";
import { toast } from "sonner";
import type { DataStoreSchemaField, DataStoreField } from "@/modules/flow/domain/flow";

/**
 * Data Store node data type definition
 */
export type DataStoreNodeData = {
  label?: string;
  color?: string; // Hex color for the node
  dataStoreFields?: DataStoreField[]; // Runtime field values with logic
};

// Re-export types from flow domain
export type { DataStoreField, DataStoreSchemaField } from "@/modules/flow/domain/flow";

/**
 * Data Store node type
 */
export type DataStoreNode = Node<DataStoreNodeData, "dataStore">;

/**
 * Data Store node component
 */
export default function DataStoreNode({ 
  data, 
  id,
  selected 
}: NodeProps<DataStoreNode>) {
  const [title, setTitle] = useState(data.label || "Data Store");
  const [editingTitle, setEditingTitle] = useState(data.label || "Data Store");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { openPanel, isPanelOpen, updateNodePanelStates } = useFlowPanelContext();
  
  // Get flow ID from agent store
  const selectedFlowId = useAgentStore.use.selectedFlowId();
  
  // Get flow data and save function
  const { flow, saveFlow } = useFlowPanel({ flowId: selectedFlowId || "" });
  
  // Check if the data-store panel is open
  const isPanelActive = isPanelOpen('dataStore', id);
  
  // Get node color with opacity based on connection state
  const nodeColor = useMemo(() => {
    // Use the assigned color from data
    const baseColor = data.color || '#A5B4FC'; // fallback to indigo-300 if not set
    return baseColor;
  }, [data.color]);
  
  // Use flow validation hook
  const { isValid: isFlowValid, invalidNodeReasons } = useFlowValidation(selectedFlowId ? new UniqueEntityID(selectedFlowId) : null);
  
  // Check if node is connected
  const isConnected = useMemo(() => {
    if (!flow) return false;
    const traversalResult = traverseFlow(flow);
    return traversalResult.connectedSequence.includes(id) && traversalResult.hasValidFlow;
  }, [flow, id]);
  
  // Check if this specific node is invalid (only show if connected)
  const isNodeInvalid = isConnected && invalidNodeReasons && invalidNodeReasons[id] && invalidNodeReasons[id].length > 0;
  
  // Calculate opacity based on connection state and flow validity
  const nodeOpacity = useMemo(() => {
    if (!flow) return 1;
    
    // If node is not connected to both start and end, return 70% opacity
    if (!isConnected) {
      return 0.7;
    }
    // If node is connected but the flow has invalid nodes, return 70% opacity
    else if (!isFlowValid) {
      return 0.7;
    }
    
    // Return full opacity for connected nodes in a valid flow
    return 1;
  }, [flow, isConnected, isFlowValid]);
  
  // Calculate opacity with hex alpha channel
  const colorWithOpacity = useMemo(() => {
    return nodeOpacity < 1 
      ? `${nodeColor}${Math.round(nodeOpacity * 255).toString(16).padStart(2, '0')}` 
      : nodeColor;
  }, [nodeColor, nodeOpacity]);

  // Save node name to flow
  const saveNodeName = useCallback(async (newName: string) => {
    if (!flow || isSaving) return;
    
    setIsSaving(true);
    try {
      const node = flow.props.nodes.find(n => n.id === id);
      if (!node) return;
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          label: newName
        }
      };
      
      const updatedNodes = flow.props.nodes.map(n => 
        n.id === id ? updatedNode : n
      );
      
      const updateResult = flow.update({ nodes: updatedNodes });
      if (updateResult.isSuccess) {
        await saveFlow(flow);
        setTitle(newName);
        
        // Update panel states to reflect the new name
        updateNodePanelStates(id, newName);
        
        // Show success toast
        toast.success("Node name updated");
      }
    } finally {
      setIsSaving(false);
    }
  }, [flow, id, saveFlow, isSaving, updateNodePanelStates]);

  // Handle title changes
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingTitle.trim()) {
        saveNodeName(editingTitle.trim());
      }
    } else if (e.key === 'Escape') {
      setEditingTitle(title);
    }
  }, [editingTitle, title, saveNodeName]);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    // Open Data Store Panel with nodeId
    openPanel('dataStore', id);
  }, [id, openPanel]);

  // Handle copy action
  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use flow panel's copy method if available
    if ((window as any).flowPanelCopyNode) {
      (window as any).flowPanelCopyNode(id);
    } else {
      console.error("Copy function not available");
    }
  }, [id]);

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
  // Get fields from the node's actual dataStoreFields (runtime values)
  // These are the fields that have been configured for this specific node
  const displayFields = useMemo(() => {
    const fields: Array<{ id: string; name: string }> = [];
    
    // Get the node's configured fields
    if (data.dataStoreFields && data.dataStoreFields.length > 0) {
      // We need to get the field names from the schema using the schemaFieldId
      data.dataStoreFields.forEach(field => {
        // Find the corresponding schema field to get the name
        const schemaField = flow?.props.dataStoreSchema?.fields.find(
          sf => sf.id === field.schemaFieldId
        );
        if (schemaField) {
          fields.push({ id: field.schemaFieldId, name: schemaField.name });
        }
      });
    }
    
    return fields;
  }, [data.dataStoreFields, flow?.props.dataStoreSchema?.fields]);
  
  // Check if node has configured fields (not schema fields)
  const hasNoFields = !data.dataStoreFields || data.dataStoreFields.length === 0;

  return (
    <div 
      className={`group/node relative w-80 rounded-lg inline-flex justify-between items-center ${
        isNodeInvalid
          ? "bg-background-surface-3 outline-2 outline-status-destructive-light"
          : selected 
            ? "bg-background-surface-3 outline-2 outline-accent-primary shadow-lg" 
            : "bg-background-surface-3 outline-1 outline-border-light"
      }`}
    >
      <div className="flex-1 p-4 inline-flex flex-col justify-start items-start gap-4">
        {/* Node Name Section */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <div className="justify-start">
              <span className="text-text-body text-[10px] font-medium">Data store node</span>
              <span className="text-secondary-normal text-[10px] font-medium">*</span>
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
            placeholder="Enter data store name"
            disabled={isSaving}
            className="nodrag"
          />
        </div>

        {/* Edit Fields Button */}
        <button 
          onClick={handleEditClick}
          className={`self-stretch h-20 px-2 rounded-lg outline outline-offset-[-1px] flex flex-col justify-center items-center gap-2 transition-all ${
            hasNoFields 
              ? isPanelActive
                ? 'bg-background-surface-light outline-status-destructive-light hover:opacity-70'
                : 'bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5'
              : isPanelActive
                ? 'bg-background-surface-light outline-border-light hover:opacity-70'
                : 'bg-background-surface-4 outline-border-light hover:bg-background-surface-5'
          }`}
        >
          <Pencil className={`w-5 h-5 ${isPanelActive ? 'text-text-contrast-text' : 'text-text-primary'}`} />
          <div className={`self-stretch text-center justify-start text-xs font-medium ${
            isPanelActive ? 'text-text-info' : 'text-text-secondary'
          }`}>
            Edit data fields
          </div>
        </button>
        
        {/* Fields Badges Section - only show if there are fields */}
        {displayFields.length > 0 && (
          <SimpleFieldBadges 
            fields={displayFields}
            maxVisible={8}
            className="self-stretch"
          />
        )}
      </div>

      {/* Side Actions - matching agent node style */}
      <div 
        className="self-stretch px-2 py-4 rounded-tr-lg rounded-br-lg inline-flex flex-col justify-start items-start gap-3"
        style={{ backgroundColor: colorWithOpacity }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyClick}
                className="w-6 h-6 relative overflow-hidden hover:opacity-80 transition-opacity group/copy"
              >
                <Copy className="min-w-4 min-h-5 text-text-contrast-text" />
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
                className="w-6 h-6 relative overflow-hidden hover:opacity-80 transition-opacity group/delete"
              >
                <Trash2 className="min-w-4 min-h-5 text-text-contrast-text" />
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
            <DialogTitle>Delete data store</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
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