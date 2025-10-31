/**
 * Lorebook Extension
 *
 * Automatically detects lorebook-worthy information in conversations
 * and suggests adding entries to character lorebooks.
 *
 * Runs async alongside NPC extraction extension.
 */

import {
  IExtension,
  IExtensionClient,
  ExtensionMetadata,
  HookContext,
} from "../../pwa/src/modules/extensions/core/types";
import { logger } from "@astrsk/shared/logger";
import { executeLorebookExtractionAgent } from "./lorebook-extraction-agent";
import { useLorebookStore, LorebookEntryData } from "./lorebook-store";

/**
 * Helper: Generate keyword triggers from content
 * Extracts important words that should trigger this lorebook entry
 */
function generateKeysFromContent(content: string): string[] {
  // Remove the "character_name:" prefix
  const withoutPrefix = content.replace(/^[^:]+:\s*/, "").toLowerCase();

  // Common words to ignore
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "can", "may", "might", "must", "his", "her",
    "their", "its", "this", "that", "these", "those", "i", "you", "he", "she",
    "it", "we", "they", "what", "which", "who", "when", "where", "why", "how"
  ]);

  // Extract words (3+ characters, not stop words)
  const words = withoutPrefix
    .split(/\W+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));

  // Get unique words, limit to 5 most relevant
  const uniqueWords = [...new Set(words)].slice(0, 5);

  return uniqueWords;
}

/**
 * Lorebook Extension
 */
export class LorebookExtension implements IExtension {
  metadata: ExtensionMetadata = {
    id: "lorebook-extraction",
    name: "Lorebook Auto-Extraction",
    version: "1.0.0",
    description:
      "Automatically detects lorebook-worthy information and suggests adding entries to character lorebooks",
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

    // Register hook for message generation (runs async with NPC extraction)
    client.on("message:afterGenerate", this.handleMessageAfterGenerate);

    // Register hook for scenario initialization
    client.on("scenario:initialized", this.handleMessageAfterGenerate);

    console.log("📚 [Lorebook Extension] Loaded successfully - will auto-detect lorebook-worthy information");
    logger.info("[Lorebook Extension] Loaded successfully");
  }

  async onUnload(): Promise<void> {
    if (this.client) {
      this.client.off("message:afterGenerate", this.handleMessageAfterGenerate);
      this.client.off("scenario:initialized", this.handleMessageAfterGenerate);
    }

    logger.info("[Lorebook Extension] Unloaded successfully");
  }

  /**
   * Handle message:afterGenerate and scenario:initialized hooks
   * Triggers lorebook extraction for both generated messages and scenario content
   */
  private handleMessageAfterGenerate = async (
    context: HookContext,
  ): Promise<void> => {
    const { blockUIForTurn, unblockUI } = await import("../../pwa/src/modules/extensions/bootstrap");

    // Set 10-second safety timeout to force unblock if something goes wrong
    const messageId = context.messageId?.toString();
    const safetyTimeout = setTimeout(() => {
      console.warn(`⏱️ [Lorebook Extension] Safety timeout reached${messageId ? ` for message ${messageId}` : ''}, force unblocking UI`);
      unblockUI();
    }, 10000);

    try {
      const { session, message } = context;

      if (!session || !message) {
        logger.warn("[Lorebook Extension] Missing session or message in context");
        return;
      }

      const sessionId = session.id.toString();

      // Block UI while processing lorebook entries
      if (messageId) {
        blockUIForTurn(messageId, "Lorebook extraction", "processing");
        console.log(`🔒 [Lorebook Extension] Blocked UI for message ${messageId}`);
      }

      // Get all character cards from session
      const characterCards = session.allCards.filter((c: any) => c.type === "character");

      console.log("📚 [Lorebook Extension] Session characters:", {
        sessionId,
        characterCount: characterCards.length,
      });

      // Build character lorebook context
      const charactersWithLorebooks = [];

      for (const cardRef of characterCards) {
        try {
          const cardResult = await this.client!.api.getCard(cardRef.id);

          if (cardResult.isSuccess) {
            const card = cardResult.getValue();
            const characterId = cardRef.id.toString();
            const characterName = card.props?.name || card.name;

            // Get existing lorebook entries from store
            const existingEntries = useLorebookStore
              .getState()
              .getEntriesByCharacter(characterId, sessionId);

            // Get rejected lorebook entries from store
            const rejectedEntries = useLorebookStore
              .getState()
              .getRejectedEntriesByCharacter(characterId, sessionId);

            console.log(`📚 [Lorebook Extension] ${characterName}:`, {
              characterId,
              existingEntries: existingEntries.length,
              rejectedEntries: rejectedEntries.length,
            });

            charactersWithLorebooks.push({
              characterId,
              characterName,
              existingEntries,
              rejectedEntries,
            });
          }
        } catch (error) {
          logger.warn("[Lorebook Extension] Failed to load character card", {
            cardId: cardRef.id.toString(),
            error,
          });
        }
      }

      // Execute lorebook extraction using secure client API
      console.log("📚 [Lorebook Extension] Analyzing message for lorebook-worthy information...");
      logger.info("[Lorebook Extension] Processing message for lorebook extraction", {
        sessionId,
        characterCount: charactersWithLorebooks.length,
        messageLength: typeof message === "string" ? message.length : 0,
      });

      const extractionResult = await executeLorebookExtractionAgent(this.client!, {
        sessionId,
        message: {
          role: "assistant",
          content: message,
        },
        charactersWithLorebooks,
        // TODO: Pass world memory context when available
        worldMemoryContext: undefined,
      });

      console.log(
        `✨ [Lorebook Extension] Found ${extractionResult.entries.length} potential lorebook entries:`,
        extractionResult.entries.map((e) => `${e.characterName}: ${e.content.substring(0, 50)}...`).join(", ")
      );
      logger.info("[Lorebook Extension] Extraction completed", {
        sessionId,
        extractedEntriesCount: extractionResult.entries.length,
        entries: extractionResult.entries.map((e) => ({
          characterName: e.characterName,
          entryTitle: e.entryTitle,
          content: e.content.substring(0, 100),
        })),
      });

      // Process extracted lorebook entries
      for (const entry of extractionResult.entries) {
        try {
          // Find the character this entry is for by loose name matching
          const characterData = charactersWithLorebooks.find(
            (c) => {
              const charNameLower = c.characterName.toLowerCase().trim();
              const entryNameLower = entry.characterName.toLowerCase().trim();

              // Loose matching: exact match or substring match
              return charNameLower === entryNameLower ||
                     charNameLower.includes(entryNameLower) ||
                     entryNameLower.includes(charNameLower);
            }
          );

          if (!characterData) {
            console.warn(`⚠️ [Lorebook Extension] Character not found for entry: ${entry.characterName}`);
            continue;
          }

          // Use LLM-generated entry title
          const entryName = entry.entryTitle;

          // Auto-generate keys from content
          const keys = generateKeysFromContent(entry.content);

          console.log(`📚 [Lorebook Extension] Using LLM-generated title: "${entryName}", keys:`, keys);

          // Check if very similar entry already exists
          const isDuplicate = characterData.existingEntries.some(
            (existing) =>
              existing.name.toLowerCase() === entryName.toLowerCase() ||
              existing.content.toLowerCase().includes(entry.content.toLowerCase()) ||
              entry.content.toLowerCase().includes(existing.content.toLowerCase())
          );

          if (isDuplicate) {
            console.log(`⏭️ [Lorebook Extension] Skipping duplicate entry: ${entryName}`);
            continue;
          }

          // Check if very similar entry was rejected
          const wasRejected = characterData.rejectedEntries.some(
            (rejected) =>
              rejected.name.toLowerCase() === entryName.toLowerCase() ||
              rejected.content.toLowerCase().includes(entry.content.toLowerCase()) ||
              entry.content.toLowerCase().includes(rejected.content.toLowerCase())
          );

          if (wasRejected) {
            console.log(`⏭️ [Lorebook Extension] Skipping rejected entry: ${entryName}`);
            continue;
          }

          // Clear safety timeout before showing dialog - user needs time to respond
          clearTimeout(safetyTimeout);

          // Show dialog to user for confirmation
          console.log(`📋 [Lorebook Extension] Showing confirmation dialog for: ${entryName}`);

          const userResponse = await this.client!.api.ui.showDialog({
            title: `Add to ${characterData.characterName}'s Lorebook?`,
            description: `Review and add this information to the character's lorebook.`,
            content: {
              type: "lorebook-entry",
              data: {
                entryName,
                content: entry.content,
                keys,
              },
            },
            buttons: [
              { label: "Decide Later", variant: "outline", value: "later" },
              { label: "Skip", variant: "ghost", value: "skip" },
              { label: "Add to Lorebook", variant: "default", value: "add" },
            ],
          });

          console.log(`👤 [Lorebook Extension] User response: ${userResponse}`);

          if (userResponse === "add") {
            // User confirmed - add to character card's lorebook
            try {
              // Use the secure API to add lorebook entry
              const addResult = await this.client!.api.addLorebookEntryToCard({
                cardId: characterData.characterId,
                name: entryName,
                keys,
                content: entry.content,
                enabled: true,
                recallRange: 2,
              });

              if (addResult.isFailure) {
                throw new Error(`Failed to add lorebook entry: ${addResult.getError()}`);
              }

              const entryId = (addResult as any).entryId;

              // Also track in extension store for quick lookups
              const lorebookEntry: LorebookEntryData = {
                id: entryId,
                sessionId,
                characterId: characterData.characterId,
                characterName: characterData.characterName,
                name: entryName,
                keys,
                content: entry.content,
                createdAt: Date.now(),
                lastUpdatedAt: Date.now(),
              };

              useLorebookStore.getState().addEntry(lorebookEntry);

              console.log(`✅ [Lorebook Extension] Added to ${characterData.characterName}'s lorebook: ${entryName}`);
              logger.info("[Lorebook Extension] Entry added to character card lorebook", {
                entryId,
                characterId: characterData.characterId,
                characterName: characterData.characterName,
                entryName,
                keys,
              });
            } catch (error) {
              logger.error("[Lorebook Extension] Failed to add entry to character card", {
                characterId: characterData.characterId,
                characterName: characterData.characterName,
                entryName,
                error,
              });
              console.error(`❌ [Lorebook Extension] Failed to add entry:`, error);
            }
          } else if (userResponse === "skip") {
            // User rejected - add to rejected list
            useLorebookStore.getState().addRejectedEntry({
              id: `rejected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sessionId,
              characterId: characterData.characterId,
              name: entryName,
              content: entry.content,
              rejectedAt: Date.now(),
              reason: "User declined",
            });

            console.log(`❌ [Lorebook Extension] Entry rejected: ${entryName}`);
            logger.info("[Lorebook Extension] Entry rejected by user", {
              characterName: characterData.characterName,
              entryName,
            });
          } else {
            // User chose "later" or closed dialog - do nothing
            console.log(`⏸️ [Lorebook Extension] Entry deferred: ${entryName}`);
          }
        } catch (error) {
          logger.error("[Lorebook Extension] Failed to process extracted entry", {
            characterName: entry.characterName,
            entryTitle: entry.entryTitle,
            content: entry.content.substring(0, 100),
            error,
          });
        }
      }

      logger.info("[Lorebook Extension] Processing complete", {
        sessionId,
        processedEntriesCount: extractionResult.entries.length,
      });
    } catch (error) {
      logger.error("[Lorebook Extension] Error processing message", { error });
    } finally {
      // Clear safety timeout
      clearTimeout(safetyTimeout);

      // Unblock UI
      unblockUI();
      console.log(`🔓 [Lorebook Extension] Unblocked UI`);
    }
  };
}
