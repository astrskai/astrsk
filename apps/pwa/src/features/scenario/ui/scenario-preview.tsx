import { EllipsisVertical } from "lucide-react";
import { cn } from "@/shared/lib";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { Button } from "@/shared/ui/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface ScenarioPreviewProps {
  title: string;
  imageUrl?: string | null;
  summary?: string;
  tags: string[];
  tokenCount?: number;
  firstMessages?: number;
  actions?: CharacterAction[];
  className?: string;
  isShowActions?: boolean;
  isDisabled?: boolean;
  bottomActions?: CharacterAction[];
  moreActionsClassName?: string;
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/scenario-placeholder.png";

const ScenarioPreview = ({
  title,
  imageUrl,
  summary,
  tags,
  tokenCount = 0,
  firstMessages = 0,
  className,
  isShowActions = false,
  actions = [],
  isDisabled = false,
  bottomActions = [],
  moreActionsClassName,
  onClick,
}: ScenarioPreviewProps) => {
  const getCompactedTagString = (tags: string[]) => {
    const compactedTags = tags.slice(0, 3).map((tag, index) => {
      return (
        <span
          key={`${title}-tag-${index}-${tag}`}
          className={cn(
            "truncate rounded-md bg-gray-800/80 px-2.5 py-0.5 text-xs font-semibold text-gray-300 lg:text-sm",
            "transition-all duration-300 group-hover/preview:bg-black/50 group-hover/preview:text-gray-50",
            index === 2 && "hidden lg:inline-flex",
          )}
        >
          {tag}
        </span>
      );
    });

    if (tags.length > 2) {
      compactedTags.push(
        <span
          key={`${title}-tag-mobile-count-${tags.length}`}
          className="text-xs text-gray-300 transition-all duration-300 group-hover/preview:text-gray-50 lg:hidden"
        >
          +{tags.length - 2}
        </span>,
      );
    }

    if (tags.length > 3) {
      compactedTags.push(
        <span
          key={`${title}-tag-desktop-count-${tags.length}`}
          className="hidden text-xs text-gray-300 transition-all duration-300 group-hover/preview:text-gray-50 lg:inline-flex"
        >
          +{tags.length - 3}
        </span>,
      );
    }

    return compactedTags;
  };

  return (
    <article
      className={cn(
        "group/preview relative flex aspect-[2/1] w-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200 transition-all duration-300 lg:aspect-[3/1.1]",
        !isDisabled && onClick && "cursor-pointer",
        isDisabled
          ? "pointer-events-none"
          : "hover:border-gray-500 hover:shadow-lg",
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
              {action.icon ? (
                <action.icon
                  className={cn("h-4", action.loading && "animate-pulse")}
                />
              ) : (
                <span className="text-xs">{action.label.charAt(0)}</span>
              )}
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
                  {action.icon && (
                    <action.icon
                      className={cn(
                        "h-4 w-4",
                        action.loading && "animate-pulse",
                      )}
                    />
                  )}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex min-h-0 flex-[1_1_50%] items-center bg-gray-900">
        <img
          src={imageUrl || PLACEHOLDER_IMAGE_URL}
          alt={title}
          className={cn(
            "h-full w-24 flex-shrink-0 object-cover transition-transform duration-300 md:w-32",
            !isDisabled && "group-hover/preview:scale-105",
          )}
          loading="lazy"
        />
        <div className="relative flex h-full min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-2">
          <h3
            className={cn(
              "z-10 truncate text-base font-semibold text-gray-50 lg:text-lg",
              isShowActions && actions.length > 0
                ? "w-[90%] md:w-full"
                : "w-full",
            )}
          >
            {title}
          </h3>

          <div className="z-10 flex items-center gap-2 overflow-hidden text-xs lg:text-sm">
            {tags.length > 0 ? getCompactedTagString(tags) : "No tags"}
          </div>

          {/* Background image with blur on hover */}
          {!isDisabled && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-0 blur-md transition-opacity duration-300 group-hover/preview:opacity-50"
              style={{
                backgroundImage: `url(${imageUrl || PLACEHOLDER_IMAGE_URL})`,
              }}
            />
          )}
        </div>
      </div>

      <div className="bg-dark-surface relative flex min-h-0 flex-[1_1_50%] flex-col justify-between gap-2 overflow-hidden p-4">
        <p
          className={cn(
            "line-clamp-2 text-xs lg:text-sm",
            summary &&
              "transition-all duration-300 group-hover/preview:text-gray-50",
          )}
        >
          {summary || "No summary"}
        </p>

        <div className="flex items-center justify-between gap-1 text-xs lg:text-sm">
          <div className="flex items-center gap-3">
            <p>
              <span className="font-semibold text-gray-50">{tokenCount}</span>{" "}
              Tokens
            </p>
            <p>
              <span className="font-semibold text-gray-50">
                {firstMessages}
              </span>{" "}
              First messages
            </p>
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
    </article>
  );
};

export default ScenarioPreview;
