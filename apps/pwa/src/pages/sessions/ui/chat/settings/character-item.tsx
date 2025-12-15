import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { CharacterCard } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";
import { Switch } from "@/shared/ui";

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

        {/* Toggle switch for enable/disable */}
        {onToggleActive && (
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              onToggleActive();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        )}
      </div>
    </div>
  );
}
