import { EyeOff, Eye } from "lucide-react";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { CharacterCard } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";

interface CharacterItemProps {
  characterId: UniqueEntityID;
  isEnabled?: boolean;
  onClick?: () => void;
  onToggleActive?: () => void;
}

export default function CharacterItem({
  characterId,
  isEnabled = true,
  onClick,
  onToggleActive,
}: CharacterItemProps) {
  const [character] = useCard<CharacterCard>(characterId);
  const iconAssetId = character?.props.iconAssetId ?? undefined;
  const [imageUrl] = useAsset(iconAssetId);

  if (!character) return null;

  return (
    <div
      className={cn(
        "group flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-border-subtle hover:border-fg-subtle",
        !isEnabled && "opacity-50"
      )}
      onClick={onClick}
    >
      <div className="relative w-[25%]">
        <img
          className="h-full w-full object-cover"
          src={imageUrl ?? "/img/placeholder/character-placeholder.png"}
          alt={imageUrl ? character.props.title : "No image"}
        />
      </div>
      <div className="flex w-[75%] items-center justify-between gap-2 p-4">
        <h3 className={cn(
          "line-clamp-2 text-base font-semibold text-ellipsis",
          isEnabled ? "text-fg-default" : "text-fg-subtle"
        )}>
          {character.props.title}
        </h3>

        <div className="relative flex-shrink-0">
          {/* Token count - visible by default, hidden on hover when onToggleActive exists */}
          <p className={cn(
            "text-sm text-fg-subtle",
            onToggleActive && "group-hover:hidden"
          )}>
            <span className={cn("font-semibold", isEnabled ? "text-fg-default" : "text-fg-subtle")}>
              {character.props.tokenCount}
            </span>{" "}
            <span>Tokens</span>
          </p>

          {/* Toggle active button - hidden by default, visible on hover */}
          {onToggleActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive();
              }}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded-full text-white transition-colors group-hover:flex",
                isEnabled
                  ? "bg-fg-subtle hover:bg-fg-muted"
                  : "bg-brand-500 hover:bg-brand-600"
              )}
              aria-label={isEnabled ? "Deactivate character" : "Activate character"}
              title={isEnabled ? "Click to deactivate" : "Click to activate"}
            >
              {isEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
