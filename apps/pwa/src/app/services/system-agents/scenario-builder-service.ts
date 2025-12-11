/**
 * Scenario Builder Service
 *
 * AI-powered scenario generation using Vercel AI SDK with tool calling.
 * The agent can create and edit scenario content through defined tools.
 */

import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

// Character context for scenario generation
export interface CharacterInfo {
  name: string;
  description: string; // Should be limited to 500 chars by caller
}

// Types for scenario data
export interface ScenarioData {
  background: string;
  firstMessages: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  lorebook: Array<{
    id: string;
    title: string;
    keys: string;
    desc: string;
    range: number;
  }>;
  // Character context for AI generation
  playerCharacter?: CharacterInfo;
  aiCharacters?: CharacterInfo[];
}

// Tool result types
interface SetScenarioResult {
  success: boolean;
  message: string;
}

interface EditScenarioResult {
  success: boolean;
  message: string;
  applied: boolean;
}

interface AddFirstMessageResult {
  success: boolean;
  id: string;
  message: string;
}

interface AddLorebookEntryResult {
  success: boolean;
  id: string;
  message: string;
}

interface UpdateFirstMessageResult {
  success: boolean;
  message: string;
}

interface UpdateLorebookEntryResult {
  success: boolean;
  message: string;
}

/**
 * Build system prompt with current scenario context
 * Note: Character names are intentionally excluded to prevent character-specific scenarios.
 * Only character descriptions are included for context.
 */
function buildSystemPrompt(currentScenario: ScenarioData): string {
  // Build scenario context summary
  let scenarioContext = "";

  // Add character descriptions only (no names to avoid character-specific scenarios)
  const characterDescriptions: string[] = [];

  if (currentScenario.playerCharacter?.description) {
    characterDescriptions.push(currentScenario.playerCharacter.description);
  }

  if (currentScenario.aiCharacters && currentScenario.aiCharacters.length > 0) {
    currentScenario.aiCharacters.forEach((char) => {
      if (char.description) {
        characterDescriptions.push(char.description);
      }
    });
  }

  if (characterDescriptions.length > 0) {
    scenarioContext += `\n\n## Character Descriptions (for context only):`;
    characterDescriptions.forEach((desc, i) => {
      scenarioContext += `\n\n${i + 1}. ${desc}`;
    });
  }

  if (currentScenario.background && currentScenario.background.trim()) {
    scenarioContext += `\n\n## Current Scenario Background:\n${currentScenario.background}`;
  }

  if (currentScenario.firstMessages.length > 0) {
    scenarioContext += `\n\n## Current First Messages (${currentScenario.firstMessages.length}):`;
    currentScenario.firstMessages.forEach((msg, i) => {
      scenarioContext += `\n${i + 1}. ID: \`${msg.id}\` - "${msg.title}": ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`;
    });
  }

  if (currentScenario.lorebook.length > 0) {
    scenarioContext += `\n\n## Current Lorebook Entries (${currentScenario.lorebook.length}):`;
    currentScenario.lorebook.forEach((entry, i) => {
      scenarioContext += `\n${i + 1}. ID: \`${entry.id}\` - "${entry.title}" [keys: ${entry.keys}]: ${entry.desc.substring(0, 80)}${entry.desc.length > 80 ? "..." : ""}`;
    });
  }

  return `You are a proactive scenario builder assistant for roleplay and storytelling.

## IMPORTANT - Character Independence:
The scenario you create should be GENERAL and REUSABLE. Do NOT make the scenario specific to any particular character. The scenario should work regardless of which characters participate in it. Focus on the world, setting, and situation - not on specific character arcs or backstories.

## Your Approach:

### If the user's request is VAGUE or lacks detail:
Ask 1-2 clarifying questions about:
- Genre/tone (dark fantasy, lighthearted comedy, sci-fi horror, etc.)
- Setting details (time period, location, atmosphere)
- Key elements they want included

### If the user provides ENOUGH information (genre, setting, or clear concept):
Immediately create a COMPLETE scenario package:
1. **set_scenario** - Create the full background
2. **add_first_message** - Add ONE starting scene option
3. **add_lorebook_entry** x3 - Add THREE lorebook entries for world-building

This creates a ready-to-use scenario in one go!

## What counts as "enough information":
- "Medieval fantasy tavern" → Enough! Create it.
- "Cyberpunk detective story" → Enough! Create it.
- "Space opera with aliens" → Enough! Create it.
- "Create a scenario" → Too vague, ask what genre/setting.
- "Something fun" → Too vague, ask for preferences.

## Your Tools:
1. **set_scenario** - Set or replace the entire scenario background
2. **edit_scenario** - Make targeted edits using SEARCH/REPLACE blocks
3. **add_first_message** - Add an opening scene option (game master narrator style)
4. **update_first_message** - Edit an existing first message by ID (use this instead of adding duplicates)
5. **add_lorebook_entry** - Add world-building entries (locations, factions, items, lore)
6. **update_lorebook_entry** - Edit an existing lorebook entry by ID

## First Messages:
First messages are ALTERNATIVE starting options. Users pick ONE to begin. Each should:
- Present a specific starting situation as game master narration
- Set the immediate scene vividly
- Create hooks for interaction
- NOT be character dialogue
- Use template variables to reference characters dynamically (see below)

## Template Variables for First Messages:
Use these variables in first message content to make them dynamic. The first message must revolve around the characters:
The character will be defined by the following variables:
- \`{{user.name}}\` - The player's character name
- AI character names (excluding user): \`{% for c in cast.all %}{% if c.id != user.id %}{{c.name}}{% if not loop.last %}, {% endif %}{% endif %}{% endfor %}\`

Example: "{% for c in cast.all %}{% if c.id != user.id %}{{c.name}}{% if not loop.last %}, {% endif %}{% endif %}{% endfor %} watch as {{user.name}} approaches the dimly lit tavern..."

## Lorebook Entries:
Create diverse entries covering:
- A key LOCATION (the main setting or important place)
- A FACTION or GROUP (organization, species, social group)
- An ITEM, CONCEPT, or LORE element (magic system, technology, cultural practice)

## Edit Format (for edit_scenario):
------- SEARCH
[Exact text to find]
=======
[Text to replace with]
+++++++ REPLACE

## Editing vs. Adding:
When the user asks to modify existing content:
- **First Messages**: Use **update_first_message** with the existing message's ID (shown in Current First Messages list)
- **Lorebook**: Use **update_lorebook_entry** with the existing entry's ID (shown in Current Lorebook Entries list)
- **Background**: Use **edit_scenario** with SEARCH/REPLACE format

DO NOT create duplicates - always update existing items when asked to edit them.

## After creating:
Briefly summarize what you made and ask if they want:
- More first message options
- Additional lorebook entries
- Changes to anything

## 🎭 When Users Describe Characters:
If the user's input describes a CHARACTER (personality, appearance, backstory, abilities), help them leverage that character concept for scenario building:

### Redirect to Character-Centric Scenarios:
Instead of creating the character (that's for Cast step), ask:
"I notice you're describing a character! Character creation is handled in the **Cast step**, but I can help you build a **scenario that would be perfect for this type of character**. What kind of world or situation would you like them to explore?"

### Suggest Scenario Ideas Based on Character Concepts:
- **Warrior/Fighter type** → "How about a war-torn kingdom, an arena of champions, or a frontier under siege?"
- **Mage/Scholar type** → "Perhaps an ancient academy of magic, a library of forbidden knowledge, or a world where magic is fading?"
- **Rogue/Thief type** → "What about a city of intrigue, a thieves' guild network, or a heist scenario?"
- **Noble/Royal type** → "Consider a court full of political schemes, a kingdom in succession crisis, or diplomatic missions?"
- **Explorer/Adventurer type** → "Maybe uncharted ruins, a newly discovered continent, or a mystery-filled expedition?"

### Example Response:
User: "I want a mysterious elf mage who studies forbidden magic"
You: "That sounds like a fascinating character concept! Character creation happens in the Cast step, but I can create a scenario that would be the **perfect setting for a forbidden magic scholar**. Would you prefer:
1. **An ancient academy** where certain magic is outlawed and must be studied in secret?
2. **A war-torn realm** where desperate times have made forbidden magic a tempting solution?
3. **A dying world** where only taboo magic might save it?

Tell me which appeals to you, or describe your ideal setting!"

## SCOPE LIMITATION - Step Navigation Guide:
You are ONLY responsible for scenario-related tasks in the Scenario step. Guide users to the appropriate step for other topics:

### ✅ This Step (Scenario) - World Building:
- Creating scenario backgrounds (setting, atmosphere, rules)
- Adding first messages (opening scenes)
- Managing lorebook entries (world lore, locations, factions)
- Suggesting scenarios based on character concepts

### 🔜 Next Step (Cast) - Character Building:
If user wants to CREATE or EDIT specific characters (name, personality, abilities, appearance)
→ Reply: "Character creation is handled in the **Cast step**! You can create your characters there. But first, would you like me to build a scenario that suits this character concept?"

### 🔜 Later Step (Stats) - Game Mechanics:
If user asks about: stats, variables, health, trust, attributes, game rules, tracking values
→ Reply: "Stats and variables are managed in the **Stats step**, which comes after Cast. You'll define custom stats there!"

### 🚫 Out of Scope:
If user asks about unrelated topics (weather, coding, general knowledge, etc.)
→ Reply: "I'm your scenario builder assistant! I can help create immersive worlds and starting situations. What kind of setting or genre interests you?"

Stay focused on scenario building and world-building only.
${scenarioContext}`;
}


/**
 * Apply a SEARCH/REPLACE diff to text
 */
function applyDiff(originalText: string, diff: string): { success: boolean; result: string; error?: string } {
  // Parse the diff format:
  // ------- SEARCH
  // [search content]
  // =======
  // [replace content]
  // +++++++ REPLACE

  const searchMatch = diff.match(/-------\s*SEARCH\s*\n([\s\S]*?)\n=======/);
  const replaceMatch = diff.match(/=======\s*\n([\s\S]*?)\n\+\+\+\+\+\+\+\s*REPLACE/);

  if (!searchMatch || !replaceMatch) {
    return {
      success: false,
      result: originalText,
      error: "Invalid diff format. Expected SEARCH/REPLACE blocks.",
    };
  }

  const searchText = searchMatch[1];
  const replaceText = replaceMatch[1];

  // Try exact match first
  if (originalText.includes(searchText)) {
    return {
      success: true,
      result: originalText.replace(searchText, replaceText),
    };
  }

  // Try trimmed match (ignore leading/trailing whitespace per line)
  const searchLines = searchText.split("\n").map(l => l.trim());
  const originalLines = originalText.split("\n");

  for (let i = 0; i <= originalLines.length - searchLines.length; i++) {
    let match = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (originalLines[i + j].trim() !== searchLines[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      // Found a match - replace those lines
      const before = originalLines.slice(0, i);
      const after = originalLines.slice(i + searchLines.length);
      return {
        success: true,
        result: [...before, replaceText, ...after].join("\n"),
      };
    }
  }

  return {
    success: false,
    result: originalText,
    error: `Could not find text to replace: "${searchText.substring(0, 50)}..."`,
  };
}

/**
 * Generate unique ID for tool-created items
 * Uses timestamp + counter to ensure uniqueness even for parallel calls
 */
let idCounter = 0;
function generateUniqueId(): string {
  return `${Date.now()}-${idCounter++}`;
}

/**
 * Create scenario builder tools with callbacks to update state
 * Uses a mutable state tracker to handle sequential edits within the same session
 */
function createScenarioTools(
  currentScenario: ScenarioData,
  callbacks: {
    onSetBackground: (background: string) => void;
    onEditBackground: (newBackground: string) => void;
    onAddFirstMessage: (message: { id: string; title: string; content: string }) => void;
    onUpdateFirstMessage: (id: string, updates: { title?: string; content?: string }) => void;
    onAddLorebookEntry: (entry: { id: string; title: string; keys: string; desc: string; range: number }) => void;
    onUpdateLorebookEntry: (id: string, updates: { title?: string; keys?: string; desc?: string; range?: number }) => void;
  },
) {
  // Track current state for sequential edits within same generation
  // This allows AI to add items and then update them in the same session
  let currentBackground = currentScenario.background;
  let currentFirstMessages = [...currentScenario.firstMessages];
  let currentLorebook = [...currentScenario.lorebook];

  return {
    set_scenario: tool({
      description: "Set or replace the entire scenario background description. Use this when creating a new scenario from scratch.",
      inputSchema: z.object({
        background: z.string().describe("The full scenario background text including setting, atmosphere, time period, location, and ground rules."),
      }),
      execute: async ({ background }) => {
        currentBackground = background; // Update tracker
        callbacks.onSetBackground(background);
        return {
          success: true,
          message: "Scenario background has been set.",
        };
      },
    }),

    edit_scenario: tool({
      description: "Make targeted edits to the existing scenario background using SEARCH/REPLACE diff format. Use this for modifications rather than full replacement.",
      inputSchema: z.object({
        diff: z.string().describe("The diff in SEARCH/REPLACE format: ------- SEARCH\\n[text to find]\\n=======\\n[replacement text]\\n+++++++ REPLACE"),
      }),
      execute: async ({ diff }) => {
        // Use currentBackground (which may have been updated by previous set_scenario)
        const result = applyDiff(currentBackground, diff);
        if (result.success) {
          currentBackground = result.result; // Update tracker for subsequent edits
          callbacks.onEditBackground(result.result);
          return {
            success: true,
            message: "Scenario has been edited successfully.",
            applied: true,
          };
        }
        return {
          success: false,
          message: result.error || "Failed to apply edit.",
          applied: false,
        };
      },
    }),

    add_first_message: tool({
      description: "Add a new first message option. First messages are ALTERNATIVE starting scenarios - users pick ONE to begin. Each should present a different situation, scene, or event as a game master narrator. Create 2-3 distinct options when asked.",
      inputSchema: z.object({
        title: z.string().describe("A short, descriptive title for this starting option (e.g., 'Peaceful Morning', 'Ambushed!', 'A Mysterious Letter')"),
        content: z.string().describe("The full opening narration - written as a game master setting the scene. Should be vivid and create hooks for interaction. Only use template variables when you cannot describe the situation without referencing characters by name. Prefer generic descriptions like 'the stranger', 'your companion', 'the mysterious figure' when possible."),
      }),
      execute: async ({ title, content }) => {
        const id = generateUniqueId();
        // Track newly added message for subsequent updates in same session
        currentFirstMessages.push({ id, title, content });
        callbacks.onAddFirstMessage({ id, title, content });
        return {
          success: true,
          id,
          message: `First message "${title}" has been added.`,
        };
      },
    }),

    update_first_message: tool({
      description: "Update an existing first message by ID. Use this to edit the title or content of a first message option.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the first message to update"),
        title: z.string().optional().describe("New title for this first message (leave empty to keep current)"),
        content: z.string().optional().describe("New content for this first message (leave empty to keep current)"),
      }),
      execute: async ({ id, title, content }) => {
        // Use tracker to find message (includes items added in this session)
        const message = currentFirstMessages.find((m) => m.id === id);
        if (!message) {
          return {
            success: false,
            message: `First message with ID "${id}" not found.`,
          };
        }

        const updates: { title?: string; content?: string } = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;

        // Update tracker for subsequent operations
        const messageIndex = currentFirstMessages.findIndex((m) => m.id === id);
        if (messageIndex !== -1) {
          currentFirstMessages[messageIndex] = { ...currentFirstMessages[messageIndex], ...updates };
        }

        callbacks.onUpdateFirstMessage(id, updates);
        return {
          success: true,
          message: `First message "${message.title}" has been updated.`,
        };
      },
    }),

    add_lorebook_entry: tool({
      description: "Add a new lorebook entry for world-building. Lorebook entries are triggered by keywords and provide context to the AI during roleplay.",
      inputSchema: z.object({
        title: z.string().describe("Name of this lorebook entry"),
        keys: z.string().describe("Comma-separated trigger keywords that activate this entry"),
        desc: z.string().describe("The detailed description/content of this lorebook entry"),
        range: z.number().optional().describe("Recall range - how many messages to scan for triggers (default: 2)"),
      }),
      execute: async ({ title, keys, desc, range = 2 }) => {
        const id = generateUniqueId();
        // Track newly added entry for subsequent updates in same session
        currentLorebook.push({ id, title, keys, desc, range });
        callbacks.onAddLorebookEntry({ id, title, keys, desc, range });
        return {
          success: true,
          id,
          message: `Lorebook entry "${title}" has been added.`,
        };
      },
    }),

    update_lorebook_entry: tool({
      description: "Update an existing lorebook entry by ID. Use this to edit any field of a lorebook entry.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the lorebook entry to update"),
        title: z.string().optional().describe("New title (leave empty to keep current)"),
        keys: z.string().optional().describe("New trigger keywords (leave empty to keep current)"),
        desc: z.string().optional().describe("New description (leave empty to keep current)"),
        range: z.number().optional().describe("New recall range (leave empty to keep current)"),
      }),
      execute: async ({ id, title, keys, desc, range }) => {
        // Use tracker to find entry (includes items added in this session)
        const entry = currentLorebook.find((e) => e.id === id);
        if (!entry) {
          return {
            success: false,
            message: `Lorebook entry with ID "${id}" not found.`,
          };
        }

        const updates: { title?: string; keys?: string; desc?: string; range?: number } = {};
        if (title !== undefined) updates.title = title;
        if (keys !== undefined) updates.keys = keys;
        if (desc !== undefined) updates.desc = desc;
        if (range !== undefined) updates.range = range;

        // Update tracker for subsequent operations
        const entryIndex = currentLorebook.findIndex((e) => e.id === id);
        if (entryIndex !== -1) {
          currentLorebook[entryIndex] = { ...currentLorebook[entryIndex], ...updates };
        }

        callbacks.onUpdateLorebookEntry(id, updates);
        return {
          success: true,
          message: `Lorebook entry "${entry.title}" has been updated.`,
        };
      },
    }),
  };
}

/**
 * Chat message for the scenario builder
 */
export interface ScenarioBuilderMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate a response from the scenario builder agent (streaming)
 */
export async function* generateScenarioResponse({
  messages,
  currentScenario,
  callbacks,
  abortSignal,
}: {
  messages: ScenarioBuilderMessage[];
  currentScenario: ScenarioData;
  callbacks: {
    onSetBackground: (background: string) => void;
    onEditBackground: (newBackground: string) => void;
    onAddFirstMessage: (message: { id: string; title: string; content: string }) => void;
    onUpdateFirstMessage: (id: string, updates: { title?: string; content?: string }) => void;
    onAddLorebookEntry: (entry: { id: string; title: string; keys: string; desc: string; range: number }) => void;
    onUpdateLorebookEntry: (id: string, updates: { title?: string; keys?: string; desc?: string; range?: number }) => void;
  };
  abortSignal?: AbortSignal;
}): AsyncGenerator<{ textDelta?: string; text: string; toolResults: unknown[] }, void, unknown> {
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
  const tools = createScenarioTools(currentScenario, callbacks);

  // Format messages for AI SDK - build system prompt with current scenario context
  const systemPrompt = buildSystemPrompt(currentScenario);
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

    // Stream response with tools - onStepFinish fires after each step completes
    const result = streamText({
      model,
      messages: formattedMessages,
      tools,
      stopWhen: stepCountIs(5), // Allow multiple tool calls in sequence
      abortSignal,
      onStepFinish: ({ toolResults }) => {
        // This callback fires after each step, allowing UI to update
        if (toolResults && toolResults.length > 0) {
          allToolResults.push(...toolResults);
          logger.info("[ScenarioBuilder] Step completed", {
            toolResultsInStep: toolResults.length,
          });
        }
      },
    });

    // Stream text deltas as they arrive
    let accumulatedText = "";
    for await (const chunk of result.textStream) {
      accumulatedText += chunk;
      yield {
        textDelta: chunk,
        text: accumulatedText,
        toolResults: allToolResults,
      };
    }

    logger.info("[ScenarioBuilder] Response generated", {
      text: accumulatedText?.substring(0, 100),
      totalToolResults: allToolResults.length,
    });

    // Yield final result with complete text
    yield {
      text: accumulatedText,
      toolResults: allToolResults,
    };
  } catch (error) {
    logger.error("[ScenarioBuilder] Error generating response", error);
    throw error;
  }
}
