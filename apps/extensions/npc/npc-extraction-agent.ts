/**
 * NPC Extraction Agent
 *
 * Analyzes messages to detect NPCs mentioned in conversation.
 * Outputs only NEW NPCs or NEW ALIASES for existing NPCs.
 */

import { z } from "zod";
import { NpcData } from "./npc-store";
import { logger } from "@astrsk/shared/logger";
import type { IExtensionClient } from "../../pwa/src/modules/extensions/core/types";

/**
 * NPC Extraction Schema
 * Enhanced to generate AI descriptions for NPCs
 */
const npcExtractionSchema = z.object({
  npcs: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Full proper name of a PERSON (not book titles, places, or objects) as mentioned in conversation (e.g., 'Hamasaki-san', 'John Doe'). If this name exists in the pool, don't include it unless it's a NEW alias.",
          ),
        id: z
          .string()
          .describe(
            "Lowercase single-word ID from first name (e.g., 'hamasaki', 'john'). If this person already exists in the pool, use the EXACT same ID.",
          ),
        description: z
          .string()
          .describe(
            "2-3 paragraph AI-generated character description including appearance, personality, role, and relationships with other characters based on message history and world context. If insufficient context, provide minimal description.",
          ),
      }),
    )
    .describe("Only NEW PERSON NPCs (not titles/places/objects) or NEW ALIASES for existing NPCs. Empty array if no NPCs found."),
});

export type NpcExtractionOutput = z.infer<typeof npcExtractionSchema>;

export interface NpcExtractionInput {
  sessionId: string;
  message: {
    role: string;
    content: string;
    characterName?: string;
  };
  recentMessages?: Array<{
    // Optional: for context
    role: string;
    content: string;
  }>;
  existingNpcPool: NpcData[];
  mainCharacterNames: string[]; // Main characters in session - do NOT extract as NPCs
  mainCharacterDescriptions?: string[]; // Character descriptions to help identify aliases/variations
  worldMemoryContext?: string[]; // NEW: World memory for relationship context and character descriptions
  charactersInScene?: string[]; // Characters currently in the scene (helps identify contextual references)
}

/**
 * Default configuration
 * Using gemini-2.5-flash for faster response times
 */
const DEFAULT_NPC_EXTRACTION_MODEL = "openai-compatible:google/gemini-2.5-flash";

/**
 * Execute NPC Extraction Agent
 * @param client - Extension client for secure API access
 * @param input - Extraction input parameters
 */
export async function executeNpcExtractionAgent(
  client: IExtensionClient,
  input: NpcExtractionInput,
): Promise<NpcExtractionOutput> {
  const { message, recentMessages, existingNpcPool, mainCharacterNames, mainCharacterDescriptions, worldMemoryContext, charactersInScene } = input;

  // Build prompt
  const existingNpcsText = existingNpcPool.length
    ? existingNpcPool
        .map((npc) => `- ID: ${npc.id}, Names: [${npc.names.join(", ")}]`)
        .join("\n")
    : "None";

  const mainCharactersText = mainCharacterNames.length
    ? mainCharacterNames.map((name, index) => {
        const description = mainCharacterDescriptions?.[index];
        // Truncate descriptions at 10000 characters to prevent prompt overflow (good practice)
        const truncatedDescription = description && description.length > 10000
          ? description.substring(0, 10000) + "... (truncated)"
          : description;
        return truncatedDescription ? `- ${name}: ${truncatedDescription}` : `- ${name}`;
      }).join("\n")
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
    ? "\n\nWORLD CONTEXT (for generating character descriptions):\n" +
      worldMemoryContext.map((mem, i) => `${i + 1}. ${mem}`).join("\n")
    : "";

  // Build characters in scene text
  const charactersInSceneText = charactersInScene?.length
    ? "\n\nCHARACTERS IN CURRENT SCENE:\n" +
      charactersInScene.map(name => `- ${name}`).join("\n")
    : "";

  const prompt = `You are an NPC extraction agent. Your job is to identify Non-Player Characters (NPCs) mentioned in conversation messages AND generate detailed character descriptions for them.

MAIN CHARACTERS in this session (DO NOT EXTRACT THESE):
${mainCharactersText}

EXISTING NPCs in this session:
${existingNpcsText}${charactersInSceneText}

CURRENT MESSAGE:
${messageText}
${contextText}
${worldContextText}

INSTRUCTIONS:
1. Identify ONLY CHARACTERS (people) mentioned in the messages - characters that are talked about or appear
2. **DO NOT extract:**
   - Book titles, story titles, novel titles (e.g., "The Secret That Began in the Library")
   - Place names, location names (e.g., "Classroom 2-A", "Tokyo Tower")
   - Objects, items, things (e.g., "the book", "the desk")
   - Abstract concepts or ideas
   - **Context clue:** If preceded by "in", "at", "from", "the", or mentioned in quotes/italics, it's likely NOT a character
   - **Context clue:** Phrases like "the male lead in X", "the story of X", "the book titled X" mean X is a title, NOT a character
3. For each NPC (actual person):
   - Generate a lowercase single-word ID from their first name (e.g., "John Doe" → "john")
   - Record their full name as it appears in the conversation
   - Generate a 2-3 paragraph character description including:
     * Physical appearance (if mentioned or can be inferred)
     * Personality traits and mannerisms
     * Role in the story/relationship to main characters
     * Any relevant background or context from world memories
     * If insufficient context available, provide minimal description: "[Name] is a character in the story."
4. Check against MAIN CHARACTERS list:
   - NEVER extract any character listed in MAIN CHARACTERS as an NPC
   - Use the character descriptions to identify if a mentioned name is an alias/variation of a main character
   - Examples: If "Sakuraba Yui" is a main character, then "Sakuraba-san", "Yui-chan", "Sakuraba" are aliases, NOT NPCs
   - This includes honorifics (san, kun, chan, sensei, sama), last names, first names, or nicknames
5. Check against EXISTING NPCs:
   - If the ID already exists but a NEW name/alias is used, include it WITH the same ID and generate description
   - If the ID and name both already exist, DO NOT include it
   - If it's a completely new NPC, include it with generated description
6. DO NOT extract as NPCs:
   - Main characters or their aliases (listed above)
   - Generic references like "someone", "people", "a person"
   - **Generic descriptive references that clearly refer to a character in the scene** (e.g., "new guy", "transfer student", "that person" when referring to a known character)
   - Check CHARACTERS IN CURRENT SCENE and RECENT CONTEXT to determine if a generic reference is about a known character
   - Examples:
     * "new guy" or "transfer student" when a transfer student character (e.g., Ren) is in the scene → Skip (refers to known character)
     * "Tanaka-sensei" when "Tanaka-sensei" is a main character → Skip (main character alias)
     * "class president" when referring to Yui who is the class president → Skip (refers to known character)
     * "the male lead in 'The Secret That Began in the Library'" → Skip (refers to a character IN a book, not a real person)
     * "Hamasaki-san" when no Hamasaki is in main characters or scene → Extract (new NPC with proper name)
7. **CRITICAL - Generic References Rule:**
   - If a reference has NO specific name AND can be inferred from context to refer to a character already in MAIN CHARACTERS or CHARACTERS IN CURRENT SCENE, DO NOT extract it
   - Check the RECENT CONTEXT to see if the generic reference was used right after introducing a known character
   - Only extract characters with specific names that cannot be matched to existing characters

Output ONLY new NPCs or new aliases for existing NPCs, each with their AI-generated description.`;

  console.log("📝 [NPC Extraction] Prompt being sent:", {
    mainCharacterNames,
    mainCharacterDescriptions: mainCharacterDescriptions?.map(d => d || 'none'), // Show full descriptions in debug logs
    existingNpcPool: existingNpcPool.map(n => ({ id: n.id, names: n.names })),
    promptLength: prompt.length,
  });

  console.log("📝 [NPC Extraction] MAIN CHARACTERS section sent to AI:");
  console.log(mainCharactersText);

  try {
    const startTime = Date.now();

    // Use secure client API - JWT handled internally, never exposed to extension
    const result = await client.api.callAI(prompt, {
      modelId: DEFAULT_NPC_EXTRACTION_MODEL,
      schema: npcExtractionSchema,
      temperature: 0.7,
      sessionId: input.sessionId,
      feature: "npc-extraction",
    });

    const duration = Date.now() - startTime;
    const object = result.object;

    logger.info("[NPC Extraction] Success", {
      npcs: object.npcs.length,
      sessionId: input.sessionId,
      duration,
    });

    return object as NpcExtractionOutput;
  } catch (error) {
    logger.error("[NPC Extraction] Failed", {
      error,
      sessionId: input.sessionId,
    });

    // Return empty on failure
    return { npcs: [] };
  }
}
