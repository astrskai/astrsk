import React from "react";
import { cn } from "@/shared/utils";

interface NodeSelectionMenuProps {
  position?: { x: number; y: number };
  onSelectNodeType: (type: "agent" | "dataStore" | "if") => void;
  onClose?: () => void;
  variant?: "floating" | "dropdown";
}

// Reusable menu items component
export function NodeSelectionMenuItems({ 
  onSelectNodeType,
  variant = "dropdown"
}: {
  onSelectNodeType: (type: "agent" | "dataStore" | "if") => void;
  variant?: "floating" | "dropdown";
}) {
  const isDropdown = variant === "dropdown";
  
  return (
    <div className={cn(
      "w-28 rounded-lg inline-flex flex-col justify-start items-start overflow-hidden",
      !isDropdown && "flex-row gap-2 p-2 w-auto"
    )}>
      <button
        onClick={() => onSelectNodeType("agent")}
        className={cn(
          isDropdown
            ? "self-stretch px-3 py-2 bg-background-surface-4 border-b border-border-normal inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
            : "flex flex-col items-center justify-center gap-2 p-4 min-w-[100px] rounded-md bg-background-surface-4 hover:bg-background-surface-5 border border-border-light hover:border-accent-primary transition-all duration-200 group"
        )}
      >
        <div className={cn(
          "justify-start text-text-primary text-xs font-normal",
          !isDropdown && "text-text-body group-hover:text-accent-primary transition-colors font-medium"
        )}>
          Agent node
        </div>
      </button>
      
      <button
        onClick={() => onSelectNodeType("dataStore")}
        className={cn(
          isDropdown
            ? "self-stretch px-3 py-2 bg-background-surface-4 border-b border-border-normal inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
            : "flex flex-col items-center justify-center gap-2 p-4 min-w-[100px] rounded-md bg-background-surface-4 hover:bg-background-surface-5 border border-border-light hover:border-accent-primary transition-all duration-200 group"
        )}
      >
        <div className={cn(
          "justify-start text-text-primary text-xs font-normal",
          !isDropdown && "text-text-body group-hover:text-accent-primary transition-colors font-medium"
        )}>
          Data store node
        </div>
      </button>
      
      <button
        onClick={() => onSelectNodeType("if")}
        className={cn(
          isDropdown
            ? "self-stretch px-3 py-2 bg-background-surface-4 inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
            : "flex flex-col items-center justify-center gap-2 p-4 min-w-[100px] rounded-md bg-background-surface-4 hover:bg-background-surface-5 border border-border-light hover:border-accent-primary transition-all duration-200 group"
        )}
      >
        <div className={cn(
          "justify-start text-text-primary text-xs font-normal",
          !isDropdown && "text-text-body group-hover:text-accent-primary transition-colors font-medium"
        )}>
          If node
        </div>
      </button>
    </div>
  );
}

// Main component that supports both floating and dropdown variants
export function NodeSelectionMenu({ 
  position, 
  onSelectNodeType, 
  onClose,
  variant = "floating"
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
          "bg-background-surface-3 rounded-lg",
          "shadow-lg border border-border-light",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          left: `${position?.x || 0}px`,
          top: `${position?.y || 0}px`,
          transform: 'translateY(-50%)', // Only center vertically
        }}
      >
        <NodeSelectionMenuItems onSelectNodeType={onSelectNodeType} variant="floating" />
      </div>
    </>
  );
}