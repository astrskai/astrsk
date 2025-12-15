/**
 * Library Character Card
 *
 * Wraps design-system CharacterCard for library characters (from DB).
 * Displays with LIBRARY badge and provides PLAY AS / ADD AS AI actions.
 */
import { User, Cpu } from "lucide-react";
import { CharacterCard as DesignSystemCharacterCard } from "@astrsk/design-system/character-card";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import { buildCharacterBadges, PLACEHOLDER_IMAGE_URL } from "./character-card-utils";

export interface LibraryCharacterCardProps {
  card: CharacterCard;
  isPlayer: boolean;
  isAI: boolean;
  isLocal: boolean;
  onAssignPlayer: () => void;
  onAddAI: () => void;
  onOpenDetails: () => void;
  triggerFlyingTrail?: (
    event: React.MouseEvent,
    targetType: "player" | "ai",
    name: string,
    imageUrl?: string,
  ) => void;
}

export function LibraryCharacterCard({
  card,
  isPlayer,
  isAI,
  isLocal,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
  triggerFlyingTrail,
}: LibraryCharacterCardProps) {
  const [imageUrl] = useAsset(card.props.iconAssetId);
  const isSelected = isPlayer || isAI;
  // Library cards: isLocal=false, isLibrary=true
  const badges = buildCharacterBadges(isPlayer, isAI, isLocal, true);

  return (
    <DesignSystemCharacterCard
      name={card.props.name || "Unnamed"}
      imageUrl={imageUrl}
      placeholderImageUrl={PLACEHOLDER_IMAGE_URL}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      badges={badges}
      onClick={onOpenDetails}
      renderMetadata={() => null}
      footerActions={
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) {
                triggerFlyingTrail?.(
                  e,
                  "player",
                  card.props.name || "Character",
                  imageUrl ?? undefined,
                );
                onAssignPlayer();
              }
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-emerald-600/10 hover:text-emerald-300",
            )}
          >
            <User size={10} className="sm:h-3 sm:w-3" /> PLAY AS
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) {
                triggerFlyingTrail?.(
                  e,
                  "ai",
                  card.props.name || "Character",
                  imageUrl ?? undefined,
                );
                onAddAI();
              }
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-purple-600/10 hover:text-purple-300",
            )}
          >
            <Cpu size={10} className="sm:h-3 sm:w-3" /> ADD AS AI
          </button>
        </>
      }
    />
  );
}
