/**
 * Data Schema Builder Service
 *
 * AI-powered data schema generation using Vercel AI SDK with tool calling.
 * The agent analyzes the scenario context and suggests relevant data stores
 * (variables, stats, trackers) that would enhance the roleplay experience.
 */

import { streamText, generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { useModelStore, type DefaultModelSelection, getAstrskAiModel, SPECIFIC_MODELS } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel, shouldUseNonStreamingForTools } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";
import { sanitizeFileName } from "@/shared/lib/file-utils";

// Types for data schema - matches StatsDataStore from stats-step.tsx
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

## CRITICAL: Variable Perspective Rules
Variables must belong to ONE of these perspectives ONLY:

1. **WORLD PERSPECTIVE (PRIMARY)** - Environmental/location variables
   - Examples: "world_location", "time_of_day", "weather", "danger_level", "area_explored"
   - Focus: Setting, environment, global state that affects everyone

2. **USER PERSPECTIVE (SECONDARY, ONLY IF NEEDED)** - User-specific variables
   - Examples: "user_health", "user_stamina", "user_inventory_count"
   - Focus: Only the user/player character state, NOT other characters

**FORBIDDEN**:
- NO OTHER CHARACTER VARIABLES - Do NOT create variables for NPCs, companions, or any character except the user
- NO CHARACTER-SPECIFIC TRACKERS - No "yui_affection", "companion_trust", "npc_health", etc.
- NO RELATIONSHIP TRACKERS - No "trust_with_X", "relationship_with_Y"

**Why**: Other characters are handled separately. Variables are ONLY for world state and user state.

## Additional Rules:
1. **SNAKE_CASE NAMES ONLY** - Use lowercase letters, numbers, and underscores only (e.g., "world_location", "user_health", "danger_level"). No spaces, apostrophes, or special characters.
2. **QUALITY OVER QUANTITY** - Only create meaningful trackers for this scenario
3. **GENRE-APPROPRIATE** - Match the setting's theme
4. **FIELD LIMIT: Generate MAXIMUM 8 data stores** unless the user explicitly requests more
   - **RECOMMENDED: 4-6 data stores** - Aim for this range per scenario
   - Too few (<3): Missing important tracking dimensions
   - Too many (>8): Overwhelming for players and AI to manage
   - **If user doesn't specify a number, generate NO MORE than 8 fields**

## Data Store Types - MIX QUANTITATIVE AND QUALITATIVE:
- **integer** - Quantitative metrics (e.g., user_health: 0-100, danger_level: 0-100, user_stamina: 0-100)
- **boolean** - Binary states (e.g., user_has_weapon, area_secured, door_locked)
- **string** - Qualitative/categorical states (e.g., world_location: "forest/cave/village", weather: "sunny/rainy/stormy", time_of_day: "morning/afternoon/evening/night")

## IMPORTANT: Recommended Ranges for Gradual Progression
For integer fields, choose range based on tracking precision needed:

- **0-100 (RECOMMENDED for most fields)** - Best balance of precision and readability
  - AI uses delta values of ±1 to ±3 for gradual changes
  - Example: "health: 0-100", "trust_level: 0-100", "stamina: 0-100"

- **0-1000 or 0-10000 (for high-precision tracking)** - Use when fine granularity matters
  - Allows very precise progression over many interactions
  - AI uses larger deltas (±5 to ±20 for 0-1000, ±10 to ±50 for 0-10000)
  - Example: "experience_points: 0-10000", "reputation: 0-1000"
  - Good for: currency, XP, reputation systems, long-term progression

- **0-10 (for simple scales)** - Only for boolean-like states or simple intensity levels
  - AI uses delta values of ±1 to ±2
  - Example: "danger_level: 0-10" (0=safe, 10=deadly), "alertness: 0-10"

Choose the range that best fits the tracking granularity needed for the scenario.

## IMPORTANT: Balance Both Types
- Don't create only numeric trackers! Include qualitative states too.
- Good mix example: user_health (integer), user_has_key (boolean), world_location (string), weather (string), danger_level (integer)
- Qualitative states (string/boolean) often matter MORE for roleplay than numbers.
- Remember: Focus on WORLD perspective (primary) and USER perspective (only if needed). NO other character variables.

## Field Relationships:
Fields are updated by AI agents in a workflow with branching. In descriptions, note:
- "May affect: [fields]" - what this field influences
- "Affected by: [fields]" - what influences this field

## Tools:
- **add_data_store** - Add a single tracker (call multiple times for multiple stores)

**IMPORTANT**:
- Call add_data_store once for EACH data store you want to create.
- Generate MAXIMUM 8 data stores (aim for 4-6) unless user explicitly requests more in their prompt.
- YOU MUST use the add_data_store tool to create the data stores. Do NOT just describe them in text.

## SCOPE LIMITATION - IMPORTANT:
You are the Stats Assistant, ONLY responsible for stats/data-related tasks (adding, removing, modifying trackable variables).

**If the user asks about topics outside your scope, politely redirect them:**

- **SCENARIO requests** (background, setting, world-building, lorebook, first messages):
  → "That's handled in the **Scenario step** (Step 1). Use the stepper at the top to go back and modify your scenario there! I'm here to help with stats and trackable variables."

- **CHARACTER requests** (creating characters, editing personalities, adding cast members):
  → "Character creation is handled in the **Cast step** (Step 2). Use the stepper at the top to go back and create or edit characters there! I'm here to help with stats and trackable variables."

- **FLOW/WORKFLOW requests** (AI behavior, response flow, branching logic):
  → "That's configured automatically based on your stats. If you need specific tracking behavior, let me know what variables you'd like to track!"

**What you CAN help with:**
- Adding new trackable variables (stats, counters, flags)
- Removing existing variables
- Modifying variable properties (name, type, range, initial value)
- Explaining what each variable tracks
- Suggesting variables appropriate for the scenario

Stay focused on stats and variables only. Be helpful and friendly when redirecting users to the correct step.

## After Completing Tasks:
Keep your completion response SHORT and CONCISE (1-2 sentences max).
- Good: "Done! Added 5 variables for tracking health, trust, and mood."
- Good: "Added the stamina tracker. Let me know if you need more."
- Bad: Long explanations listing every field's purpose and range
- Bad: Repeating the variable configurations back to the user

Only offer suggestions if the user asks "what else?" or seems unsure.

Analyze the scenario and create appropriate data stores using the add_data_store tool. Don't ask for clarification.`;
}


/**
 * Generate unique ID for data stores (proper UUID)
 */
function generateUniqueId(): string {
  return new UniqueEntityID().toString();
}

/**
 * Create data schema builder tools with callbacks to update state
 */
function createDataSchemaTools(
  currentStores: DataSchemaEntry[],
  callbacks: {
    onAddStore: (store: DataSchemaEntry) => void;
    onRemoveStore: (id: string) => void;
    onClearAll: () => void;
    onBatchComplete?: (stores: DataSchemaEntry[]) => void;
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
    add_data_store: tool({
      description: "Add a single trackable data store/variable to the HUD. Creates a value that will be displayed to players and tracked by the AI. Call this tool multiple times to add multiple stores.",
      inputSchema: dataStoreEntrySchema,
      execute: async (store) => {
        const { name, type, description, initial, min, max } = store;

        // Check total limit before processing
        const currentTotal = currentStores.length + createdStores.length;

        if (currentTotal >= MAX_DATA_STORES) {
          return {
            success: false,
            id: "",
            name: name,
            message: `Cannot add data store. Maximum limit of ${MAX_DATA_STORES} reached. Current total: ${currentTotal}.`,
            totalStores: currentTotal,
          };
        }

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
          return {
            success: false,
            id: existingStore!.id,
            name: sanitizedName,
            message: `Data store "${name}" already exists (ID: ${existingStore!.id}). Skipped.`,
            totalStores: currentTotal,
          };
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

        const newStore: DataSchemaEntry = {
          id,
          name: sanitizedName,
          type,
          description,
          initial: validatedInitial,
          ...((type === "integer" || type === "number") && min !== undefined && { min }),
          ...((type === "integer" || type === "number") && max !== undefined && { max }),
        };

        // Track for context and notify callback
        createdStores.push(newStore);
        callbacks.onAddStore(newStore);

        return {
          success: true,
          id,
          name: sanitizedName,
          message: `Added data store "${sanitizedName}" (${type}). Total stores: ${currentTotal + 1}/${MAX_DATA_STORES}`,
          totalStores: currentTotal + 1,
          createdStore: newStore,
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
    onBatchComplete?: (stores: DataSchemaEntry[]) => void;
  };
  abortSignal?: AbortSignal;
}): Promise<{ text: string; stores: DataSchemaEntry[] }> {
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
    onBatchComplete: callbacks.onBatchComplete,
  };

  const tools = createDataSchemaTools(currentStores, trackingCallbacks);

  // Build the base system prompt (instructions only, no scenario context)
  const baseSystemPrompt = buildSystemPrompt(context);

  // Build user message with scenario context only (no character names to avoid character-specific trackers)
  const buildUserMessage = (): string => {
    if (context.scenario && context.scenario.trim()) {
      return `Generate appropriate data stores for tracking variables in this roleplay scenario.

**IMPORTANT**:
- YOU MUST use the add_data_store tool to create the stores. Do NOT just describe them in text.
- Generate MAXIMUM 8 data stores (recommended: 4-6) unless I explicitly request more. Focus on the most important trackers only.
- Call add_data_store once for EACH store you want to create.

## Scenario Background:
${context.scenario}

Now use the add_data_store tool to create the data stores.`;
    }

    return `Generate data stores for a general roleplay scenario. Consider what trackers would be useful.

**IMPORTANT**:
- YOU MUST use the add_data_store tool to create the stores. Do NOT just describe them in text.
- Generate MAXIMUM 8 data stores (recommended: 4-6). Focus on the most important trackers only.
- Call add_data_store once for EACH store you want to create.

Now use the add_data_store tool to create the data stores.`;
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

    // Check if this model needs non-streaming approach for tool calling
    const useNonStreaming = shouldUseNonStreamingForTools(
      apiConnection.source,
      defaultModel.modelId
    );

    // Common options for both streaming and non-streaming
    const glmOptions = isGlmModel ? {
      providerOptions: {
        zhipu: { thinking: { type: "disabled" } },
      },
    } : {};

    if (useNonStreaming) {
      // Use non-streaming generateText (model requires it)

      const result = await generateText({
        model,
        messages: initialMessages,
        tools,
        stopWhen: stepCountIs(10), // Allow multiple tool calls for each data store
        abortSignal,
        ...glmOptions,
      });

      return {
        text: result.text || "",
        stores: generatedStores,
      };
    } else {
      // Generate response with tools (streaming)
      // Use prepareStep to update system prompt with newly created stores before each step
      const result = streamText({
        model,
        messages: initialMessages,
        tools,
        stopWhen: stepCountIs(10), // Allow multiple tool calls for each data store
        abortSignal,
        ...glmOptions,
        onStepFinish: (step) => {
          const { text, toolCalls, toolResults, finishReason, response } = step;


          // If there's an error, try to get more details
          if (finishReason === 'error') {
            logger.error("[DataSchemaBuilder] Step finished with error", {
              fullStep: JSON.stringify(step, null, 2),
              responseKeys: response ? Object.keys(response) : [],
            });
          }
        },
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

      // Wait for the stream to complete and get final text
      const text = await result.text;


      return {
        text,
        stores: generatedStores,
      };
    }
  } catch (error) {
    // Check if this is a non-fatal Vertex AI metadata-only response error
    const isVertexMetadataError =
      error instanceof Error &&
      error.message?.includes("Invalid input: expected array, received undefined") &&
      error.message?.includes("candidates") &&
      generatedStores.length > 0; // We have successful tool results

    if (isVertexMetadataError) {

      // Return what we have - the tool calls succeeded
      return {
        text: "",
        stores: generatedStores,
      };
    }

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

    // Check if this model needs non-streaming approach for tool calling
    const useNonStreaming = shouldUseNonStreamingForTools(
      apiConnection.source,
      defaultModel.modelId
    );

    // Common options for both streaming and non-streaming
    const glmOptions = isGlmModel ? {
      providerOptions: {
        zhipu: { thinking: { type: "disabled" } },
      },
    } : {};

    if (useNonStreaming) {
      // Use non-streaming generateText (model requires it)
      const result = await generateText({
        model,
        messages,
        tools,
        stopWhen: stepCountIs(5),
        abortSignal,
        ...glmOptions,
      });

      // If text is empty, log warning with more details
      if (!result.text || result.text.trim().length === 0) {
        logger.warn("[DataSchemaBuilder] Refinement returned empty text", {
          messages: messages.map(m => ({ role: m.role, content: m.content?.substring(0, 100) })),
          storesCount: currentStores.length,
        });
      }

      return {
        text: result.text,
      };
    } else {
      // Generate response with tools (streaming)
      const result = streamText({
        model,
        messages,
        tools,
        stopWhen: stepCountIs(5),
        abortSignal,
        ...glmOptions,
        onStepFinish: (step) => {
          const { text, toolCalls, toolResults, finishReason, response } = step;


          // If there's an error, try to get more details
          if (finishReason === 'error') {
            logger.error("[DataSchemaBuilder] Step finished with error", {
              fullStep: JSON.stringify(step, null, 2),
              responseKeys: response ? Object.keys(response) : [],
            });
          }
        },
      });

      // Wait for the stream to complete and get final text
      const text = await result.text;

      // If text is empty, log warning with more details
      if (!text || text.trim().length === 0) {
        logger.warn("[DataSchemaBuilder] Refinement returned empty text", {
          messages: messages.map(m => ({ role: m.role, content: m.content?.substring(0, 100) })),
          storesCount: currentStores.length,
        });
      }

      return {
        text,
      };
    }
  } catch (error) {
    // Check if this is a non-fatal Vertex AI metadata-only response error
    const isVertexMetadataError =
      error instanceof Error &&
      error.message?.includes("Invalid input: expected array, received undefined") &&
      error.message?.includes("candidates");

    if (isVertexMetadataError) {
      // Return empty text - the tool calls may have succeeded
      return {
        text: "",
      };
    }

    throw error;
  }
}
