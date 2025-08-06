// If node component for flow-multi system
// Provides conditional branching logic in the flow
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState, useCallback } from "react";
import { GitBranch, Copy, Trash2, Plus, SignpostBig } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Input } from "@/components-v2/ui/input";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";

/**
 * If node condition definition
 */
export interface IfCondition {
  id: string;
  value1: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value2: string;
}

/**
 * If node data type definition
 */
export type IfNodeData = {
  label?: string;
  condition?: string;
  logicOperator?: 'AND' | 'OR';
  conditions?: IfCondition[];
};

/**
 * If node type
 */
export type IfNode = Node<IfNodeData, "if">;

/**
 * If node component
 */
export default function IfNode({ 
  data, 
  id,
  selected 
}: NodeProps<IfNode>) {
  const [title, setTitle] = useState(data.label || "If Condition");
  const [editingTitle, setEditingTitle] = useState(data.label || "If Condition");
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
    // Open If Node Panel with nodeId
    openPanel('ifNode', id);
  }, [id, openPanel]);

  // Handle copy action
  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement copy functionality
    console.log("Copy if node:", id);
  }, [id]);

  // Handle delete action
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete functionality  
    console.log("Delete if node:", id);
  }, [id]);

  // Get condition count
  const conditionCount = data.conditions?.length || 0;
  const hasConditions = conditionCount > 0;

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
            <GitBranch className="min-w-4 min-h-4 text-purple-400" />
            <div className="justify-start text-text-body text-xs font-medium">If Node</div>
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
            placeholder="Enter condition name"
            disabled={isSaving}
            className="nodrag"
          />
        </div>

        {/* Action Buttons */}
        <div className="self-stretch flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Edit Condition Button */}
            <button 
              onClick={handleEditClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center
                bg-background-surface-4 outline-border-light hover:bg-background-surface-5
              `}
            >
              {hasConditions ? (
                <>
                  <div className="self-stretch text-center justify-start text-text-primary text-2xl font-medium leading-10">
                    {conditionCount}
                  </div>
                  <div className="self-stretch text-center justify-start text-text-secondary text-xs font-medium">
                    Condition{conditionCount > 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <>
                  <SignpostBig className="w-8 h-8 text-text-primary mb-1" />
                  <div className="self-stretch text-center justify-start text-text-secondary text-xs font-medium">
                    Edit condition
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side Actions - Always visible with purple color indicator */}
      <div className="self-stretch bg-purple-100 dark:bg-purple-900/20 px-2 py-4 inline-flex flex-col justify-between items-start gap-2 rounded-r-lg">
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
        <div className="w-1 flex-1 bg-purple-400 rounded-full" />
      </div>

      {/* Two source handles for true/false branches - matching agent node style */}
      {/* True handle */}
      <Handle 
        position={Position.Right} 
        type="source" 
        id="true"
        style={{ top: '35%' }}
        className="!w-3 !h-3 !border-0 !bg-transparent group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
        title="True path"
      />
      {/* True handle visual - small */}
      <div className="absolute top-[35%] right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 p-[1.5px] bg-green-500 rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center group-hover/node:hidden pointer-events-none">
        <div className="w-2 h-2 relative overflow-hidden">
          <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute outline-[0.67px] outline-offset-[-0.33px] outline-white"></div>
        </div>
      </div>
      {/* True handle on hover with plus icon */}
      <div className="absolute top-[35%] right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 p-[5px] bg-green-500 rounded-xl outline-1 outline-offset-[-1px] outline-green-600 hidden group-hover/node:flex justify-center items-center pointer-events-none">
        <Plus className="w-4 h-4 text-white" />
      </div>

      {/* False handle */}
      <Handle 
        position={Position.Right} 
        type="source" 
        id="false"
        style={{ top: '65%' }}
        className="!w-3 !h-3 !border-0 !bg-transparent group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
        title="False path"
      />
      {/* False handle visual - small */}
      <div className="absolute top-[65%] right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 p-[1.5px] bg-red-500 rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center group-hover/node:hidden pointer-events-none">
        <div className="w-2 h-2 relative overflow-hidden">
          <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute outline-[0.67px] outline-offset-[-0.33px] outline-white"></div>
        </div>
      </div>
      {/* False handle on hover with plus icon */}
      <div className="absolute top-[65%] right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 p-[5px] bg-red-500 rounded-xl outline-1 outline-offset-[-1px] outline-red-600 hidden group-hover/node:flex justify-center items-center pointer-events-none">
        <Plus className="w-4 h-4 text-white" />
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