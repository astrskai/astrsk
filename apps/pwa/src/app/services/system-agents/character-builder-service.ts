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
  id?: string; // ID for locally created characters that can be edited
  name: string;
  description: string;
  tags?: string[];
  cardSummary?: string;
  exampleDialogue?: string;
}

/**
 * Scenario context for character generation
 */
export interface ScenarioContext {
  background?: string;
  firstMessages?: Array<{ title: string; content: string }>;
}

/**
 * Tool result types
 */
interface CreateCharacterResult {
  success: boolean;
  character?: CharacterData;
  message: string;
}

interface UpdateCharacterResult {
  success: boolean;
  message: string;
}

interface QueryCharacterResult {
  success: boolean;
  character?: CharacterData;
  message: string;
}

/**
 * Build system prompt for character generation with scenario context
 */
function buildSystemPrompt(scenarioContext: ScenarioContext, currentCharacters: CharacterData[]): string {
  let contextSection = "";

  // Add scenario context if available
  if (scenarioContext.background && scenarioContext.background.trim()) {
    contextSection += `\n\n## Scenario Context:\n${scenarioContext.background.substring(0, 500)}${scenarioContext.background.length > 500 ? "..." : ""}`;
  }

  if (scenarioContext.firstMessages && scenarioContext.firstMessages.length > 0) {
    contextSection += `\n\n## Starting Situations:`;
    scenarioContext.firstMessages.slice(0, 3).forEach((msg, i) => {
      contextSection += `\n${i + 1}. "${msg.title}": ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`;
    });
  }

  // Add current characters list (IDs and names only - use query tool for details)
  if (currentCharacters.length > 0) {
    contextSection += `\n\n## Current Characters (${currentCharacters.length}):`;
    currentCharacters.forEach((char, i) => {
      const idInfo = char.id ? ` - ID: \`${char.id}\`` : "";
      contextSection += `\n${i + 1}${idInfo} - "${char.name}"`;
    });
  }

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

## Your Tools:
1. **query_character_details** - Get full details of a character by ID (description, tags, etc.)
2. **create_character** - Create a new character with specified details
3. **update_character** - Update an existing character's details (name, description, tags, summary, dialogue)

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

## Querying Character Details:
When you need to see full details of a character (to edit):
- Use **query_character_details** with the character's ID
- This returns: name, description, tags, cardSummary, exampleDialogue

## Editing vs. Creating:
When the user asks to modify an existing character:
- First use **query_character_details** to see current state
- Use **update_character** with the existing character's ID (shown in Current Characters list)
- DO NOT create duplicates - always update existing characters when asked to edit them

## After creating:
Briefly summarize the character and ask if they want any changes.${contextSection}`;
}

/**
 * Create character builder tools with callbacks
 */
function createCharacterTools(
  currentCharacters: CharacterData[],
  callbacks: {
    onCreateCharacter: (character: CharacterData) => void;
    onUpdateCharacter: (id: string, updates: Partial<CharacterData>) => void;
  },
) {
  return {
    query_character_details: tool({
      description: "Get full details of a character by ID. Use this to see the complete character before editing or adding lorebook entries.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the character to query"),
      }),
      execute: async ({ id }): Promise<QueryCharacterResult> => {
        const character = currentCharacters.find((c) => c.id === id);
        if (!character) {
          return {
            success: false,
            message: `Character with ID "${id}" not found.`,
          };
        }

        return {
          success: true,
          character,
          message: `Retrieved details for "${character.name}".`,
        };
      },
    }),

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
          id: crypto.randomUUID(), // Generate ID for locally created character
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

    update_character: tool({
      description: "Update an existing locally-created character by ID. Use this to edit a character's details instead of creating a duplicate.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the character to update"),
        name: z.string().optional().describe("New name for the character (leave empty to keep current)"),
        description: z.string().optional().describe("New description (leave empty to keep current)"),
        tags: z.array(z.string()).optional().describe("New tags (leave empty to keep current)"),
        cardSummary: z.string().optional().describe("New summary (leave empty to keep current)"),
        exampleDialogue: z.string().optional().describe("New example dialogue (leave empty to keep current)"),
      }),
      execute: async ({ id, name, description, tags, cardSummary, exampleDialogue }): Promise<UpdateCharacterResult> => {
        const character = currentCharacters.find((c) => c.id === id);
        if (!character) {
          return {
            success: false,
            message: `Character with ID "${id}" not found.`,
          };
        }

        const updates: Partial<CharacterData> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (tags !== undefined) updates.tags = tags;
        if (cardSummary !== undefined) updates.cardSummary = cardSummary;
        if (exampleDialogue !== undefined) updates.exampleDialogue = exampleDialogue;

        callbacks.onUpdateCharacter(id, updates);
        return {
          success: true,
          message: `Character "${character.name}" has been updated.`,
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
  scenarioContext = {},
  currentCharacters = [],
  callbacks,
  abortSignal,
}: {
  messages: CharacterBuilderMessage[];
  scenarioContext?: ScenarioContext;
  currentCharacters?: CharacterData[];
  callbacks: {
    onCreateCharacter: (character: CharacterData) => void;
    onUpdateCharacter: (id: string, updates: Partial<CharacterData>) => void;
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
  const tools = createCharacterTools(currentCharacters, callbacks);

  // Format messages for AI SDK
  const systemPrompt = buildSystemPrompt(scenarioContext, currentCharacters);
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
