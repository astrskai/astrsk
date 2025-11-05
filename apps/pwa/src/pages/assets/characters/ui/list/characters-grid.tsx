import { useState, useCallback } from "react";
import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { CharacterCard } from "@/entities/card/domain/character-card";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import CharacterPreview from "@/features/character/ui/character-preview";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { downloadFile } from "@/shared/lib";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { cardQueries } from "@/entities/card/api/card-queries";
import { TableName } from "@/db/schema/table-name";
import type { CharacterAction } from "@/features/character/model/character-actions";

interface CharactersGridProps {
  characters: CharacterCard[];
  showNewCharacterCard: boolean;
}

/**
 * Characters grid component
 * Displays character cards in a responsive grid with optional New Character Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column per row
 * - Desktop: New card inside grid + 2 columns per row
 */
export function CharactersGrid({
  characters,
  showNewCharacterCard,
}: CharactersGridProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    cardId: string | null;
    title: string;
    usedSessionsCount: number;
  }>({
    isOpen: false,
    cardId: null,
    title: "",
    usedSessionsCount: 0,
  });

  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: {
      exporting?: boolean;
      copying?: boolean;
      deleting?: boolean;
    };
  }>({});

  const handleCharacterClick = (characterId: string) => {
    navigate({
      to: "/assets/characters/$characterId",
      params: { characterId },
    });
  };

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/characters/new" });
  };

  const handleExport = useCallback(
    (cardId: string, title: string) => async (e: React.MouseEvent) => {
      e.stopPropagation();

      setLoadingStates((prev) => ({
        ...prev,
        [cardId]: { ...prev[cardId], exporting: true },
      }));

      try {
        const result = await CardService.exportCardToFile.execute({
          cardId: new UniqueEntityID(cardId),
          options: { format: "png" },
        });

        if (result.isFailure) {
          toast.error("Failed to export", { description: result.getError() });
          return;
        }

        downloadFile(result.getValue());
        toast.success("Successfully exported!", {
          description: `"${title}" exported`,
        });
      } catch (error) {
        toast.error("Failed to export", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [cardId]: { ...prev[cardId], exporting: false },
        }));
      }
    },
    [],
  );

  const handleCopy = useCallback(
    (cardId: string, title: string) => async (e: React.MouseEvent) => {
      e.stopPropagation();

      setLoadingStates((prev) => ({
        ...prev,
        [cardId]: { ...prev[cardId], copying: true },
      }));

      try {
        const result = await CardService.cloneCard.execute({
          cardId: new UniqueEntityID(cardId),
        });

        if (result.isFailure) {
          toast.error("Failed to copy card", {
            description: result.getError(),
          });
          return;
        }

        toast.success("Card copied", {
          description: `Created copy of "${title}"`,
        });
        await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });
      } catch (error) {
        toast.error("Failed to copy card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [cardId]: { ...prev[cardId], copying: false },
        }));
      }
    },
    [queryClient],
  );

  const handleDeleteClick = useCallback(
    (cardId: string, title: string) => async (e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        const result = await SessionService.listSessionByCard.execute({
          cardId: new UniqueEntityID(cardId),
        });
        const usedSessionsCount = result.isSuccess
          ? result.getValue().length
          : 0;

        setDeleteDialogState({
          isOpen: true,
          cardId,
          title,
          usedSessionsCount,
        });
      } catch (error) {
        console.error("Failed to check used sessions:", error);
        setDeleteDialogState({
          isOpen: true,
          cardId,
          title,
          usedSessionsCount: 0,
        });
      }
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    const { cardId, title, usedSessionsCount } = deleteDialogState;
    if (!cardId) return;

    setLoadingStates((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], deleting: true },
    }));

    try {
      const result = await CardService.deleteCard.execute(
        new UniqueEntityID(cardId),
      );

      if (result.isFailure) {
        toast.error("Failed to delete card", {
          description: result.getError(),
        });
        return;
      }

      toast.success("Card deleted", { description: title });
      await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });

      if (usedSessionsCount > 0) {
        await queryClient.invalidateQueries({
          queryKey: [TableName.Sessions],
        });
      }

      setDeleteDialogState({
        isOpen: false,
        cardId: null,
        title: "",
        usedSessionsCount: 0,
      });
    } catch (error) {
      toast.error("Failed to delete card", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [cardId]: { ...prev[cardId], deleting: false },
      }));
    }
  }, [deleteDialogState, queryClient]);

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewCharacterCard && (
          <Button
            onClick={handleCreateCharacter}
            icon={<Plus size={16} />}
            className="w-full md:hidden"
          >
            Create new character
          </Button>
        )}

        {/* Characters Grid */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 justify-center gap-4 md:grid-cols-2">
          {/* Desktop: New Character Card (inside grid) */}
          {showNewCharacterCard && (
            <CreateItemCard
              title="New Character"
              description="Create a new character"
              onClick={handleCreateCharacter}
              className="hidden aspect-[3/1] md:flex"
            />
          )}

          {/* Existing Characters */}
          {characters.map((character) => {
            const cardId = character.id.toString();
            const loading = loadingStates[cardId] || {};

            const actions: CharacterAction[] = [
              {
                icon: Upload,
                label: `Export ${character.props.title}`,
                onClick: handleExport(cardId, character.props.title),
                disabled: loading.exporting,
                loading: loading.exporting,
              },
              {
                icon: Copy,
                label: `Copy ${character.props.title}`,
                onClick: handleCopy(cardId, character.props.title),
                disabled: loading.copying,
                loading: loading.copying,
              },
              {
                icon: Trash2,
                label: `Delete ${character.props.title}`,
                onClick: handleDeleteClick(cardId, character.props.title),
                disabled: loading.deleting,
                loading: loading.deleting,
              },
            ];

            return (
              <CharacterPreview
                key={cardId}
                cardId={character.id}
                iconAssetId={character.props.iconAssetId}
                title={character.props.title}
                summary={character.props.cardSummary}
                tags={character.props.tags || []}
                tokenCount={character.props.tokenCount}
                onClick={() => handleCharacterClick(cardId)}
                actions={actions}
                isShowActions={true}
              />
            );
          })}
        </div>
      </div>

      <ActionConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={() =>
          setDeleteDialogState((prev) => ({ ...prev, isOpen: false }))
        }
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
