import { useState } from "react";
import { UserIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import CharacterPreview from "@/features/character/ui/character-preview";
import { CreateItemCard } from "@/shared/ui";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";

interface AiCharacterSelectionStepProps {
  selectedCharacters: CharacterCard[];
  selectedUserCharacter: CharacterCard | null; // To disable if selected as user character
  onCharactersSelected: (characters: CharacterCard[]) => void;
}

/**
 * Selected Character Card
 * Wrapper component for selected characters with Remove action
 */
interface SelectedCharacterCardProps {
  card: CharacterCard;
  onRemove: (cardId: string) => (e: React.MouseEvent) => void;
}

const SelectedCharacterCard = ({
  card,
  onRemove,
}: SelectedCharacterCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);
  const cardId = card.id.toString();

  const actions: CharacterAction[] = [
    {
      icon: Trash2,
      label: `Remove`,
      onClick: onRemove(cardId),
      bottomActionsClassName: "block md:hidden",
    },
  ];

  return (
    <CharacterPreview
      imageUrl={imageUrl}
      name={card.props.name || ""}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      tokenCount={card.props.tokenCount}
      actions={actions}
      isShowActions={true}
      bottomActions={actions}
      moreActionsClassName="hidden"
    />
  );
};

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
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleAddCharacterClick = () => {
    setIsDialogOpen(true);
  };

  const handleRemoveCharacter = (cardId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedCharacters.filter(
      (card) => card.id.toString() !== cardId,
    );
    onCharactersSelected(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-base font-semibold md:text-[1.2rem]">
          Add AI Characters&nbsp;
          <span className="text-status-required">(Minimum 1)*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Choose one or more AI characters to add to your session.
        </p>
      </div>

      {/* Selected Characters Display */}
      <div className="flex flex-col gap-4">
        {/* Mobile: Add Button (outside grid) */}
        {selectedCharacters.length > 0 && (
          <Button
            onClick={handleAddCharacterClick}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            {`Add more characters (${selectedCharacters.length} selected)`}
          </Button>
        )}

        {/* Characters Grid */}
        {selectedCharacters.length > 0 ? (
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 justify-center gap-4 md:grid-cols-2">
            {/* Desktop: Add Character Card (inside grid) */}
            <CreateItemCard
              title="Add Character"
              description="Add more characters"
              onClick={handleAddCharacterClick}
              className="hidden aspect-[2/1] md:flex lg:aspect-[3/1]"
            />

            {/* Selected Characters */}
            {selectedCharacters.map((card) => (
              <SelectedCharacterCard
                key={`${card.props.title}-${card.id.toString()}`}
                card={card}
                onRemove={handleRemoveCharacter}
              />
            ))}
          </div>
        ) : (
          /* Empty State - Show Add Button Card */
          <div
            onClick={handleAddCharacterClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <UserIcon className="text-text-secondary mb-3 min-h-12 min-w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Add AI Characters
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select AI characters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Character Selection Dialog */}
      <CharacterSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedCharacters={selectedCharacters}
        onConfirm={onCharactersSelected}
        excludeCharacterIds={
          selectedUserCharacter ? [selectedUserCharacter.id.toString()] : []
        }
        isMultipleSelect={true}
        title="Choose characters"
        description="Choose one or more AI character cards (at least 1 required)"
        confirmButtonText="Add"
      />
    </div>
  );
}
