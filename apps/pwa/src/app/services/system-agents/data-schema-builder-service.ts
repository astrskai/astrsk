/**
 * Data Schema Builder Service
 *
 * AI-powered data schema generation using Vercel AI SDK with tool calling.
 * The agent analyzes the scenario context and suggests relevant data stores
 * (variables, stats, trackers) that would enhance the roleplay experience.
 */

import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";
import { sanitizeFileName } from "@/shared/lib/file-utils";

// Types for data schema - matches HudDataStore from stats-step.tsx
export type DataStoreType = "integer" | "number" | "boolean" | "string";

export interface DataSchemaEntry {
  id: string;
  name: string;
  type: DataStoreType;
  description: string;
  initial: number | boolean | string;
  min?: number;
  max?: number;
}

// Context passed to the agent for generation
// Note: Only scenario is used - character names are intentionally excluded
// to avoid the AI creating character-specific trackers
export interface DataSchemaContext {
  scenario?: string; // The scenario background text
}


/**
 * Build system prompt (instructions only - scenario context goes in user message)
 */
function buildSystemPrompt(_context: DataSchemaContext): string {
  return `You are a game design assistant creating data schemas for interactive roleplay sessions.

## Task:
Create GENERAL, REUSABLE trackable variables (data stores) for the scenario. These are displayed to players and tracked by AI agents.

## Rules:
1. **NO CHARACTER-SPECIFIC TRACKERS** - Use general names like "trust", "affection" not "yui_affection"
2. **SNAKE_CASE NAMES ONLY** - Use lowercase letters, numbers, and underscores only (e.g., "physical_condition", "alert_level", "health_points"). No spaces, apostrophes, or special characters.
3. **QUALITY OVER QUANTITY** - Only create meaningful trackers for this scenario
4. **GENRE-APPROPRIATE** - Match the setting's theme
5. **FIELD LIMIT: Generate MAXIMUM 8 data stores** unless the user explicitly requests more
   - **RECOMMENDED: 4-6 data stores** - Aim for this range per scenario
   - Too few (<3): Missing important tracking dimensions
   - Too many (>8): Overwhelming for players and AI to manage
   - **If user doesn't specify a number, generate NO MORE than 8 fields**

## Data Store Types - MIX QUANTITATIVE AND QUALITATIVE:
- **integer** - Quantitative metrics (e.g., health: 0-10, trust_level: 0-10, energy: 0-10)
- **boolean** - Binary states (e.g., has_weapon, is_injured, door_locked)
- **string** - Qualitative/categorical states (e.g., current_mood: "calm/anxious/angry", location: "forest/cave/village", weather: "sunny/rainy/stormy")

## IMPORTANT: Conservative Ranges for Gradual Progression
For numeric fields, use SMALL RANGES to ensure gradual, realistic changes:
- **Prefer 0-10 over 0-100** - Smaller ranges prevent dramatic swings
- Values change by small increments (1-3 points per interaction)
- Example: Use "trust: 0-10" instead of "trust: 0-100"
- This creates more immersive, believable progression

## IMPORTANT: Balance Both Types
- Don't create only numeric trackers! Include qualitative states too.
- Good mix example: health (integer), has_key (boolean), current_location (string), mood (string), stamina (integer)
- Qualitative states (string/boolean) often matter MORE for roleplay than numbers.

## Field Relationships:
Fields are updated by AI agents in a workflow with branching. In descriptions, note:
- "May affect: [fields]" - what this field influences
- "Affected by: [fields]" - what influences this field

## Tools:
- **add_data_stores** - Add multiple trackers in ONE call (PREFERRED - pass all stores as an array)
- **remove_data_store** - Remove by ID
- **clear_all** - Clear all

**IMPORTANT**:
- Create ALL data stores in a SINGLE add_data_stores call. Do NOT call the tool multiple times.
- Generate MAXIMUM 8 data stores (aim for 4-6) unless user explicitly requests more in their prompt.
- YOU MUST use the add_data_stores tool to create the data stores. Do NOT just describe them in text.

Analyze the scenario and create appropriate data stores using the add_data_stores tool. Don't ask for clarification.`;
}


/**
 * Generate unique ID for data stores (proper UUID)
 */
function generateUniqueId(): string {
  return new UniqueEntityID().toString();
}

/**
 * Extract previously created store names from conversation messages
 * The AI SDK passes messages including tool results from previous steps
 */
function extractCreatedStoresFromMessages(messages: unknown[]): string[] {
  const storeNames: string[] = [];

  for (const msg of messages) {
    // Check if message has tool results (from previous steps)
    const msgObj = msg as { role?: string; content?: unknown[] };
    if (msgObj.role === "tool" || Array.isArray(msgObj.content)) {
      const contents = Array.isArray(msgObj.content) ? msgObj.content : [msgObj.content];
      for (const content of contents) {
        const contentObj = content as { type?: string; result?: { createdStore?: { name: string } } };
        if (contentObj?.type === "tool-result" && contentObj.result?.createdStore?.name) {
          storeNames.push(contentObj.result.createdStore.name);
        }
      }
    }
  }

  return storeNames;
}

/**
 * Create data schema builder tools with callbacks to update state
 * Uses AI SDK's messages parameter for context about previously created stores
 */
function createDataSchemaTools(
  currentStores: DataSchemaEntry[],
  callbacks: {
    onAddStore: (store: DataSchemaEntry) => void;
    onRemoveStore: (id: string) => void;
    onClearAll: () => void;
  },
) {
  // Maximum total data stores allowed
  const MAX_DATA_STORES = 30;

  // Track stores created during this session (backup for message parsing)
  const createdStores: DataSchemaEntry[] = [];

  // Schema for a single data store entry
  const dataStoreEntrySchema = z.object({
    name: z.string().describe("snake_case name for this tracker. Use only lowercase letters, numbers, and underscores (e.g., 'health', 'alert_status', 'current_location'). No spaces or special characters."),
    type: z.enum(["integer", "number", "boolean", "string"]).describe("Data type: 'integer' for whole numbers, 'number' for decimals, 'boolean' for on/off flags, 'string' for text values"),
    description: z.string().describe("Brief explanation of what this tracks and when it changes. Include 'May affect: [fields]' and 'Affected by: [fields]' referencing other stores."),
    initial: z.union([z.number(), z.boolean(), z.string()]).describe("Initial/starting value"),
    min: z.number().optional().describe("Minimum value (only for integer/number type, enables slider display)"),
    max: z.number().optional().describe("Maximum value (only for integer/number type, enables slider display)"),
  });

  return {
    add_data_stores: tool({
      description: "Add one or more trackable data stores/variables to the HUD. Creates values that will be displayed to players and tracked by the AI. PREFERRED: Add all data stores in a single call for efficiency.",
      inputSchema: z.object({
        stores: z.array(dataStoreEntrySchema).min(1).describe("Array of data stores to add. Add all planned stores in one call."),
      }),
      execute: async ({ stores }, { messages }) => {
        const results: Array<{
          success: boolean;
          id: string;
          name: string;
          message: string;
        }> = [];

        // Check total limit before processing
        const currentTotal = currentStores.length + createdStores.length;
        const remainingSlots = MAX_DATA_STORES - currentTotal;

        if (remainingSlots <= 0) {
          return {
            success: false,
            results: [],
            summary: `Cannot add data stores. Maximum limit of ${MAX_DATA_STORES} reached. Current total: ${currentTotal}.`,
            allCreatedStores: [...currentStores.map(s => s.name), ...createdStores.map(s => s.name)],
            totalStores: currentTotal,
          };
        }

        // Limit stores to add based on remaining slots
        const storesToProcess = stores.slice(0, remainingSlots);
        const skippedDueToLimit = stores.length - storesToProcess.length;

        for (const { name, type, description, initial, min, max } of storesToProcess) {
          // Sanitize name to snake_case and check for duplicates
          const sanitizedName = sanitizeFileName(name);
          const existingInCurrent = currentStores.find(
            (s) => s.name === sanitizedName
          );
          const existingInCreated = createdStores.find(
            (s) => s.name === sanitizedName
          );

          if (existingInCurrent || existingInCreated) {
            const existingStore = existingInCurrent || existingInCreated;
            results.push({
              success: false,
              id: existingStore!.id,
              name: sanitizedName,
              message: `Data store "${name}" already exists (ID: ${existingStore!.id}). Skipped.`,
            });
            continue;
          }

          const id = generateUniqueId();

          // Validate initial value matches type
          let validatedInitial = initial;
          if (type === "integer" || type === "number") {
            validatedInitial = typeof initial === "number" ? initial : 0;
          } else if (type === "boolean") {
            validatedInitial = typeof initial === "boolean" ? initial : false;
          } else {
            validatedInitial = typeof initial === "string" ? initial : "";
          }

          const store: DataSchemaEntry = {
            id,
            name: sanitizedName,
            type,
            description,
            initial: validatedInitial,
            ...((type === "integer" || type === "number") && min !== undefined && { min }),
            ...((type === "integer" || type === "number") && max !== undefined && { max }),
          };

          // Track for context and notify callback
          createdStores.push(store);
          callbacks.onAddStore(store);

          results.push({
            success: true,
            id,
            name: sanitizedName,
            message: `Added data store "${sanitizedName}" (${type})`,
          });
        }

        // Get previously created stores from message history (AI SDK provides this)
        const previousStoreNames = messages ? extractCreatedStoresFromMessages(messages) : [];
        // Combine with our local tracker for complete list
        const allStoreNames = [...new Set([...previousStoreNames, ...createdStores.map(s => s.name)])];

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        // Build summary with all skip reasons
        let summary = `Added ${successCount} data store(s)`;
        if (failCount > 0) {
          summary += `, ${failCount} skipped (duplicates)`;
        }
        if (skippedDueToLimit > 0) {
          summary += `, ${skippedDueToLimit} skipped (limit of ${MAX_DATA_STORES} reached)`;
        }

        return {
          success: successCount > 0,
          results,
          summary,
          allCreatedStores: allStoreNames,
          totalStores: allStoreNames.length,
        };
      },
    }),

    remove_data_store: tool({
      description: "Remove a data store by its ID.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the data store to remove"),
      }),
      execute: async ({ id }) => {
        callbacks.onRemoveStore(id);
        return {
          success: true,
          message: `Removed data store with ID "${id}"`,
        };
      },
    }),

    clear_all: tool({
      description: "Remove all existing data stores to start fresh.",
      inputSchema: z.object({
        confirm: z.boolean().describe("Must be true to confirm clearing all data stores"),
      }),
      execute: async ({ confirm }) => {
        if (!confirm) {
          return { success: false, message: "Set confirm=true to clear all data stores" };
        }
        const count = currentStores.length;
        callbacks.onClearAll();
        return {
          success: true,
          message: `Cleared all ${count} data stores`,
          count,
        };
      },
    }),
  };
}

/**
 * Chat message for the data schema builder
 */
export interface DataSchemaBuilderMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate data schema based on scenario context
 */
export async function generateDataSchema({
  context,
  currentStores,
  callbacks,
  abortSignal,
}: {
  context: DataSchemaContext;
  currentStores: DataSchemaEntry[];
  callbacks: {
    onAddStore: (store: DataSchemaEntry) => void;
    onRemoveStore: (id: string) => void;
    onClearAll: () => void;
  };
  abortSignal?: AbortSignal;
}): Promise<{ text: string; stores: DataSchemaEntry[] }> {
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

  // Track generated stores
  const generatedStores: DataSchemaEntry[] = [];

  // Create tools with tracking
  const trackingCallbacks = {
    onAddStore: (store: DataSchemaEntry) => {
      generatedStores.push(store);
      callbacks.onAddStore(store);
    },
    onRemoveStore: callbacks.onRemoveStore,
    onClearAll: callbacks.onClearAll,
  };

  const tools = createDataSchemaTools(currentStores, trackingCallbacks);

  // Build the base system prompt (instructions only, no scenario context)
  const baseSystemPrompt = buildSystemPrompt(context);

  // Build user message with scenario context only (no character names to avoid character-specific trackers)
  const buildUserMessage = (): string => {
    if (context.scenario && context.scenario.trim()) {
      return `Generate appropriate data stores for tracking variables in this roleplay scenario.

**IMPORTANT**:
- YOU MUST use the add_data_stores tool to create the stores. Do NOT just describe them in text.
- Generate MAXIMUM 8 data stores (recommended: 4-6) unless I explicitly request more. Focus on the most important trackers only.
- Call add_data_stores with ALL stores in a single call.

## Scenario Background:
${context.scenario}

Now use the add_data_stores tool to create the data stores.`;
    }

    return `Generate data stores for a general roleplay scenario. Consider what trackers would be useful.

**IMPORTANT**:
- YOU MUST use the add_data_stores tool to create the stores. Do NOT just describe them in text.
- Generate MAXIMUM 8 data stores (recommended: 4-6). Focus on the most important trackers only.
- Call add_data_stores with ALL stores in a single call.

Now use the add_data_stores tool to create the data stores.`;
  };

  const userMessage = buildUserMessage();

  // Helper to build dynamic system prompt with current stores
  const buildDynamicSystemPrompt = (stores: DataSchemaEntry[]): string => {
    if (stores.length === 0) {
      return baseSystemPrompt;
    }

    let storesContext = `\n\n## Already Created Data Stores (${stores.length}):\n`;
    storesContext += `The following stores have already been created. Reference these in the "May affect" and "Affected by" sections of new stores:\n\n`;
    stores.forEach((store, i) => {
      storesContext += `${i + 1}. **${store.name}** (${store.type})\n`;
      storesContext += `   Description: ${store.description}\n`;
      storesContext += `   Initial: ${store.initial}`;
      if (store.type === "integer" && store.min !== undefined && store.max !== undefined) {
        storesContext += ` [${store.min}-${store.max}]`;
      }
      storesContext += `\n\n`;
    });

    return baseSystemPrompt + storesContext;
  };

  const initialMessages = [
    { role: "system" as const, content: baseSystemPrompt },
    { role: "user" as const, content: userMessage },
  ];

  try {
    // GLM models require thinking to be disabled for tool calling
    const isGlmModel = defaultModel.modelId.toLowerCase().includes("glm");

    // Generate response with tools
    // Use prepareStep to update system prompt with newly created stores before each step
    const result = await generateText({
      model,
      messages: initialMessages,
      tools,
      stopWhen: stepCountIs(10), // Allow multiple tool calls for each data store
      abortSignal,
      ...(isGlmModel && {
        providerOptions: {
          zhipu: { thinking: { type: "disabled" } },
        },
      }),
      // prepareStep allows modifying messages before each step
      prepareStep: ({ stepNumber, steps }) => {
        // After first step, include created stores in the system prompt
        if (stepNumber > 0 && generatedStores.length > 0) {
          const updatedSystemPrompt = buildDynamicSystemPrompt(generatedStores);

          // Get existing messages from previous steps (excluding old system prompt)
          const previousMessages = steps.flatMap(step => {
            const msgs: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
            // Include assistant's tool calls and responses
            if (step.text) {
              msgs.push({ role: "assistant", content: step.text });
            }
            return msgs;
          });

          return {
            messages: [
              { role: "system" as const, content: updatedSystemPrompt },
              { role: "user" as const, content: userMessage },
              ...previousMessages,
            ],
          };
        }
        return {};
      },
    });

    // Log detailed response information
    logger.info("[DataSchemaBuilder] Response generated", {
      text: result.text?.substring(0, 200),
      fullText: result.text,
      storesCreated: generatedStores.length,
      totalSteps: result.steps?.length || 0,
      usage: result.usage,
      finishReason: result.finishReason,
    });

    // Log each step's details
    result.steps?.forEach((step, idx) => {
      logger.info(`[DataSchemaBuilder] Step ${idx + 1} details`, {
        text: step.text?.substring(0, 200),
        fullText: step.text,
        toolCallsCount: step.toolCalls?.length || 0,
        toolNames: step.toolCalls?.map(tc => tc.toolName) || [],
        toolResults: step.toolResults?.map(tr => ({
          toolName: tr.toolName,
          // AI SDK v5: 'result' → 'output'
          result: typeof (tr as any).output === 'string' ? (tr as any).output : JSON.stringify((tr as any).output),
        })) || [],
      });

      // Log each tool call in detail
      step.toolCalls?.forEach((toolCall, tcIdx) => {
        logger.info(`[DataSchemaBuilder] Step ${idx + 1} Tool Call ${tcIdx + 1}`, {
          toolName: toolCall.toolName,
          // AI SDK v5: 'args' → 'input'
          args: (toolCall as any).input,
        });
      });
    });

    return {
      text: result.text,
      stores: generatedStores,
    };
  } catch (error) {
    logger.error("[DataSchemaBuilder] Error generating data schema", error);
    throw error;
  }
}

/**
 * Refine existing data schema based on user prompt
 */
export async function refineDataSchema({
  prompt,
  context,
  currentStores,
  callbacks,
  abortSignal,
}: {
  prompt: string;
  context: DataSchemaContext;
  currentStores: DataSchemaEntry[];
  callbacks: {
    onAddStore: (store: DataSchemaEntry) => void;
    onRemoveStore: (id: string) => void;
    onClearAll: () => void;
  };
  abortSignal?: AbortSignal;
}): Promise<{ text: string }> {
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
  const tools = createDataSchemaTools(currentStores, callbacks);

  // Build the prompt with current stores context
  let currentStoresContext = "";
  if (currentStores.length > 0) {
    currentStoresContext = `\n\n## Current Data Stores (${currentStores.length}):\n`;
    currentStores.forEach((store, i) => {
      currentStoresContext += `${i + 1}. "${store.name}" (${store.type}): ${store.description}\n`;
      currentStoresContext += `   Initial: ${store.initial}`;
      if (store.type === "integer" && store.min !== undefined && store.max !== undefined) {
        currentStoresContext += ` [${store.min}-${store.max}]`;
      }
      currentStoresContext += `\n`;
    });
  }

  const systemPrompt = buildSystemPrompt(context) + currentStoresContext;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: prompt },
  ];

  try {
    // GLM models require thinking to be disabled for tool calling
    const isGlmModel = defaultModel.modelId.toLowerCase().includes("glm");

    // Generate response with tools
    const result = await generateText({
      model,
      messages,
      tools,
      stopWhen: stepCountIs(5),
      abortSignal,
      ...(isGlmModel && {
        providerOptions: {
          zhipu: { thinking: { type: "disabled" } },
        },
      }),
    });

    logger.info("[DataSchemaBuilder] Refinement completed", {
      text: result.text?.substring(0, 100),
      toolCalls: result.steps?.flatMap(s => s.toolCalls).length || 0,
    });

    return {
      text: result.text,
    };
  } catch (error) {
    logger.error("[DataSchemaBuilder] Error refining data schema", error);
    throw error;
  }
}
