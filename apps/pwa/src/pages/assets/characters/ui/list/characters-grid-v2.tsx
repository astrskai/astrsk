import { Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { CharacterCard as CharacterCardDomain } from "@/entities/card/domain/character-card";
import { DialogConfirm } from "@/shared/ui/dialogs";
import CharacterCard from "@/features/character/ui/character-card";
import type { CardAction } from "@/features/common/ui";
import { useCardActions } from "@/features/common/model/use-card-actions";
import { useAsset } from "@/shared/hooks/use-asset";

interface CharactersGridV2Props {
  characters: CharacterCardDomain[];
}

/**
 * Character Grid Item
 * Wrapper component that handles useAsset hook
 */
interface CharacterGridItemProps {
  character: CharacterCardDomain;
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

  const actions: CardAction[] = [
    {
      icon: Upload,
      label: "Export",
      onClick: onExport(cardId, character.props.name || ""),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: "Copy",
      onClick: onCopy(cardId, character.props.name || ""),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: onDeleteClick(cardId, character.props.name || ""),
      disabled: loading.deleting,
      loading: loading.deleting,
      className: "text-red-400 hover:text-red-300",
    },
  ];

  return (
    <CharacterCard
      imageUrl={imageUrl}
      name={character.props.name || ""}
      summary={character.props.cardSummary}
      tags={character.props.tags || []}
      tokenCount={character.props.tokenCount}
      onClick={() => onCharacterClick(cardId)}
      actions={actions}
    />
  );
}

/**
 * Characters grid component v2
 * Displays character cards in a responsive grid
 *
 * Layout: Uses auto-fill with minmax to ensure stable card sizes
 */
export function CharactersGridV2({ characters }: CharactersGridV2Props) {
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

  const handleCharacterClick = (id: string) => {
    navigate({
      to: "/assets/characters/{-$characterId}",
      params: { characterId: id },
    });
  };

  return (
    <>
      {/* Characters Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
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
