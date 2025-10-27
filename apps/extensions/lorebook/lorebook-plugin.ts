/**
 * Lorebook Plugin
 *
 * Automatically detects lorebook-worthy information in conversations
 * and suggests adding entries to character lorebooks.
 *
 * Runs async alongside NPC extraction plugin.
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
 * Helper: Generate entry name from content
 * Extracts a descriptive name from the lorebook content
 */
function generateEntryName(content: string, characterName: string): string {
  // Remove the "character_name:" prefix
  const withoutPrefix = content.replace(/^[^:]+:\s*/, "");

  // Take first 50 characters and capitalize first letter
  let name = withoutPrefix.substring(0, 50).trim();
  if (name.length === 50) {
    // Find last complete word
    const lastSpace = name.lastIndexOf(" ");
    if (lastSpace > 0) {
      name = name.substring(0, lastSpace);
    }
  }

  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);

  // Add character name prefix if not already there
  if (!name.toLowerCase().includes(characterName.toLowerCase())) {
    name = `${characterName} - ${name}`;
  }

  return name;
}

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
 * Lorebook Plugin Extension
 */
export class LorebookPlugin implements IExtension {
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
    this.client = client;

    // Register hook for message generation (runs async with NPC extraction)
    client.on("message:afterGenerate", this.handleMessageAfterGenerate);

    // Register hook for scenario initialization
    client.on("scenario:initialized", this.handleMessageAfterGenerate);

    console.log("📚 [Lorebook Plugin] Loaded successfully - will auto-detect lorebook-worthy information");
    logger.info("[Lorebook Plugin] Loaded successfully");
  }

  async onUnload(): Promise<void> {
    if (this.client) {
      this.client.off("message:afterGenerate", this.handleMessageAfterGenerate);
      this.client.off("scenario:initialized", this.handleMessageAfterGenerate);
    }

    logger.info("[Lorebook Plugin] Unloaded successfully");
  }

  /**
   * Handle message:afterGenerate and scenario:initialized hooks
   * Triggers lorebook extraction for both generated messages and scenario content
   */
  private handleMessageAfterGenerate = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { session, message } = context;

      if (!session || !message) {
        logger.warn("[Lorebook Plugin] Missing session or message in context");
        return;
      }

      const sessionId = session.id.toString();

      // Get all character cards from session
      const characterCards = session.allCards.filter((c: any) => c.type === "character");

      console.log("📚 [Lorebook Plugin] Session characters:", {
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

            console.log(`📚 [Lorebook Plugin] ${characterName}:`, {
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
          logger.warn("[Lorebook Plugin] Failed to load character card", {
            cardId: cardRef.id.toString(),
            error,
          });
        }
      }

      // Execute lorebook extraction using secure client API
      console.log("📚 [Lorebook Plugin] Analyzing message for lorebook-worthy information...");
      logger.info("[Lorebook Plugin] Processing message for lorebook extraction", {
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
        `✨ [Lorebook Plugin] Found ${extractionResult.entries.length} potential lorebook entries:`,
        extractionResult.entries.map((e) => `${e.content.substring(0, 50)}... (${e.name})`).join(", ")
      );
      logger.info("[Lorebook Plugin] Extraction completed", {
        sessionId,
        extractedEntriesCount: extractionResult.entries.length,
        entries: extractionResult.entries.map((e) => ({
          name: e.name,
          content: e.content.substring(0, 100),
        })),
      });

      // Process extracted lorebook entries
      for (const entry of extractionResult.entries) {
        try {
          // Find the character this entry is for by matching name
          const characterData = charactersWithLorebooks.find(
            (c) => c.characterName.toLowerCase() === entry.name.toLowerCase() ||
                   c.characterName.toLowerCase().includes(entry.name.toLowerCase()) ||
                   entry.name.toLowerCase().includes(c.characterName.toLowerCase())
          );

          if (!characterData) {
            console.warn(`⚠️ [Lorebook Plugin] Character not found for entry: ${entry.name}`);
            continue;
          }

          // Auto-generate entry name from content
          const entryName = generateEntryName(entry.content, characterData.characterName);

          // Auto-generate keys from content
          const keys = generateKeysFromContent(entry.content);

          console.log(`📚 [Lorebook Plugin] Generated entry name: "${entryName}", keys:`, keys);

          // Check if very similar entry already exists
          const isDuplicate = characterData.existingEntries.some(
            (existing) =>
              existing.name.toLowerCase() === entryName.toLowerCase() ||
              existing.content.toLowerCase().includes(entry.content.toLowerCase()) ||
              entry.content.toLowerCase().includes(existing.content.toLowerCase())
          );

          if (isDuplicate) {
            console.log(`⏭️ [Lorebook Plugin] Skipping duplicate entry: ${entryName}`);
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
            console.log(`⏭️ [Lorebook Plugin] Skipping rejected entry: ${entryName}`);
            continue;
          }

          // Show dialog to user for confirmation
          console.log(`📋 [Lorebook Plugin] Showing confirmation dialog for: ${entryName}`);

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

          console.log(`👤 [Lorebook Plugin] User response: ${userResponse}`);

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

              console.log(`✅ [Lorebook Plugin] Added to ${characterData.characterName}'s lorebook: ${entryName}`);
              logger.info("[Lorebook Plugin] Entry added to character card lorebook", {
                entryId,
                characterId: characterData.characterId,
                characterName: characterData.characterName,
                entryName,
                keys,
              });
            } catch (error) {
              logger.error("[Lorebook Plugin] Failed to add entry to character card", {
                characterId: characterData.characterId,
                characterName: characterData.characterName,
                entryName,
                error,
              });
              console.error(`❌ [Lorebook Plugin] Failed to add entry:`, error);
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

            console.log(`❌ [Lorebook Plugin] Entry rejected: ${entryName}`);
            logger.info("[Lorebook Plugin] Entry rejected by user", {
              characterName: characterData.characterName,
              entryName,
            });
          } else {
            // User chose "later" or closed dialog - do nothing
            console.log(`⏸️ [Lorebook Plugin] Entry deferred: ${entryName}`);
          }
        } catch (error) {
          logger.error("[Lorebook Plugin] Failed to process extracted entry", {
            entryName: entry.name,
            content: entry.content.substring(0, 100),
            error,
          });
        }
      }

      logger.info("[Lorebook Plugin] Processing complete", {
        sessionId,
        processedEntriesCount: extractionResult.entries.length,
      });
    } catch (error) {
      logger.error("[Lorebook Plugin] Error processing message", { error });
    }
  };
}
