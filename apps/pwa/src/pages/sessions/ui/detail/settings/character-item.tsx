import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { CharacterCard } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";

interface CharacterItemProps {
  characterId: UniqueEntityID;
}

export default function CharacterItem({ characterId }: CharacterItemProps) {
  const [character] = useCard<CharacterCard>(characterId);

  const [imageUrl] = useAsset(character.props.iconAssetId);

  return (
    <div className="flex h-[64px] overflow-hidden rounded-lg border border-gray-500">
      <img
        className="w-[25%] object-cover"
        src={imageUrl ?? "/img/placeholder/character-card-image.png"}
        alt={imageUrl ? character.props.title : "No image"}
      />
      <div className="flex w-full items-center justify-between p-4">
        <h3 className="text-base font-semibold text-gray-50">
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
