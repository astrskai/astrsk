/**
 * Character Builder Service
 *
 * AI-powered character generation using Vercel AI SDK with tool calling.
 * The agent can create character cards through defined tools.
 */

import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

/**
 * Character data structure for creation
 */
export interface CharacterData {
  name: string;
  description: string;
  tags?: string[];
  cardSummary?: string;
  exampleDialogue?: string;
}

/**
 * Tool result types
 */
interface CreateCharacterResult {
  success: boolean;
  character?: CharacterData;
  message: string;
}

/**
 * Build system prompt for character generation
 */
function buildSystemPrompt(): string {
  return `You are a creative character builder assistant for roleplay and storytelling.

## Your Role:
Help users create compelling, well-rounded characters for roleplay scenarios. You can create characters based on user descriptions, ideas, or even vague concepts.

## Your Approach:

### If the user's request is VAGUE:
Ask 1-2 clarifying questions about:
- Character type (hero, villain, sidekick, mysterious stranger, etc.)
- Personality traits they want
- Setting/genre context (fantasy, sci-fi, modern, etc.)

### If the user provides ENOUGH information:
Immediately create a complete character using the create_character tool.

## What counts as "enough information":
- "A mysterious elf mage" → Enough! Create it.
- "A cyberpunk hacker with attitude" → Enough! Create it.
- "A kind grandmother who secretly fights crime" → Enough! Create it.
- "Create a character" → Too vague, ask what type/personality.
- "Someone cool" → Too vague, ask for more details.

## Character Creation Guidelines:

### Name:
- Create a fitting, memorable name for the character
- Match the setting/genre (fantasy names for fantasy, etc.)

### Description:
- Write in second person or third person
- Include physical appearance, personality, background
- Keep it concise but evocative (100-300 words)
- Focus on distinctive traits and quirks

### Tags:
- Add 3-5 relevant tags for categorization
- Include genre, archetype, personality keywords
- Examples: "fantasy", "mage", "mysterious", "wise", "mentor"

### Card Summary:
- One-line summary of the character's essence
- Should capture their core identity
- Examples: "A battle-scarred warrior seeking redemption"

### Example Dialogue:
- Write 2-3 sample dialogue lines showing their voice
- Format: "Character Name: Dialogue here"
- Show their personality through speech patterns

## After creating:
Briefly summarize the character and ask if they want any changes.`;
}

/**
 * Create character builder tools with callbacks
 */
function createCharacterTools(
  callbacks: {
    onCreateCharacter: (character: CharacterData) => void;
  },
) {
  return {
    create_character: tool({
      description: "Create a new character with the specified details. Use this when you have enough information to generate a complete character.",
      inputSchema: z.object({
        name: z.string().describe("The character's name"),
        description: z.string().describe("Full character description including appearance, personality, and background"),
        tags: z.array(z.string()).optional().describe("3-5 tags for categorization"),
        cardSummary: z.string().optional().describe("One-line summary of the character"),
        exampleDialogue: z.string().optional().describe("2-3 example dialogue lines showing the character's voice"),
      }),
      execute: async ({ name, description, tags, cardSummary, exampleDialogue }): Promise<CreateCharacterResult> => {
        const character: CharacterData = {
          name,
          description,
          tags,
          cardSummary,
          exampleDialogue,
        };

        callbacks.onCreateCharacter(character);

        return {
          success: true,
          character,
          message: `Character "${name}" has been created.`,
        };
      },
    }),
  };
}

/**
 * Chat message for the character builder
 */
export interface CharacterBuilderMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate a response from the character builder agent
 */
export async function generateCharacterResponse({
  messages,
  callbacks,
  abortSignal,
}: {
  messages: CharacterBuilderMessage[];
  callbacks: {
    onCreateCharacter: (character: CharacterData) => void;
  };
  abortSignal?: AbortSignal;
}): Promise<{ text: string; toolResults: unknown[] }> {
  // Get the default lite model from store
  const modelStore = useModelStore.getState();
  const defaultModel: DefaultModelSelection | null = modelStore.defaultLiteModel;

  if (!defaultModel) {
    throw new Error("No default light model configured. Please set up a default model in Settings > Providers.");
  }

  // Get the API connection
  const connectionResult = await ApiService.getApiConnection.execute(
    new UniqueEntityID(defaultModel.apiConnectionId),
  );

  if (connectionResult.isFailure) {
    throw new Error(`Failed to get API connection: ${connectionResult.getError()}`);
  }

  const apiConnection = connectionResult.getValue();

  if (!apiConnection) {
    throw new Error("API connection not found.");
  }

  // Create the model
  const model = createLiteModel(
    apiConnection.source,
    defaultModel.modelId,
    apiConnection.apiKey || "",
    apiConnection.baseUrl,
  );

  // Create tools
  const tools = createCharacterTools(callbacks);

  // Format messages for AI SDK
  const systemPrompt = buildSystemPrompt();
  const formattedMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ];

  try {
    // Track all tool results across steps
    const allToolResults: unknown[] = [];

    // Stream response with tools
    const result = streamText({
      model,
      messages: formattedMessages,
      tools,
      stopWhen: stepCountIs(3), // Allow up to 3 tool calls
      abortSignal,
      onStepFinish: ({ toolResults }) => {
        if (toolResults && toolResults.length > 0) {
          allToolResults.push(...toolResults);
          logger.info("[CharacterBuilder] Step completed", {
            toolResultsInStep: toolResults.length,
          });
        }
      },
    });

    // Wait for the stream to complete and get final text
    const text = await result.text;

    logger.info("[CharacterBuilder] Response generated", {
      text: text?.substring(0, 100),
      totalToolResults: allToolResults.length,
    });

    return {
      text,
      toolResults: allToolResults,
    };
  } catch (error) {
    logger.error("[CharacterBuilder] Error generating response", error);
    throw error;
  }
}
