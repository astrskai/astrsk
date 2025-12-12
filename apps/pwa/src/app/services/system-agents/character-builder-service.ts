/**
 * Character Builder Service
 *
 * AI-powered character generation using Vercel AI SDK with tool calling.
 * The agent can create character cards through defined tools.
 */

import { streamText, generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { useModelStore, type DefaultModelSelection, getAstrskAiModel, SPECIFIC_MODELS } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel, shouldUseNonStreamingForTools } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

/**
 * Lorebook entry data for character creation/editing
 */
export interface CharacterLorebookEntry {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

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
  lorebook?: CharacterLorebookEntry[];
  /** Source of character: "session" (editable) or "library" (read-only) */
  source?: "session" | "library";
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

interface LorebookEntryResult {
  success: boolean;
  entry?: CharacterLorebookEntry;
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

  // Add current characters list with source type (SESSION = editable, LIBRARY = read-only)
  if (currentCharacters.length > 0) {
    const sessionChars = currentCharacters.filter((c) => c.source === "session");
    const libraryChars = currentCharacters.filter((c) => c.source === "library");

    contextSection += `\n\n## Current Characters (${currentCharacters.length} total):`;

    if (sessionChars.length > 0) {
      contextSection += `\n\n### SESSION Characters (Editable):`;
      sessionChars.forEach((char) => {
        const idInfo = char.id ? ` - ID: \`${char.id}\`` : "";
        contextSection += `\n- [SESSION]${idInfo} "${char.name}"`;
      });
    }

    if (libraryChars.length > 0) {
      contextSection += `\n\n### LIBRARY Characters (Read-Only):`;
      libraryChars.forEach((char) => {
        contextSection += `\n- [LIBRARY] "${char.name}" (cannot be modified)`;
      });
    }
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
1. **query_character_details** - Get full details of a character by ID (description, tags, lorebook, etc.)
2. **create_character** - Create a new character with specified details
3. **update_character** - Update an existing character's details (name, description, tags, summary, dialogue)
4. **add_lorebook_entry** - Add a new lorebook entry to a character
5. **update_lorebook_entry** - Update an existing lorebook entry
6. **remove_lorebook_entry** - Remove a lorebook entry from a character

## Character Creation Guidelines:

### Name:
- Create a fitting, memorable name for the character
- Match the setting/genre (fantasy names for fantasy, etc.)

### Description:
- Write in second person or third person
- Include physical appearance, personality, background
- Keep it concise but evocative (100-300 words)
- Focus on distinctive traits and quirks

**Template Variables for Descriptions - ONLY THESE ARE ALLOWED:**
You can use these two template variables to reference past interactions in character descriptions:
1. \`{{user.name}}\` - The user/player character's name
2. \`{{char.name}}\` - This AI character's own name (the character being described)

Use these to describe past interactions or relationships between the user and this character.
Example: "{{char.name}} remembers the time {{user.name}} saved them from danger..."

**FORBIDDEN VARIABLES:**
- DO NOT use any other template variables (e.g., \`{{health}}\`, \`{{location}}\`, \`{{trust}}\`, \`{{other_character.name}}\`, etc.)
- DO NOT create custom variables or assume other data exists
- These are the ONLY two variables available in character descriptions

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
When you need to see full details of a character (to edit or add lorebook):
- Use **query_character_details** with the character's ID
- This returns: name, description, tags, cardSummary, exampleDialogue, lorebook entries

## Editing vs. Creating:
When the user asks to modify an existing character:
- First use **query_character_details** to see current state (including lorebook)
- Use **update_character** with the existing character's ID (shown in Current Characters list)
- DO NOT create duplicates - always update existing characters when asked to edit them

## SESSION vs LIBRARY - Character Edit Rules:

### SESSION Characters [SESSION] - Fully Editable:
- Characters created via chat or import are marked [SESSION]
- You CAN modify all their properties using update_character tool
- You CAN add/update/remove their lorebook entries
- Always use the character's ID from the Current Characters list

### LIBRARY Characters [LIBRARY] - Read-Only:
- Characters from the user's permanent library are marked [LIBRARY]
- These are shared templates that CANNOT be modified
- If user asks to edit a LIBRARY character, respond:
  "This character is from your Library and cannot be modified here. Library characters are read-only templates. If you'd like a customized version, I can create a new SESSION character based on them!"

### Editable Elements (SESSION characters only):
- Name, Description, Tags, Card Summary, Example Dialogue
- Lorebook entries (add/update/remove)

### Non-Editable via Chat:
- Character images - Guide user: "To change the character image, use the Edit button (pencil icon) on the character card in the Library panel."
- LIBRARY character data - Suggest creating a SESSION copy instead

## Lorebook Management:
Lorebook entries are character-specific knowledge that gets injected into context when triggered by keywords.
- **Adding entries**: Use **add_lorebook_entry** with the character's ID
- **Updating entries**: First query to get entry IDs, then use **update_lorebook_entry**
- **Removing entries**: Use **remove_lorebook_entry** with character ID and entry ID

### Lorebook Entry Structure:
- **name**: Entry title (e.g., "Character's Secret Past")
- **keys**: Trigger keywords as array (e.g., ["past", "history", "secret"])
- **content**: The lore content to inject when triggered
- **recallRange**: How many messages back to scan for triggers (default: 1000)
- **enabled**: Whether the entry is active (default: true)

## After Completing Tasks:
Keep your completion response SHORT and CONCISE (1-2 sentences max).
- Good: "Done! Created Kira, a cyberpunk hacker with a sharp tongue."
- Good: "Updated the description. Anything else?"
- Bad: Long paragraphs summarizing all the character's traits and backstory
- Bad: Repeating the full description or lorebook content back to the user

Only offer to add lorebook entries if the user asks about it or seems unsure.

## SCOPE LIMITATION - Step Navigation Guide:
You are ONLY responsible for character-related tasks in the Cast step. Guide users to the appropriate step for other topics:

### This Step (Cast) - Character Building:
- Creating new characters
- Editing SESSION character details (name, description, tags, summary, dialogue)
- Managing character-specific lorebook entries
- Querying character information

### Previous Step (Scenario) - World Building:
If user asks about: background, setting, world lore, scenario lorebook, story setup
- Reply: "That's handled in the **Scenario step**! You can navigate back to modify the scenario background or world lorebook. Note: Each character can have their own personal lorebook entries here in the Cast step."

### Next Step (Stats) - Game Mechanics:
If user asks about: stats, variables, health, trust, attributes, game rules, tracking values
- Reply: "Stats and variables are managed in the **Stats step**, which comes after Cast. You'll be able to define custom stats like health, trust, or any other trackable values there!"

### Out of Scope:
If user asks about unrelated topics (weather, coding, general knowledge, etc.)
- Reply: "I'm your character creation assistant! I can help you create or edit characters for your session. What kind of character would you like to create?"

Stay focused on character building and character lorebook only.${contextSection}`;
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
      description: "Update an existing SESSION character by ID. LIBRARY characters cannot be modified. Use this to edit a character's details instead of creating a duplicate.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the character to update (must be a SESSION character)"),
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

        // Block modifications to LIBRARY characters
        if (character.source === "library") {
          return {
            success: false,
            message: `Cannot modify "${character.name}" - this is a LIBRARY character (read-only). Library characters are shared templates. To customize, create a new SESSION character based on them.`,
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

    add_lorebook_entry: tool({
      description: "Add a new lorebook entry to a SESSION character. LIBRARY characters cannot be modified.",
      inputSchema: z.object({
        characterId: z.string().describe("The ID of the character to add the lorebook entry to (must be a SESSION character)"),
        name: z.string().describe("Title of the lorebook entry (e.g., 'Character's Secret Past')"),
        keys: z.array(z.string()).describe("Trigger keywords that activate this entry (e.g., ['past', 'history', 'secret'])"),
        content: z.string().describe("The lore content to inject when triggered"),
        recallRange: z.number().optional().describe("How many messages back to scan for triggers (default: 1000)"),
        enabled: z.boolean().optional().describe("Whether the entry is active (default: true)"),
      }),
      execute: async ({ characterId, name, keys, content, recallRange, enabled }): Promise<LorebookEntryResult> => {
        const character = currentCharacters.find((c) => c.id === characterId);
        if (!character) {
          return {
            success: false,
            message: `Character with ID "${characterId}" not found.`,
          };
        }

        // Block modifications to LIBRARY characters
        if (character.source === "library") {
          return {
            success: false,
            message: `Cannot add lorebook to "${character.name}" - this is a LIBRARY character (read-only). To add custom lore, create a SESSION character based on them.`,
          };
        }

        const newEntry: CharacterLorebookEntry = {
          id: crypto.randomUUID(),
          name,
          keys,
          content,
          recallRange: recallRange ?? 1000,
          enabled: enabled ?? true,
        };

        // Get existing lorebook or create empty array
        const existingLorebook = character.lorebook || [];
        const updatedLorebook = [...existingLorebook, newEntry];

        callbacks.onUpdateCharacter(characterId, { lorebook: updatedLorebook });

        return {
          success: true,
          entry: newEntry,
          message: `Lorebook entry "${name}" added to "${character.name}".`,
        };
      },
    }),

    update_lorebook_entry: tool({
      description: "Update an existing lorebook entry on a SESSION character. LIBRARY characters cannot be modified. First use query_character_details to get the entry IDs.",
      inputSchema: z.object({
        characterId: z.string().describe("The ID of the character (must be a SESSION character)"),
        entryId: z.string().describe("The ID of the lorebook entry to update"),
        name: z.string().optional().describe("New title for the entry"),
        keys: z.array(z.string()).optional().describe("New trigger keywords"),
        content: z.string().optional().describe("New lore content"),
        recallRange: z.number().optional().describe("New recall range"),
        enabled: z.boolean().optional().describe("Enable or disable the entry"),
      }),
      execute: async ({ characterId, entryId, name, keys, content, recallRange, enabled }): Promise<UpdateCharacterResult> => {
        const character = currentCharacters.find((c) => c.id === characterId);
        if (!character) {
          return {
            success: false,
            message: `Character with ID "${characterId}" not found.`,
          };
        }

        // Block modifications to LIBRARY characters
        if (character.source === "library") {
          return {
            success: false,
            message: `Cannot modify lorebook of "${character.name}" - this is a LIBRARY character (read-only).`,
          };
        }

        if (!character.lorebook || character.lorebook.length === 0) {
          return {
            success: false,
            message: `Character "${character.name}" has no lorebook entries.`,
          };
        }

        const entryIndex = character.lorebook.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) {
          return {
            success: false,
            message: `Lorebook entry with ID "${entryId}" not found in "${character.name}".`,
          };
        }

        const existingEntry = character.lorebook[entryIndex];
        const updatedEntry: CharacterLorebookEntry = {
          ...existingEntry,
          ...(name !== undefined && { name }),
          ...(keys !== undefined && { keys }),
          ...(content !== undefined && { content }),
          ...(recallRange !== undefined && { recallRange }),
          ...(enabled !== undefined && { enabled }),
        };

        const updatedLorebook = [...character.lorebook];
        updatedLorebook[entryIndex] = updatedEntry;

        callbacks.onUpdateCharacter(characterId, { lorebook: updatedLorebook });

        return {
          success: true,
          message: `Lorebook entry "${updatedEntry.name}" has been updated.`,
        };
      },
    }),

    remove_lorebook_entry: tool({
      description: "Remove a lorebook entry from a SESSION character. LIBRARY characters cannot be modified.",
      inputSchema: z.object({
        characterId: z.string().describe("The ID of the character (must be a SESSION character)"),
        entryId: z.string().describe("The ID of the lorebook entry to remove"),
      }),
      execute: async ({ characterId, entryId }): Promise<UpdateCharacterResult> => {
        const character = currentCharacters.find((c) => c.id === characterId);
        if (!character) {
          return {
            success: false,
            message: `Character with ID "${characterId}" not found.`,
          };
        }

        // Block modifications to LIBRARY characters
        if (character.source === "library") {
          return {
            success: false,
            message: `Cannot modify lorebook of "${character.name}" - this is a LIBRARY character (read-only).`,
          };
        }

        if (!character.lorebook || character.lorebook.length === 0) {
          return {
            success: false,
            message: `Character "${character.name}" has no lorebook entries.`,
          };
        }

        const entryIndex = character.lorebook.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) {
          return {
            success: false,
            message: `Lorebook entry with ID "${entryId}" not found in "${character.name}".`,
          };
        }

        const entryName = character.lorebook[entryIndex].name;
        const updatedLorebook = character.lorebook.filter((e) => e.id !== entryId);

        callbacks.onUpdateCharacter(characterId, { lorebook: updatedLorebook });

        return {
          success: true,
          message: `Lorebook entry "${entryName}" has been removed from "${character.name}".`,
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
  // Get Gemini 2.5 Flash model specifically for session creation
  const geminiFlashModel = await getAstrskAiModel(SPECIFIC_MODELS.SESSION_CREATION);

  if (!geminiFlashModel) {
    throw new Error("Gemini 2.5 Flash is required for session creation. Please ensure astrsk.ai provider is configured.");
  }

  const defaultModel: DefaultModelSelection = geminiFlashModel;

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

  // Track all tool results across steps (declare outside try block for catch access)
  const allToolResults: unknown[] = [];

  try {
    // Check if this model needs non-streaming approach for tool calling
    const useNonStreaming = shouldUseNonStreamingForTools(
      apiConnection.source,
      defaultModel.modelId
    );

    if (useNonStreaming) {
      // Use non-streaming generateText (model requires it)
      const result = await generateText({
        model,
        messages: formattedMessages,
        tools,
        stopWhen: stepCountIs(3), // Allow up to 3 tool calls
        abortSignal,
      });

      // Collect all tool results
      if (result.toolResults && result.toolResults.length > 0) {
        allToolResults.push(...result.toolResults);
      }

      const finalText = result.text || "";

      return {
        text: finalText,
        toolResults: allToolResults,
      };
    } else {
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
          }
        },
      });

      // Wait for the stream to complete and get final text
      const text = await result.text;

      return {
        text,
        toolResults: allToolResults,
      };
    }
  } catch (error) {
    // Check if this is a non-fatal Vertex AI metadata-only response error
    const isVertexMetadataError =
      error instanceof Error &&
      error.message?.includes("Invalid input: expected array, received undefined") &&
      error.message?.includes("candidates") &&
      allToolResults.length > 0; // We have successful tool results

    if (isVertexMetadataError) {
      // Return what we have - the tool calls succeeded
      return {
        text: "",
        toolResults: allToolResults,
      };
    }

    logger.error("[CharacterBuilder] Error generating response", error);
    throw error;
  }
}
