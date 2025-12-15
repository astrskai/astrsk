/**
 * Character Details Modal
 *
 * Shows full character information when clicking on a card.
 * Supports both library characters (CharacterCard) and draft characters (DraftCharacter).
 * Uses DialogBase for consistent styling, accessibility, and proper mobile viewport handling.
 */
import { Activity } from "lucide-react";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { UniqueEntityID } from "@/shared/domain";
import { useAsset } from "@/shared/hooks/use-asset";

/**
 * Unified character data for details modal
 * Supports both CharacterCard (from DB) and DraftCharacter (local)
 */
export interface CharacterDetailsData {
  name: string;
  description?: string;
  cardSummary?: string;
  tags?: string[];
  version?: string;
  imageUrl?: string;
  // For library characters, we need asset ID to load image
  iconAssetId?: UniqueEntityID;
}

export interface CharacterDetailsModalProps {
  character: CharacterDetailsData | null;
  onClose: () => void;
}

export function CharacterDetailsModal({
  character,
  onClose,
}: CharacterDetailsModalProps) {
  // Load image from asset if iconAssetId is provided (library characters)
  const [assetImageUrl] = useAsset(character?.iconAssetId);
  // Use asset URL if available, otherwise use direct imageUrl (draft characters)
  const imageUrl = assetImageUrl || character?.imageUrl;

  return (
    <DialogBase
      open={!!character}
      onOpenChange={(open) => !open && onClose()}
      title={character?.name || "Character Details"}
      hideTitle
      size="lg"
      isShowCloseButton
      className="overflow-hidden p-0"
      contentClassName="md:overflow-hidden!"
      content={
        character && (
          <div className="flex flex-col md:h-[400px] md:flex-row">
            {/* Visual Side - Character Image */}
            {/* Mobile: sticky top, Desktop: fixed left column */}
            <div className="bg-surface-raised sticky top-0 z-10 md:relative md:top-auto md:z-auto md:h-full md:w-2/5">
              <div className="from-brand-600 to-brand-800 relative flex h-48 w-full flex-col justify-end overflow-hidden bg-gradient-to-br md:h-full">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={character.name || ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-black text-white/50 md:text-6xl">
                      {(character.name || "??").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Character Name Overlay */}
                <div className="relative z-10 p-4 md:p-6">
                  <h2 className="text-lg leading-tight font-bold text-white md:text-2xl">
                    {character.name || "Unnamed"}
                  </h2>
                  {character.version && (
                    <p className="mt-1 font-mono text-xs text-white/70 md:text-sm">
                      v{character.version}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Data Side - Character Info */}
            <div className="relative flex flex-1 flex-col md:h-full md:min-h-0">
              {/* Header - sticky on mobile, fixed on desktop */}
              <div className="bg-surface-raised sticky top-48 z-10 px-4 pt-4 pb-4 md:relative md:top-auto md:z-auto md:px-6 md:pt-6 md:pb-4">
                <h3 className="text-fg-muted mb-1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                  <Activity size={12} /> Character Info
                </h3>
                <div className="bg-brand-500 h-0.5 w-12" />
              </div>

              {/* Content (scrollable on desktop) */}
              <div className="flex-1 space-y-4 px-4 pb-8 md:space-y-5 md:overflow-y-auto md:px-6 md:pb-10">
                {/* Summary */}
                {character.cardSummary && (
                  <p className="text-fg-muted border-border-default border-l-2 pl-3 text-sm leading-relaxed md:pl-4">
                    {character.cardSummary}
                  </p>
                )}

                {/* Description */}
                {character.description && (
                  <div>
                    <h4 className="text-fg-subtle mb-2 font-mono text-[10px] uppercase">
                      Description
                    </h4>
                    <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-wrap">
                      {character.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {character.tags && character.tags.length > 0 && (
                  <div>
                    <h4 className="text-fg-subtle mb-2 font-mono text-[10px] uppercase">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {character.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-raised text-brand-300 border-border-default rounded border px-1.5 py-0.5 text-xs md:px-2 md:py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom fade overlay - sticky on mobile, absolute on desktop */}
              <div className="from-surface-raised pointer-events-none sticky bottom-0 h-12 w-full bg-gradient-to-t to-transparent md:absolute md:inset-x-0" />
            </div>
          </div>
        )
      }
    />
  );
}
