/**
 * Character Mutations
 *
 * Character-specific mutation hooks for creating and updating CharacterCard.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardService } from "@/app/services/card-service";
import { AssetService } from "@/app/services/asset-service";
import { Lorebook, CardType, Entry } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { cardKeys } from "@/entities/card/api/query-factory";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export interface CreateCharacterData {
  name: string;
  description: string;
  exampleDialogue?: string;
  tags?: string[];
  creator?: string;
  cardSummary?: string;
  version?: string;
  conceptualOrigin?: string;
  imageFile?: File;
  lorebookEntries?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    keys: string[];
    recallRange: number;
    content: string;
  }>;
}

/**
 * Hook for creating a new character card
 */
export const useCreateCharacterCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCharacterData) => {
      // Step 1: Upload image if exists
      let uploadedAssetId: string | undefined;
      if (data.imageFile) {
        const assetResult = await AssetService.saveFileToAsset.execute({
          file: data.imageFile,
        });

        if (assetResult.isFailure) {
          throw new Error(`Failed to upload image: ${assetResult.getError()}`);
        }

        uploadedAssetId = assetResult.getValue().id.toString();
      }

      // Step 2: Create lorebook if entries exist
      let lorebook: Lorebook | undefined;
      if (data.lorebookEntries && data.lorebookEntries.length > 0) {
        const entries = data.lorebookEntries.map((entry) => {
          const entryResult = Entry.create({
            name: entry.name,
            content: entry.content,
            keys: entry.keys,
            enabled: entry.enabled,
            recallRange: entry.recallRange,
          });
          if (entryResult.isFailure) {
            throw new Error(`Failed to create lorebook entry: ${entryResult.getError()}`);
          }
          return entryResult.getValue();
        });

        const lorebookResult = Lorebook.create({ entries });
        if (lorebookResult.isFailure) {
          throw new Error(`Failed to create lorebook: ${lorebookResult.getError()}`);
        }
        lorebook = lorebookResult.getValue();
      }

      // Step 3: Create character card
      const cardResult = CharacterCard.create({
        title: data.name,
        name: data.name,
        description: data.description,
        exampleDialogue: data.exampleDialogue,
        iconAssetId: uploadedAssetId
          ? new UniqueEntityID(uploadedAssetId)
          : undefined,
        type: CardType.Character,
        tags: data.tags || [],
        creator: data.creator,
        cardSummary: data.cardSummary,
        version: data.version,
        conceptualOrigin: data.conceptualOrigin,
        lorebook,
      });

      if (cardResult.isFailure) {
        throw new Error(`Failed to create card: ${cardResult.getError()}`);
      }

      const card = cardResult.getValue();

      // Step 4: Save card to database
      const saveResult = await CardService.saveCard.execute(card);

      if (saveResult.isFailure) {
        throw new Error(`Failed to save card: ${saveResult.getError()}`);
      }

      return card;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
};

/**
 * Hook for updating entire character card (batch update)
 *
 * @remarks
 * Non-atomic batch update - individual field updates are executed in parallel.
 * Uses thunks to defer execution until all validation passes.
 */
export const useUpdateCharacterCard = (cardId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      name?: string;
      description?: string;
      exampleDialogue?: string;
      tags?: string[];
      creator?: string;
      cardSummary?: string;
      version?: string;
      conceptualOrigin?: string;
      imagePrompt?: string;
      iconAssetId?: string;
      imageFile?: File;
      lorebookEntries?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        keys: string[];
        recallRange: number;
        content: string;
      }>;
    }) => {
      // Step 1: Upload image if new file provided
      let uploadedAssetId: string | undefined;
      if (data.imageFile) {
        const assetResult = await AssetService.saveFileToAsset.execute({
          file: data.imageFile,
        });

        if (assetResult.isFailure) {
          throw new Error(`Failed to upload image: ${assetResult.getError()}`);
        }

        uploadedAssetId = assetResult.getValue().id.toString();
      }

      // Step 2: Use thunks to defer execution until all validation passes
      const operations: Array<() => Promise<unknown>> = [];

      if (data.title !== undefined) {
        const title = data.title;
        operations.push(() =>
          CardService.updateCardTitle.execute({ cardId, title }),
        );
      }
      if (data.name !== undefined) {
        const name = data.name;
        operations.push(() =>
          CardService.updateCharacterName.execute({ cardId, name }),
        );
      }
      if (data.description !== undefined) {
        const description = data.description;
        operations.push(() =>
          CardService.updateCharacterDescription.execute({
            cardId,
            description,
          }),
        );
      }
      if (data.exampleDialogue !== undefined) {
        const exampleDialogue = data.exampleDialogue;
        operations.push(() =>
          CardService.updateCharacterExampleDialogue.execute({
            cardId,
            exampleDialogue,
          }),
        );
      }
      if (data.tags !== undefined) {
        const tags = data.tags;
        operations.push(() =>
          CardService.updateCardTags.execute({ cardId, tags }),
        );
      }
      if (data.creator !== undefined) {
        const creator = data.creator;
        operations.push(() =>
          CardService.updateCardCreator.execute({ cardId, creator }),
        );
      }
      if (data.cardSummary !== undefined) {
        const cardSummary = data.cardSummary;
        operations.push(() =>
          CardService.updateCardSummary.execute({ cardId, cardSummary }),
        );
      }
      if (data.version !== undefined) {
        const version = data.version;
        operations.push(() =>
          CardService.updateCardVersion.execute({ cardId, version }),
        );
      }
      if (data.conceptualOrigin !== undefined) {
        const conceptualOrigin = data.conceptualOrigin;
        operations.push(() =>
          CardService.updateCardConceptualOrigin.execute({
            cardId,
            conceptualOrigin,
          }),
        );
      }
      if (data.imagePrompt !== undefined) {
        const imagePrompt = data.imagePrompt;
        operations.push(() =>
          CardService.updateCardImagePrompt.execute({ cardId, imagePrompt }),
        );
      }
      // Use uploaded asset ID if new image was uploaded, otherwise use provided iconAssetId
      const finalIconAssetId = uploadedAssetId ?? data.iconAssetId;
      if (finalIconAssetId !== undefined) {
        operations.push(() =>
          CardService.updateCardIconAsset.execute({
            cardId,
            iconAssetId: finalIconAssetId ?? null,
          }),
        );
      }
      if (data.lorebookEntries !== undefined) {
        const lorebookJSON = {
          entries: data.lorebookEntries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            enabled: entry.enabled,
            keys: entry.keys,
            recallRange: entry.recallRange,
            content: entry.content,
          })),
        };
        const lorebookResult = Lorebook.fromJSON(lorebookJSON);
        if (!lorebookResult.isSuccess) {
          throw new Error(
            `Invalid lorebook data: ${lorebookResult.getError()}`,
          );
        }
        operations.push(() =>
          CardService.updateCardLorebook.execute({
            cardId,
            lorebook: lorebookResult.getValue(),
          }),
        );
      }

      // Execute all operations only after validation passes
      const results = await Promise.all(operations.map((op) => op()));

      const failures = results.filter(
        (
          r,
        ): r is {
          isFailure: boolean;
          getError: () => string;
        } => {
          if (r === null || typeof r !== "object") return false;
          if (!("isFailure" in r)) return false;
          const result = r as { isFailure: unknown };
          return result.isFailure === true;
        },
      );

      if (failures.length > 0) {
        throw new Error(
          `Failed to update card: ${failures.map((f) => f.getError()).join(", ")}`,
        );
      }

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lorebook(cardId) });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
