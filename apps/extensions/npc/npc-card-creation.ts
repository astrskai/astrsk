/**
 * NPC Card Creation
 *
 * Creates real persistent CharacterCard entities in the database for NPCs.
 * Cards are created with AI-generated descriptions from the extraction agent.
 */

import { useNpcStore } from "./npc-store";
import { logger } from "@astrsk/shared/logger";
import type { IExtensionClient } from "../../pwa/src/modules/extensions/core/types";

export interface NpcCardCreationInput {
  npcId: string;
  sessionId: string;
  description: string; // From NPC extraction agent
}

export interface NpcCardCreationResult {
  cardId: string; // UUID of created card
  wasCreated: boolean; // true if new card, false if already existed
}

/**
 * Creates a real persistent CharacterCard for an NPC
 * - Receives AI-generated description from NPC extraction agent
 * - Description includes relationships and context from world memory
 * - Description set once, all future info tracked in memories
 * - Idempotent: Returns existing card if already created
 * @param client - Extension client for secure API access
 * @param input - Card creation parameters
 */
export async function createNpcCharacterCard(
  client: IExtensionClient,
  input: NpcCardCreationInput,
): Promise<NpcCardCreationResult> {
  // 1. Get NPC data from store
  const npc = useNpcStore.getState().getNpcById(input.npcId, input.sessionId);
  if (!npc) {
    throw new Error(`NPC not found: ${input.npcId}`);
  }

  // 2. Check if card already exists (idempotent)
  if (npc.characterCardId) {
    logger.info("[NPC Card] Card already exists", {
      npcId: input.npcId,
      cardId: npc.characterCardId,
    });
    return {
      cardId: npc.characterCardId,
      wasCreated: false,
    };
  }

  // 3. Determine primary name
  const primaryName = npc.names[0] || input.npcId;

  // 4. Create REAL CharacterCard in database using secure client API
  // AI-generated description from extraction agent
  const cardResult = await client.api.createCharacterCard({
    title: primaryName,
    name: primaryName,
    description: input.description,
    tags: [`npc`, `auto-generated`, `session:${input.sessionId}`],
  });

  if (cardResult.isFailure) {
    logger.error("[NPC Card] Failed to create card", {
      npcId: input.npcId,
      error: cardResult.getError(),
    });
    throw new Error(
      `Failed to create card: ${cardResult.getError()}`,
    );
  }

  const savedCard = cardResult.getValue();

  // 5. Store card ID in NPC pool
  useNpcStore.getState().updateNpc(input.npcId, input.sessionId, {
    characterCardId: savedCard.id.toString(),
  });

  // 6. Add card to session's participants using secure client API
  try {
    const addToSessionResult = await client.api.addCardToSession(
      input.sessionId,
      savedCard.id.toString(),
      "character"
    );

    if (addToSessionResult.isSuccess) {
      const updatedSession = addToSessionResult.getValue();
      logger.info("[NPC Card] Added card to session participants", {
        npcId: input.npcId,
        cardId: savedCard.id.toString(),
        sessionId: input.sessionId,
        allCardsCount: updatedSession.allCards.length,
      });
    } else {
      logger.error("[NPC Card] Failed to add card to session", {
        npcId: input.npcId,
        cardId: savedCard.id.toString(),
        sessionId: input.sessionId,
        error: addToSessionResult.getError(),
      });
    }
  } catch (error) {
    logger.error("[NPC Card] Error adding card to session", {
      npcId: input.npcId,
      error,
    });
    // Don't throw - card is created successfully, just not added to session
  }

  logger.info("[NPC Card] Created card", {
    npcId: input.npcId,
    cardId: savedCard.id.toString(),
    name: primaryName,
  });

  return {
    cardId: savedCard.id.toString(),
    wasCreated: true,
  };
}
