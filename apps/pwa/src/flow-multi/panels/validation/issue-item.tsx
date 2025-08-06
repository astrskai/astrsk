import { AlertCircle, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/shared/utils";

export type IssueVariant = 'error' | 'warning' | 'success' | 'draft';

interface IssueItemProps {
  variant: IssueVariant;
  title: string;
  description: string;
  suggestion?: string;
}

export function IssueItem({ variant, title, description, suggestion }: IssueItemProps) {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'error':
        return 'bg-status-destructive/30';
      case 'warning':
        return 'bg-status-warning/30';
      case 'success':
        return 'bg-status-ready/30';
      case 'draft':
        return 'bg-background-surface-5/30';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle className="max-w-4 max-h-4 text-status-destructive-light" />;
      case 'warning':
        return <AlertTriangle className="max-w-4 max-h-4 text-status-warning-light" />;
      case 'success':
        return <Check className="max-w-4 max-h-4 text-status-succeed" />;
      case 'draft':
        return null;
    }
  };

  return (
    <div className={cn(
      "px-4 py-2 border-b border-border-dark flex gap-1",
      (variant === 'success' || variant === 'draft') ? "justify-start items-center min-h-[75px]" : "justify-start items-start",
      getBackgroundClass()
    )}>
      <div className="flex-1 flex flex-col justify-start items-start gap-1">
        <div className="self-stretch flex justify-start items-center gap-2">
          {getIcon()}
          <div className={cn(
            "text-text-primary text-xs font-semibold",
            variant === 'draft' ? "" : "flex-1"
          )}>
            {title}
          </div>
        </div>
        <div className="self-stretch text-text-secondary text-xs font-normal">
          {description}
        </div>
        {suggestion && (
          <div className="self-stretch text-text-subtle text-[10px] font-normal leading-none">
            → {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}