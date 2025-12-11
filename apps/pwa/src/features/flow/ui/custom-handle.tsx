import { Handle, Position, HandleProps } from "@xyflow/react";
import { Plus } from "lucide-react";

interface CustomHandleProps extends Omit<HandleProps, "type" | "position"> {
  variant: "input" | "output";
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
  const isOutput = variant === "output";
  const defaultPosition = isOutput ? Position.Right : Position.Left;
  const actualPosition = position || defaultPosition;

  // Check if this handle is active (menu is open for output handles)
  const isActive =
    isOutput && (window as any).flowPanelActiveHandleNodeId === nodeId;

  // Determine the visual state
  const renderVisual = () => {
    if (isOutput) {
      if (isActive) {
        // Active state - menu is open
        return (
          <div className="pointer-events-none absolute top-1/2 right-0 flex translate-x-1/2 -translate-y-1/2 items-center">
            <div className="bg-surface-overlay outline-border-subtle flex h-6 w-6 items-center justify-center rounded-xl p-[5px] outline outline-offset-[-1px]">
              <Plus className="text-fg-default h-4 w-4" />
            </div>
            {label && (
              <span className="text-fg-default ml-1 text-xs font-semibold">
                {label}
              </span>
            )}
          </div>
        );
      }

      return (
        <>
          {/* Default small handle */}
          <div className="bg-fg-default pointer-events-none absolute top-1/2 right-0 flex h-3 w-3 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl p-[1.5px] group-hover/node:hidden">
            <div className="relative h-2 w-2 overflow-hidden">
              <div className="absolute top-[1px] left-[1px] h-1.5 w-1.5"></div>
            </div>
          </div>
          {/* Large handle on hover with plus icon */}
          <div className="pointer-events-none absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 items-center group-hover/node:flex">
            <div className="bg-emphasis flex h-6 w-6 items-center justify-center rounded-xl p-[5px]">
              <Plus className="text-fg-on-emphasis h-4 w-4" />
            </div>
            {label && (
              <span className="text-fg-default ml-1 text-xs font-semibold">
                {label}
              </span>
            )}
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
            ? "hover:bg-emphasis! h-3! w-3! border-0! bg-transparent! transition-all duration-200 group-hover/node:h-6! group-hover/node:w-6!"
            : "hover:bg-emphasis! h-3! w-3! border-0! bg-white! transition-all duration-200"
        }
        title={
          isOutput
            ? `Click or drag to create new node${label ? ` (${label} path)` : ""}`
            : "Connect from previous node"
        }
        onClick={
          isOutput
            ? (e) => {
                e.stopPropagation();
                if (onHandleClick) {
                  onHandleClick(nodeId, "source");
                } else if ((window as any).flowPanelHandleClick) {
                  (window as any).flowPanelHandleClick(nodeId, "source");
                }
              }
            : undefined
        }
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
  position,
}: {
  nodeId: string;
  handleId: "true" | "false";
  label: string;
  position: string | number;
}) {
  const isActive = (window as any).flowPanelActiveHandleNodeId === nodeId;
  const topPosition = typeof position === "string" ? position : `${position}%`;

  return (
    <div className="group/handle">
      <Handle
        position={Position.Right}
        type="source"
        id={handleId}
        style={{ top: topPosition }}
        className="hover:bg-emphasis! h-3! w-3! border-0! bg-transparent! transition-all duration-200 group-hover/node:h-6! group-hover/node:w-6!"
        title={`Click or drag to create new node (${label} path)`}
        onClick={(e) => {
          e.stopPropagation();
          if ((window as any).flowPanelHandleClick) {
            (window as any).flowPanelHandleClick(nodeId, "source", handleId);
          }
        }}
      />
      {isActive ? (
        // Active state - menu is open
        <>
          <div
            className="bg-surface-overlay outline-border-subtle pointer-events-none absolute right-0 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl p-[5px] outline outline-offset-[-1px]"
            style={{ top: topPosition }}
          >
            <Plus className="text-fg-default h-4 w-4" />
          </div>
          <span
            className="text-fg-default pointer-events-none absolute right-0 translate-x-[150%] -translate-y-1/2 text-xs font-semibold"
            style={{ top: topPosition }}
          >
            {label}
          </span>
        </>
      ) : (
        <>
          {/* Default small handle */}
          <div
            className="bg-fg-default pointer-events-none absolute right-0 flex h-3 w-3 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl p-[1.5px] group-hover/node:hidden"
            style={{ top: topPosition }}
          >
            <div className="relative h-2 w-2 overflow-hidden">
              <div className="absolute top-[1px] left-[1px] h-1.5 w-1.5"></div>
            </div>
          </div>
          {/* Large handle on hover with plus icon */}
          <div
            className="bg-emphasis pointer-events-none absolute right-0 hidden h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl p-[5px] group-hover/node:flex"
            style={{ top: topPosition }}
          >
            <Plus className="text-fg-on-emphasis h-4 w-4" />
          </div>
          {/* Label positioned separately */}
          <span
            className="text-fg-default pointer-events-none absolute right-0 hidden translate-x-[150%] -translate-y-1/2 text-xs font-semibold group-hover/node:block"
            style={{ top: topPosition }}
          >
            {label}
          </span>
        </>
      )}
    </div>
  );
}
