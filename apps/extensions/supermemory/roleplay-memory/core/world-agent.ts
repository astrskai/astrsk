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
}) => Promise<any>;

/**
 * Default World Agent configuration
 * Uses AstrskAi provider with Gemini 2.5 Flash (lightweight, cost-efficient)
 */
const DEFAULT_WORLD_AGENT_MODEL = "openai-compatible:google/gemini-2.5-flash";

/**
 * Zod schema for World Agent structured output
 * Note: Uses character NAMES (not IDs) for better LLM understanding
 * Participants are derived from characterSceneUpdates (characters in selectedScene)
 */
const worldAgentSchema = z.object({
  worldContextUpdates: z
    .array(
      z.object({
        characterName: z
          .string()
          .describe('Character name (e.g., "Yui", "Ren")'),
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
          .describe('Character name (e.g., "Alice", "Bob")'),
        scene: z
          .string()
          .describe(
            'Scene where this character currently is. Use selectedScene if in current scene, different scene if moved elsewhere, or "none" if location unknown',
          ),
      }),
    )
    .describe(
      "Array of character scene assignments for ALL characters mentioned in recent messages. " +
      "Include speaker and any characters they interact with or mention. " +
      "Use the exact selectedScene name if they're in the current scene. " +
      "Use a different scene name if they explicitly moved elsewhere. " +
      "Use 'none' if character is mentioned but location is unknown.",
    ),
});

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

  return `You are the World Agent for a multi-character roleplay session. Your task is to:
1. Assign characters to scenes based on the conversation
2. Update character-specific world context based on what happened

IMPORTANT: Look at recent messages to understand which characters are participating and where they are.

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
- Current Scene: ${dataStore.selectedScene}
- All Known Participants: ${allParticipantsText}
- Total Participant Count: ${dataStore.participants?.length || 0}

### Current Character Scenes
${characterScenesText}

## Task
Determine:
1. characterSceneUpdates: Which scene is each character in?
   - **SPECIAL CASE: If Total Participant Count = 2, and the message contains dialogue or direct response, BOTH participants are in the current scene**
   - If someone is speaking TO another character (direct address, dialogue), both are in the current scene
   - If someone is speaking ABOUT another character (just mentioning them), only speaker is in current scene
   - Use character NAMES (not IDs) - e.g., "Alice", "Bob"
   - Use the exact selectedScene name for characters in the current scene
   - Use a different scene name if a character explicitly moved elsewhere
   - Use "none" if character is mentioned but location is unknown
   - Speaker is ALWAYS included with their scene
2. worldContextUpdates: Brief context updates for characters in the current scene (1-2 sentences)
   - Each character in the scene gets a brief summary of what happened from their perspective
   - Use character NAMES (not IDs) - e.g., "Alice", "Bob"
   - Focus on actions, decisions, and relationship changes
   - These updates will accumulate over the session

## Examples
Example 1 (Two characters talking in same scene):
Message: "Alice and I agreed to search for the sword together!"
Speaker: Bob (ID: bob-id)
Current Scene: "Tavern Morning Day 1"
All Participants: Alice, Bob, Charlie
Output:
{
  "characterSceneUpdates": [
    {"characterName": "Alice", "scene": "Tavern Morning Day 1"},
    {"characterName": "Bob", "scene": "Tavern Morning Day 1"}
  ],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You agreed with Bob to search for the Sacred Sword together"},
    {"characterName": "Bob", "contextUpdate": "You agreed with Alice to search for the Sacred Sword"}
  ]
}

Example 2 (Character moving to different scene):
Message: "I'm heading to the tavern alone to think."
Speaker: Charlie (ID: charlie-id)
Current Scene: "Marketplace Afternoon Day 1"
All Participants: Alice, Bob, Charlie
Output:
{
  "characterSceneUpdates": [
    {"characterName": "Charlie", "scene": "Tavern Afternoon Day 1"}
  ],
  "worldContextUpdates": [
    {"characterName": "Charlie", "contextUpdate": "You decided to go to the tavern alone to reflect on things"}
  ]
}

Example 3 (Direct dialogue between two characters):
Message: "Thanks for the compliment! Your observation skills are impressive too."
Speaker: Yui (ID: yui-id)
Current Scene: "Classroom Morning Day 1"
All Participants: Yui, Ren
Output:
{
  "characterSceneUpdates": [
    {"characterName": "Yui", "scene": "Classroom Morning Day 1"},
    {"characterName": "Ren", "scene": "Classroom Morning Day 1"}
  ],
  "worldContextUpdates": [
    {"characterName": "Yui", "contextUpdate": "You thanked Ren for the compliment and complimented their observation skills"},
    {"characterName": "Ren", "contextUpdate": "Yui thanked you for your compliment and acknowledged your observation skills"}
  ]
}

Example 4 (Multiple characters meeting at new location):
Message: "We all met at the Dragon's Lair as planned."
Speaker: Alice (ID: alice-id)
Current Scene: "Dragon's Lair Morning Day 2"
All Participants: Alice, Bob, Charlie
Output:
{
  "characterSceneUpdates": [
    {"characterName": "Alice", "scene": "Dragon's Lair Morning Day 2"},
    {"characterName": "Bob", "scene": "Dragon's Lair Morning Day 2"},
    {"characterName": "Charlie", "scene": "Dragon's Lair Morning Day 2"}
  ],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You met everyone at the Dragon's Lair as planned"},
    {"characterName": "Bob", "contextUpdate": "You met Alice and Charlie at the Dragon's Lair"},
    {"characterName": "Charlie", "contextUpdate": "You joined Alice and Bob at the Dragon's Lair"}
  ]
}

Example 5 (Mentioning character not in scene):
Message: "I wonder where Charlie went. Anyway, let's continue our discussion."
Speaker: Alice (ID: alice-id)
Current Scene: "Library Afternoon Day 1"
All Participants: Alice, Bob, Charlie
Output:
{
  "characterSceneUpdates": [
    {"characterName": "Alice", "scene": "Library Afternoon Day 1"},
    {"characterName": "Bob", "scene": "Library Afternoon Day 1"}
  ],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You wondered about Charlie's whereabouts and suggested continuing the discussion with Bob"},
    {"characterName": "Bob", "contextUpdate": "Alice mentioned wondering where Charlie was and suggested you continue your discussion"}
  ]
}

IMPORTANT:
- Use exact character NAMES from the participants list (not IDs!)
- characterSceneUpdates MUST include at least the speaker name with their scene
- Use the exact selectedScene name when characters are in the current scene
- worldContextUpdates should only include characters that are actively in the current scene
- If a character explicitly moves to a new location, use a descriptive scene name for their new location`;
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
 * Validate World Agent output structure
 */
function validateWorldAgentOutput(
  output: any,
  speakerName: string,
): output is WorldAgentOutput {
  // Check required fields
  if (!output || typeof output !== "object") return false;
  if (!Array.isArray(output.worldContextUpdates)) return false;
  if (!Array.isArray(output.characterSceneUpdates)) return false;

  // characterSceneUpdates must be non-empty
  if (output.characterSceneUpdates.length === 0) return false;

  // characterSceneUpdates must include speaker name (case-insensitive, whitespace-trimmed)
  const normalizedSpeakerName = speakerName.trim().toLowerCase();
  const characterNames = output.characterSceneUpdates.map((update: any) =>
    update.characterName?.trim().toLowerCase(),
  );
  if (!characterNames.includes(normalizedSpeakerName)) return false;

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
      // Use extension client's callAI with structured output
      const { object } = await callAI(prompt, {
        modelId: DEFAULT_WORLD_AGENT_MODEL,
        schema: worldAgentSchema,
        temperature: 0.7,
        sessionId: input.sessionId,
        feature: "world-agent",
      });

      // Type assertion for the generated object
      const typedObject = object as z.infer<typeof worldAgentSchema>;

      // Validate worldContextUpdates array (name-based)
      const worldContextUpdates = Array.isArray(typedObject.worldContextUpdates)
        ? typedObject.worldContextUpdates.filter(
            (item) => item.characterName && item.contextUpdate,
          )
        : [];

      // Validate characterSceneUpdates array
      const characterSceneUpdates = Array.isArray(typedObject.characterSceneUpdates)
        ? typedObject.characterSceneUpdates.filter(
            (item) => item.characterName && item.scene,
          )
        : [];

      const output: WorldAgentOutput = {
        worldContextUpdates,
        characterSceneUpdates,
      };

      // Validate output structure
      const isValid = validateWorldAgentOutput(output, input.speakerName);

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
