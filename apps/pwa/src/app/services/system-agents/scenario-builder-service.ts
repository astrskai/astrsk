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
      scenarioContext += `\n${i + 1}. "${msg.title}": ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`;
    });
  }

  if (currentScenario.lorebook.length > 0) {
    scenarioContext += `\n\n## Current Lorebook Entries (${currentScenario.lorebook.length}):`;
    currentScenario.lorebook.forEach((entry, i) => {
      scenarioContext += `\n${i + 1}. "${entry.title}" [keys: ${entry.keys}]: ${entry.desc.substring(0, 80)}${entry.desc.length > 80 ? "..." : ""}`;
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
4. **add_lorebook_entry** - Add world-building entries (locations, factions, items, lore)

## First Messages:
First messages are ALTERNATIVE starting options. Users pick ONE to begin. Each should:
- Present a specific starting situation as game master narration
- Set the immediate scene vividly
- Create hooks for interaction
- NOT be character dialogue

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

## After creating:
Briefly summarize what you made and ask if they want:
- More first message options
- Additional lorebook entries
- Changes to anything
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
    onAddLorebookEntry: (entry: { id: string; title: string; keys: string; desc: string; range: number }) => void;
  },
) {
  // Track current background for sequential edits within same generation
  let currentBackground = currentScenario.background;

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
        content: z.string().describe("The full opening narration - written as a game master setting the scene. Should be vivid and create hooks for interaction."),
      }),
      execute: async ({ title, content }) => {
        const id = generateUniqueId();
        callbacks.onAddFirstMessage({ id, title, content });
        return {
          success: true,
          id,
          message: `First message "${title}" has been added.`,
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
        callbacks.onAddLorebookEntry({ id, title, keys, desc, range });
        return {
          success: true,
          id,
          message: `Lorebook entry "${title}" has been added.`,
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
 * Generate a response from the scenario builder agent
 */
export async function generateScenarioResponse({
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
    onAddLorebookEntry: (entry: { id: string; title: string; keys: string; desc: string; range: number }) => void;
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

    // Wait for the stream to complete and get final text
    const text = await result.text;

    logger.info("[ScenarioBuilder] Response generated", {
      text: text?.substring(0, 100),
      totalToolResults: allToolResults.length,
    });

    return {
      text,
      toolResults: allToolResults,
    };
  } catch (error) {
    logger.error("[ScenarioBuilder] Error generating response", error);
    throw error;
  }
}
