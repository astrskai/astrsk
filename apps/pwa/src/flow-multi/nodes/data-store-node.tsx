// Data Store node component for flow-multi system
// Manages data storage and variables within the flow
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState, useCallback } from "react";
import { Database, Copy, Trash2, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Input } from "@/components-v2/ui/input";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";

/**
 * Data Store node data type definition
 */
export type DataStoreNodeData = {
  label?: string;
  fields?: DataStoreField[];
};

/**
 * Data Store field definition
 */
export interface DataStoreField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  logic?: string;
  description?: string;
}

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
  
  const { openPanel } = useFlowPanelContext();

  // Handle title changes
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingTitle.trim()) {
        setTitle(editingTitle);
        // TODO: Save to flow
      }
    } else if (e.key === 'Escape') {
      setEditingTitle(title);
    }
  }, [editingTitle, title]);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    // Open Data Store Schema Panel with nodeId
    openPanel('dataStoreSchema', id);
  }, [id, openPanel]);

  // Handle copy action
  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement copy functionality
    console.log("Copy data store node:", id);
  }, [id]);

  // Handle delete action
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete functionality  
    console.log("Delete data store node:", id);
  }, [id]);

  // Get fields for display (will come from data.fields)
  const displayFields = data.fields || [];
  const fieldsCount = displayFields.length;
  const hasFields = fieldsCount > 0;

  return (
    <div 
      className={`group/node relative w-80 rounded-lg inline-flex justify-between items-center ${
        selected 
          ? "bg-background-surface-3 outline-2 outline-accent-primary shadow-lg" 
          : "bg-background-surface-3 outline-1 outline-border-light"
      }`}
    >
      <div className="flex-1 p-4 inline-flex flex-col justify-start items-start gap-4">
        {/* Node Name Section */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <Database className="min-w-4 min-h-4 text-indigo-400" />
            <div className="justify-start text-text-body text-xs font-medium">Data Store</div>
          </div>
          <Input
            value={editingTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (editingTitle.trim() && editingTitle.trim() !== title) {
                setTitle(editingTitle);
                // TODO: Save to flow
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

        {/* Action Buttons */}
        <div className="self-stretch flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Edit Fields Button */}
            <button 
              onClick={handleEditClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center
                bg-background-surface-4 outline-border-light hover:bg-background-surface-5
              `}
            >
              <div className="self-stretch text-center justify-start text-text-primary text-2xl font-medium leading-10">
                {fieldsCount}
              </div>
              <div className="self-stretch text-center justify-start text-text-secondary text-xs font-medium">
                Edit Fields
              </div>
            </button>
          </div>
        </div>
        
        {/* Fields Preview Section */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-1">
            <div className="justify-start text-text-body text-xs font-medium">Fields</div>
          </div>
          <div className="self-stretch max-h-24 bg-background-surface-2 rounded-md p-2">
            {hasFields ? (
              <ScrollAreaSimple className="h-full">
                <div className="flex flex-wrap gap-1">
                  {displayFields.map((field, index) => (
                    <span 
                      key={field.id}
                      className="px-2 py-1 bg-background-surface-4 rounded text-xs text-text-body"
                    >
                      {field.name}
                    </span>
                  ))}
                </div>
              </ScrollAreaSimple>
            ) : (
              <div className="text-center py-2 text-text-subtle text-xs">
                No fields defined
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Actions - Always visible with indigo color indicator */}
      <div className="self-stretch bg-indigo-100 dark:bg-indigo-900/20 px-2 py-4 inline-flex flex-col justify-between items-start gap-2 rounded-r-lg">
        <div className="flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyClick}
                  className="w-6 h-6 flex items-center justify-center hover:bg-background-surface-4 rounded transition-colors"
                >
                  <Copy className="min-w-3.5 min-h-3.5 text-text-subtle" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy node</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDeleteClick}
                  className="w-6 h-6 flex items-center justify-center hover:bg-background-surface-4 rounded transition-colors"
                >
                  <Trash2 className="min-w-3.5 min-h-3.5 text-text-subtle" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete node</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Color indicator bar */}
        <div className="w-1 flex-1 bg-indigo-400 rounded-full" />
      </div>

      {/* Source handle with custom styling - matching agent node */}
      <Handle 
        position={Position.Right} 
        type="source" 
        className="!w-3 !h-3 !border-0 !bg-transparent group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
        title="Drag to connect to next node"
      />
      {/* Default small handle visual */}
      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 p-[1.5px] bg-text-primary rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center group-hover/node:hidden pointer-events-none">
        <div className="w-2 h-2 relative overflow-hidden">
          <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute outline-[0.67px] outline-offset-[-0.33px] outline-text-primary"></div>
        </div>
      </div>
      {/* Large handle on hover with plus icon */}
      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 p-[5px] bg-background-surface-3 rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 hidden group-hover/node:flex justify-center items-center pointer-events-none">
        <Plus className="w-4 h-4 text-text-primary" />
      </div>
      
      {/* Target handle */}
      <Handle 
        position={Position.Left} 
        type="target" 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300"
        title="Connect from previous node"
      />
    </div>
  );
}