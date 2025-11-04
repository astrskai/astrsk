/**
 * Space-Time Agent
 *
 * Analyzes messages to identify WHERE and WHEN conversations happen.
 * Outputs a scene name that represents the location and time.
 *
 * This agent runs BEFORE World Agent to establish scene context.
 */

import { z } from "zod";
import { logger } from "../../shared/logger";

// ============================================================================
// Types
// ============================================================================

export interface SpaceTimeAgentInput {
  generatedMessage: string;           // The new message to analyze
  recentMessages: Array<{             // Last 5 messages for context
    role: "user" | "assistant";
    content: string;
  }>;
  scenePool: string[];                // Existing scenes (max 20)
  speakerName: string;                // Who spoke this message
  currentScene?: string;              // Current scene/location (if known)
}

export interface SpaceTimeAgentOutput {
  selected_time: string;              // Time period (e.g., "Morning Day 1", "Afternoon Day 2")
  action: "select" | "new";           // Whether selecting existing or creating new scene
  selected_scene: string;             // Scene/Location (e.g., "Classroom", "Park", "Coffee Shop")
}

export type CallAIFunction = (params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  response_format?: { type: string; schema: any };
}) => Promise<any>;

// ============================================================================
// Zod Schema for Structured Output
// ============================================================================

const spaceTimeAgentSchema = z.object({
  selected_time: z.string().describe(
    "The time period in format: 'TimeOfDay Day#' (e.g., 'Morning Day 1', 'Afternoon Day 2', 'Evening Day 3'). " +
    "First determine when this conversation is happening based on the narrative progression and context."
  ),
  action: z.enum(["select", "new"]).describe(
    "Set to 'select' if the selected_scene matches an existing scene from the Scene Pool. " +
    "Set to 'new' if the selected_scene is a new location not in the Scene Pool."
  ),
  selected_scene: z.string().describe(
    "The specific scene/location where this conversation is happening (e.g., 'Classroom', 'Park', 'Coffee Shop', 'Alice's House'). " +
    "Be specific about the location. Use the selected_time to help determine the appropriate scene."
  ),
});

// ============================================================================
// Prompt Template
// ============================================================================

function buildSpaceTimeAgentPrompt(input: SpaceTimeAgentInput): string {
  const { generatedMessage, recentMessages, scenePool, speakerName, currentScene } = input;

  // Format scene pool for reference
  const scenePoolFormatted = scenePool.length > 0
    ? scenePool.map((scene, idx) => `${idx + 1}. "${scene}"`).join("\n")
    : "(Empty - this will be the first scene)";

  // Format recent messages
  const recentMessagesFormatted = recentMessages.length > 0
    ? recentMessages.map((msg, idx) =>
        `${idx + 1}. ${msg.role === "user" ? "User" : "Character"}: ${msg.content}`
      ).join("\n")
    : "(No recent messages)";

  // Format current scene
  const currentSceneText = currentScene || "Unknown (this is the first scene)";

  return `You are a Space-Time Agent that tracks WHERE and WHEN conversations happen in a roleplay.

Your job is to analyze the current message and determine the TIME and LOCATION in two steps:

**CURRENT LOCATION**: ${currentSceneText}
(Characters start here - only change if they physically move)

## Step 1: Determine TIME
First, analyze WHEN this conversation is happening:
- **Time of day**: Morning, Afternoon, Evening, Night, Lunch Break, etc.
- **Day number**: Day 1, Day 2, Day 3, etc. - track narrative progression
- Format: "TimeOfDay Day#" (e.g., "Morning Day 1", "Afternoon Day 2")

## Step 2: Determine LOCATION (using the time context)
After determining the time, identify WHERE this conversation is happening:
- Be **specific** about location (not just "school" but "Classroom" or "Cafeteria")
- Use **consistent naming** - look at the scene pool to see if this location already exists
- Consider the time context to help determine the appropriate location

**CRITICAL - Physical Movement Rule:**
- Characters must **PHYSICALLY MOVE** to create a new scene
- **Suggestions, plans, or talking about going somewhere** = STAY in current scene
  - [NO] "Let's go to the hallway" = Still in current location
  - [NO] "Should we head outside?" = Still in current location
  - [NO] "I want to check the cafeteria" = Still in current location
- **Physical movement indicators** = NEW scene
  - [YES] "walked to the hallway" = Now in Hallway
  - [YES] "They entered the cafeteria" = Now in Cafeteria
  - [YES] "arrived at the park" = Now in Park
  - [YES] "standing outside the classroom" = Now in Hallway (infer logical location)
- When physical movement occurs, **extract the actual destination** (e.g., "outside classroom" → "Hallway")

## Existing Scenes (Scene Pool)
${scenePoolFormatted}

## Recent Conversation
${recentMessagesFormatted}

## New Message
Speaker: ${speakerName}
Content: ${generatedMessage}

## Task
Analyze the message and output THREE fields:

1. **selected_time**: The time period in format "TimeOfDay Day#"
   - Example: "Morning Day 1", "Afternoon Day 2", "Evening Day 3"

2. **action**: Verification field
   - Set to "select" if your selected_scene (location name only) already appears in any of the scenes from the Scene Pool above
   - Set to "new" if your selected_scene is a new location not seen in the Scene Pool
   - Note: Characters can be in the same location at different times, so only check the location name

3. **selected_scene**: The specific location name
   - Example: "Classroom", "Park", "Coffee Shop", "Alice's House"
   - Use consistent naming with existing locations from the Scene Pool when appropriate
   - **IMPORTANT**: Only change location if the message shows PHYSICAL MOVEMENT (walked, entered, arrived, standing at)
   - If characters just TALK ABOUT going somewhere, keep the current location from Scene Pool
   - If "outside [location]" is mentioned, infer the logical adjacent location (e.g., "outside classroom" → "Hallway")`;
}

// ============================================================================
// Execution with Validation & Retry
// ============================================================================

export async function executeSpaceTimeAgent(
  input: SpaceTimeAgentInput,
  callAI: CallAIFunction,
  maxRetries: number = 2
): Promise<SpaceTimeAgentOutput> {
  logger.info(`🌍 [Space-Time Agent] Analyzing scene...`);
  logger.info(`   Speaker: ${input.speakerName}`);
  logger.info(`   Message: ${input.generatedMessage.substring(0, 100)}...`);
  logger.info(`   Scene Pool Size: ${input.scenePool.length}`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = buildSpaceTimeAgentPrompt(input);

      // Call LLM with structured output
      // Use Gemini 2.5 Flash for consistency with World Agent (fast and cost-efficient)
      const response = await callAI({
        model: "openai-compatible:google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          schema: spaceTimeAgentSchema,
        },
      });

      const output: SpaceTimeAgentOutput = {
        selected_time: response.selected_time,
        action: response.action,
        selected_scene: response.selected_scene,
      };

      logger.info(`   Agent Output: selected_time="${output.selected_time}", action="${output.action}", selected_scene="${output.selected_scene}"`);

      // Validation: If action is "select", scene name MUST exist in pool (checking location only, not time)
      if (output.action === "select") {
        // Check if any scene in the pool contains this location name
        const sceneExists = input.scenePool.some(poolScene =>
          poolScene.includes(output.selected_scene)
        );

        if (!sceneExists) {
          logger.warn(
            `⚠️ [Space-Time Agent] Retry ${attempt + 1}/${maxRetries}: ` +
            `Agent said "select" but scene "${output.selected_scene}" not in pool.`
          );
          logger.warn(`   Available scenes: ${input.scenePool.join(", ")}`);

          if (attempt < maxRetries - 1) {
            // Retry with enhanced prompt
            continue;
          } else {
            // Max retries reached - force to "new"
            logger.warn(
              `⚠️ [Space-Time Agent] Max retries reached. ` +
              `Forcing action to "new" for scene: ${output.selected_scene}`
            );
            return {
              selected_time: output.selected_time,
              action: "new",
              selected_scene: output.selected_scene,
            };
          }
        }
      }

      // Valid output
      if (output.action === "select") {
        logger.info(`✅ [Space-Time Agent] Selected existing scene: "${output.selected_scene}" at time: "${output.selected_time}"`);
      } else {
        logger.info(`🆕 [Space-Time Agent] Creating new scene: "${output.selected_scene}" at time: "${output.selected_time}"`);
      }

      return output;

    } catch (error) {
      logger.error(`[Space-Time Agent] Error on attempt ${attempt + 1}:`, error);

      if (attempt < maxRetries - 1) {
        continue; // Retry
      } else {
        // Fallback: Create a default scene
        logger.error(`[Space-Time Agent] All retries failed. Using fallback scene.`);
        return {
          selected_time: "Unknown Time Day 1",
          action: "new",
          selected_scene: "Unknown Location",
        };
      }
    }
  }

  throw new Error("Space-Time Agent failed after max retries");
}
