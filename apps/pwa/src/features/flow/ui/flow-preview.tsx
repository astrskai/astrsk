import { EllipsisVertical } from "lucide-react";
import { cn } from "@/shared/lib";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/forms";

export interface FlowAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  bottomActionsClassName?: string;
}

interface FlowPreviewProps {
  title: string;
  description?: string;
  nodeCount?: number;
  actions?: FlowAction[];
  bottomActions?: FlowAction[];
  className?: string;
  isShowActions?: boolean;
  isDisabled?: boolean;
  moreActionsClassName?: string;
  onClick?: () => void;
}

const FlowPreview = ({
  title,
  description,
  nodeCount = 0,
  actions = [],
  bottomActions = [],
  className,
  isShowActions = false,
  isDisabled = false,
  moreActionsClassName,
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

      {/* Action buttons - Desktop (hover) */}
      {isShowActions && actions.length > 0 && (
        <div className="absolute top-2 right-2 z-30 hidden -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover/preview:translate-y-0 group-hover/preview:opacity-100 md:flex">
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

      {/* Action buttons - Mobile (dropdown menu) */}
      {isShowActions && actions.length > 0 && (
        <div
          className={cn(
            "absolute top-2 right-2 z-30 md:hidden",
            moreActionsClassName,
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                aria-label="More actions"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-gray-50 hover:bg-gray-800/80"
              >
                <EllipsisVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-700 md:hidden"
            >
              {actions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(e);
                  }}
                  disabled={action.disabled}
                  className="flex items-center gap-2"
                >
                  <action.icon
                    className={cn("h-4 w-4", action.loading && "animate-pulse")}
                  />
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="flex items-center justify-between gap-1 text-xs lg:text-sm">
            <div>
              <span className="font-semibold text-gray-50">{nodeCount}</span>{" "}
              Nodes
            </div>

            {bottomActions.length > 0 && (
              <div className="flex items-center gap-1 text-xs lg:text-sm">
                {bottomActions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(e);
                    }}
                    disabled={action.disabled}
                    aria-label={action.label}
                    className={cn(action.bottomActionsClassName, "px-2 py-1")}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default FlowPreview;
