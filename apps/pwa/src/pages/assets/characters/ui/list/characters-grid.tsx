import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { CharacterCard } from "@/entities/card/domain/character-card";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { DialogConfirm } from "@/shared/ui/dialogs";
import CharacterPreview from "@/features/character/ui/character-preview";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { useCardActions } from "@/features/common/model/use-card-actions";
import { useAsset } from "@/shared/hooks/use-asset";

interface CharactersGridProps {
  characters: CharacterCard[];
  showNewCharacterCard: boolean;
}

/**
 * Character Grid Item
 * Wrapper component that handles useAsset hook
 */
interface CharacterGridItemProps {
  character: CharacterCard;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  onCharacterClick: (characterId: string) => void;
  onExport: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onCopy: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    cardId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function CharacterGridItem({
  character,
  loading,
  onCharacterClick,
  onExport,
  onCopy,
  onDeleteClick,
}: CharacterGridItemProps) {
  const [imageUrl] = useAsset(character.props.iconAssetId);
  const cardId = character.id.toString();

  const actions: CharacterAction[] = [
    {
      icon: Upload,
      label: `Export`,
      onClick: onExport(cardId, character.props.title),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: `Copy`,
      onClick: onCopy(cardId, character.props.title),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: `Delete`,
      onClick: onDeleteClick(cardId, character.props.title),
      disabled: loading.deleting,
      loading: loading.deleting,
    },
  ];

  return (
    <CharacterPreview
      imageUrl={imageUrl}
      name={character.props.name || ""}
      summary={character.props.cardSummary}
      tags={character.props.tags || []}
      tokenCount={character.props.tokenCount}
      onClick={() => onCharacterClick(cardId)}
      actions={actions}
      isShowActions={true}
    />
  );
}

/**
 * Characters grid component
 * Displays character cards in a responsive grid with optional New Character Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column per row
 * - Desktop: New card inside grid + 2 columns per row
 */
export default function CharactersGrid({
  characters,
  showNewCharacterCard,
}: CharactersGridProps) {
  const navigate = useNavigate();

  const {
    loadingStates,
    deleteDialogState,
    handleExport,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useCardActions({ entityType: "character" });

  const handleCharacterClick = (characterId: string) => {
    navigate({
      to: "/assets/characters/$characterId",
      params: { characterId },
    });
  };

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/characters/new" });
  };

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewCharacterCard && (
          <Button
            onClick={handleCreateCharacter}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            Create new character
          </Button>
        )}
        {/* Characters Grid */}
        <div className="grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2">
          {/* Desktop: New Character Card (inside grid) */}
          {showNewCharacterCard && (
            <CreateItemCard
              title="New Character"
              onClick={handleCreateCharacter}
              className="hidden aspect-[2/1] md:flex lg:aspect-[3/1]"
            />
          )}

          {/* Existing Characters */}
          {characters
            .filter((character) => character.id !== undefined)
            .map((character) => {
              const cardId = character.id.toString();
              const loading = loadingStates[cardId] || {};

              return (
                <CharacterGridItem
                  key={cardId}
                  character={character}
                  loading={loading}
                  onCharacterClick={handleCharacterClick}
                  onExport={handleExport}
                  onCopy={handleCopy}
                  onDeleteClick={handleDeleteClick}
                />
              );
            })}
        </div>
      </div>

      <DialogConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Character"
        description={
          deleteDialogState.usedSessionsCount > 0
            ? `This character is used in ${deleteDialogState.usedSessionsCount} session(s). Deleting it may affect those sessions.`
            : "This character will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
