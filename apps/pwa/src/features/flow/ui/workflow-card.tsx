import { Workflow, CheckCircle2, AlertCircle } from "lucide-react";
import { IconWorkflow } from "@/shared/assets";
import { cn } from "@/shared/lib";
import {
  BaseCard,
  CardActionToolbar,
  type CardAction,
} from "@/features/common/ui";

interface WorkflowCardProps {
  title: string;
  description?: string;
  nodeCount?: number;
  isValid?: boolean;
  tags?: string[];
  actions?: CardAction[];
  className?: string;
  isDisabled?: boolean;
  onClick?: () => void;
  showTypeIndicator?: boolean;
}

const WorkflowCard = ({
  title,
  description,
  nodeCount = 0,
  isValid = true,
  tags = [],
  actions = [],
  className,
  isDisabled = false,
  onClick,
  showTypeIndicator = false,
}: WorkflowCardProps) => {
  return (
    <BaseCard
      className={cn("min-h-[240px]", className)}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Action Toolbar */}
      <CardActionToolbar actions={actions} />

      {/* Main Content Area */}
      <div className="flex flex-grow flex-col p-5">
        {/* Type Indicator - takes up space in flow when shown */}
        {showTypeIndicator && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
              <IconWorkflow className="h-3 w-3" />
              WORKFLOW
            </div>
          </div>
        )}

        {/* Title */}
        <h3
          className={cn(
            "mb-4 line-clamp-2 text-lg leading-tight font-bold break-words text-zinc-100 transition-colors group-hover:text-white",
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="mb-5 line-clamp-3 min-h-[3rem] text-xs leading-relaxed break-words text-zinc-400">
          {description || "No description"}
        </p>

        {/* Footer Stats & Tags */}
        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-800/50 pt-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.length > 0 ? (
              <>
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-zinc-800 bg-zinc-800/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors group-hover:border-zinc-700"
                  >
                    #{tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] text-zinc-600">
                    +{tags.length - 3}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-zinc-600">No tags</span>
            )}
          </div>

          {/* Meta Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 transition-colors group-hover:text-zinc-400">
              <Workflow size={12} />
              <span>{nodeCount} Nodes</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5",
                isValid ? "text-emerald-500" : "text-amber-500",
              )}
            >
              {isValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>{isValid ? "Ready" : "Issues Found"}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default WorkflowCard;
