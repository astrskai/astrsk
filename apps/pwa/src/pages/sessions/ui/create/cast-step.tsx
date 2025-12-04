import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Cpu,
  X,
  Plus,
  LayoutGrid,
  Users,
  Upload,
  Info,
  Activity,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { SearchInput, Button } from "@/shared/ui/forms";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";

interface CastStepProps {
  playerCharacter: CharacterCard | null;
  aiCharacters: CharacterCard[];
  onPlayerCharacterChange: (character: CharacterCard | null) => void;
  onAiCharactersChange: (characters: CharacterCard[]) => void;
  onCreateCharacter: () => void;
  onImportCharacter: () => void;
  // Mobile tab state (controlled by parent for navigation)
  mobileTab: "library" | "cast";
  onMobileTabChange: (tab: "library" | "cast") => void;
}

/**
 * Library Character Card Wrapper
 * Uses BaseCard styling with PLAY/ADD buttons always visible at bottom
 */
interface LibraryCharacterCardProps {
  card: CharacterCard;
  isPlayer: boolean;
  isAI: boolean;
  onAssignPlayer: () => void;
  onAddAI: () => void;
  onOpenDetails: () => void;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-placeholder.png";

const LibraryCharacterCard = ({
  card,
  isPlayer,
  isAI,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
}: LibraryCharacterCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);
  const isSelected = isPlayer || isAI;

  return (
    <article
      onClick={onOpenDetails}
      className={cn(
        // Base structure (matching BaseCard)
        "group relative flex h-full flex-col overflow-hidden cursor-pointer",
        // Visual styling (matching BaseCard)
        "rounded-xl border bg-surface-raised shadow-lg",
        // Transitions
        "transition-all duration-300",
        // Selection states
        isPlayer
          ? "border-brand-400"
          : isAI
            ? "border-[#8a7355]"
            : "border-border-default hover:border-border-muted hover:shadow-xl",
      )}
    >
      {/* Selection Badge */}
      {isPlayer && (
        <div className="absolute top-3 right-3 z-10 rounded border border-brand-400 bg-brand-600/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-brand-300 backdrop-blur-sm">
          PLAYER
        </div>
      )}
      {isAI && (
        <div className="absolute top-3 right-3 z-10 rounded border border-[#8a7355] bg-[#8a7355]/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#c9b89a] backdrop-blur-sm">
          AI
        </div>
      )}
      {/* Info Button - shown when not selected */}
      {!isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails();
          }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
        >
          <Info size={14} />
        </button>
      )}

      {/* Image Area */}
      <div className="relative h-32 overflow-hidden bg-zinc-800 sm:h-48">
        <img
          src={imageUrl || PLACEHOLDER_IMAGE_URL}
          alt={card.props.name || ""}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 -mt-6 flex flex-grow flex-col p-3 sm:-mt-8 sm:p-4">
        <h3 className="mb-1 line-clamp-2 text-sm font-bold break-words text-white drop-shadow-md sm:text-lg">
          {card.props.name || "Unnamed"}
        </h3>

        {/* Tags - hidden on mobile for compact view */}
        <div className="mb-2 hidden flex-wrap gap-1.5 sm:mb-3 sm:flex">
          {(card.props.tags || []).length > 0 ? (
            <>
              {(card.props.tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
              {(card.props.tags || []).length > 3 && (
                <span className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  +{(card.props.tags || []).length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-600">No tags</span>
          )}
        </div>

        <p className="mb-2 line-clamp-2 hidden flex-grow text-xs leading-relaxed break-words text-zinc-400 sm:mb-4 sm:block">
          {card.props.cardSummary || "No summary"}
        </p>
      </div>

      {/* Action Buttons - Always visible at bottom */}
      <div className="flex border-t border-zinc-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) onAssignPlayer();
          }}
          disabled={isSelected}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold transition-all sm:gap-2 sm:py-3 sm:text-xs",
            "border-r border-zinc-800",
            isSelected
              ? "cursor-not-allowed text-neutral-600"
              : "text-neutral-400 hover:bg-brand-600/10 hover:text-brand-300",
          )}
        >
          <User size={12} className="sm:h-[14px] sm:w-[14px]" /> PLAY
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) onAddAI();
          }}
          disabled={isSelected}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold transition-all sm:gap-2 sm:py-3 sm:text-xs",
            isSelected
              ? "cursor-not-allowed text-neutral-600"
              : "text-neutral-400 hover:bg-[#8a7355]/10 hover:text-[#c9b89a]",
          )}
        >
          <Cpu size={12} className="sm:h-[14px] sm:w-[14px]" /> ADD
        </button>
      </div>
    </article>
  );
};

/**
 * Cast Step
 * Step in new session stepper for character selection
 * Two-panel layout: Character Library (left) + Session Roster (right)
 */
export function CastStep({
  playerCharacter,
  aiCharacters,
  onPlayerCharacterChange,
  onAiCharactersChange,
  onCreateCharacter,
  onImportCharacter,
  mobileTab,
  onMobileTabChange,
}: CastStepProps) {
  const [search, setSearch] = useState("");
  const [selectedDetailsChar, setSelectedDetailsChar] = useState<CharacterCard | null>(null);

  // Fetch character cards
  const { data: characterCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Character] }),
  });

  // Filter by search
  const filteredCharacters = useMemo(() => {
    if (!characterCards) return [];
    if (!search.trim()) return characterCards;

    const keyword = search.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const name = card.props.name?.toLowerCase() || "";
      return name.includes(keyword);
    });
  }, [characterCards, search]);

  // Handlers
  const handleAssignPlayer = (char: CharacterCard) => {
    // If already AI, remove from AI list
    if (aiCharacters.find((c) => c.id.toString() === char.id.toString())) {
      onAiCharactersChange(
        aiCharacters.filter((c) => c.id.toString() !== char.id.toString()),
      );
    }
    onPlayerCharacterChange(char);
  };

  const handleAddAI = (char: CharacterCard) => {
    // If already player, remove from player
    if (playerCharacter?.id.toString() === char.id.toString()) {
      onPlayerCharacterChange(null);
    }
    // Add to AI if not already there
    if (!aiCharacters.find((c) => c.id.toString() === char.id.toString())) {
      onAiCharactersChange([...aiCharacters, char]);
    }
  };

  const handleRemoveAI = (charId: string) => {
    onAiCharactersChange(
      aiCharacters.filter((c) => c.id.toString() !== charId),
    );
  };

  const handleRemovePlayer = () => {
    onPlayerCharacterChange(null);
  };

  const totalSelected = (playerCharacter ? 1 : 0) + aiCharacters.length;

  // Get player character image
  const [playerImageUrl] = useAsset(playerCharacter?.props.iconAssetId);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Character Details Modal */}
      <CharacterDetailsModal
        character={selectedDetailsChar}
        onClose={() => setSelectedDetailsChar(null)}
      />

      {/* Mobile Tab Nav */}
      <div className="z-20 flex-shrink-0 p-3 md:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(value) => onMobileTabChange(value as "library" | "cast")}
        >
          <TabsList variant="dark-mobile" className="w-full">
            <TabsTrigger value="library" className="gap-2">
              <LayoutGrid size={14} /> Library
            </TabsTrigger>
            <TabsTrigger value="cast" className="gap-2">
              <Users size={14} /> Roster{" "}
              <span className="rounded-full bg-indigo-600 px-1.5 text-[9px] text-white">
                {totalSelected}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 overflow-hidden px-0 pb-0 md:flex-row md:px-6 md:pb-6">
        {/* Left Panel: Character Library - border provides visual distinction */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden border border-zinc-800 md:rounded-xl",
            mobileTab === "library" ? "flex" : "hidden md:flex",
          )}
        >
          {/* Library Header */}
          <div className="flex flex-shrink-0 flex-col gap-4 border-b border-zinc-800 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-fg-default">
                  <LayoutGrid size={20} className="text-brand-400" />
                  Character Library
                </h1>
                <p className="mt-1 font-mono text-xs text-fg-muted">
                  SELECT PERSONAS FOR SIMULATION
                </p>
              </div>
              <Button
                onClick={onCreateCharacter}
                variant="default"
                size="sm"
                icon={<Plus size={16} />}
              >
                <span className="hidden sm:inline">New Character</span>
              </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <SearchInput
                placeholder="Search characters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                variant="dark"
                className="flex-1"
              />
              <Button
                onClick={onImportCharacter}
                variant="secondary"
                size="md"
                icon={<Upload size={16} />}
                title="Import JSON"
              />
            </div>
          </div>

          {/* Character Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((card: CharacterCard) => {
                const cardId = card.id.toString();
                const isPlayer = playerCharacter?.id.toString() === cardId;
                const isAI = aiCharacters.some((c) => c.id.toString() === cardId);

                return (
                  <LibraryCharacterCard
                    key={cardId}
                    card={card}
                    isPlayer={isPlayer}
                    isAI={isAI}
                    onAssignPlayer={() => handleAssignPlayer(card)}
                    onAddAI={() => handleAddAI(card)}
                    onOpenDetails={() => setSelectedDetailsChar(card)}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredCharacters.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center text-zinc-600">
                <div className="mb-3 rounded-full bg-zinc-900/50 p-4">
                  <Users size={32} />
                </div>
                <p className="text-sm">No data found in archives.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Session Roster - border provides visual distinction */}
        <div
          className={cn(
            "relative w-full flex-col overflow-hidden rounded-xl border border-zinc-800 md:w-80 lg:w-96",
            mobileTab === "cast" ? "flex h-full" : "hidden md:flex",
          )}
        >
          {/* Roster Header */}
          <div className="flex-shrink-0 border-b border-zinc-800 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-fg-default">
              <Users size={16} className="text-brand-400" />
              Session Roster
            </h2>
          </div>

          {/* Roster Content */}
          <div className="flex-1 space-y-8 overflow-y-auto p-5">
            {/* Player Character Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <User size={12} /> Your Character
                </label>
                {playerCharacter && (
                  <button
                    onClick={handleRemovePlayer}
                    className="text-[10px] text-red-400 transition-colors hover:text-red-300"
                  >
                    DISMISS
                  </button>
                )}
              </div>

              {playerCharacter ? (
                <div className="group relative overflow-hidden rounded-xl border border-brand-500/30 bg-brand-700/10 p-1">
                  <div className="relative flex items-center gap-3 rounded-xl bg-surface-raised p-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-brand-600 font-bold text-white">
                      {playerImageUrl ? (
                        <img
                          src={playerImageUrl}
                          alt={playerCharacter.props.name || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (playerCharacter.props.name || "??")
                          .substring(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">
                        {playerCharacter.props.name || "Unnamed"}
                      </div>
                      <div className="mt-1 inline-block rounded border border-brand-500/20 bg-brand-600/10 px-1.5 py-0.5 text-[10px] text-brand-300">
                        PLAYER
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-brand-500/50 bg-brand-900/10 p-4 text-center">
                  <p className="text-xs text-brand-400">
                    Select your character from the library using the PLAY button
                  </p>
                </div>
              )}
            </div>

            {/* AI Support Characters Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <Cpu size={12} /> Support Characters
                </label>
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900 text-zinc-400"
                >
                  {aiCharacters.length}
                </Badge>
              </div>

              {aiCharacters.length > 0 ? (
                <div className="space-y-2">
                  {aiCharacters.map((char) => (
                    <AIRosterItem
                      key={char.id.toString()}
                      character={char}
                      onRemove={() => handleRemoveAI(char.id.toString())}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-6 text-center">
                  <p className="text-[10px] text-zinc-600">
                    No AI companions selected.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-zinc-800 p-4">
            <div className="text-center text-xs text-zinc-500">
              {totalSelected === 0
                ? "Select at least one character to continue"
                : `${totalSelected} character${totalSelected > 1 ? "s" : ""} selected`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AI Roster Item
 * Single AI character in the roster
 * Uses consistent rounded-xl to match system design
 */
function AIRosterItem({
  character,
  onRemove,
}: {
  character: CharacterCard;
  onRemove: () => void;
}) {
  const [imageUrl] = useAsset(character.props.iconAssetId);

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised p-3 transition-all hover:border-border-muted">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#8a7355] text-xs font-bold text-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={character.props.name || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          (character.props.name || "??").substring(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-200">
          {character.props.name || "Unnamed"}
        </div>
        <div className="mt-0.5 inline-block rounded border border-[#8a7355]/30 bg-[#8a7355]/10 px-1.5 py-0.5 text-[10px] text-[#c9b89a]">
          AI
        </div>
      </div>
      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-rose-400 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Character Details Modal
 * Shows full character information when clicking on a card
 */
function CharacterDetailsModal({
  character,
  onClose,
}: {
  character: CharacterCard | null;
  onClose: () => void;
}) {
  const [imageUrl] = useAsset(character?.props.iconAssetId);

  if (!character) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border-default rounded-xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col md:flex-row min-h-[400px]">
          {/* Visual Side - Character Image */}
          <div className="w-full md:w-1/3 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={character.props.name || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-white/50">
                  {(character.props.name || "??").substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 p-6">
              <span className="font-mono text-white/50 text-xs">CHARACTER_PROFILE</span>
            </div>

            <div className="relative z-10 p-6">
              <h2 className="text-2xl font-bold text-white leading-tight">
                {character.props.name || "Unnamed"}
              </h2>
              {character.props.version && (
                <p className="font-mono text-white/70 text-sm mt-1">
                  v{character.props.version}
                </p>
              )}
            </div>
          </div>

          {/* Data Side - Character Info */}
          <div className="flex-1 p-6 flex flex-col bg-surface">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-bold text-fg-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Activity size={12} /> Character Info
                </h3>
                <div className="h-0.5 w-12 bg-brand-500" />
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-raised text-fg-muted hover:text-fg-default transition-colors rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto">
              {/* Summary */}
              {character.props.cardSummary && (
                <p className="text-sm text-fg-muted leading-relaxed border-l-2 border-border-default pl-4">
                  {character.props.cardSummary}
                </p>
              )}

              {/* Description */}
              {character.props.description && (
                <div>
                  <h4 className="text-[10px] font-mono text-fg-subtle uppercase mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {character.props.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {character.props.tags && character.props.tags.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-fg-subtle uppercase mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {character.props.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-surface-raised text-brand-300 border border-border-default rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border-default flex justify-end">
              <Button onClick={onClose} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

