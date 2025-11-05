/**
 * Roleplay Memory System - World Agent
 *
 * Analyzes generated messages to detect actual participants and extract
 * character-specific world knowledge for memory distribution.
 *
 * Based on contracts/world-agent.contract.md and research.md
 */

import { z } from "zod";
import type { WorldAgentInput, WorldAgentOutput } from "../../shared/types";
import { logger } from "../../shared/logger";
import {
  recordWorldAgentPrompt,
  recordWorldAgentOutput,
} from "../debug/debug-helpers";

/**
 * Type for the callAI function that will be passed from the extension client
 */
export type CallAIFunction = (prompt: string, options?: {
  modelId?: string;
  temperature?: number;
  schema?: any;
  sessionId?: string;
  feature?: string;
  timeout?: number;
}) => Promise<any>;

/**
 * Default World Agent configuration
 * Uses Gemini 2.5 Flash (fast and cost-efficient for structured outputs)
 */
const DEFAULT_WORLD_AGENT_MODEL = "openai-compatible:google/gemini-2.5-flash";

/**
 * Create dynamic Zod schema for World Agent based on available scenes and participants
 * Constrains scene and character selection to only valid options
 */
function createWorldAgentSchema(
  scenePool: string[],
  selectedScene: string,
  participants: string[]
) {
  // Build available scene options for guidance (not enforced as enum)
  const availableScenes = new Set<string>();
  availableScenes.add(selectedScene);
  scenePool.forEach(scene => availableScenes.add(scene));
  availableScenes.add("unknown"); // Always include "unknown" as a valid option
  const sceneOptions = Array.from(availableScenes);

  return z.object({
    worldContextUpdates: z
      .array(
        z.object({
          characterName: z
            .string()
            .describe(
              `Character name - should be one of: ${participants.join(", ")}`,
            ),
          contextUpdate: z
            .string()
            .describe(
              "Brief 1-2 sentence context update from this character's perspective about what happened",
            ),
        }),
      )
      .describe(
        "Brief context updates for each character in the current scene describing what they learned or experienced",
      ),
    characterSceneUpdates: z
      .array(
        z.object({
          characterName: z
            .string()
            .describe(
              `Character name - should be one of: ${participants.join(", ")}`,
            ),
          scene: z.string().describe(
            `Scene where this character is located. ` +
            `Available scenes: ${sceneOptions.join(", ")}. ` +
            `BEST PRACTICE: Use scenes from the available list above. ` +
            `DEFAULT: Use character's location from "Previous Character Locations" section. ` +
            `ONLY change if: 1) Character is speaker → use "${selectedScene}", OR 2) Character is directly interacting with speaker → use "${selectedScene}". ` +
            `PRESERVE previous location for characters who are only mentioned.`,
          ),
        }),
      )
      .describe(
        "Array of character scene assignments showing where EACH character is located. " +
        `CRITICAL: ALL characters from "Previous Character Locations" MUST be included with locations PRESERVED unless they are the speaker or directly interacting with speaker.`,
      ),
  });
}

/**
 * World Agent prompt template with few-shot examples
 * Focused on assigning characters to scenes and extracting world context
 */
function buildWorldAgentPrompt(input: WorldAgentInput): string {
  const {
    generatedMessage,
    recentMessages,
    dataStore,
    speakerCharacterId,
    speakerName,
  } = input;

  // Format recent messages with character names (if available)
  const recentMessagesText =
    recentMessages.length > 0
      ? recentMessages
          .map((msg) => {
            // Try to extract character name from role or use role as-is
            const speaker =
              msg.role === "user"
                ? "User"
                : msg.role === "assistant"
                  ? speakerName
                  : msg.role;
            return `${speaker}: ${msg.content}`;
          })
          .join("\n")
      : "No recent messages";

  // Format all participants - dataStore.participants now contains names directly
  const allParticipantsText = (dataStore.participants || []).join(", ");

  // Get world memory context if available
  const worldMemoryContext =
    input.worldMemoryContext || "No recent world events";

  // Get accumulated world context if available
  const worldContextText =
    dataStore.worldContext || "No accumulated world context yet";

  // Format current character scenes
  const characterScenesText = dataStore.characterScenes
    ? Object.entries(dataStore.characterScenes)
        .map(([name, scene]) => `- ${name}: ${scene}`)
        .join("\n")
    : "No character scenes yet";

  // Build available scene options for the prompt
  const availableScenes = new Set<string>();
  availableScenes.add(dataStore.selectedScene);
  (dataStore.scene_pool || []).forEach(scene => availableScenes.add(scene));
  availableScenes.add("unknown"); // Always include "unknown" as a valid option
  const sceneOptions = Array.from(availableScenes);

  return `You are the World Agent for a multi-character roleplay session. Your task is to:
1. Assign characters to scenes based on the conversation
2. Update character-specific world context based on what happened

## Context
### World Memory (recent events)
${worldMemoryContext}

### Accumulated World Context (evolving character context)
${worldContextText}

### Recent Messages (for conversation context)
${recentMessagesText}

### Generated Message
Speaker: ${speakerName} (ID: ${speakerCharacterId})
Content: ${generatedMessage}

### Session Data
- Current Scene (SPEAKER's location): ${dataStore.selectedScene}
- All Known Participants: ${allParticipantsText}
- Total Participant Count: ${dataStore.participants?.length || 0}

### Previous Character Locations (TECHNICAL REFERENCE ONLY - NOT SPEAKER KNOWLEDGE)
**IMPORTANT: This list shows where each character was in the previous turn.**
**This is NOT information the speaker (${speakerName}) knows or has access to.**
**Use this ONLY to preserve character locations - characters keep their previous location unless they are:**
**1) The speaker, or 2) Directly interacting with the speaker in this message**

${characterScenesText}

**Your job: Preserve these locations for characters who are NOT the speaker and NOT directly interacting.**

## Task
Determine:
1. characterSceneUpdates: Which scene is each character in?

   **PROCESS:**
   1. Identify the speaker (${speakerName}) → set to selectedScene (${dataStore.selectedScene})
   2. Check message for DIRECT INTERACTION with other characters → set them to selectedScene
   3. ALL other characters NOT in this scene → set to "unknown"

   **CRITICAL: Default is "unknown"**
   - We only know where characters are if they're IN THE CURRENT SCENE
   - Characters not present = we don't know where they are = "unknown"
   - Don't try to preserve previous locations for absent characters

   **Direct Interaction (character IS in scene):**
   - "I said to Alice" → Alice in selectedScene
   - "Bob hands me the sword" → Bob in selectedScene
   - "We're all here together" → everyone mentioned in selectedScene

   **Not in Scene (set to "unknown"):**
   - Characters only MENTIONED: "I think about Alice" → Alice is "unknown"
   - Characters OBSERVED from distance: "I hear Bob talking" → Bob is "unknown"
   - Characters with NO mention at all → "unknown"

   **Example:**
   Message: "Ren went to the boy's bathroom"
   Speaker: Ren | selectedScene: Boy's Bathroom
   Previous: Ren=Staff Room, Yui=Staff Room, Tanaka=Classroom 2-A
   Result: Ren=Boy's Bathroom (speaker), Yui=unknown (not present), Tanaka=unknown (not present)
2. worldContextUpdates: Brief context updates for characters in the current scene (1-2 sentences)
   - Each character in the scene gets a brief summary of what happened from their perspective
   - Use character NAMES from participants list: ${allParticipantsText}
   - Focus on actions, decisions, and relationship changes
   - These updates will accumulate over the session

## Examples
Example 1 (Direct interaction - both in same scene):
Message: "Thanks for the compliment! Your observation skills are impressive too."
Speaker: Yui, Current Scene: "Classroom"
Participants: Yui, Ren, Tanaka
Output: Yui=Classroom (speaker), Ren=Classroom (direct dialogue), Tanaka=unknown (not present)

Example 2 (Speaker only - others become unknown):
Message: "I hear voices in the distance. I gather my notes."
Speaker: Tanaka, Current Scene: "Classroom 2-A"
Participants: Tanaka, Ren, Yui
Output: Tanaka=Classroom 2-A (speaker), Ren=unknown (not in scene), Yui=unknown (not in scene)
Note: "I hear voices" = no direct interaction, Ren and Yui are not physically present

Example 3 (Multiple in scene together):
Message: "We all met at the Dragon's Lair as planned."
Speaker: Alice, Current Scene: "Dragon's Lair"
Participants: Alice, Bob, Charlie, David
Output: Alice=Dragon's Lair (speaker), Bob=Dragon's Lair (together), Charlie=Dragon's Lair (together), David=unknown (not mentioned)

Use character names from: ${allParticipantsText}
Try to use scenes from the available pool: ${sceneOptions.join(", ")}`;
}

/**
 * Create fallback output when World Agent fails
 * Contract: Always include speaker with their current scene, preserve previous context if available
 */
function createFallbackOutput(
  speakerName: string,
  currentScene: string,
  previousWorldContext?: string,
): WorldAgentOutput {
  // If we have previous world context, preserve it for this character
  const worldContextUpdates = [];

  if (previousWorldContext) {
    // Extract this character's previous context from accumulated context
    const characterContextMatch = previousWorldContext.match(
      new RegExp(`\\[${speakerName}\\]\\n([\\s\\S]*?)(?=\\n\\n\\[|$)`)
    );

    if (characterContextMatch) {
      // Preserve the previous context as-is (no updates since World Agent failed)
      worldContextUpdates.push({
        characterName: speakerName,
        contextUpdate: characterContextMatch[1].trim(),
      });
    }
  }

  return {
    worldContextUpdates,
    characterSceneUpdates: [
      {
        characterName: speakerName,
        scene: currentScene,
      }
    ],
  };
}

/**
 * Fuzzy match character name by checking if substring appears anywhere in valid name
 * Starts with first 4 letters, increases length if multiple matches found
 * Examples:
 *   "Yui" matches "Sakuraba Yui" ✅ (substring match)
 *   "yui" matches "Yui" ✅ (case-insensitive)
 *   "Tana" matches "Tanaka-sensei" ✅ (partial match)
 *   "Tanaka sensei" matches "Tanaka-sensei" ✅ (first 4+ letters)
 */
function fuzzyMatchCharacterName(
  llmOutput: string,
  validName: string,
  allValidNames?: string[]
): boolean {
  const normalized = llmOutput.trim().toLowerCase();
  const validNormalized = validName.trim().toLowerCase();

  // If no list of all names, just do simple substring match with first 4 letters (or full length if shorter)
  if (!allValidNames) {
    const substring = normalized.slice(0, Math.min(4, normalized.length));
    return validNormalized.includes(substring);
  }

  // Start with first 4 letters (or full length if shorter), increase until we have unique match
  let substringLength = Math.min(4, normalized.length);

  while (substringLength <= normalized.length) {
    const substring = normalized.slice(0, substringLength);

    // Find all names that contain this substring (anywhere in the name)
    const matches = allValidNames.filter(name =>
      name.trim().toLowerCase().includes(substring)
    );

    // If exactly one match, check if it's this name
    if (matches.length === 1) {
      return matches[0].trim().toLowerCase() === validNormalized;
    }

    // If multiple matches, increase substring length to disambiguate
    if (matches.length > 1) {
      substringLength++;
      continue;
    }

    // If no matches, return false
    return false;
  }

  // Used full string, check if it appears anywhere in valid name (for cases like "Yui" in "Sakuraba Yui")
  return validNormalized.includes(normalized);
}

/**
 * Validate World Agent output structure
 */
function validateWorldAgentOutput(
  output: any,
  speakerName: string,
  participants: string[],
): output is WorldAgentOutput {
  // Check required fields
  if (!output || typeof output !== "object") return false;
  if (!Array.isArray(output.worldContextUpdates)) return false;
  if (!Array.isArray(output.characterSceneUpdates)) return false;

  // characterSceneUpdates must be non-empty
  if (output.characterSceneUpdates.length === 0) return false;

  // characterSceneUpdates must include speaker name (fuzzy match with disambiguation)
  const speakerFound = output.characterSceneUpdates.some((update: any) =>
    fuzzyMatchCharacterName(update.characterName || "", speakerName, participants)
  );
  if (!speakerFound) return false;

  // Validate structure of characterSceneUpdates
  for (const update of output.characterSceneUpdates) {
    if (!update.characterName || typeof update.characterName !== "string") return false;
    if (!update.scene || typeof update.scene !== "string") return false;
  }

  // Validate structure of worldContextUpdates
  for (const update of output.worldContextUpdates) {
    if (!update.characterName || typeof update.characterName !== "string") return false;
    if (!update.contextUpdate || typeof update.contextUpdate !== "string") return false;
  }

  return true;
}

/**
 * Execute World Agent to analyze message and detect participants
 *
 * Contract: contracts/world-agent.contract.md
 * - MUST return non-empty actualParticipants (minimum: speaker)
 * - MUST provide character-specific world knowledge
 * - MUST fallback gracefully on errors (no throws)
 *
 * @param input - World Agent input with message context
 * @param callAI - Extension client callAI function for making LLM calls
 * @returns World Agent output with participants and knowledge
 */
export async function executeWorldAgent(
  input: WorldAgentInput,
  callAI: CallAIFunction,
): Promise<WorldAgentOutput> {
  try {
    // Build prompt with few-shot examples
    const prompt = buildWorldAgentPrompt(input);

    // Record debug event - World Agent prompt
    recordWorldAgentPrompt({
      speakerName: input.speakerName,
      generatedMessage: input.generatedMessage,
      prompt,
      recentMessages: input.recentMessages,
      dataStore: input.dataStore,
      worldMemoryContext: input.worldMemoryContext,
      worldMemoryQuery: input.worldMemoryQuery,
    });

    try {
      // Create dynamic schema based on available scenes and participants
      const scenePool = input.dataStore.scene_pool || [];
      const selectedScene = input.dataStore.selectedScene;
      const participants = input.dataStore.participants || [];
      const dynamicSchema = createWorldAgentSchema(scenePool, selectedScene, participants);

      // Use extension client's callAI with structured output
      const { object } = await callAI(prompt, {
        modelId: DEFAULT_WORLD_AGENT_MODEL,
        schema: dynamicSchema,
        temperature: 0.7,
        sessionId: input.sessionId,
        feature: "world-agent",
      });

      // Type assertion for the generated object
      const typedObject = object as z.infer<typeof dynamicSchema>;

      // Validate worldContextUpdates array (name-based)
      const worldContextUpdates = (Array.isArray(typedObject.worldContextUpdates)
        ? typedObject.worldContextUpdates.filter(
            (item: any) => item.characterName && item.contextUpdate,
          )
        : []) as { characterName: string; contextUpdate: string }[];

      // Validate characterSceneUpdates array
      const characterSceneUpdates = (Array.isArray(typedObject.characterSceneUpdates)
        ? typedObject.characterSceneUpdates.filter(
            (item: any) => item.characterName && item.scene,
          )
        : []) as { characterName: string; scene: string }[];

      const output: WorldAgentOutput = {
        worldContextUpdates,
        characterSceneUpdates,
      };

      // Validate output structure
      const isValid = validateWorldAgentOutput(output, input.speakerName, participants);

      if (!isValid) {
        // Log validation failure details
        logger.warn("[World Agent] Validation failed:", {
          speakerName: input.speakerName,
          rawLLMOutput: typedObject,
        });

        const fallbackOutput = createFallbackOutput(
          input.speakerName,
          input.dataStore.selectedScene,
          input.dataStore.worldContext,
        );

        // Record debug event - World Agent output (fallback)
        recordWorldAgentOutput({
          characterSceneUpdates: fallbackOutput.characterSceneUpdates as Array<{characterName: string; scene: string}>,
          worldContextUpdates: fallbackOutput.worldContextUpdates as Array<{characterName: string; contextUpdate: string}>,
          rawOutput: {
            fallback: true,
            reason: "validation_failed",
            llmResponse: typedObject,
          },
        });

        return fallbackOutput;
      }

      // Record debug event - World Agent output (success)
      recordWorldAgentOutput({
        characterSceneUpdates: output.characterSceneUpdates as Array<{characterName: string; scene: string}>,
        worldContextUpdates: output.worldContextUpdates as Array<{characterName: string; contextUpdate: string}>,
        rawOutput: typedObject,
      });

      return output;
    } catch (llmError) {
      // LLM call failed - use fallback
      logger.warn("[World Agent] LLM call failed, using fallback:", llmError);

      const fallbackOutput = createFallbackOutput(
        input.speakerName,
        input.dataStore.selectedScene,
        input.dataStore.worldContext
      );

      // Record debug event - World Agent output (LLM error fallback)
      recordWorldAgentOutput({
        characterSceneUpdates: fallbackOutput.characterSceneUpdates as Array<{characterName: string; scene: string}>,
        worldContextUpdates: fallbackOutput.worldContextUpdates as Array<{characterName: string; contextUpdate: string}>,
        rawOutput: { fallback: true, reason: "llm_error", error: String(llmError) },
      });

      return fallbackOutput;
    }
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error("[World Agent] Unexpected error:", error);
    const fallbackOutput = createFallbackOutput(
      input.speakerName,
      input.dataStore.selectedScene,
      input.dataStore.worldContext
    );

    // Record debug event - World Agent output (error fallback)
    recordWorldAgentOutput({
      characterSceneUpdates: fallbackOutput.characterSceneUpdates as Array<{characterName: string; scene: string}>,
      worldContextUpdates: fallbackOutput.worldContextUpdates as Array<{characterName: string; contextUpdate: string}>,
      rawOutput: { fallback: true, reason: "error", error: String(error) },
    });

    return fallbackOutput;
  }
}
