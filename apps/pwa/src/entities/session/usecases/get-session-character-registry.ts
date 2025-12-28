import { Result } from "@/shared/core";
import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { sessions } from "@/db/schema/sessions";
import { characters } from "@/db/schema/characters";
import { eq, inArray } from "drizzle-orm";
import { formatFail, sanitizeToXmlTag } from "@/shared/lib";
import type { Transaction } from "@/db/transaction";
import { CardType } from "@/entities/card/domain/card";
import { queryClient } from "@/shared/api/query-client";
import { cardQueries } from "@/entities/card/api/query-factory";
import { CharacterCard } from "@/entities/card/domain/character-card";

/**
 * Get character registry for a session
 *
 * Builds a map of sanitized character names to display names
 * by fetching actual character cards from the session.
 *
 * Optimized with TanStack Query cache: checks cache first, falls back to DB.
 *
 * Example: { "alice-the-great": "Alice the Great", "bob": "Bob" }
 */
export async function getSessionCharacterRegistry(
  sessionId: string,
  tx?: Transaction
): Promise<Result<Record<string, string>>> {
  const db = tx ?? (await Drizzle.getInstance());
  try {
    // Get session's character card IDs
    const session = await db
      .select({ all_cards: sessions.all_cards })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .then(getOneOrThrow);

    const allCards = (session.all_cards as Array<{ id: string; type: string; enabled: boolean }>) ?? [];

    const characterCardIds = allCards
      .filter(card => card.type === CardType.Character && card.enabled)
      .map(card => card.id);

    if (characterCardIds.length === 0) {
      return Result.ok({});
    }

    // Build registry: { "sanitized-name": "Display Name" }
    const registry: Record<string, string> = {};
    const missingCardIds: string[] = [];

    // First, try to get character names from TanStack Query cache
    for (const cardId of characterCardIds) {
      const cachedCard = queryClient.getQueryData<CharacterCard>(
        cardQueries.detail(cardId).queryKey
      );

      if (cachedCard?.props?.name) {
        const sanitizedName = sanitizeToXmlTag(cachedCard.props.name);
        registry[sanitizedName] = cachedCard.props.name;
      } else {
        // Not in cache or missing name, need to query DB
        missingCardIds.push(cardId);
      }
    }

    // If all cards were in cache, return early
    if (missingCardIds.length === 0) {
      return Result.ok(registry);
    }

    // Fallback: Fetch missing cards from DB in batch
    const missingCharacterCards = await db
      .select({
        id: characters.id,
        name: characters.name,
      })
      .from(characters)
      .where(inArray(characters.id, missingCardIds));

    // Add missing cards to registry
    for (const card of missingCharacterCards) {
      const displayName = card.name;
      if (!displayName) continue;

      const sanitizedName = sanitizeToXmlTag(displayName);
      registry[sanitizedName] = displayName;
    }

    return Result.ok(registry);
  } catch (error) {
    return formatFail("Failed to get character registry", error);
  }
}
