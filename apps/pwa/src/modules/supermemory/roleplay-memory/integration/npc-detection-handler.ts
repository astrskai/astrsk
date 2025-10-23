/**
 * NPC Detection Handler
 *
 * Handles NPC extraction results from the NPC extraction agent.
 * Creates CharacterCards for new NPCs and adds them to the session.
 */

import { useNpcStore } from "@/app/stores/npc-store";
import { createNpcCharacterCard } from "../core/npc-card-creation";
import { SessionService } from "@/app/services/session-service";
import { CardType } from "@/modules/card/domain";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

export interface ExtractedNpc {
  id: string; // NPC ID (e.g., "tanaka")
  name: string; // Full name (e.g., "Tanaka Sansei")
  description: string; // AI-generated description
}

/**
 * Handle NPC extraction result from NPC extraction agent
 * Called after NPC extraction in message pipeline
 *
 * For each extracted NPC:
 * 1. Check if NPC already exists in pool
 * 2. If new: Create CharacterCard and add to session
 * 3. If existing: Update names/aliases only
 */
export async function handleNpcDetection(
  extractedNpcs: ExtractedNpc[],
  sessionId: string,
): Promise<void> {
  for (const extracted of extractedNpcs) {
    const { id: npcId, name, description } = extracted;

    try {
      // 1. Check if NPC already exists in pool
      const existingNpc = useNpcStore.getState().getNpcById(npcId, sessionId);

      if (existingNpc) {
        // NPC already in pool - just update names/aliases if new ones found
        const newNames = [name].filter((n) => !existingNpc.names.includes(n));
        if (newNames.length > 0) {
          useNpcStore.getState().updateNpc(npcId, sessionId, {
            names: [...existingNpc.names, ...newNames],
            lastSeenAt: Date.now(),
          });
          logger.info("[NPC Detection] Updated existing NPC with new alias", {
            npcId,
            newNames,
          });
        } else {
          // Just update lastSeenAt
          useNpcStore.getState().updateNpc(npcId, sessionId, {
            lastSeenAt: Date.now(),
          });
        }

        // Skip card creation - already exists
        logger.debug("[NPC Detection] NPC already exists in pool", { npcId });
        continue;
      }

      // 2. NPC is NEW - add to pool
      const now = Date.now();
      useNpcStore.getState().addNpc({
        id: npcId,
        names: [name],
        sessionId,
        createdAt: now,
        lastSeenAt: now,
      });

      logger.info("[NPC Detection] Added new NPC to pool", { npcId, name });

      // 3. Create CharacterCard for this NPC
      const { cardId } = await createNpcCharacterCard({
        npcId,
        sessionId,
        description,
      });

      // Card is automatically added to session by createNpcCharacterCard
      logger.info("[NPC Detection] Created NPC card", {
        npcId,
        cardId,
        sessionId,
      });
    } catch (error) {
      logger.error("[NPC Detection] Error processing NPC", {
        npcId,
        error,
      });
      // Continue processing other NPCs even if one fails
    }
  }
}
