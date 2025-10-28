/**
 * NPC Plugin
 *
 * Automatically detects NPCs mentioned in conversations and creates character cards for them.
 */

import {
  IExtension,
  IExtensionClient,
  ExtensionMetadata,
  HookContext,
} from "../../pwa/src/modules/extensions/core/types";
// Note: Plugin should NOT import from pwa except for extension types
// All other access must go through client.api
import { logger } from "@astrsk/shared/logger";
import { executeNpcExtractionAgent } from "./npc-extraction-agent";
import { createNpcCharacterCard } from "./npc-card-creation";
import { useNpcStore } from "./npc-store";

/**
 * NPC Plugin Extension
 */
export class NpcPlugin implements IExtension {
  metadata: ExtensionMetadata = {
    id: "npc-detection",
    name: "NPC Detection & Character Card Creation",
    version: "1.0.0",
    description:
      "Automatically detects NPCs mentioned in conversations and creates character cards for them",
    author: "Astrsk",
  };

  private client: IExtensionClient | null = null;

  async onLoad(client: IExtensionClient): Promise<void> {
    // Remove existing listeners first to prevent memory leaks on hot reload
    if (this.client) {
      this.client.off("message:afterGenerate", this.handleMessageAfterGenerate);
      this.client.off("scenario:initialized", this.handleMessageAfterGenerate);
    }

    this.client = client;

    // Register hook for message generation
    client.on("message:afterGenerate", this.handleMessageAfterGenerate);

    // Register hook for scenario initialization
    client.on("scenario:initialized", this.handleMessageAfterGenerate);

    console.log("👤 [NPC Plugin] Loaded successfully - will auto-detect NPCs in conversations and scenarios");
    logger.info("[NPC Plugin] Loaded successfully");
  }

  async onUnload(): Promise<void> {
    if (this.client) {
      this.client.off("message:afterGenerate", this.handleMessageAfterGenerate);
      this.client.off("scenario:initialized", this.handleMessageAfterGenerate);
    }

    logger.info("[NPC Plugin] Unloaded successfully");
  }

  /**
   * Handle message:afterGenerate and scenario:initialized hooks
   * Triggers NPC extraction and card creation for both generated messages and scenario content
   */
  private handleMessageAfterGenerate = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { session, message } = context;

      if (!session || !message) {
        logger.warn("[NPC Plugin] Missing session or message in context");
        return;
      }

      const sessionId = session.id.toString();

      // Get main character names and descriptions from session
      // Need to load actual card data to get names and descriptions
      const mainCharacterCards = session.allCards.filter((c: any) => c.type === "character");
      const mainCharacterNames: string[] = [];
      const mainCharacterDescriptions: string[] = [];

      console.log("🔍 [NPC Plugin] Session cards:", {
        totalCards: session.allCards.length,
        allCards: session.allCards.map((c: any) => ({ id: c.id?.toString(), type: c.type })),
        characterCards: mainCharacterCards.length,
      });

      for (const cardRef of mainCharacterCards) {
        try {
          console.log("📖 [NPC Plugin] Loading character card:", cardRef.id.toString());
          const cardResult = await this.client!.api.getCard(cardRef.id);
          console.log("📖 [NPC Plugin] Card result:", {
            cardId: cardRef.id.toString(),
            isSuccess: cardResult.isSuccess,
            isFailure: cardResult.isFailure,
          });

          if (cardResult.isSuccess) {
            const card = cardResult.getValue();
            // CharacterCard stores properties in a props object
            const cardName = card.props?.name || card.name;
            const cardTitle = card.props?.title || card.title;
            const cardDescription = card.props?.description || card.description || "";

            console.log("📖 [NPC Plugin] Card data:", {
              cardId: cardRef.id.toString(),
              hasPropsName: !!(card.props?.name),
              propsName: card.props?.name,
              directName: card.name,
              finalName: cardName,
              hasDescription: !!cardDescription,
              descriptionLength: cardDescription.length,
              cardType: typeof card,
            });

            if (cardName) {
              mainCharacterNames.push(cardName);
              mainCharacterDescriptions.push(cardDescription);
              console.log("✅ [NPC Plugin] Added main character:", {
                name: cardName,
                hasDescription: !!cardDescription,
              });
            } else {
              console.warn("⚠️ [NPC Plugin] Card has no name property:", {
                cardId: cardRef.id.toString(),
                title: cardTitle,
                propsExists: !!card.props,
              });
            }
          } else {
            console.error("❌ [NPC Plugin] Failed to load card:", {
              cardId: cardRef.id.toString(),
              error: cardResult.getError(),
            });
          }
        } catch (error) {
          console.error("❌ [NPC Plugin] Exception loading card:", error);
          logger.warn("[NPC Plugin] Failed to load character card", {
            cardId: cardRef.id.toString(),
            error,
          });
        }
      }

      // Add main characters to NPC pool if not already there
      // This creates a unified character tracking system
      for (let i = 0; i < mainCharacterNames.length; i++) {
        const mainCharName = mainCharacterNames[i];
        const mainCharCardId = mainCharacterCards[i]?.id?.toString();

        // Generate ID from first word in lowercase (e.g., "Sakura Yui" → "sakura")
        const firstWord = mainCharName.split(/\s+/)[0];
        const mainCharId = firstWord.toLowerCase();

        // Check if already in pool
        const existingInPool = useNpcStore.getState().getNpcById(mainCharId, sessionId);

        if (!existingInPool && mainCharCardId) {
          // Add main character to pool
          useNpcStore.getState().addNpc({
            id: mainCharId,
            names: [mainCharName],
            sessionId,
            characterCardId: mainCharCardId, // Link to existing character card
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
          });

          console.log(`👥 [NPC Plugin] Added main character to tracking pool: ${mainCharName} (${mainCharId})`);
          logger.info("[NPC Plugin] Added main character to pool", {
            id: mainCharId,
            name: mainCharName,
            cardId: mainCharCardId,
          });
        }
      }

      // Refresh the existing NPC pool after adding main characters
      const updatedNpcPool = useNpcStore.getState().getNpcPool(sessionId);

      console.log("🔍 [NPC Plugin] Analyzing message for NPCs...", {
        sessionId,
        existingNpcs: updatedNpcPool.length,
        mainCharacters: mainCharacterNames,
      });
      logger.info("[NPC Plugin] Processing message for NPC detection", {
        sessionId,
        existingNpcCount: updatedNpcPool.length,
        mainCharacterCount: mainCharacterNames.length,
        messageLength: typeof message === 'string' ? message.length : 0,
      });

      // Execute NPC extraction using secure client API
      const extractionResult = await executeNpcExtractionAgent(this.client!, {
        sessionId,
        message: {
          role: "assistant",
          content: message,
        },
        existingNpcPool: updatedNpcPool, // Use updated pool that includes main characters
        mainCharacterNames,
        mainCharacterDescriptions, // Pass descriptions so AI can distinguish between main characters and NPCs with similar names
      });

      console.log(`✨ [NPC Plugin] Found ${extractionResult.npcs.length} NPC(s):`,
        extractionResult.npcs.map(n => `${n.name} (${n.id})`).join(", ")
      );
      logger.info("[NPC Plugin] Extraction completed", {
        sessionId,
        extractedNpcCount: extractionResult.npcs.length,
        npcs: extractionResult.npcs.map(n => ({ id: n.id, name: n.name })),
      });

      // Process extracted NPCs
      for (const npc of extractionResult.npcs) {
        // VALIDATION: Check if this is actually a main character (AI sometimes ignores instructions)
        const isMainCharacter = mainCharacterNames.some(mainName =>
          mainName.toLowerCase() === npc.name.toLowerCase() ||
          mainName.toLowerCase().includes(npc.name.toLowerCase()) ||
          npc.name.toLowerCase().includes(mainName.toLowerCase())
        );

        if (isMainCharacter) {
          console.warn(`⚠️ [NPC Plugin] Skipping "${npc.name}" - detected as main character`, {
            npcName: npc.name,
            mainCharacters: mainCharacterNames,
          });
          logger.warn("[NPC Plugin] Skipped main character detected as NPC", {
            npcId: npc.id,
            npcName: npc.name,
            mainCharacters: mainCharacterNames,
          });
          continue; // Skip this "NPC"
        }

        const existingNpc = useNpcStore
          .getState()
          .getNpcById(npc.id, sessionId);

        if (!existingNpc) {
          // New NPC - add to store
          useNpcStore.getState().addNpc({
            id: npc.id,
            names: [npc.name],
            sessionId,
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
          });

          logger.info("[NPC Plugin] New NPC detected", {
            npcId: npc.id,
            name: npc.name,
          });
        } else {
          // Existing NPC - check for new alias
          if (!existingNpc.names.includes(npc.name)) {
            useNpcStore.getState().updateNpc(npc.id, sessionId, {
              names: [...existingNpc.names, npc.name],
              lastSeenAt: Date.now(),
            });

            logger.info("[NPC Plugin] New alias detected for existing NPC", {
              npcId: npc.id,
              newAlias: npc.name,
              allAliases: [...existingNpc.names, npc.name],
            });
          }
        }

        // Create character card if not already created
        const npcData = useNpcStore.getState().getNpcById(npc.id, sessionId);
        if (npcData && !npcData.characterCardId) {
          try {
            await createNpcCharacterCard(this.client!, {
              npcId: npc.id,
              sessionId,
              description: npc.description,
            });

            console.log(`🎭 [NPC Plugin] Created character card for "${npc.name}"`);
            logger.info("[NPC Plugin] Character card created successfully", {
              npcId: npc.id,
              name: npc.name,
            });
          } catch (error) {
            logger.error("[NPC Plugin] Failed to create character card", {
              npcId: npc.id,
              name: npc.name,
              error,
            });
          }
        } else if (npcData?.characterCardId) {
          logger.debug("[NPC Plugin] NPC already has character card, skipping creation", {
            npcId: npc.id,
            cardId: npcData.characterCardId,
          });
        }
      }

      logger.info("[NPC Plugin] Processing complete", {
        sessionId,
        processedNpcCount: extractionResult.npcs.length,
      });
    } catch (error) {
      logger.error("[NPC Plugin] Error processing message", { error });
    }
  };
}
