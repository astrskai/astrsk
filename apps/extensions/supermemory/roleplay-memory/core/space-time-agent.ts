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
  currentTime?: string;               // Current time period (e.g., "Morning Day 1") - prevents time travel backwards
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
    "CRITICAL: NEVER use generic placeholders like 'Unknown Location', 'Unknown', or 'Unspecified'. " +
    "ALWAYS infer a specific, creative location based on: time of day, setting context, character actions, available scene pool. " +
    "When message doesn't specify location: infer logical place for that time/context (e.g., 'Evening' school setting = 'School Entrance', 'Courtyard', 'Hallway'). " +
    "Prefer existing scenes from Scene Pool when appropriate, but create new specific locations when needed."
  ),
});

// ============================================================================
// Prompt Template
// ============================================================================

function buildSpaceTimeAgentPrompt(input: SpaceTimeAgentInput): string {
  const { generatedMessage, recentMessages, scenePool, speakerName, currentScene, currentTime } = input;

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

  // Format current scene and time
  const currentSceneText = currentScene || "Unknown (this is the first scene)";
  const currentTimeText = currentTime || "Unknown (this is the first time period)";

  return `You are a Space-Time Agent that tracks WHERE and WHEN conversations happen in a roleplay.

Your job is to analyze the current message and determine the TIME and LOCATION in two steps:

**CURRENT TIME**: ${currentTimeText}
**CURRENT LOCATION**: ${currentSceneText}
(Characters start here - only change if they physically move)

## Step 1: Determine TIME
First, analyze WHEN this conversation is happening:
- **Time of day**: Morning, Afternoon, Evening, Night, Lunch Break, etc.
- **Day number**: Day 1, Day 2, Day 3, etc. - track narrative progression
- Format: "TimeOfDay Day#" (e.g., "Morning Day 1", "Afternoon Day 2")

**CRITICAL - Time Progression Rules:**
- **Time can ONLY move FORWARD, never backwards**
- Current time is: "${currentTimeText}"
- Within the same day, time sequence: Morning → Lunch Break → Afternoon → Evening → Night
- Next day should increment: "Night Day 1" → "Morning Day 2"
- **DO NOT** go back from Afternoon to Morning on the same day
- **DO NOT** go back from Day 2 to Day 1
- If message doesn't indicate time passage, keep current time: "${currentTimeText}"

## Step 2: Determine LOCATION (using the time context)
After determining the time, identify WHERE this conversation is happening:
- Be **specific** about location (not just "school" but "Classroom" or "Cafeteria")
- Use **consistent naming** - look at the scene pool to see if this location already exists
- Consider the time context to help determine the appropriate location

**CRITICAL - NEVER Use Generic Placeholders:**
- ❌ NEVER output "Unknown Location", "Unknown", "Unspecified", or any generic placeholder
- ✅ ALWAYS infer a specific, creative location from context
- If message doesn't specify location → use time, setting, character actions to infer logical place
- Examples of good inference:
  * "Evening" at school + greeting → "School Entrance", "Courtyard", or "Hallway" (select from pool)
  * "Morning" + no location specified → "Classroom 2-A" (from pool) or "Homeroom"
  * "Night" + casual setting → "Dorm Room", "Park Bench", "Convenience Store"
- Check Scene Pool first - prefer existing scenes when appropriate
- If no pool scene fits, create a NEW specific location (not "Unknown")

**CRITICAL - Time-Based Location Inference:**
- When **significant time has passed** (day changed, or multiple periods skipped):
  - DON'T just keep the previous location if it doesn't make sense
  - INFER a logical new location based on the new time and context
  - Examples:
    * Previous: "Morning Day 1" at "Classroom", Now: "Evening Day 2" → likely "Hallway" or "School Entrance" (from pool)
    * Previous: "Afternoon Day 1" at "School", Now: "Morning Day 2" → "Classroom 2-A" or "Hallway" (from pool)
    * Message: "a day has passed, hi again" at Evening → infer "School Entrance" or "Courtyard" (meeting place)
- When **no significant time passed** (same time or next period):
  - Keep previous location unless physical movement is indicated

**CRITICAL - Physical Movement Rule:**
- Characters must **PHYSICALLY MOVE** to create a new scene
- **Suggestions, invitations, plans, or talking about going somewhere** = STAY in current scene (NO movement yet)
  - [NO] "Let's go to the hallway" = Still in current location (just a suggestion)
  - [NO] "Should we head outside?" = Still in current location (just a question)
  - [NO] "I want to check the cafeteria" = Still in current location (just a desire)
  - [NO] "Do you want to grab a bite?" = Still in current location (just an invitation)
  - [NO] "Want to get pizza?" = Still in current location (just an offer)
  - [NO] "Let's meet at the cafeteria" = Still in current location (making plans, not there yet)
- **Physical movement indicators** = NEW scene (actual movement happened)
  - [YES] "walked to the hallway" = Now in Hallway
  - [YES] "They entered the cafeteria" = Now in Cafeteria
  - [YES] "arrived at the park" = Now in Park
  - [YES] "standing outside the classroom" = Now in Hallway (infer logical location)
  - [YES] "We went to get pizza" = Now in Cafeteria/Restaurant (movement completed)
- **IMPORTANT**: Only change time/location if movement ALREADY HAPPENED in the message
  - Talking about future plans = NO change
  - Movement already occurred = YES change
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
   - **CRITICAL**: NEVER use "Unknown Location", "Unknown", or any generic placeholder
   - **IMPORTANT**: Only change location if the message shows PHYSICAL MOVEMENT (walked, entered, arrived, standing at)
   - If characters just TALK ABOUT going somewhere, keep the current location from Scene Pool
   - If "outside [location]" is mentioned, infer the logical adjacent location (e.g., "outside classroom" → "Hallway")
   - **WHEN SIGNIFICANT TIME PASSED**: Infer a logical new location based on time context
     * Check Scene Pool first - select appropriate existing scene
     * If no scene fits, create NEW specific location (e.g., "School Entrance", "Courtyard", "Cafeteria")
     * Use time of day to guide inference (Evening = departure/meeting places, Morning = arrival places, etc.)`;
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

  // DEBUG: Print current time and scene being passed in
  console.log("\n━━━━━━━━ SPACE-TIME AGENT INPUT DEBUG ━━━━━━━━");
  console.log(`Current Time: ${input.currentTime || '(not set)'}`);
  console.log(`Current Scene: ${input.currentScene || '(not set)'}`);
  console.log(`Scene Pool:`, input.scenePool);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = buildSpaceTimeAgentPrompt(input);

      // DEBUG: Print the full prompt being sent to LLM
      console.log("\n━━━━━━━━ SPACE-TIME AGENT PROMPT DEBUG ━━━━━━━━");
      console.log(prompt);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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

      // DEBUG: Print Space-Time Agent output
      console.log("\n━━━━━━━━ SPACE-TIME AGENT OUTPUT DEBUG ━━━━━━━━");
      console.log(`Selected Time: ${output.selected_time}`);
      console.log(`Action: ${output.action}`);
      console.log(`Selected Scene: ${output.selected_scene}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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
