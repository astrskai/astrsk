/**
 * Draft Character Card
 *
 * Displays import/chat/create characters in the library with SESSION badge.
 * Includes edit action (session characters are editable).
 */
import { User, Cpu, Pencil } from "lucide-react";
import { CharacterCard as DesignSystemCharacterCard } from "@astrsk/design-system/character-card";
import { cn } from "@/shared/lib";
import { useFilePreviewUrl } from "@/shared/hooks/use-file-preview-url";
import type { DraftCharacter } from "./draft-character";
import { buildCharacterBadges, PLACEHOLDER_IMAGE_URL } from "./character-card-utils";

export interface DraftCharacterCardProps {
  draft: DraftCharacter;
  isPlayer: boolean;
  isAI: boolean;
  onAssignPlayer: (e: React.MouseEvent, imageUrl?: string) => void;
  onAddAI: (e: React.MouseEvent, imageUrl?: string) => void;
  onOpenDetails: (imageUrl?: string) => void;
  onEdit: () => void;
}

export function DraftCharacterCard({
  draft,
  isPlayer,
  isAI,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
  onEdit,
}: DraftCharacterCardProps) {
  const isSelected = isPlayer || isAI;
  const name = draft.data?.name || "Unnamed";
  // Use hook to manage object URL lifecycle from imageFile
  const imageUrl = useFilePreviewUrl(
    draft.data?.imageFile,
    draft.data?.imageUrl,
  );
  // Draft characters are always local (session)
  const badges = buildCharacterBadges(isPlayer, isAI, true);

  return (
    <DesignSystemCharacterCard
      name={name}
      imageUrl={imageUrl}
      placeholderImageUrl={PLACEHOLDER_IMAGE_URL}
      summary={draft.data?.cardSummary}
      tags={draft.data?.tags || []}
      badges={badges}
      className="border-dashed border-amber-500/50"
      onClick={() => onOpenDetails(imageUrl)}
      renderMetadata={() => null}
      footerActions={
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) onAssignPlayer(e, imageUrl);
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
              if (!isSelected) onAddAI(e, imageUrl);
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-purple-600/10 hover:text-purple-300",
            )}
          >
            <Cpu size={10} className="sm:h-3 sm:w-3" /> ADD AS AI
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex items-center justify-center px-2 py-2 text-zinc-400 transition-all hover:bg-zinc-600/10 hover:text-zinc-200 sm:px-3 sm:py-3"
          >
            <Pencil size={12} className="sm:h-3.5 sm:w-3.5" />
          </button>
        </>
      }
    />
  );
}
