import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { useAssetShared } from "@/shared/hooks/use-asset-shared";
import { CharacterCard } from "@/entities/card/domain";
import { AvatarSimple } from "@/shared/ui";
import { cn } from "@/shared/lib";

interface ChatCharacterButtonProps {
  characterId?: UniqueEntityID;
  icon?: React.ReactNode;
  label?: string | React.ReactNode;
  isUser?: boolean;
  onClick?: () => void;
  isHighLighted?: boolean;
  isSubscribeBadge?: boolean;
  isDisabled?: boolean;
}

export default function ChatCharacterButton({
  characterId,
  icon,
  label,
  isUser,
  onClick,
  isHighLighted,
  isSubscribeBadge,
  isDisabled,
}: ChatCharacterButtonProps) {
  const [character] = useCard<CharacterCard>(characterId);
  const [characterIcon] = useAssetShared(character?.props.iconAssetId);

  if (characterId && !character) return null;

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-[4px]",
        isDisabled && "pointer-events-none cursor-default opacity-50",
      )}
      onClick={() => {
        if (isDisabled) return;

        onClick?.();
      }}
    >
      {character ? (
        <>
          <AvatarSimple
            src={characterIcon}
            alt={character?.props.name?.at(0)?.toUpperCase() ?? ""}
            size="lg"
            className={cn(
              "border-1 border-gray-50/30",
              isDisabled ? "cursor-default" : "hover:border-gray-50",
            )}
          />
          <div className="line-clamp-1 max-w-[48px] text-center text-xs leading-4 text-gray-50 md:line-clamp-2 md:text-ellipsis">
            {character.props.title}
          </div>

          {isUser && (
            <div className="border-background-primary absolute top-0 right-0 size-3 rounded-full border-2 bg-blue-100" />
          )}
        </>
      ) : (
        <>
          <div className="size-[48px] rounded-full">{icon}</div>
          <div className="line-clamp-2 max-w-[48px] text-center text-sm text-gray-50">
            {label}
          </div>
        </>
      )}
    </div>
  );
}
