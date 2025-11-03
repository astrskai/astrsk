import { CharacterCard } from "@/entities/card/domain/character-card";
import CardDisplay from "@/features/card/ui/card-display";
import { cn } from "@/shared/lib";

interface CardSelectItemProps {
  card: CharacterCard;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Card select item component for selection
 * Shows card image with metadata (title, description, tags)
 * Used for Character and Plot card selection
 */
export function CardSelectItem({
  card,
  isSelected,
  onClick,
  disabled = false,
}: CardSelectItemProps) {
  const title = card.props.title || "Untitled Character";
  const description = card.props.description || "";
  const tags = card.props.tags || [];

  // Display max 2 tags, show +N for remaining
  const displayTags = tags.slice(0, 2);
  const remainingCount = tags.length - 2;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all",
        "bg-background-surface-1 border-2 p-4",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:shadow-lg",
        isSelected
          ? "border-blue-200 shadow-lg"
          : disabled
            ? "border-border"
            : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex gap-4">
        {/* Left: Card Display */}
        <div className="w-32 shrink-0">
          <CardDisplay
            cardId={card.id}
            title={card.props.title}
            name={card.props.name}
            type={card.props.type}
            tags={card.props.tags}
            tokenCount={card.props.tokenCount}
            iconAssetId={card.props.iconAssetId}
            isSelected={false}
          />
        </div>

        {/* Right: Title, Description & Tags */}
        <div className="flex flex-1 flex-col justify-center gap-2 overflow-hidden">
          <h3 className="text-text-primary truncate text-lg font-semibold">
            {title}
          </h3>
          <p className="text-text-secondary line-clamp-2 text-sm">
            {description || "No description"}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-background-surface-3 text-text-secondary inline-flex items-center rounded-md px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-text-secondary text-xs">
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
