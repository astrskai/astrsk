import React from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/components-v2/ui/badge";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Code,
  RotateCcw,
  Loader2,
  TestTube,
} from "lucide-react";
import { SvgIcon } from "@/components/ui/svg-icon";
import { cn } from "@/shared/lib";

interface VibePanelHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isProcessing?: boolean;
  onReset?: () => void;
  resourceName?: string | null;
  resourceType?: "card" | "flow" | null;
  isRestored?: boolean;
  className?: string;
  isLocalPanel?: boolean;
}

export const VibePanelHeader: React.FC<VibePanelHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  isProcessing = false,
  onReset,
  resourceName,
  resourceType,
  isRestored = false,
  isLocalPanel = false,
  className,
}) => {
  if (isCollapsed) {
    return (
      <div className={cn("flex w-12 justify-center py-4", className)}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ArrowLeftFromLine className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 px-4 py-2">
        <SvgIcon name="ai_assistant" size={24} className="text-[#B59EFF]" />
        <div className="text-text-primary text-xs font-medium">
          AI assistant
        </div>
      </div>
      <div className="flex items-center">
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="bg-tailwind-colors-base-transparent/0 h-7 rounded-full px-3 py-2"
          >
            <span className="text-text-subtle text-xs leading-none font-normal">
              Clear All Chat
            </span>
          </Button>
        )}
        {!isLocalPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="bg-tailwind-colors-base-transparent/0 h-7 rounded-full px-3 py-2"
          >
            <span className="text-text-subtle text-xs leading-none font-normal">
              Close
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};
