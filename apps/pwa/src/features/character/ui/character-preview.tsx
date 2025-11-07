import { cn } from "@/shared/lib";
import type { CharacterAction } from "@/features/character/model/character-actions";

interface CharacterPreviewProps {
  title: string;
  imageUrl?: string | null;
  summary?: string;
  tags: string[];
  tokenCount?: number;
  actions?: CharacterAction[];
  className?: string;
  isShowActions?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-card-image.png";

const CharacterPreview = ({
  title,
  imageUrl,
  summary,
  tags,
  tokenCount = 0,
  actions = [],
  className,
  isShowActions = false,
  isDisabled = false,
  onClick,
}: CharacterPreviewProps) => {
  const getCompactedTagString = (tags: string[]) => {
    const compactedTags = tags.slice(0, 3).map((tag, index) => {
      return (
        <span
          key={`${title}-tag-${index}-${tag}`}
          className={cn(
            "rounded-md bg-gray-800/80 px-2.5 py-0.5 text-xs font-semibold text-gray-300 lg:text-sm",
            "transition-all duration-300 group-hover/preview:bg-gray-900/50 group-hover/preview:text-gray-50",
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
        "group/preview relative flex aspect-[2/1] w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200 transition-all duration-300 lg:aspect-[3/1]",
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
                className={cn("h-4", action.loading && "animate-pulse")}
              />
            </button>
          ))}
        </div>
      )}

      <img
        src={imageUrl || PLACEHOLDER_IMAGE_URL}
        alt={title}
        className={cn(
          "h-full w-1/4 flex-shrink-0 object-cover transition-transform duration-300",
          !isDisabled && "group-hover/preview:scale-105",
        )}
        loading="lazy"
      />

      <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-4">
        {/* Background image with blur on hover */}
        {!isDisabled && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-0 blur-md transition-opacity duration-300 group-hover/preview:opacity-20"
            style={{
              backgroundImage: `url(${imageUrl || PLACEHOLDER_IMAGE_URL})`,
            }}
          />
        )}

        {/* Content layer */}
        <div className="relative z-10 flex h-full flex-col justify-around gap-1 lg:justify-between lg:gap-2">
          <h3
            className={cn(
              "line-clamp-2 text-base font-semibold text-ellipsis text-gray-50 lg:text-lg",
              "transition-all duration-300 group-hover/preview:text-gray-200",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "line-clamp-2 text-xs text-ellipsis lg:text-sm",
              summary &&
                "transition-all duration-300 group-hover/preview:text-gray-50",
            )}
          >
            {summary || "No summary"}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs lg:text-sm">
            {tags.length > 0 ? getCompactedTagString(tags) : "No tags"}
          </div>
          <div className="flex items-center gap-1 text-xs lg:text-sm">
            {tokenCount > 0 && (
              <>
                <span className="font-semibold text-gray-50">{tokenCount}</span>{" "}
                Tokens
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CharacterPreview;
