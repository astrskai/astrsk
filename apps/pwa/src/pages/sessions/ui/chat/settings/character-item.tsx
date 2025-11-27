import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { CharacterCard } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";

interface CharacterItemProps {
  characterId: UniqueEntityID;
  onClick?: () => void;
}

export default function CharacterItem({
  characterId,
  onClick,
}: CharacterItemProps) {
  const [character] = useCard<CharacterCard>(characterId);
  const iconAssetId = character?.props.iconAssetId ?? undefined;
  const [imageUrl] = useAsset(iconAssetId);

  if (!character) return null;

  return (
    <div
      className="flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-border-subtle hover:border-fg-subtle"
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
        <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-fg-default">
          {character.props.title}
        </h3>

        <p className="text-sm text-fg-subtle">
          <span className="font-semibold text-fg-default">
            {character.props.tokenCount}
          </span>{" "}
          <span>Tokens</span>
        </p>
      </div>
    </div>
  );
}
