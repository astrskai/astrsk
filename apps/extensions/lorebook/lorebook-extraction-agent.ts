/**
 * Lorebook Extraction Agent
 *
 * Analyzes messages to detect lorebook-worthy information for characters.
 * Outputs only NEW lorebook entries that haven't been added or rejected before.
 */

import { z } from "zod";
import { LorebookEntryData, RejectedLorebookEntry } from "./lorebook-store";
import { logger } from "@astrsk/shared/logger";
import type { IExtensionClient } from "../../pwa/src/modules/extensions/core/types";

/**
 * Lorebook Extraction Schema
 * Simplified: Only name and content required
 * Plugin will figure out characterId and generate keys automatically
 */
const lorebookExtractionSchema = z.object({
  entries: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Character name from the entry content (e.g., 'Ren', 'Victor')"
          ),
        content: z
          .string()
          .describe(
            "Factual lorebook information as a complete sentence (e.g., 'Victor believes Raphy orchestrates outcomes and anticipates needs' or 'Ren learned to cast fireball magic from his mentor'). DO NOT use 'character:' prefix format."
          ),
      })
    )
    .describe("Only NEW lorebook-worthy entries that don't exist or weren't rejected"),
});

export type LorebookExtractionOutput = z.infer<typeof lorebookExtractionSchema>;

export interface LorebookExtractionInput {
  sessionId: string;
  message: {
    role: string;
    content: string;
    characterName?: string;
  };
  recentMessages?: Array<{
    role: string;
    content: string;
  }>;
  // Characters in the session with their existing lorebook entries
  charactersWithLorebooks: Array<{
    characterId: string;
    characterName: string;
    existingEntries: LorebookEntryData[];     // What's already in their lorebook
    rejectedEntries: RejectedLorebookEntry[]; // What user has rejected
  }>;
  worldMemoryContext?: string[]; // World memory for additional context
}

/**
 * Default configuration
 * Using gemini-2.5-flash for faster response times
 */
const DEFAULT_LOREBOOK_EXTRACTION_MODEL = "openai-compatible:google/gemini-2.5-flash";

/**
 * Execute Lorebook Extraction Agent
 * @param client - Extension client for secure API access
 * @param input - Extraction input parameters
 */
export async function executeLorebookExtractionAgent(
  client: IExtensionClient,
  input: LorebookExtractionInput,
): Promise<LorebookExtractionOutput> {
  const { message, recentMessages, charactersWithLorebooks, worldMemoryContext } = input;

  // Build character lorebook context
  const characterLorebookText = charactersWithLorebooks.length
    ? charactersWithLorebooks
        .map((char) => {
          const existingText =
            char.existingEntries.length > 0
              ? char.existingEntries
                  .map((e) => `  * ${e.name}: ${e.content} [keys: ${e.keys.join(", ")}]`)
                  .join("\n")
              : "  (no entries yet)";

          const rejectedText =
            char.rejectedEntries.length > 0
              ? char.rejectedEntries
                  .map((e) => `  * ${e.name}: ${e.content} [keys: ${e.keys.join(", ")}] (rejected: ${e.reason || "user declined"})`)
                  .join("\n")
              : "  (no rejected entries)";

          return `CHARACTER: ${char.characterName} (ID: ${char.characterId})
  Existing Lorebook Entries:
${existingText}

  Rejected Lorebook Entries (DO NOT suggest these again):
${rejectedText}`;
        })
        .join("\n\n")
    : "None";

  // Build message text (current message + optional context)
  const messageText = message.characterName
    ? `${message.characterName}: ${message.content}`
    : `${message.role}: ${message.content}`;

  const contextText = recentMessages
    ? "\n\nRECENT CONTEXT:\n" +
      recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
    : "";

  // Build world context text
  const worldContextText = worldMemoryContext?.length
    ? "\n\nWORLD CONTEXT (for generating lorebook entries):\n" +
      worldMemoryContext.map((mem, i) => `${i + 1}. ${mem}`).join("\n")
    : "";

  const prompt = `You are a lorebook extraction agent. Your job is to identify lorebook-worthy information from conversation messages and suggest new lorebook entries for characters.

CHARACTERS WITH THEIR LOREBOOKS:
${characterLorebookText}

CURRENT MESSAGE:
${messageText}
${contextText}
${worldContextText}

WHAT IS LOREBOOK-WORTHY:
Lorebook entries should capture important, reusable information about characters that would be useful for future context. Examples:
- Character abilities/powers (e.g., "Ren can cast fireball magic")
- Character backstory reveals (e.g., "Victor grew up in an orphanage")
- Character traits/personality (e.g., "Yui is extremely loyal to her friends")
- Character relationships (e.g., "Ren and Yui are childhood friends")
- Important events (e.g., "Victor witnessed the great fire 10 years ago")
- Character knowledge/skills (e.g., "Ren studied at the magic academy")
- Physical characteristics (e.g., "Victor has a scar on his left arm")

NOT LOREBOOK-WORTHY:
- Temporary states or emotions (e.g., "Ren is currently happy")
- Simple dialogue or actions without lasting significance
- Information already in existing lorebook entries
- Information in rejected entries (user declined these)

INSTRUCTIONS:
1. Analyze the message for lorebook-worthy information about each character
2. For each piece of information:
   - Extract the character name (e.g., "Ren", "Victor")
   - Write content as a FACTUAL SENTENCE (e.g., "Ren learned to cast fireball magic from his mentor")
   - DO NOT use "character:" prefix format - write as complete factual sentences
3. Check against EXISTING lorebook entries:
   - DO NOT suggest entries that are already in a character's lorebook
   - DO NOT suggest duplicate or very similar information
4. Check against REJECTED lorebook entries:
   - DO NOT suggest entries that have been rejected by the user
   - DO NOT suggest variations of rejected entries
5. Only suggest truly NEW and RELEVANT lorebook entries
6. Only character-specific entries for now (no world lore)

OUTPUT FORMAT:
{
  "name": "Character Name",
  "content": "Factual sentence about the character"
}

EXAMPLES:
- { "name": "Ren", "content": "Ren learned to cast fireball magic from his mentor at the academy" }
- { "name": "Victor", "content": "Victor grew up in an orphanage after his parents died in the war" }
- { "name": "Yui", "content": "Yui is fiercely protective of her childhood friends" }

IMPORTANT: Write lorebook entries as factual statements, NOT in conversation format. This helps distinguish them from dialogue.

Output ONLY new lorebook-worthy entries that don't already exist or weren't rejected.`;

  console.log("📚 [Lorebook Extraction] Prompt being sent:", {
    charactersCount: charactersWithLorebooks.length,
    existingEntriesCount: charactersWithLorebooks.reduce((sum, c) => sum + c.existingEntries.length, 0),
    rejectedEntriesCount: charactersWithLorebooks.reduce((sum, c) => sum + c.rejectedEntries.length, 0),
    promptLength: prompt.length,
  });

  try {
    const startTime = Date.now();

    // Use secure client API - JWT handled internally, never exposed to plugin
    const result = await client.api.callAI(prompt, {
      modelId: DEFAULT_LOREBOOK_EXTRACTION_MODEL,
      schema: lorebookExtractionSchema,
      temperature: 0.7,
      sessionId: input.sessionId,
      feature: "lorebook-extraction",
    });

    const duration = Date.now() - startTime;
    const object = result.object;

    logger.info("[Lorebook Extraction] Success", {
      entries: object.entries.length,
      sessionId: input.sessionId,
      duration,
    });

    console.log(`📚 [Lorebook Extraction] Found ${object.entries.length} potential lorebook entries`);

    return object as LorebookExtractionOutput;
  } catch (error) {
    logger.error("[Lorebook Extraction] Failed", {
      error,
      sessionId: input.sessionId,
    });

    // Return empty on failure
    return { entries: [] };
  }
}
