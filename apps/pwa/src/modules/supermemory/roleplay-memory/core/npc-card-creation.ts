/**
 * NPC Card Creation
 *
 * Creates real persistent CharacterCard entities in the database for NPCs.
 * Cards are created with AI-generated descriptions from the extraction agent.
 */

import { CardService } from "@/app/services/card-service";
import { useNpcStore } from "@/app/stores/npc-store";
import { CharacterCard } from "@/modules/card/domain/character-card";
import { logger } from "@/shared/utils/logger";

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
 */
export async function createNpcCharacterCard(
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

  // 4. Create REAL CharacterCard in database with AI-generated description
  const cardResult = CharacterCard.create({
    title: primaryName,
    name: primaryName,
    description: input.description, // AI-generated from extraction agent
    // Optional fields can be added later by user
    tags: [`npc`, `auto-generated`, `session:${input.sessionId}`],
  });

  if (cardResult.isFailure) {
    logger.error("[NPC Card] Failed to create card", {
      npcId: input.npcId,
      error: cardResult.getErrorValue(),
    });
    throw new Error(
      `Failed to create card: ${cardResult.getErrorValue()}`,
    );
  }

  const createdCard = cardResult.getValue();

  // 5. Save card to database
  const saveResult = await CardService.saveCard.execute(createdCard);
  if (saveResult.isFailure) {
    logger.error("[NPC Card] Failed to save card", {
      npcId: input.npcId,
      error: saveResult.getErrorValue(),
    });
    throw new Error(
      `Failed to save card: ${saveResult.getErrorValue()}`,
    );
  }

  const savedCard = saveResult.getValue();

  // 6. Store card ID in NPC pool
  useNpcStore.getState().updateNpc(input.npcId, input.sessionId, {
    characterCardId: savedCard.id.toString(),
  });

  // 7. Add card to session's participants
  try {
    const { SessionService } = await import("@/app/services/session-service");
    const { UniqueEntityID } = await import("@/shared/domain");
    const { CardType } = await import("@/modules/card/domain");

    const sessionResult = await SessionService.getSession.execute(
      new UniqueEntityID(input.sessionId),
    );

    if (sessionResult.isSuccess) {
      const session = sessionResult.getValue();
      const addResult = session.addCard(savedCard.id, CardType.Character);

      if (addResult.isSuccess) {
        // Log session state BEFORE save
        logger.info("[NPC Card] Session state before save", {
          npcId: input.npcId,
          sessionId: session.id.toString(),
          allCardsCount: session.allCards.length,
          allCards: session.allCards.map(c => ({ id: c.id?.toString(), type: c.type })),
          flowId: session.flowId?.toString(),
          turnIdsCount: session.turnIds?.length,
          userCharacterCardId: session.userCharacterCardId?.toString(),
        });

        // Save the session with the new card
        const saveSessionResult = await SessionService.saveSession.execute({ session });

        if (saveSessionResult.isSuccess) {
          const savedSession = saveSessionResult.getValue();
          logger.info("[NPC Card] Added card to session participants", {
            npcId: input.npcId,
            cardId: savedCard.id.toString(),
            sessionId: input.sessionId,
            savedSessionAllCardsCount: savedSession.allCards.length,
            savedSessionAllCards: savedSession.allCards.map(c => ({ id: c.id.toString(), type: c.type })),
          });
        } else {
          logger.error("[NPC Card] Failed to save session after adding card", {
            npcId: input.npcId,
            cardId: savedCard.id.toString(),
            sessionId: input.sessionId,
            error: saveSessionResult.getError(),
          });
        }
      } else {
        logger.warn("[NPC Card] Failed to add card to session", {
          npcId: input.npcId,
          error: addResult.getErrorValue(),
        });
      }
    } else {
      logger.warn("[NPC Card] Failed to get session", {
        sessionId: input.sessionId,
        error: sessionResult.getErrorValue(),
      });
    }
  } catch (error) {
    logger.error("[NPC Card] Failed to add card to session", {
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
