/**
 * NPC Extraction Agent
 *
 * Analyzes messages to detect NPCs mentioned in conversation.
 * Outputs only NEW NPCs or NEW ALIASES for existing NPCs.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NpcData } from "@/app/stores/npc-store";
import { useAppStore } from "@/app/stores/app-store";
import { logger } from "@/shared/utils/logger";
import { recordNpcExtraction } from "../debug/debug-helpers";
import { ApiSource } from "@/modules/api/domain/api-connection";

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
            "Full name as mentioned in conversation (e.g., 'John Doe') from the context if that name is in the pool dont print this, but if it exists in other form print it but with same id.",
          ),
        id: z
          .string()
          .describe(
            "Lowercase single-word ID into single word (e.g., 'john') if this person exists in the pool, use the exact id in there.",
          ),
        description: z
          .string()
          .describe(
            "2-3 paragraph AI-generated character description including appearance, personality, role, and relationships with other characters based on message history and world context. If insufficient context, provide minimal description.",
          ),
      }),
    )
    .describe("Only NEW NPCs or NEW ALIASES for existing NPCs"),
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
}

/**
 * Default configuration
 * Using gemini-2.5-flash for faster response times
 */
const DEFAULT_NPC_EXTRACTION_MODEL = "openai-compatible:google/gemini-2.5-flash";
const NPC_EXTRACTION_TIMEOUT_MS = 20000; // 20 seconds

/**
 * Execute NPC Extraction Agent
 */
export async function executeNpcExtractionAgent(
  input: NpcExtractionInput,
): Promise<NpcExtractionOutput> {
  const { message, recentMessages, existingNpcPool, mainCharacterNames, mainCharacterDescriptions, worldMemoryContext } = input;

  // Build prompt
  const existingNpcsText = existingNpcPool.length
    ? existingNpcPool
        .map((npc) => `- ID: ${npc.id}, Names: [${npc.names.join(", ")}]`)
        .join("\n")
    : "None";

  const mainCharactersText = mainCharacterNames.length
    ? mainCharacterNames.map((name, index) => {
        const description = mainCharacterDescriptions?.[index];
        return description ? `- ${name}: ${description}` : `- ${name}`;
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

  const prompt = `You are an NPC extraction agent. Your job is to identify Non-Player Characters (NPCs) mentioned in conversation messages AND generate detailed character descriptions for them.

MAIN CHARACTERS in this session (DO NOT EXTRACT THESE):
${mainCharactersText}

EXISTING NPCs in this session:
${existingNpcsText}

CURRENT MESSAGE:
${messageText}
${contextText}
${worldContextText}

INSTRUCTIONS:
1. Identify any NPCs mentioned in the messages (characters that are talked about or appear)
2. For each NPC:
   - Generate a lowercase single-word ID from their first name (e.g., "John Doe" → "john")
   - Record their full name as it appears in the conversation
   - Generate a 2-3 paragraph character description including:
     * Physical appearance (if mentioned or can be inferred)
     * Personality traits and mannerisms
     * Role in the story/relationship to main characters
     * Any relevant background or context from world memories
     * If insufficient context available, provide minimal description: "[Name] is a character in the story."
3. Check against MAIN CHARACTERS list:
   - NEVER extract any character listed in MAIN CHARACTERS as an NPC
   - Use the character descriptions to identify if a mentioned name is an alias/variation of a main character
   - Examples: If "Sakuraba Yui" is a main character, then "Sakuraba-san", "Yui-chan", "Sakuraba" are aliases, NOT NPCs
   - This includes honorifics (san, kun, chan, sensei, sama), last names, first names, or nicknames
4. Check against EXISTING NPCs:
   - If the ID already exists but a NEW name/alias is used, include it WITH the same ID and generate description
   - If the ID and name both already exist, DO NOT include it
   - If it's a completely new NPC, include it with generated description
5. DO NOT include:
   - Main characters or their aliases (listed above)
   - Generic references like "someone", "people", "a person"
   - Characters that are clearly not NPCs

Output ONLY new NPCs or new aliases for existing NPCs, each with their AI-generated description.`;

  try {
    const startTime = Date.now();

    // Setup provider (using Convex backend routing) - same pattern as world-agent
    const [providerSource, parsedModelId] =
      DEFAULT_NPC_EXTRACTION_MODEL.split(":");
    const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${providerSource}`;

    // Format base URL correctly for OpenAI-compatible providers
    let oaiCompBaseUrl = astrskBaseUrl ?? "";
    if (!oaiCompBaseUrl.endsWith("/v1")) {
      oaiCompBaseUrl += "/v1";
    }

    const provider = createOpenAI({
      apiKey: "DUMMY",
      baseURL: oaiCompBaseUrl,
    });

    // Create model using the same logic as world-agent
    const model = ("chat" in provider && typeof provider.chat === "function")
      ? (provider as any).chat(parsedModelId)
      : provider.languageModel(parsedModelId);

    // Get JWT for authentication
    const jwt = useAppStore.getState().jwt;
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "x-astrsk-credit-log": JSON.stringify({
            feature: "npc-extraction",
            sessionId: input.sessionId,
          }),
        }
      : undefined;

    // Execute with timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      NPC_EXTRACTION_TIMEOUT_MS,
    );

    const { object } = await generateObject({
      model,
      schema: npcExtractionSchema,
      prompt,
      abortSignal: abortController.signal,
      temperature: 0.7,
      ...(headers && { headers }),
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    logger.info("[NPC Extraction] Success", {
      npcs: object.npcs.length,
      sessionId: input.sessionId,
      duration,
    });

    // Record debug event
    recordNpcExtraction({
      sessionId: input.sessionId,
      message: input.message,
      mainCharacterNames: input.mainCharacterNames,
      existingNpcPool: input.existingNpcPool,
      extractedNpcs: object.npcs,
      prompt,
      duration,
    });

    return object as NpcExtractionOutput;
  } catch (error) {
    logger.error("[NPC Extraction] Failed", {
      error,
      sessionId: input.sessionId,
    });

    // Record debug event for failure
    recordNpcExtraction({
      sessionId: input.sessionId,
      message: input.message,
      mainCharacterNames: input.mainCharacterNames,
      existingNpcPool: input.existingNpcPool,
      extractedNpcs: [], // Empty on failure
      prompt,
      duration: 0,
    });

    // Return empty on failure
    return { npcs: [] };
  }
}
