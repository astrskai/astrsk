import { useState } from "react";
import { UserIcon, Trash2 } from "lucide-react";
import CharacterPreview from "@/features/character/ui/character-preview";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";

interface UserCharacterSelectionStepProps {
  selectedUserCharacter: CharacterCard | null;
  selectedAiCharacterIds: string[]; // To disable already selected AI characters
  onUserCharacterSelected: (character: CharacterCard | null) => void;
}

/**
 * Selected Character Card
 * Wrapper component for selected character with Remove action
 */
interface SelectedCharacterCardProps {
  card: CharacterCard;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

const SelectedCharacterCard = ({
  card,
  onClick,
  onRemove,
}: SelectedCharacterCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CharacterAction[] = [
    {
      icon: Trash2,
      label: `Remove`,
      onClick: (e) => {
        e.stopPropagation();
        onRemove(e);
      },
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
      onClick={onClick}
      moreActionsClassName="hidden"
    />
  );
};

/**
 * User Character Selection Step
 * Third step in create session wizard
 * Allows user to select one user character card (optional)
 * Cards already selected as AI characters are disabled
 */
export default function UserCharacterSelectionStep({
  selectedUserCharacter,
  selectedAiCharacterIds,
  onUserCharacterSelected,
}: UserCharacterSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleAddUserCharacterClick = () => {
    setIsDialogOpen(true);
  };

  const handleRemoveUserCharacter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserCharacterSelected(null);
  };

  const handleConfirm = (characters: CharacterCard[]) => {
    // Single selection mode - take first character or null
    onUserCharacterSelected(characters.length > 0 ? characters[0] : null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-text-primary mb-2 text-base font-semibold lg:text-[1.2rem]">
          Select User Character&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-xs md:text-sm">
          Select one character to play as in this session, or skip to continue
          without one.
        </p>
      </div>

      {/* Selected Character Display */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {selectedUserCharacter ? (
          <SelectedCharacterCard
            card={selectedUserCharacter}
            onClick={handleAddUserCharacterClick}
            onRemove={handleRemoveUserCharacter}
          />
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
      <CharacterSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedCharacters={
          selectedUserCharacter ? [selectedUserCharacter] : []
        }
        onConfirm={handleConfirm}
        excludeCharacterIds={selectedAiCharacterIds}
        isMultipleSelect={false}
        title="Select User Character"
        description="Choose a user character card (optional)"
        confirmButtonText="Select"
      />
    </div>
  );
}
