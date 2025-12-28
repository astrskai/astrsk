import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";
import { Transaction } from "@/db/transaction";
import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { sessions } from "@/db/schema/sessions";
import { characters } from "@/db/schema/characters";
import { eq, inArray } from "drizzle-orm";

/**
 * Build character registry from session's character cards
 *
 * Creates a mapping of normalized character names to display names:
 * { "yui": "Yui", "ren": "Ren" }
 *
 * This is used for:
 * 1. Filtering compressed anchors by access control
 * 2. Informing compression/retrieval agents about character names
 *
 * The registry is saved to session.config.characterRegistry
 */
export async function buildSessionCharacterRegistry(
  sessionId: UniqueEntityID,
  tx?: Transaction
): Promise<Result<Record<string, string>>> {
  const db = tx ?? (await Drizzle.getInstance());

  try {
    // Get session
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId.toString()))
      .then(getOneOrThrow);

    // Extract character card IDs from allCards
    const allCards = session.all_cards as Array<{
      id: string;
      type: string;
      enabled: boolean;
    }>;

    const characterCardIds = allCards
      .filter(card => card.type === 'character')
      .map(card => card.id);

    if (characterCardIds.length === 0) {
      // No characters, return empty registry
      return Result.ok({});
    }

    // Fetch character cards
    const characterCards = await db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(inArray(characters.id, characterCardIds));

    // Build registry: normalized name → display name
    const registry: Record<string, string> = {};
    for (const card of characterCards) {
      const normalizedName = card.name.toLowerCase().trim();
      registry[normalizedName] = card.name;
    }

    // Update session config with new registry
    await db
      .update(sessions)
      .set({
        config: {
          ...session.config,
          characterRegistry: registry,
        },
        updated_at: new Date(),
      })
      .where(eq(sessions.id, sessionId.toString()));

    return Result.ok(registry);
  } catch (error) {
    return formatFail("Failed to build character registry", error);
  }
}
