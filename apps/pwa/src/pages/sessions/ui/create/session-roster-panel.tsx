/**
 * Session Roster Panel
 *
 * Right panel in Cast Step showing selected player and AI characters.
 * Displays current roster state with add/remove functionality.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Cpu, X, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import { useFilePreviewUrl } from "@/shared/hooks/use-file-preview-url";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { DraftCharacter, getDraftCharacterName } from "./draft-character";

export interface SessionRosterPanelProps {
  /** Ref for flying trail animation target */
  panelRef: React.RefObject<HTMLDivElement>;
  /** Currently selected player character */
  playerCharacter: DraftCharacter | null;
  /** Player character display name (resolved from library or draft) */
  playerDisplayName?: string;
  /** Player character image URL (resolved from library or draft) */
  playerDisplayImageUrl?: string;
  /** Currently selected AI characters */
  aiCharacters: DraftCharacter[];
  /** Library character cards for resolving AI character data */
  libraryCards: CharacterCard[];
  /** Callback to remove player character */
  onRemovePlayer: () => void;
  /** Callback to remove an AI character by tempId */
  onRemoveAI: (tempId: string) => void;
  /** Current mobile tab for visibility control */
  mobileTab: "library" | "cast";
}

export function SessionRosterPanel({
  panelRef,
  playerCharacter,
  playerDisplayName,
  playerDisplayImageUrl,
  aiCharacters,
  libraryCards,
  onRemovePlayer,
  onRemoveAI,
  mobileTab,
}: SessionRosterPanelProps) {
  const totalSelected = (playerCharacter ? 1 : 0) + aiCharacters.length;

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative w-full flex-col overflow-hidden border-zinc-800 md:w-72 md:rounded-xl md:border lg:w-80",
        mobileTab === "cast" ? "flex h-full" : "hidden md:flex",
      )}
    >
      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Player Character Section */}
        <PlayerSection
          playerCharacter={playerCharacter}
          displayName={playerDisplayName}
          displayImageUrl={playerDisplayImageUrl}
          onRemove={onRemovePlayer}
        />

        {/* AI Characters Section */}
        <AISection
          aiCharacters={aiCharacters}
          libraryCards={libraryCards}
          onRemoveAI={onRemoveAI}
        />
      </div>

      {/* Footer Status */}
      <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3">
        <AnimatePresence mode="wait">
          {totalSelected === 0 ? (
            <motion.div
              key="warning"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center justify-center gap-2 text-zinc-500"
            >
              <AlertTriangle size={14} />
              <span className="text-xs">Select at least one character</span>
            </motion.div>
          ) : (
            <motion.div
              key="count"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center justify-center gap-2 text-zinc-400"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                {totalSelected}
              </span>
              <span className="text-xs">
                character{totalSelected > 1 ? "s" : ""} ready
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Player Character Section
 */
interface PlayerSectionProps {
  playerCharacter: DraftCharacter | null;
  displayName?: string;
  displayImageUrl?: string;
  onRemove: () => void;
}

function PlayerSection({
  playerCharacter,
  displayName,
  displayImageUrl,
  onRemove,
}: PlayerSectionProps) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
        <User size={11} />
        Player
      </h3>

      <AnimatePresence mode="wait">
        {playerCharacter ? (
          <motion.div
            key={playerCharacter.tempId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="group relative"
          >
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2.5 transition-colors hover:border-zinc-600/50">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 text-sm font-bold text-white">
                  {displayImageUrl ? (
                    <img
                      src={displayImageUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (displayName || "??").substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {displayName}
                </p>
                {playerCharacter.source !== "library" && (
                  <span className="text-[10px] text-amber-400/80">Session</span>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={onRemove}
                aria-label="Remove player character"
                className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-700/50 hover:text-zinc-400 md:opacity-0 md:group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700/50 p-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50">
              <User size={16} className="text-zinc-600" />
            </div>
            <p className="text-xs text-zinc-600">No player selected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * AI Characters Section
 */
interface AISectionProps {
  aiCharacters: DraftCharacter[];
  libraryCards: CharacterCard[];
  onRemoveAI: (tempId: string) => void;
}

function AISection({ aiCharacters, libraryCards, onRemoveAI }: AISectionProps) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          <Cpu size={11} />
          AI Characters
        </span>
        {aiCharacters.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-300">
            {aiCharacters.length}
          </span>
        )}
      </h3>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {aiCharacters.length > 0 ? (
            aiCharacters.map((draft) => (
              <motion.div
                key={draft.tempId}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <AICharacterListItem
                  draft={draft}
                  libraryCards={libraryCards}
                  onRemove={() => onRemoveAI(draft.tempId)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty-ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700/50 p-2.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50">
                <Cpu size={16} className="text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No AI characters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/**
 * AI Character List Item
 */
interface AICharacterListItemProps {
  draft: DraftCharacter;
  libraryCards: CharacterCard[];
  onRemove: () => void;
}

function AICharacterListItem({
  draft,
  libraryCards,
  onRemove,
}: AICharacterListItemProps) {
  const libraryCard = useMemo(() => {
    if (draft.source === "library" && draft.existingCardId) {
      return libraryCards.find((c) => c.id.toString() === draft.existingCardId);
    }
    return null;
  }, [draft, libraryCards]);

  const [libraryImageUrl] = useAsset(libraryCard?.props.iconAssetId);
  const draftImageUrl = useFilePreviewUrl(
    draft.data?.imageFile,
    draft.data?.imageUrl,
  );

  const displayName =
    libraryCard?.props.name || draft.data?.name || getDraftCharacterName(draft);
  const displayImageUrl = libraryImageUrl || draftImageUrl;
  const isLocal = draft.source !== "library";

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2.5 transition-colors hover:border-zinc-600/50">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-purple-600 text-sm font-bold text-white">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            (displayName || "??").substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-purple-500" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">
          {displayName}
        </p>
        {isLocal && (
          <span className="text-[10px] text-amber-400/80">Session</span>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove AI character"
        className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-700/50 hover:text-zinc-400 md:opacity-0 md:group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
