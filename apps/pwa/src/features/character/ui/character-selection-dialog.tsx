import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserIcon, ChevronLeft, Info } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import CharacterCardUI from "@/features/character/ui/character-card";
import Carousel from "@/shared/ui/carousel-v2";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CardAction } from "@/features/common/ui";
import { DialogBase } from "@/shared/ui/dialogs/base";

interface CharacterSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharacters: CharacterCard[];
  onConfirm: (characters: CharacterCard[]) => void;
  excludeCharacterIds?: string[]; // Character IDs to disable (e.g., already selected as user character)
  isMultipleSelect?: boolean; // Allow multiple selection (default: false)
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

/**
 * Character Preview Item (for dialog selection list)
 * Wrapper component that handles useAsset hook and passes imageUrl to CharacterPreview
 */
interface CharacterPreviewItemProps {
  card: CharacterCard;
  cardId: string;
  isDisabled: boolean;
  isSelected: boolean;
  onCardClick: (cardId: string) => void;
  onDetailClick: (cardId: string) => void;
  onMouseEnter: () => void;
}

const CharacterPreviewItem = ({
  card,
  cardId,
  isDisabled,
  isSelected,
  onCardClick,
  onDetailClick,
  onMouseEnter,
}: CharacterPreviewItemProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CardAction[] = [
    {
      icon: Info,
      label: "Detail",
      onClick: (e) => {
        e.stopPropagation();
        onDetailClick(cardId);
      },
      title: "View Details",
      className: "md:hidden", // Only visible on mobile
    },
  ];

  return (
    <div
      className={cn(
        "relative transition-all",
        isDisabled && "pointer-events-none opacity-50",
      )}
    >
      <div
        onClick={() => {
          if (!isDisabled) {
            onCardClick(cardId);
          }
        }}
        onMouseEnter={onMouseEnter}
        className="pointer-events-auto"
      >
        <CharacterCardUI
          imageUrl={imageUrl}
          name={card.props.name || ""}
          summary={card.props.cardSummary}
          tags={card.props.tags || []}
          tokenCount={card.props.tokenCount}
          className={cn(
            isSelected
              ? "border-brand-500 hover:border-brand-400 border-2 shadow-lg"
              : "border-2 border-transparent",
          )}
          isDisabled={isDisabled}
          actions={actions}
        />
      </div>
    </div>
  );
};

/**
 * Character Detail Panel
 * Displays detailed information about a selected character
 */
const CharacterDetailPanel = ({ character }: { character: CharacterCard }) => {
  const [characterImageUrl] = useAsset(character.props.iconAssetId);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h3 className="hidden text-lg font-semibold text-fg-default md:block">
        {character.props.name || ""}
      </h3>

      {/* Character Image */}
      <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-lg md:max-w-xs">
        <img
          src={characterImageUrl || "/img/placeholder/character-card-image.png"}
          alt={character.props.name || ""}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Description */}
      <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-wrap">
        {character.props.description || "No description available"}
      </p>

      {/* Tags */}
      {character.props.tags && character.props.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {character.props.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-md bg-neutral-800 px-2.5 py-0.5 text-sm font-semibold text-neutral-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Token Count */}
      {character.props.tokenCount && character.props.tokenCount > 0 && (
        <div className="text-fg-muted flex items-center gap-2 text-sm">
          <span className="font-semibold text-fg-default">
            {character.props.tokenCount}
          </span>
          <span>Tokens</span>
        </div>
      )}

      {character.props.lorebook &&
        character.props.lorebook.props.entries.length > 0 && (
          <div>
            <h4 className="text-fg-subtle text-center text-xs">
              Lorebook
            </h4>
            <Carousel
              slides={character.props.lorebook.props.entries.map(
                (entry, index) => ({
                  title: entry.name,
                  content: (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {entry.keys.map((key, keyIndex) => (
                          <span
                            key={`${index}-${key}-${keyIndex}`}
                            className="rounded-md bg-neutral-700/80 px-2.5 py-1 text-sm font-semibold text-fg-default"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                      <div className="text-fg-muted p-2 text-sm whitespace-pre-wrap">
                        {entry.props.content || "No content"}
                      </div>
                    </div>
                  ),
                }),
              )}
              options={{ loop: true }}
            />
          </div>
        )}
    </div>
  );
};

/**
 * Character Selection Dialog
 * Reusable dialog for selecting character cards
 * Supports both single and multiple selection modes
 */
export function CharacterSelectionDialog({
  open,
  onOpenChange,
  selectedCharacters,
  onConfirm,
  excludeCharacterIds = [],
  isMultipleSelect = false,
  title = "Choose characters",
  description = "Choose one or more AI character cards",
  confirmButtonText = "Add",
}: CharacterSelectionDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  // Temporary state for dialog selection (only committed on Confirm)
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(
    selectedCharacters.map((c) => c.id.toString()),
  );
  const [previewCharacterId, setPreviewCharacterId] = useState<string | null>(
    null,
  );
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [mobileDetailCharacterId, setMobileDetailCharacterId] = useState<
    string | null
  >(null);

  const { data: characterCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Character] }),
    enabled: open, // Only fetch when dialog is open
  });

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setTempSelectedIds(selectedCharacters.map((c) => c.id.toString()));
      setSearchKeyword("");
      setShowMobileDetail(false);
      setMobileDetailCharacterId(null);
    }
  }, [open, selectedCharacters]);

  // Get preview character details (desktop)
  const previewCharacter = useMemo(() => {
    if (!previewCharacterId || !characterCards) return null;
    return characterCards.find(
      (card: CharacterCard) => card.id.toString() === previewCharacterId,
    ) as CharacterCard | null;
  }, [previewCharacterId, characterCards]);

  // Get mobile detail character
  const mobileDetailCharacter = useMemo(() => {
    if (!mobileDetailCharacterId || !characterCards) return null;
    return characterCards.find(
      (card: CharacterCard) => card.id.toString() === mobileDetailCharacterId,
    ) as CharacterCard | null;
  }, [mobileDetailCharacterId, characterCards]);

  // Filter character cards by search keyword
  const filteredCharacterCards = useMemo(() => {
    if (!characterCards) return [];
    if (!searchKeyword.trim()) return characterCards;

    const keyword = searchKeyword.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const name = card.props.name?.toLowerCase() || "";
      return name.includes(keyword);
    });
  }, [characterCards, searchKeyword]);

  const handleCharacterCardClick = useCallback(
    (cardId: string) => {
      if (isMultipleSelect) {
        // Multiple selection mode: toggle selection
        setTempSelectedIds((prev) => {
          if (prev.includes(cardId)) {
            // Remove if already selected
            return prev.filter((id) => id !== cardId);
          } else {
            // Add if not selected
            return [...prev, cardId];
          }
        });
      } else {
        // Single selection mode: replace selection
        setTempSelectedIds([cardId]);
      }
    },
    [isMultipleSelect],
  );

  const handleClose = useCallback(() => {
    // Just close the dialog - useEffect will handle reset
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(() => {
    // Commit temp selection to actual state
    if (tempSelectedIds.length > 0 && characterCards) {
      const selected = characterCards.filter(
        (card: CharacterCard): card is CharacterCard =>
          tempSelectedIds.includes(card.id.toString()),
      );
      onConfirm(selected);
      handleClose();
    }
  }, [tempSelectedIds, characterCards, onConfirm, handleClose]);

  const handleCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Just pass through to parent - useEffect handles initialization
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <DialogBase
      open={open}
      onOpenChange={handleOpenChange}
      title={showMobileDetail && mobileDetailCharacter ? "" : title}
      description={showMobileDetail && mobileDetailCharacter ? "" : description}
      isShowCloseButton={false}
      size="2xl"
      content={
        <>
          {/* Mobile Detail Header */}
          {showMobileDetail && mobileDetailCharacter && (
            <div className="flex flex-shrink-0 items-center gap-2 md:hidden">
              <button
                onClick={() => setShowMobileDetail(false)}
                className="text-text-primary hover:text-primary flex items-center gap-2 transition-colors"
                aria-label="Back to character list"
              >
                <ChevronLeft className="min-h-5 min-w-5" />
                <h3 className="text-lg font-semibold text-fg-default">
                  {mobileDetailCharacter.props.name || ""}
                </h3>
              </button>
            </div>
          )}

          {/* Split Layout */}
          <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
            {/* Mobile Detail View */}
            {showMobileDetail && mobileDetailCharacter && (
              <div className="flex min-h-0 w-full flex-col md:hidden">
                {/* Character Detail Content */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <CharacterDetailPanel character={mobileDetailCharacter} />
                </div>
              </div>
            )}

            {/* Left Side: Search + Character List */}
            <div
              className={cn(
                "flex min-h-0 w-full flex-col gap-4 md:w-1/2",
                showMobileDetail && "hidden md:flex",
              )}
            >
              {/* Search Input */}
              <SearchInput
                name="character-search"
                placeholder="Search characters..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-shrink-0"
              />

              {/* Character Preview List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredCharacterCards.map(
                    (card: CharacterCard, index: number) => {
                      const cardId = card.id.toString();
                      const isDisabled = excludeCharacterIds.includes(cardId);
                      const isSelected = tempSelectedIds.includes(cardId);

                      return (
                        <CharacterPreviewItem
                          key={`${cardId}-${index}`}
                          card={card}
                          cardId={cardId}
                          isDisabled={isDisabled}
                          isSelected={isSelected}
                          onCardClick={handleCharacterCardClick}
                          onDetailClick={(cardId) => {
                            setMobileDetailCharacterId(cardId);
                            setShowMobileDetail(true);
                          }}
                          onMouseEnter={() => {
                            setPreviewCharacterId(cardId);
                          }}
                        />
                      );
                    },
                  )}
                </div>

                {/* Empty State */}
                {filteredCharacterCards.length === 0 && (
                  <div className="text-text-secondary flex flex-col items-center justify-center py-12 text-center">
                    {searchKeyword ? (
                      <>
                        <p className="mb-2 text-lg">No characters found</p>
                        <p className="text-sm">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-lg">
                          No character cards available
                        </p>
                        <p className="text-sm">
                          Create a character card first to continue
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Character Detail (Desktop only) */}
            <div className="hidden w-1/2 flex-col overflow-y-auto rounded-lg bg-surface-raised p-4 md:flex">
              {previewCharacter ? (
                <CharacterDetailPanel character={previewCharacter} />
              ) : (
                <div className="text-fg-subtle flex h-full flex-col items-center justify-center text-center">
                  <UserIcon className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-lg">Hover over a character</p>
                  <p className="text-sm">
                    Move your mouse over a character to see details
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      }
      footer={
        <div className="flex justify-end gap-2 border-t border-border-muted pt-4">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tempSelectedIds.length === 0}
          >
            {confirmButtonText} ({tempSelectedIds.length})
          </Button>
        </div>
      }
    />
  );
}
