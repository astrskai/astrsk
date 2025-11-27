import React from "react";
import { cn } from "@/shared/lib";

interface NodeSelectionMenuProps {
  position?: { x: number; y: number };
  onSelectNodeType: (type: "agent" | "dataStore" | "if") => void;
  onClose?: () => void;
  variant?: "floating" | "dropdown";
  className?: string;
}

// Reusable menu items component
export function NodeSelectionMenuItems({ 
  onSelectNodeType,
  variant = "dropdown",
  showOnlyAgent = false,
  showOnlyDataStore = false,
  showOnlyIf = false,
  customAgentLabel,
  customDataStoreLabel,
  customIfLabel,
  className
}: {
  onSelectNodeType: (type: "agent" | "dataStore" | "if") => void;
  variant?: "floating" | "dropdown";
  showOnlyAgent?: boolean;
  showOnlyDataStore?: boolean;
  showOnlyIf?: boolean;
  customAgentLabel?: string;
  customDataStoreLabel?: string;
  customIfLabel?: string;
  className?: string;
}) {
  // Determine which buttons to show
  const showAgent = showOnlyAgent || (!showOnlyDataStore && !showOnlyIf);
  const showDataStore = showOnlyDataStore || (!showOnlyAgent && !showOnlyIf);
  const showIf = showOnlyIf || (!showOnlyAgent && !showOnlyDataStore);
  
  // The actual buttons content - conditionally rendered based on props
  const buttons = (
    <>
      {showAgent && (
        <button
          onClick={() => onSelectNodeType("agent")}
          className={cn("w-[92px] h-[31px] bg-hover inline-flex justify-center items-center hover:bg-active transition-colors", showDataStore || showIf ? "border-b border-border-muted" : "", className)}
        >
          <div className="text-center text-fg-default text-xs font-normal whitespace-nowrap">
            {customAgentLabel || "Agent node"}
          </div>
        </button>
      )}
      
      {showDataStore && (
        <button
          onClick={() => onSelectNodeType("dataStore")}
          className={cn(`w-[92px] h-[31px] bg-hover ${showIf ? 'border-b border-border-muted' : ''} inline-flex justify-center items-center hover:bg-active transition-colors`, className)}
        >
          <div className="text-center text-fg-default text-xs font-normal whitespace-nowrap">
            {customDataStoreLabel || "Data update node"}
          </div>
        </button>
      )}
      
      {showIf && (
        <button
          onClick={() => onSelectNodeType("if")}
          className={cn("w-[92px] h-[31px] bg-hover inline-flex justify-center items-center hover:bg-active transition-colors", className)}
        >
          <div className="text-center text-fg-default text-xs font-normal whitespace-nowrap">
            {customIfLabel || "If node"}
          </div>
        </button>
      )}
    </>
  );
  
  // For dropdown, return just the buttons (DropdownMenuContent provides container)
  if (variant === "dropdown") {
    return buttons;
  }
  
  // For floating, wrap in a container div with default width of 92px
  return (
    <div className={cn("w-[92px] rounded-lg flex flex-col justify-start items-start overflow-hidden", className)}>
      {buttons}
    </div>
  );
}

// Main component that supports both floating and dropdown variants
export function NodeSelectionMenu({ 
  position, 
  onSelectNodeType, 
  onClose,
  variant = "floating",
  className
}: NodeSelectionMenuProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // For dropdown variant, just return the items
  if (variant === "dropdown") {
    return <NodeSelectionMenuItems onSelectNodeType={onSelectNodeType} variant="dropdown" />;
  }

  // For floating variant, render with backdrop and positioning
  return (
    <>
      {/* Invisible backdrop to capture clicks outside */}
      <div 
        className="absolute inset-0 z-40" 
        onClick={handleBackdropClick}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Menu */}
      <div
        className={cn(
          "absolute z-50",
        )}
        style={{
          left: `${position?.x || 0}px`,
          top: `${position?.y || 0}px`,
          transform: 'translateY(-50%)', // Only center vertically
        }}
      >
        <NodeSelectionMenuItems onSelectNodeType={onSelectNodeType} variant="floating" className={className} />
      </div>
    </>
  );
}