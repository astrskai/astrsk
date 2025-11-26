import { Handle, Position, HandleProps } from "@xyflow/react";
import { Plus } from "lucide-react";

interface CustomHandleProps extends Omit<HandleProps, 'type' | 'position'> {
  variant: 'input' | 'output';
  nodeId: string;
  label?: string; // For if-node labels like "True" or "False"
  position?: Position;
  onHandleClick?: (nodeId: string, handleType: string) => void;
}

export function CustomHandle({ 
  variant, 
  nodeId, 
  label, 
  position,
  onHandleClick,
  ...handleProps 
}: CustomHandleProps) {
  const isOutput = variant === 'output';
  const defaultPosition = isOutput ? Position.Right : Position.Left;
  const actualPosition = position || defaultPosition;
  
  // Check if this handle is active (menu is open for output handles)
  const isActive = isOutput && (window as any).flowPanelActiveHandleNodeId === nodeId;
  
  // Determine the visual state
  const renderVisual = () => {
    if (isOutput) {
      if (isActive) {
        // Active state - menu is open
        return (
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <div className="w-6 h-6 p-[5px] bg-surface-overlay rounded-xl outline outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center">
              <Plus className="w-4 h-4 text-fg-default" />
            </div>
            {label && <span className="ml-1 text-fg-default text-xs font-semibold">{label}</span>}
          </div>
        );
      }
      
      return (
        <>
          {/* Default small handle */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 p-[1.5px] bg-text-primary rounded-xl flex justify-center items-center group-hover/node:hidden pointer-events-none">
            <div className="w-2 h-2 relative overflow-hidden">
              <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute"></div>
            </div>
          </div>
          {/* Large handle on hover with plus icon */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 hidden group-hover/node:flex items-center pointer-events-none">
            <div className="w-6 h-6 p-[5px] bg-emphasis rounded-xl flex justify-center items-center">
              <Plus className="w-4 h-4 text-fg-on-emphasis" />
            </div>
            {label && <span className="ml-1 text-fg-default text-xs font-semibold">{label}</span>}
          </div>
        </>
      );
    }
    
    // Input handle - no visual overlays needed
    return null;
  };
  
  return (
    <div className="group/handle">
      <Handle 
        {...handleProps}
        position={actualPosition}
        type={isOutput ? "source" : "target"}
        className={
          isOutput 
            ? "!w-3 !h-3 !border-0 !bg-transparent hover:!bg-emphasis group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
            : "!w-3 !h-3 !bg-white !border-0 hover:!bg-emphasis transition-all duration-200"
        }
        title={
          isOutput 
            ? `Click or drag to create new node${label ? ` (${label} path)` : ''}`
            : "Connect from previous node"
        }
        onClick={isOutput ? (e) => {
          e.stopPropagation();
          if (onHandleClick) {
            onHandleClick(nodeId, 'source');
          } else if ((window as any).flowPanelHandleClick) {
            (window as any).flowPanelHandleClick(nodeId, 'source');
          }
        } : undefined}
      />
      {renderVisual()}
    </div>
  );
}

// For if-node specific handles with custom positioning
export function CustomIfHandle({ 
  nodeId, 
  handleId,
  label,
  position 
}: { 
  nodeId: string;
  handleId: 'true' | 'false';
  label: string;
  position: string | number;
}) {
  const isActive = (window as any).flowPanelActiveHandleNodeId === nodeId;
  const topPosition = typeof position === 'string' ? position : `${position}%`;
  
  return (
    <div className="group/handle">
      <Handle 
        position={Position.Right}
        type="source"
        id={handleId}
        style={{ top: topPosition }}
        className="!w-3 !h-3 !border-0 !bg-transparent hover:!bg-emphasis group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
        title={`Click or drag to create new node (${label} path)`}
        onClick={(e) => {
          e.stopPropagation();
          if ((window as any).flowPanelHandleClick) {
            (window as any).flowPanelHandleClick(nodeId, 'source', handleId);
          }
        }}
      />
      {isActive ? (
        // Active state - menu is open
        <>
          <div 
            className="absolute right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 p-[5px] bg-surface-overlay rounded-xl outline outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center pointer-events-none"
            style={{ top: topPosition }}
          >
            <Plus className="w-4 h-4 text-fg-default" />
          </div>
          <span 
            className="absolute right-0 translate-x-[150%] -translate-y-1/2 text-fg-default text-xs font-semibold pointer-events-none"
            style={{ top: topPosition }}
          >
            {label}
          </span>
        </>
      ) : (
        <>
          {/* Default small handle */}
          <div 
            className="absolute right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 p-[1.5px] bg-text-primary rounded-xl flex justify-center items-center group-hover/node:hidden pointer-events-none"
            style={{ top: topPosition }}
          >
            <div className="w-2 h-2 relative overflow-hidden">
              <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute"></div>
            </div>
          </div>
          {/* Large handle on hover with plus icon */}
          <div 
            className="absolute right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 p-[5px] bg-emphasis rounded-xl hidden group-hover/node:flex justify-center items-center pointer-events-none"
            style={{ top: topPosition }}
          >
            <Plus className="w-4 h-4 text-fg-on-emphasis" />
          </div>
          {/* Label positioned separately */}
          <span 
            className="absolute right-0 translate-x-[150%] -translate-y-1/2 text-fg-default text-xs font-semibold hidden group-hover/node:block pointer-events-none"
            style={{ top: topPosition }}
          >
            {label}
          </span>
        </>
      )}
    </div>
  );
}