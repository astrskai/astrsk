import { cn } from "@/shared/lib";
import type { LucideIcon } from "lucide-react";

export interface FlowAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
}

interface FlowPreviewProps {
  title: string;
  description?: string;
  nodeCount?: number;
  actions?: FlowAction[];
  className?: string;
  isShowActions?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const FlowPreview = ({
  title,
  description,
  nodeCount = 0,
  actions = [],
  className,
  isShowActions = false,
  isDisabled = false,
  onClick,
}: FlowPreviewProps) => {
  return (
    <article
      className={cn(
        "group/preview relative flex aspect-[2/1] w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200 transition-all duration-300 lg:aspect-[3/1]",
        !isDisabled && onClick && "cursor-pointer",
        isDisabled
          ? "pointer-events-none"
          : "hover:border-gray-500 hover:bg-gray-700 hover:shadow-lg",
        className,
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      {/* Disabled overlay */}
      {isDisabled && (
        <div className="absolute inset-0 z-20 bg-white opacity-40" />
      )}

      {/* Action buttons */}
      {isShowActions && actions.length > 0 && (
        <div className="absolute top-2 right-2 z-30 flex -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover/preview:translate-y-0 group-hover/preview:opacity-100">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(e);
              }}
              disabled={action.disabled}
              aria-label={action.label}
              className={cn(
                "bg-normal-primary hover:bg-normal-primary/80 flex h-8 w-8 items-center justify-center rounded-full text-sm text-blue-900 transition-opacity",
                action.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              )}
            >
              <action.icon
                className={cn(
                  "max-h-4 max-w-4",
                  action.loading && "animate-pulse",
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-4">
        {/* Background gradient */}
        {/* {!isDisabled && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 opacity-0 blur-md transition-opacity duration-300 group-hover/preview:opacity-30" />
        )} */}

        {/* Content layer */}
        <div className="relative z-10 flex h-full flex-col justify-around gap-1 lg:justify-between lg:gap-2">
          <h3 className={cn("text-base font-semibold text-gray-50 lg:text-lg")}>
            {title}
          </h3>
          <p className={cn("line-clamp-2 text-xs lg:text-sm")}>
            {description || "No description"}
          </p>
          <div className="flex items-center gap-1 text-xs lg:text-sm">
            <span className="font-semibold text-gray-50">{nodeCount}</span>{" "}
            Nodes
          </div>
        </div>
      </div>
    </article>
  );
};

export default FlowPreview;
