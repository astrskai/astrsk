/**
 * Scenario (PlotCard) Mutations
 *
 * Scenario-specific mutation hooks for updating PlotCard.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardService } from "@/app/services/card-service";
import { Lorebook } from "@/entities/card/domain";
import { cardKeys } from "@/entities/card/api/query-factory";

/**
 * Hook for updating entire plot card (batch update)
 *
 * @remarks
 * Non-atomic batch update - individual field updates are executed in parallel.
 * Uses thunks to defer execution until all validation passes.
 */
export const useUpdatePlotCard = (cardId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      description?: string;
      scenarios?: Array<{ name: string; description: string }>;
      tags?: string[];
      creator?: string;
      cardSummary?: string;
      version?: string;
      conceptualOrigin?: string;
      imagePrompt?: string;
      iconAssetId?: string;
      lorebookEntries?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        keys: string[];
        recallRange: number;
        content: string;
      }>;
    }) => {
      // Use thunks to defer execution until all validation passes
      const operations: Array<() => Promise<unknown>> = [];

      if (data.title !== undefined) {
        const title = data.title;
        operations.push(() =>
          CardService.updateCardTitle.execute({ cardId, title }),
        );
      }
      if (data.description !== undefined) {
        const description = data.description;
        operations.push(() =>
          CardService.updatePlotDescription.execute({ cardId, description }),
        );
      }
      if (data.scenarios !== undefined) {
        const scenarios = data.scenarios;
        operations.push(() =>
          CardService.updateCardScenarios.execute({ cardId, scenarios }),
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
      if (data.iconAssetId !== undefined) {
        operations.push(() =>
          CardService.updateCardIconAsset.execute({
            cardId,
            iconAssetId: data.iconAssetId || null,
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
      queryClient.invalidateQueries({ queryKey: cardKeys.scenarios(cardId) });
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
