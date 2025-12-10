/**
 * Workflow Builder Service (Simplified)
 *
 * Single-stage workflow configuration for pre-connected templates.
 * Only configures prompts, outputs, and datastore fields - no node/edge creation.
 */

import { generateText, stepCountIs } from "ai";

import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
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
    logger.info(`[WorkflowBuilder] Progress: ${phase} - ${message}`);
    callbacks.onProgress?.(progress);
  };

  try {
    sendProgress("initializing", "Starting workflow configuration...");

    // Get lite model
    const modelStore = useModelStore.getState();
    if (!modelStore.defaultLiteModel) {
      toastError("No AI model configured", {
        description: "Please set up a lite model in Settings > Providers to use workflow generation.",
      });
      throw new Error("No AI model configured. Please set up a lite model in Settings > Providers.");
    }

    const modelInfo = await getModelFromStore(modelStore.defaultLiteModel, "lite");

    logger.info("[WorkflowBuilder] Starting configuration", {
      nodeCount: state.nodes.length,
      agentCount: state.agents.size,
      dataStoreFieldCount: context.dataStoreSchema.length,
      modelId: modelInfo.modelId,
    });

    // Create tools
    const tools = createWorkflowTools(state, context, {
      onStateChange: (updatedState) => {
        callbacks.onStateChange(updatedState);
      },
      onToolCall: (toolName) => {
        const description = TOOL_DESCRIPTIONS[toolName] || toolName;
        sendProgress("building", description, toolName);
      },
    });

    sendProgress("building", "Configuring workflow for scenario...");

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
          logger.info(`[WorkflowBuilder] Step completed`, {
            toolCallCount: toolCalls?.length || 0,
            toolNames: toolCalls?.map((tc) => tc.toolName) || [],
            hasText: !!text,
          });
        },
      }),
      generateSessionName(context.scenario || "New Session"),
    ]);

    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    logger.info("[WorkflowBuilder] Configuration complete", {
      totalTime: `${totalTime}s`,
      agentCount: state.agents.size,
      dataStoreNodeCount: state.dataStoreNodes.size,
      sessionName,
    });

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
