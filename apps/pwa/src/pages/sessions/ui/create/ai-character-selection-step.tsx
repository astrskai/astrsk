import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserIcon } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import { CardSelectItem } from "@/pages/sessions/ui/create/card-select-item";
import { CardDisplay } from "@/features/card/ui";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface AiCharacterSelectionStepProps {
  selectedCharacters: CharacterCard[];
  selectedUserCharacter: CharacterCard | null; // To disable if selected as user character
  onCharactersSelected: (characters: CharacterCard[]) => void;
}

/**
 * AI Character Selection Step
 * Second step in create session wizard
 * Allows user to select one or more AI character cards (minimum 1 required)
 */
export function AiCharacterSelectionStep({
  selectedCharacters,
  selectedUserCharacter,
  onCharactersSelected,
}: AiCharacterSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    selectedCharacters.map((c) => c.id.toString()),
  );
  const { data: characterCards } = useQuery(
    cardQueries.list({ type: [CardType.Character] }),
  );

  // Filter character cards by search keyword
  const filteredCharacterCards = useMemo(() => {
    if (!characterCards) return [];
    if (!searchKeyword.trim()) return characterCards;

    const keyword = searchKeyword.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const title = card.props.title?.toLowerCase() || "";
      const name = card.props.name?.toLowerCase() || "";
      return title.includes(keyword) || name.includes(keyword);
    });
  }, [characterCards, searchKeyword]);

  const handleAddCharacterClick = () => {
    setIsDialogOpen(true);
  };

  const handleCharacterCardClick = (cardId: string) => {
    setSelectedCharacterIds((prev) => {
      if (prev.includes(cardId)) {
        // Remove if already selected
        return prev.filter((id) => id !== cardId);
      } else {
        // Add if not selected
        return [...prev, cardId];
      }
    });
  };

  const handleDialogAdd = () => {
    if (selectedCharacterIds.length > 0 && characterCards) {
      const selected = characterCards.filter((card: CharacterCard) =>
        selectedCharacterIds.includes(card.id.toString()),
      ) as CharacterCard[];
      onCharactersSelected(selected);
      setIsDialogOpen(false);
      setSearchKeyword("");
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          2. Select AI Characters&nbsp;
          <span className="text-status-required">(Minimum 1)*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Choose one or more AI characters to add to your session.
        </p>
      </div>

      {/* Select from List Card */}
      <div
        onClick={handleAddCharacterClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
          "bg-background-surface-4 border-2 p-6",
          "hover:border-primary/50 hover:shadow-lg",
          selectedCharacters.length > 0
            ? "border-primary shadow-lg"
            : "border-border",
        )}
      >
        {selectedCharacters.length > 0 ? (
          <>
            {/* Selected Characters Display */}
            <h3 className="text-text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
              <UserIcon className="h-5 w-5" />
              Selected Characters ({selectedCharacters.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {selectedCharacters.map((card) => (
                <CardDisplay
                  key={card.id.toString()}
                  cardId={card.id}
                  title={card.props.title}
                  name={card.props.name}
                  type={card.props.type}
                  tags={card.props.tags}
                  tokenCount={card.props.tokenCount}
                  iconAssetId={card.props.iconAssetId}
                  isSelected={false}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Select from List Placeholder */}
            <div className="flex flex-col items-center justify-center py-8">
              <UserIcon className="text-text-secondary mb-3 h-12 w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Select from the list
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select AI characters
              </p>
            </div>
          </>
        )}
      </div>

      {/* Character Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Select AI Characters</DialogTitle>
            <DialogDescription>
              Choose one or more AI character cards (at least 1 required)
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
            {/* Search Input */}
            <SearchInput
              name="character-search"
              placeholder="Search characters..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full max-w-md flex-shrink-0"
            />

            {/* Character Cards Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredCharacterCards.map((card: CharacterCard) => {
                  const isDisabled =
                    selectedUserCharacter?.id.toString() === card.id.toString();
                  return (
                    <CardSelectItem
                      key={card.id.toString()}
                      card={card}
                      isSelected={selectedCharacterIds.includes(
                        card.id.toString(),
                      )}
                      onClick={() =>
                        handleCharacterCardClick(card.id.toString())
                      }
                      disabled={isDisabled}
                    />
                  );
                })}
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

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogAdd}
              disabled={selectedCharacterIds.length === 0}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
