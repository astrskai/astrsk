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
}

export interface SpaceTimeAgentOutput {
  action: "select" | "new";           // Whether selecting existing or creating new
  scene: string;                      // The scene name
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
  action: z.enum(["select", "new"]).describe(
    "Whether you are selecting an existing scene from the pool or creating a new scene"
  ),
  scene: z.string().describe(
    "The scene name in format: 'Location TimeOfDay Day#'. " +
    "If action='select', this MUST be one of the scenes from the Existing Scenes list. " +
    "If action='new', this is a new scene name you are creating."
  ),
});

// ============================================================================
// Prompt Template
// ============================================================================

function buildSpaceTimeAgentPrompt(input: SpaceTimeAgentInput): string {
  const { generatedMessage, recentMessages, scenePool, speakerName } = input;

  // Format scene pool
  const scenePoolFormatted = scenePool.length > 0
    ? scenePool.map((scene, idx) => `${idx + 1}. "${scene}"`).join("\n")
    : "(Empty - this will be the first scene)";

  // Format recent messages
  const recentMessagesFormatted = recentMessages.length > 0
    ? recentMessages.map((msg, idx) =>
        `${idx + 1}. ${msg.role === "user" ? "User" : "Character"}: ${msg.content}`
      ).join("\n")
    : "(No recent messages)";

  return `You are a Space-Time Agent that tracks WHERE and WHEN conversations happen in a roleplay.

Your job is to analyze the current message and determine what scene it belongs to.

## Scene Format
A scene is a plain English description of: **Location + Time Period**

Examples:
- "Classroom Morning Day 1"
- "School Hallway Lunch Break Day 1"
- "Park Afternoon Day 2"
- "Alice's House Evening Day 2"
- "Coffee Shop Night Day 3"

## Guidelines
1. Be **specific** about location (not just "school" but "Classroom" or "Cafeteria")
2. Include **time of day** (Morning, Afternoon, Evening, Night, Lunch Break, etc.)
3. Include **day number** (Day 1, Day 2, etc.) - track narrative progression
4. Use **consistent naming** - if a location was called "Classroom" before, keep calling it "Classroom"
5. **Prefer selecting existing scenes** when the conversation continues in the same place/time
6. **Create new scenes** when:
   - Location changes (character moves to different place)
   - Time advances significantly (morning → afternoon, today → tomorrow)
   - Message explicitly indicates scene change

## Existing Scenes (Scene Pool)
${scenePoolFormatted}

## Recent Conversation
${recentMessagesFormatted}

## New Message
Speaker: ${speakerName}
Content: ${generatedMessage}

## Task
Determine the scene for this message.

**Output TWO fields:**
1. **action**: Either "select" or "new"
   - "select" = Choose an existing scene from the Scene Pool above
   - "new" = Create a new scene (location or time has changed)

2. **scene**: The scene name
   - If action="select": MUST be EXACTLY one of the scenes from the Scene Pool (copy it exactly as written)
   - If action="new": Create a new scene name following the format guidelines

**IMPORTANT**: If you choose action="select", the scene name MUST match one of the scenes in the Scene Pool exactly!`;
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
        action: response.action,
        scene: response.scene,
      };

      logger.info(`   Agent Output: action="${output.action}", scene="${output.scene}"`);

      // Validation: If action is "select", scene MUST exist in pool
      if (output.action === "select") {
        if (!input.scenePool.includes(output.scene)) {
          logger.warn(
            `⚠️ [Space-Time Agent] Retry ${attempt + 1}/${maxRetries}: ` +
            `Agent said "select" but scene "${output.scene}" not in pool.`
          );
          logger.warn(`   Available scenes: ${input.scenePool.join(", ")}`);

          if (attempt < maxRetries - 1) {
            // Retry with enhanced prompt
            continue;
          } else {
            // Max retries reached - force to "new"
            logger.warn(
              `⚠️ [Space-Time Agent] Max retries reached. ` +
              `Forcing action to "new" for scene: ${output.scene}`
            );
            return {
              action: "new",
              scene: output.scene,
            };
          }
        }
      }

      // Valid output
      if (output.action === "select") {
        logger.info(`✅ [Space-Time Agent] Selected existing scene: "${output.scene}"`);
      } else {
        logger.info(`🆕 [Space-Time Agent] Creating new scene: "${output.scene}"`);
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
          action: "new",
          scene: `Unknown Location Day 1`,
        };
      }
    }
  }

  throw new Error("Space-Time Agent failed after max retries");
}
