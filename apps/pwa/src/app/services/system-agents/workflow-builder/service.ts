/**
 * Workflow Builder Service (Simplified)
 *
 * Single-stage workflow configuration for pre-connected templates.
 * Only configures prompts, outputs, and datastore fields - no node/edge creation.
 */

import { generateText, stepCountIs } from "ai";

import { useModelStore, type DefaultModelSelection, getAstrskAiModel, SPECIFIC_MODELS } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";
import { toastError } from "@/shared/ui/toast";

import {
  type WorkflowBuilderContext,
  type WorkflowState,
  type WorkflowBuilderProgress,
} from "./types";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "./system-prompt";
import { createWorkflowTools, TOOL_DESCRIPTIONS } from "./tools";
import { generateSessionName } from "../session-name-generator";

// ============================================================================
// Helper: Get model from store settings
// ============================================================================

interface ModelInfo {
  model: ReturnType<typeof createLiteModel>;
  modelId: string;
  source: string;
}

async function getModelFromStore(
  modelSelection: DefaultModelSelection | null,
  modelType: "lite" | "strong"
): Promise<ModelInfo> {
  if (!modelSelection) {
    throw new Error(
      `No default ${modelType} model configured. Please set up a default model in Settings > Providers.`
    );
  }

  const connectionResult = await ApiService.getApiConnection.execute(
    new UniqueEntityID(modelSelection.apiConnectionId)
  );

  if (connectionResult.isFailure) {
    throw new Error(`Failed to get API connection: ${connectionResult.getError()}`);
  }

  const apiConnection = connectionResult.getValue();

  if (!apiConnection) {
    throw new Error("API connection not found.");
  }

  const model = createLiteModel(
    apiConnection.source,
    modelSelection.modelId,
    apiConnection.apiKey || "",
    apiConnection.baseUrl
  );

  return {
    model,
    modelId: modelSelection.modelId,
    source: apiConnection.source,
  };
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate a workflow by configuring a pre-connected template.
 * Single-stage process using lite model.
 */
export async function generateWorkflow({
  context,
  initialState,
  callbacks,
  abortSignal,
}: {
  context: WorkflowBuilderContext;
  initialState: WorkflowState;
  callbacks: {
    onStateChange: (state: WorkflowState) => void;
    onProgress?: (progress: WorkflowBuilderProgress) => void;
  };
  abortSignal?: AbortSignal;
}): Promise<{ state: WorkflowState; text: string; sessionName: string }> {
  const MAX_STEPS = 50;
  const startTime = performance.now();

  // Create mutable state
  const state: WorkflowState = {
    ...initialState,
    nodes: [...initialState.nodes],
    edges: [...initialState.edges],
    agents: new Map(initialState.agents),
    ifNodes: new Map(initialState.ifNodes),
    dataStoreNodes: new Map(initialState.dataStoreNodes),
    dataStoreSchema: [...initialState.dataStoreSchema],
  };

  const sendProgress = (
    phase: WorkflowBuilderProgress["phase"],
    message: string,
    toolName?: string
  ) => {
    const progress: WorkflowBuilderProgress = {
      step: 0,
      totalSteps: MAX_STEPS,
      phase,
      toolName,
      toolDescription: toolName ? TOOL_DESCRIPTIONS[toolName] : undefined,
      message,
      timestamp: new Date(),
    };
    callbacks.onProgress?.(progress);
  };

  try {
    sendProgress("initializing", "Loading AI model...");

    // Get Gemini 3 Pro model specifically for workflow generation
    const gemini3ProModel = await getAstrskAiModel(SPECIFIC_MODELS.WORKFLOW_GENERATION);

    if (!gemini3ProModel) {
      throw new Error("Gemini 3 Pro model not available. Please ensure astrsk.ai provider is configured.");
    }

    const modelInfo = await getModelFromStore(gemini3ProModel, "strong");

    sendProgress("initializing", "Preparing workflow tools...");

    // Create tools
    const tools = createWorkflowTools(state, context, {
      onStateChange: (updatedState) => {
        callbacks.onStateChange(updatedState);
      },
    });

    sendProgress("building", "Generating workflow with AI...");

    const systemPrompt = buildSystemPrompt(context, state);
    const userMessage = buildUserPrompt(context.dataStoreSchema.length);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    // GLM models require thinking to be disabled for tool calling
    const isGlmModel = modelInfo.modelId.toLowerCase().includes("glm");

    // Run workflow generation and session name generation in parallel
    const [result, sessionName] = await Promise.all([
      generateText({
        model: modelInfo.model,
        messages,
        tools,
        stopWhen: stepCountIs(MAX_STEPS),
        abortSignal,
        ...(isGlmModel && {
          providerOptions: {
            zhipu: { thinking: { type: "disabled" } },
          },
        }),
        onStepFinish: ({ toolCalls, text }) => {
          // Send progress for each tool call
          if (toolCalls && toolCalls.length > 0) {
            for (const tc of toolCalls) {
              const description = TOOL_DESCRIPTIONS[tc.toolName] || tc.toolName;
              sendProgress("building", description, tc.toolName);
            }
          }
        },
      }),
      generateSessionName(context.scenario || "New Session"),
    ]);

    sendProgress("complete", "Workflow configuration complete!");

    return {
      state,
      text: result.text || "Workflow configured successfully.",
      sessionName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[WorkflowBuilder] Error configuring workflow", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    sendProgress("error", `Error: ${errorMessage}`);
    throw error;
  }
}
