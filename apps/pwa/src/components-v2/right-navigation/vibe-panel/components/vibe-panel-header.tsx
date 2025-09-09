import React from 'react';
import { Button } from '@/components-v2/ui/button';
import { Badge } from '@/components-v2/ui/badge';
import { 
  ArrowLeftFromLine, 
  ArrowRightFromLine, 
  Code,
  RotateCcw,
  Loader2,
  TestTube
} from 'lucide-react';
import { SvgIcon } from '@/components-v2/svg-icon';
import { cn } from '@/shared/utils';

interface VibePanelHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isProcessing?: boolean;
  onReset?: () => void;
  resourceName?: string | null;
  resourceType?: 'card' | 'flow' | null;
  isRestored?: boolean;
  className?: string;
}

export const VibePanelHeader: React.FC<VibePanelHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  isProcessing = false,
  onReset,
  resourceName,
  resourceType,
  isRestored = false,
  className,
}) => {
  if (isCollapsed) {
    return (
      <div className={cn("w-12 flex justify-center py-4", className)}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ArrowLeftFromLine className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="py-1 flex justify-between items-center">
      <div className="px-4 py-2 flex items-center gap-2">
        <SvgIcon name="ai_assistant" size={24} className="text-[#B59EFF]" />
        <div className="text-text-primary text-xs font-medium">AI assistant</div>
      </div>
      <div className="flex items-center">
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-3 py-2 bg-tailwind-colors-base-transparent/0 rounded-full"
          >
            <span className="text-text-subtle text-xs font-normal leading-none">Clear All Chat</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-7 px-3 py-2 bg-tailwind-colors-base-transparent/0 rounded-full"
        >
          <span className="text-text-subtle text-xs font-normal leading-none">Close</span>
        </Button>
      </div>
    </div>
  );
};