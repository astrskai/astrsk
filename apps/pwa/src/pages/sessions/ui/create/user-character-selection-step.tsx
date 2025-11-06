import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserIcon, ChevronLeft, Trash2 } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import CharacterPreview from "@/features/character/ui/character-preview";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CharacterAction } from "@/features/character/model/character-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface UserCharacterSelectionStepProps {
  selectedUserCharacter: CharacterCard | null;
  selectedAiCharacterIds: string[]; // To disable already selected AI characters
  onUserCharacterSelected: (character: CharacterCard | null) => void;
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
        <CharacterPreview
          imageUrl={imageUrl}
          title={card.props.title}
          summary={card.props.cardSummary}
          tags={card.props.tags || []}
          tokenCount={card.props.tokenCount}
          className={cn(
            isSelected && "border-normal-primary border-2 shadow-lg",
          )}
          isDisabled={isDisabled}
        />
      </div>

      {/* Mobile Detail Button */}
      <div className="absolute right-2 bottom-2 z-10 md:hidden">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDetailClick(cardId);
          }}
        >
          Detail
        </Button>
      </div>
    </div>
  );
};

/**
 * Selected Character Card
 * Wrapper component for selected character with Remove action
 */
interface SelectedCharacterCardProps {
  card: CharacterCard;
  onRemove: (e: React.MouseEvent) => void;
}

const SelectedCharacterCard = ({
  card,
  onRemove,
}: SelectedCharacterCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CharacterAction[] = [
    {
      icon: Trash2,
      label: `Remove ${card.props.title}`,
      onClick: onRemove,
    },
  ];

  return (
    <CharacterPreview
      imageUrl={imageUrl}
      title={card.props.title}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      tokenCount={card.props.tokenCount}
      actions={actions}
      isShowActions={true}
    />
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
      <h3 className="hidden text-lg font-semibold text-gray-50 md:block">
        {character.props.title}
      </h3>

      {/* Character Image */}
      <div className="relative mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-lg">
        <img
          src={characterImageUrl || "/img/placeholder/character-card-image.png"}
          alt={character.props.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <h4 className="text-text-primary text-lg font-semibold">Description</h4>
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
          {character.props.description || "No description available"}
        </p>
      </div>

      {/* Tags */}
      {character.props.tags && character.props.tags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-text-primary text-lg font-semibold">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {character.props.tags.map((tag, index) => (
              <span
                key={`${character.props.title}-tag-${index}-${tag}`}
                className="text-black-alternate rounded-md bg-gray-300 px-2.5 py-0.5 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Token Count */}
      {character.props.tokenCount && character.props.tokenCount > 0 && (
        <div className="text-text-secondary flex items-center gap-2 text-sm">
          <span className="font-semibold">Token Count:</span>
          <span>{character.props.tokenCount}</span>
        </div>
      )}
    </div>
  );
};

/**
 * User Character Selection Step
 * Third step in create session wizard
 * Allows user to select one user character card (optional)
 * Cards already selected as AI characters are disabled
 */
export function UserCharacterSelectionStep({
  selectedUserCharacter,
  selectedAiCharacterIds,
  onUserCharacterSelected,
}: UserCharacterSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedUserCharacterId, setSelectedUserCharacterId] = useState<
    string | null
  >(selectedUserCharacter?.id.toString() || null);
  const [previewCharacterId, setPreviewCharacterId] = useState<string | null>(
    null,
  );
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [mobileDetailCharacterId, setMobileDetailCharacterId] = useState<
    string | null
  >(null);

  const { data: characterCards } = useQuery(
    cardQueries.list({ type: [CardType.Character] }),
  );

  // Sync local selection state with prop
  useEffect(() => {
    setSelectedUserCharacterId(selectedUserCharacter?.id.toString() || null);
  }, [selectedUserCharacter]);

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

  // Filter user character cards by search keyword
  const filteredUserCharacterCards = useMemo(() => {
    if (!characterCards) return [];
    if (!searchKeyword.trim()) return characterCards;

    const keyword = searchKeyword.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const title = card.props.title?.toLowerCase() || "";
      return title.includes(keyword);
    });
  }, [characterCards, searchKeyword]);

  const handleAddUserCharacterClick = () => {
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailCharacterId(null);
    setIsDialogOpen(true);
  };

  const handleUserCharacterCardClick = (cardId: string) => {
    // Single select - toggle or replace
    setSelectedUserCharacterId((prev) => (prev === cardId ? null : cardId));
  };

  const handleDialogAdd = () => {
    if (selectedUserCharacterId && characterCards) {
      const card = characterCards.find(
        (c: CharacterCard) => c.id.toString() === selectedUserCharacterId,
      ) as CharacterCard | undefined;
      onUserCharacterSelected(card || null);
      setIsDialogOpen(false);
      setSearchKeyword("");
      // Reset mobile detail state
      setShowMobileDetail(false);
      setMobileDetailCharacterId(null);
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailCharacterId(null);
  };

  const handleRemoveUserCharacter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserCharacterSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-base font-semibold lg:text-xl">
          3. Select User Character&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-sm">
          Choose your character role for session.
        </p>
      </div>

      {/* Selected Character Display */}
      <div className="flex flex-col gap-4">
        {selectedUserCharacter ? (
          <div className="mx-auto w-full max-w-2xl">
            <SelectedCharacterCard
              card={selectedUserCharacter}
              onRemove={handleRemoveUserCharacter}
            />
          </div>
        ) : (
          /* Empty State - Show Select Button Card */
          <div
            onClick={handleAddUserCharacterClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <UserIcon className="text-text-secondary mb-3 min-h-12 min-w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Select User Character
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a user character (optional)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User Character Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[90dvh] max-h-[90dvh] max-w-5xl flex-col gap-2 md:max-w-6xl">
          <DialogHeader>
            {showMobileDetail && mobileDetailCharacter ? (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="text-text-primary hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="min-h-5 min-w-5" />
                  <DialogTitle className="text-left">
                    {mobileDetailCharacter.props.title}
                  </DialogTitle>
                </button>
              </div>
            ) : null}
            <div className={cn(showMobileDetail && "hidden md:block")}>
              <DialogTitle>Select User Character</DialogTitle>
              <DialogDescription>
                Choose a user character card (optional)
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Split Layout */}
          <div className="flex min-h-0 flex-1 gap-6 py-4">
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
                name="user-character-search"
                placeholder="Search characters..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-shrink-0"
              />

              {/* Character Preview List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {filteredUserCharacterCards.map((card: CharacterCard) => {
                    const cardId = card.id.toString();
                    const isDisabled = selectedAiCharacterIds.includes(cardId);
                    const isSelected = selectedUserCharacterId === cardId;

                    return (
                      <CharacterPreviewItem
                        key={`${card.props.title}-${card.id.toString()}`}
                        card={card}
                        cardId={cardId}
                        isDisabled={isDisabled}
                        isSelected={isSelected}
                        onCardClick={handleUserCharacterCardClick}
                        onDetailClick={(cardId) => {
                          setMobileDetailCharacterId(cardId);
                          setShowMobileDetail(true);
                        }}
                        onMouseEnter={() => {
                          setPreviewCharacterId(cardId);
                        }}
                      />
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredUserCharacterCards.length === 0 && (
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
            <div className="hidden w-1/2 flex-col overflow-y-auto rounded-lg bg-gray-900 p-4 md:flex">
              {previewCharacter ? (
                <CharacterDetailPanel character={previewCharacter} />
              ) : (
                <div className="text-text-secondary flex h-full flex-col items-center justify-center text-center">
                  <UserIcon className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-lg">Hover over a character</p>
                  <p className="text-sm">
                    Move your mouse over a character to see details
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogAdd}
              disabled={!selectedUserCharacterId}
            >
              Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
