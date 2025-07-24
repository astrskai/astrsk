import { QueryClient } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { cardQueries } from "@/app/queries/card-queries";

/**
 * Invalidates all queries for a specific card
 * This ensures that all components displaying this card's data are refreshed
 * when any field of the card is updated (title, tags, image, name, etc.)
 */
export async function invalidateSingleCardQueries(
  queryClient: QueryClient,
  cardId: UniqueEntityID | string,
) {
  const cardIdString = typeof cardId === "string" ? cardId : cardId.toString();

  // Invalidate all possible query keys that might be used for this specific card
  const invalidations = [
    // cardQueries.detail query key format: ["cards", "detail", cardId]
    queryClient.invalidateQueries({
      queryKey: cardQueries.detail(new UniqueEntityID(cardIdString)).queryKey,
    }),

    // useCard hook query key format: ["Cards", cardId]
    queryClient.invalidateQueries({
      queryKey: ["Cards", cardIdString],
    }),

    // Legacy query keys that might still be in use
    queryClient.invalidateQueries({
      queryKey: ["cards", cardIdString],
    }),
    queryClient.invalidateQueries({
      queryKey: ["card", cardIdString],
    }),

    // Invalidate list queries to update card lists (which show card titles/tags)
    queryClient.invalidateQueries({
      queryKey: cardQueries.lists(),
    }),
  ];

  // Wait for all invalidations to complete
  await Promise.all(invalidations);
}
