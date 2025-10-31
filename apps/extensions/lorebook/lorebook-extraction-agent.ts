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
 * Extension will figure out characterId and generate keys automatically
 */
const lorebookExtractionSchema = z.object({
  entries: z
    .array(
      z.object({
        characterName: z
          .string()
          .describe(
            "The character this lorebook entry is about. Must be one of the character names from the CHARACTERS WITH THEIR LOREBOOKS section above."
          ),
        entryTitle: z
          .string()
          .describe(
            "Short descriptive title for this lorebook entry (e.g., 'Transfer Student Background', 'Telekinetic Abilities', 'Class Representative Role')"
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
                  .map((e) => `  * ${e.name}: ${e.content} (rejected: ${e.reason || "user declined"})`)
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

  const prompt = `You are a lorebook extraction agent. Your job is to identify ONLY THE MOST SIGNIFICANT and MEMORABLE information from conversation messages that should be permanently recorded about characters.

⚠️ IMPORTANT: If there is no significant lorebook-worthy information in the message, return an EMPTY list. This is completely acceptable and often the correct response.

CHARACTERS WITH THEIR LOREBOOKS:
${characterLorebookText}

CURRENT MESSAGE:
${messageText}
${contextText}
${worldContextText}

CRITICAL GUIDELINES - BE HIGHLY SELECTIVE:
You should extract VERY FEW entries - only information that meets ALL these criteria:
1. SIGNIFICANT: Major character reveals, not minor details
2. PERMANENT: Lasting traits/facts, not temporary states
3. REUSABLE: Information that will matter in future conversations
4. NEW: Not already captured in existing or rejected entries

WHAT IS LOREBOOK-WORTHY (Extract ONLY if highly significant):
- Major character abilities/powers that define them
- Important backstory reveals that shape their character
- Core personality traits (not just fleeting behaviors)
- Significant relationships or bonds
- Life-changing events they experienced
- Critical knowledge/skills that are central to who they are
- Distinctive physical characteristics that are memorable

NOT LOREBOOK-WORTHY (DO NOT extract these):
- Temporary states, emotions, or current feelings
- Minor actions or simple dialogue
- Trivial details or flavor text
- Information that's already in existing lorebook entries
- Variations of information in rejected entries
- Small talk or casual conversation content
- Things that are implied or already obvious from context
- Mundane daily activities or routine behaviors

INSTRUCTIONS:
1. Read the message carefully and identify ONLY HIGHLY SIGNIFICANT information
2. Be VERY CONSERVATIVE - when in doubt, DON'T extract it
3. For truly significant information:
   - Identify the character name from the CHARACTERS section
   - Create a SHORT, DESCRIPTIVE TITLE (e.g., "Magic Training", "Tragic Backstory")
   - Write content as a FACTUAL SENTENCE (e.g., "Ren learned to cast fireball magic from his mentor")
4. Check against EXISTING lorebook entries - DO NOT duplicate or suggest similar information
5. Check against REJECTED entries - DO NOT suggest variations of what was rejected
6. Most messages will have ZERO lorebook-worthy entries - that's expected and correct!
7. Only character-specific entries (no world lore)

OUTPUT FORMAT:
{
  "characterName": "Character Name",
  "entryTitle": "Short Descriptive Title",
  "content": "Factual sentence about the character"
}

EXAMPLES OF SIGNIFICANT ENTRIES:
- { "characterName": "Ren", "entryTitle": "Magic Training", "content": "Ren learned to cast fireball magic from his mentor at the academy" }
- { "characterName": "Victor", "entryTitle": "Orphan Background", "content": "Victor grew up in an orphanage after his parents died in the war" }
- { "characterName": "Yui", "entryTitle": "Protective Trait", "content": "Yui is fiercely protective of her childhood friends" }

REMEMBER:
- Quality over quantity. Extract ONLY the most important information.
- Empty results are perfectly acceptable.`;

  console.log("📚 [Lorebook Extraction] Prompt being sent:", {
    charactersCount: charactersWithLorebooks.length,
    existingEntriesCount: charactersWithLorebooks.reduce((sum, c) => sum + c.existingEntries.length, 0),
    rejectedEntriesCount: charactersWithLorebooks.reduce((sum, c) => sum + c.rejectedEntries.length, 0),
    promptLength: prompt.length,
  });

  try {
    const startTime = Date.now();

    // Use secure client API - JWT handled internally, never exposed to extension
    const result = await client.api.callAI(prompt, {
      modelId: DEFAULT_LOREBOOK_EXTRACTION_MODEL,
      schema: lorebookExtractionSchema,
      temperature: 0.3, // Low temperature for conservative, deterministic extraction
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
