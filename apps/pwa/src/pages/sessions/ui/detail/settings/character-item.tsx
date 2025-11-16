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
      className="flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-gray-500 hover:border-gray-300"
      onClick={onClick}
    >
      <img
        className="w-[25%] object-cover"
        src={imageUrl ?? "/img/placeholder/character-card-image.png"}
        alt={imageUrl ? character.props.title : "No image"}
      />
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-gray-50">
          {character.props.title}
        </h3>

        <p className="text-sm text-gray-400">
          <span className="font-semibold text-gray-50">
            {character.props.tokenCount}
          </span>{" "}
          <span>Tokens</span>
        </p>
      </div>
    </div>
  );
}
