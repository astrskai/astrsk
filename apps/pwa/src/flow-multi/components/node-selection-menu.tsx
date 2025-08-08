import React from "react";
import { User, Database, GitBranch } from "lucide-react";
import { cn } from "@/shared/utils";

interface NodeSelectionMenuProps {
  position: { x: number; y: number };
  onSelectNodeType: (type: "agent" | "dataStore" | "if") => void;
  onClose: () => void;
}

export function NodeSelectionMenu({ position, onSelectNodeType, onClose }: NodeSelectionMenuProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          "absolute z-50 flex gap-2 p-2",
          "bg-background-surface-3 rounded-lg",
          "shadow-lg border border-border-light",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateY(-50%)', // Only center vertically
        }}
      >
        <button
          onClick={() => onSelectNodeType("agent")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4",
            "min-w-[100px] rounded-md",
            "bg-background-surface-4 hover:bg-background-surface-5",
            "border border-border-light hover:border-accent-primary",
            "transition-all duration-200 group"
          )}
        >
          <User className="w-6 h-6 text-text-body group-hover:text-accent-primary transition-colors" />
          <span className="text-xs font-medium text-text-body group-hover:text-accent-primary transition-colors">
            Agent
          </span>
        </button>

        <button
          onClick={() => onSelectNodeType("dataStore")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4",
            "min-w-[100px] rounded-md",
            "bg-background-surface-4 hover:bg-background-surface-5",
            "border border-border-light hover:border-accent-primary",
            "transition-all duration-200 group"
          )}
        >
          <Database className="w-6 h-6 text-text-body group-hover:text-accent-primary transition-colors" />
          <span className="text-xs font-medium text-text-body group-hover:text-accent-primary transition-colors">
            Data Store
          </span>
        </button>

        <button
          onClick={() => onSelectNodeType("if")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4",
            "min-w-[100px] rounded-md",
            "bg-background-surface-4 hover:bg-background-surface-5",
            "border border-border-light hover:border-accent-primary",
            "transition-all duration-200 group"
          )}
        >
          <GitBranch className="w-6 h-6 text-text-body group-hover:text-accent-primary transition-colors" />
          <span className="text-xs font-medium text-text-body group-hover:text-accent-primary transition-colors">
            If
          </span>
        </button>
      </div>
    </>
  );
}