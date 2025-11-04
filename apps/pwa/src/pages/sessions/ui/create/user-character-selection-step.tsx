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

interface UserCharacterSelectionStepProps {
  selectedUserCharacter: CharacterCard | null;
  selectedAiCharacterIds: string[]; // To disable already selected AI characters
  onUserCharacterSelected: (character: CharacterCard | null) => void;
}

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedUserCharacterId, setSelectedUserCharacterId] = useState<
    string | null
  >(selectedUserCharacter?.id.toString() || null);
  const { data: characterCards } = useQuery(
    cardQueries.list({ type: [CardType.Character] }),
  );

  // Filter user character cards by search keyword
  const filteredUserCharacterCards = useMemo(() => {
    if (!characterCards) return [];
    if (!searchKeyword.trim()) return characterCards;

    const keyword = searchKeyword.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const title = card.props.title?.toLowerCase() || "";
      const name = card.props.name?.toLowerCase() || "";
      return title.includes(keyword) || name.includes(keyword);
    });
  }, [characterCards, searchKeyword]);

  const handleAddUserCharacterClick = () => {
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
          3. Select User Character&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-sm">
          Choose your character role for session.
        </p>
      </div>

      {/* Select from List Card */}
      <div
        onClick={handleAddUserCharacterClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
          "bg-black-alternate border-1 p-6",
          "hover:border-primary/50 hover:shadow-lg",
          selectedUserCharacter
            ? "border-primary shadow-lg"
            : "border-gray-700",
        )}
      >
        {selectedUserCharacter ? (
          <>
            {/* Selected User Character Display */}
            <h3 className="text-text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
              <UserIcon className="h-5 w-5" />
              Selected User Character
            </h3>
            <div className="flex justify-center">
              <div className="w-48">
                <CardDisplay
                  cardId={selectedUserCharacter.id}
                  title={selectedUserCharacter.props.title}
                  name={selectedUserCharacter.props.name}
                  type={selectedUserCharacter.props.type}
                  tags={selectedUserCharacter.props.tags}
                  tokenCount={selectedUserCharacter.props.tokenCount}
                  iconAssetId={selectedUserCharacter.props.iconAssetId}
                  isSelected={false}
                />
              </div>
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
                Click to select a user character (optional)
              </p>
            </div>
          </>
        )}
      </div>

      {/* User Character Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Select User Character</DialogTitle>
            <DialogDescription>
              Choose a user character card (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
            {/* Search Input */}
            <SearchInput
              name="user-character-search"
              placeholder="Search characters..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full max-w-md flex-shrink-0"
            />

            {/* User Character Cards Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredUserCharacterCards.map((card: CharacterCard) => {
                  const isDisabled = selectedAiCharacterIds.includes(
                    card.id.toString(),
                  );
                  return (
                    <CardSelectItem
                      key={card.id.toString()}
                      card={card}
                      isSelected={
                        selectedUserCharacterId === card.id.toString()
                      }
                      onClick={() =>
                        handleUserCharacterCardClick(card.id.toString())
                      }
                      disabled={isDisabled}
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

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogAdd}
              disabled={!selectedUserCharacterId}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
