/**
 * Workflow Builder Service
 *
 * AI-powered workflow generation using Vercel AI SDK with tool calling.
 * The agent can create complete flow graphs with agents, conditions, and data store nodes.
 */

import { generateText, stepCountIs } from "ai";

import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

import {
  type WorkflowBuilderContext,
  type WorkflowState,
  type WorkflowBuilderProgress,
} from "./types";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildFixerSystemPrompt,
  buildFixerUserPrompt,
} from "./system-prompt";
import { createWorkflowTools, TOOL_DESCRIPTIONS } from "./tools";
import { organizeNodePositions } from "./helpers";

// ============================================================================
// JSON Export Helper
// ============================================================================

/**
 * Convert WorkflowState to a JSON-serializable format
 */
function workflowStateToJson(state: WorkflowState) {
  return {
    nodes: state.nodes,
    edges: state.edges,
    agents: Object.fromEntries(state.agents.entries()),
    ifNodes: Object.fromEntries(state.ifNodes.entries()),
    dataStoreNodes: Object.fromEntries(state.dataStoreNodes.entries()),
    dataStoreSchema: state.dataStoreSchema,
  };
}

/**
 * Download workflow state as JSON file
 */
function downloadWorkflowJson(state: WorkflowState, filename: string = "workflow_state.json") {
  const json = JSON.stringify(workflowStateToJson(state), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  logger.info(`[WorkflowBuilder] Downloaded workflow state as ${filename}`);
}

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

  logger.info(`[WorkflowBuilder] Getting ${modelType} model`, {
    modelId: modelSelection.modelId,
    apiConnectionId: modelSelection.apiConnectionId,
  });

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

  logger.info(`[WorkflowBuilder] ${modelType} model API connection ready`, {
    source: apiConnection.source,
  });

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
// Helper: Create tools with callbacks
// ============================================================================

interface ToolCallbacks {
  onStateChange: (state: WorkflowState) => void;
  onProgress?: (progress: WorkflowBuilderProgress) => void;
}

interface ProgressState {
  currentStep: number;
  currentPhase: WorkflowBuilderProgress["phase"];
  lastValidationResult: { valid: boolean; errorCount: number } | null;
  stateChangeCount: number;
  startTime: number;
  maxSteps: number;
}

function createToolsWithCallbacks(
  state: WorkflowState,
  context: WorkflowBuilderContext,
  callbacks: ToolCallbacks,
  progressState: ProgressState,
  stageLabel: string
) {
  const sendProgress = (
    phase: WorkflowBuilderProgress["phase"],
    message: string,
    toolName?: string
  ) => {
    progressState.currentPhase = phase;
    const progress: WorkflowBuilderProgress = {
      step: progressState.currentStep,
      totalSteps: progressState.maxSteps,
      phase,
      toolName,
      toolDescription: toolName ? TOOL_DESCRIPTIONS[toolName] : undefined,
      message,
      timestamp: new Date(),
    };
    logger.info(`[WorkflowBuilder:${stageLabel}] Progress: ${phase} - ${message}`, {
      step: progressState.currentStep,
      toolName,
    });
    callbacks.onProgress?.(progress);
  };

  const printWorkflowState = (label: string) => {
    const elapsed = ((performance.now() - progressState.startTime) / 1000).toFixed(2);
    console.log(`\n========== WORKFLOW STATE [${stageLabel}:${label}] (${elapsed}s) ==========`);
    console.log(`\n--- NODES (${state.nodes.length}) ---`);
    state.nodes.forEach((node) => {
      console.log(`  [${node.type}] ${node.id}`);
    });
    console.log(`\n--- EDGES (${state.edges.length}) ---`);
    state.edges.forEach((edge) => {
      console.log(`  ${edge.source}${edge.sourceHandle ? `[${edge.sourceHandle}]` : ""} → ${edge.target}`);
    });
    console.log(`\n--- AGENTS (${state.agents.size}) ---`);
    state.agents.forEach((agent, id) => {
      console.log(`  [${id}] ${agent.name}`);
      console.log(`    prompts: ${agent.promptMessages.length}, fields: ${agent.schemaFields.length}`);
    });
    console.log(`\n--- IF NODES (${state.ifNodes.size}) ---`);
    state.ifNodes.forEach((ifNode, id) => {
      console.log(`  [${id}] ${ifNode.name} - conditions: ${ifNode.conditions.length}`);
    });
    console.log(`\n--- DATA STORE NODES (${state.dataStoreNodes.size}) ---`);
    state.dataStoreNodes.forEach((dsNode, id) => {
      console.log(`  [${id}] ${dsNode.name} - fields: ${dsNode.fields.length}`);
    });
    console.log(`\n=================================================\n`);
  };

  const tools = createWorkflowTools(state, context, {
    onStateChange: (updatedState) => {
      progressState.stateChangeCount++;
      printWorkflowState(`Change #${progressState.stateChangeCount}`);
      callbacks.onStateChange(updatedState);
    },
    onToolCall: (toolName, args) => {
      let phase: WorkflowBuilderProgress["phase"] = "building";
      if (toolName === "validate_workflow") {
        phase = progressState.lastValidationResult?.valid === false ? "fixing" : "validating";
      } else if (toolName.startsWith("query_")) {
        phase = progressState.currentPhase;
      }

      const description = TOOL_DESCRIPTIONS[toolName] || toolName;
      sendProgress(phase, description, toolName);

      logger.debug(`[WorkflowBuilder:${stageLabel}] Tool call: ${toolName}`, {
        args: JSON.stringify(args, null, 2),
      });
    },
    onToolResult: (toolName, result) => {
      logger.debug(`[WorkflowBuilder:${stageLabel}] Tool result: ${toolName}`, {
        result: JSON.stringify(result, null, 2),
      });

      if (toolName === "validate_workflow" && typeof result === "object" && result !== null) {
        const validationResult = result as {
          valid: boolean;
          errorCount: number;
          warningCount: number;
          issues: Array<{ code: string; severity: string; message: string; fix?: string }>;
          summary: string;
        };
        progressState.lastValidationResult = validationResult;

        console.log(`\n========== VALIDATION RESULTS [${stageLabel}] ==========`);
        console.log(`Valid: ${validationResult.valid}`);
        console.log(`Errors: ${validationResult.errorCount}, Warnings: ${validationResult.warningCount}`);
        console.log(`Summary: ${validationResult.summary}`);
        if (validationResult.issues && validationResult.issues.length > 0) {
          console.log(`\n--- Issues (${validationResult.issues.length}) ---`);
          validationResult.issues.forEach((issue, idx) => {
            console.log(`  [${idx + 1}] ${issue.severity.toUpperCase()}: ${issue.code}`);
            console.log(`      Message: ${issue.message}`);
            if (issue.fix) {
              console.log(`      Fix: ${issue.fix}`);
            }
          });
        }
        console.log(`=========================================\n`);

        if (validationResult.valid) {
          sendProgress("validating", "Workflow validation passed!");
        } else {
          sendProgress("fixing", `Found ${validationResult.errorCount} error(s), fixing...`);
        }
      }
    },
  });

  return { tools, sendProgress };
}

// ============================================================================
// Helper: Print final workflow state
// ============================================================================

function printFinalWorkflowState(
  state: WorkflowState,
  stageLabel: string,
  startTime: number,
  stateChangeCount: number
) {
  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n========== FINAL WORKFLOW STATE [${stageLabel}] (${totalTime}s, ${stateChangeCount} changes) ==========`);
  console.log("\n--- NODES ---");
  state.nodes.forEach((node) => {
    console.log(`  [${node.type}] ${node.id} at (${node.position.x}, ${node.position.y})`);
    if (node.data) {
      console.log(`    data:`, JSON.stringify(node.data, null, 2).split("\n").map(l => "    " + l).join("\n"));
    }
  });
  console.log("\n--- EDGES ---");
  state.edges.forEach((edge) => {
    console.log(`  ${edge.source}${edge.sourceHandle ? `[${edge.sourceHandle}]` : ""} → ${edge.target}${edge.targetHandle ? `[${edge.targetHandle}]` : ""}`);
  });
  console.log("\n--- AGENTS (FULL DETAILS) ---");
  state.agents.forEach((agent, id) => {
    console.log(`  [${id}] ${agent.name} (nodeId: ${agent.nodeId})`);
    console.log(`    description: ${agent.description}`);
    console.log(`    modelTier: ${agent.modelTier}`);
    console.log(`    historyEnabled: ${agent.historyEnabled}, historyCount: ${agent.historyCount}`);
    console.log(`    enabledStructuredOutput: ${agent.enabledStructuredOutput}`);
    console.log(`    schemaFields: ${JSON.stringify(agent.schemaFields)}`);
    console.log(`    promptMessages (${agent.promptMessages.length}):`);
    agent.promptMessages.forEach((msg, idx) => {
      if (msg.type === "plain") {
        console.log(`      [${idx}] ${msg.type} - ${msg.role} (enabled: ${msg.enabled})`);
        msg.promptBlocks.forEach((block) => {
          console.log(`        block "${block.name}": ${block.template.substring(0, 100)}${block.template.length > 100 ? "..." : ""}`);
        });
      } else if (msg.type === "history") {
        console.log(`      [${idx}] ${msg.type} (enabled: ${msg.enabled}) - historyType: ${msg.historyType}, start: ${msg.start}, end: ${msg.end}`);
      }
    });
  });
  console.log("\n--- IF NODES ---");
  state.ifNodes.forEach((ifNode, id) => {
    console.log(`  [${id}] ${ifNode.name} (nodeId: ${ifNode.nodeId})`);
    console.log(`    logicOperator: ${ifNode.logicOperator}`);
    console.log(`    conditions: ${JSON.stringify(ifNode.conditions)}`);
  });
  console.log("\n--- DATA STORE NODES ---");
  state.dataStoreNodes.forEach((dsNode, id) => {
    console.log(`  [${id}] ${dsNode.name} (nodeId: ${dsNode.nodeId})`);
    console.log(`    fields: ${JSON.stringify(dsNode.fields)}`);
  });
  console.log("\n--- DATA STORE SCHEMA ---");
  console.log(`  ${JSON.stringify(state.dataStoreSchema, null, 2)}`);
  console.log("\n=====================================\n");
}

// ============================================================================
// Stage 1: Light Model - Build Workflow
// ============================================================================

async function runBuilderStage(
  state: WorkflowState,
  context: WorkflowBuilderContext,
  callbacks: ToolCallbacks,
  abortSignal?: AbortSignal
): Promise<{ text: string; validationPassed: boolean }> {
  const MAX_STEPS = 100;
  const progressState: ProgressState = {
    currentStep: 0,
    currentPhase: "initializing",
    lastValidationResult: null,
    stateChangeCount: 0,
    startTime: performance.now(),
    maxSteps: MAX_STEPS,
  };

  const modelStore = useModelStore.getState();
  const liteModelInfo = await getModelFromStore(modelStore.defaultLiteModel, "lite");

  logger.info("[WorkflowBuilder:Builder] Initial state", {
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    agentCount: state.agents.size,
  });

  const { tools, sendProgress } = createToolsWithCallbacks(
    state,
    context,
    callbacks,
    progressState,
    "Builder"
  );

  sendProgress("initializing", "Stage 1: Building workflow with light model...");

  const systemPrompt = buildSystemPrompt(context, state);
  const userMessage = buildUserPrompt(context.dataStoreSchema.length);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userMessage },
  ];

  logger.info("[WorkflowBuilder:Builder] Context summary", {
    hasScenario: !!context.scenario,
    scenarioLength: context.scenario?.length || 0,
    dataStoreFieldCount: context.dataStoreSchema.length,
    dataStoreFields: context.dataStoreSchema.map((f) => f.name),
    modelId: liteModelInfo.modelId,
  });

  sendProgress("building", "Analyzing scenario and building workflow...");

  const result = await generateText({
    model: liteModelInfo.model,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    abortSignal,
    onStepFinish: ({ toolCalls, toolResults, text }) => {
      progressState.currentStep++;

      logger.info(`[WorkflowBuilder:Builder] Step ${progressState.currentStep} completed`, {
        toolCallCount: toolCalls?.length || 0,
        toolNames: toolCalls?.map((tc) => tc.toolName) || [],
        hasText: !!text,
        textPreview: text?.substring(0, 100),
      });

      if (toolResults && toolResults.length > 0) {
        toolResults.forEach((tr, idx) => {
          logger.info(`[WorkflowBuilder:Builder] Step ${progressState.currentStep} tool result ${idx + 1}`, {
            toolName: toolCalls?.[idx]?.toolName,
            result: JSON.stringify((tr as any).result ?? tr, null, 2).substring(0, 500),
          });
        });
      }
    },
  });

  logger.info("[WorkflowBuilder:Builder] Stage complete", {
    finalNodeCount: state.nodes.length,
    finalEdgeCount: state.edges.length,
    finalAgentCount: state.agents.size,
    totalSteps: progressState.currentStep,
    totalToolCalls: result.steps?.flatMap((s) => s.toolCalls).length || 0,
    validationPassed: progressState.lastValidationResult?.valid ?? false,
  });

  printFinalWorkflowState(state, "Builder", progressState.startTime, progressState.stateChangeCount);

  return {
    text: result.text || "",
    validationPassed: progressState.lastValidationResult?.valid ?? false,
  };
}

// ============================================================================
// Stage 2: Heavy Model - Fix Workflow
// ============================================================================

async function runFixerStage(
  state: WorkflowState,
  context: WorkflowBuilderContext,
  callbacks: ToolCallbacks,
  abortSignal?: AbortSignal
): Promise<{ text: string; validationPassed: boolean }> {
  const MAX_STEPS = 50; // Fixer stage needs fewer steps
  const progressState: ProgressState = {
    currentStep: 0,
    currentPhase: "fixing",
    lastValidationResult: null,
    stateChangeCount: 0,
    startTime: performance.now(),
    maxSteps: MAX_STEPS,
  };

  const modelStore = useModelStore.getState();
  const strongModelInfo = await getModelFromStore(modelStore.defaultStrongModel, "strong");

  logger.info("[WorkflowBuilder:Fixer] Starting fixer stage", {
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    agentCount: state.agents.size,
    modelId: strongModelInfo.modelId,
  });

  const { tools, sendProgress } = createToolsWithCallbacks(
    state,
    context,
    callbacks,
    progressState,
    "Fixer"
  );

  sendProgress("fixing", "Stage 2: Reviewing and fixing workflow with heavy model...");

  const systemPrompt = buildFixerSystemPrompt(context, state);
  const userMessage = buildFixerUserPrompt();

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userMessage },
  ];

  logger.info("[WorkflowBuilder:Fixer] Fixer prompt prepared", {
    systemPromptLength: systemPrompt.length,
  });

  const result = await generateText({
    model: strongModelInfo.model,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    abortSignal,
    onStepFinish: ({ toolCalls, toolResults, text }) => {
      progressState.currentStep++;

      logger.info(`[WorkflowBuilder:Fixer] Step ${progressState.currentStep} completed`, {
        toolCallCount: toolCalls?.length || 0,
        toolNames: toolCalls?.map((tc) => tc.toolName) || [],
        hasText: !!text,
        textPreview: text?.substring(0, 100),
      });

      if (toolResults && toolResults.length > 0) {
        toolResults.forEach((tr, idx) => {
          logger.info(`[WorkflowBuilder:Fixer] Step ${progressState.currentStep} tool result ${idx + 1}`, {
            toolName: toolCalls?.[idx]?.toolName,
            result: JSON.stringify((tr as any).result ?? tr, null, 2).substring(0, 500),
          });
        });
      }
    },
  });

  logger.info("[WorkflowBuilder:Fixer] Stage complete", {
    finalNodeCount: state.nodes.length,
    finalEdgeCount: state.edges.length,
    finalAgentCount: state.agents.size,
    totalSteps: progressState.currentStep,
    totalToolCalls: result.steps?.flatMap((s) => s.toolCalls).length || 0,
    validationPassed: progressState.lastValidationResult?.valid ?? false,
  });

  printFinalWorkflowState(state, "Fixer", progressState.startTime, progressState.stateChangeCount);

  return {
    text: result.text || "",
    validationPassed: progressState.lastValidationResult?.valid ?? false,
  };
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate a workflow using a two-stage AI process:
 * 1. Light model builds the initial workflow
 * 2. Heavy model reviews and fixes any issues
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
}): Promise<{ state: WorkflowState; text: string }> {
  const overallStartTime = performance.now();

  // Create mutable state for tracking - deep clone Maps to avoid mutating initialState
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
    message: string
  ) => {
    const progress: WorkflowBuilderProgress = {
      step: 0,
      totalSteps: 150, // Combined steps for both stages
      phase,
      message,
      timestamp: new Date(),
    };
    logger.info(`[WorkflowBuilder] Progress: ${phase} - ${message}`);
    callbacks.onProgress?.(progress);
  };

  try {
    // ========================================
    // Stage 1: Build with Light Model
    // ========================================
    sendProgress("initializing", "Starting two-stage workflow generation...");

    const builderResult = await runBuilderStage(
      state,
      context,
      callbacks,
      abortSignal
    );

    logger.info("[WorkflowBuilder] Builder stage complete", {
      validationPassed: builderResult.validationPassed,
    });

    // ========================================
    // Stage 2: Fix with Heavy Model
    // ========================================
    // Always run the fixer stage to ensure quality
    sendProgress("fixing", "Running fixer stage with heavy model...");

    const fixerResult = await runFixerStage(
      state,
      context,
      callbacks,
      abortSignal
    );

    logger.info("[WorkflowBuilder] Fixer stage complete", {
      validationPassed: fixerResult.validationPassed,
    });

    // ========================================
    // Finalize
    // ========================================
    // Automatically organize node positions
    organizeNodePositions(state);
    callbacks.onStateChange(state);
    logger.info("[WorkflowBuilder] Organized node positions automatically");

    const totalTime = ((performance.now() - overallStartTime) / 1000).toFixed(2);
    logger.info("[WorkflowBuilder] Two-stage generation complete", {
      totalTime: `${totalTime}s`,
      finalNodeCount: state.nodes.length,
      finalEdgeCount: state.edges.length,
      finalAgentCount: state.agents.size,
      finalValidation: fixerResult.validationPassed,
    });

    sendProgress("complete", "Workflow generation complete!");

    return {
      state,
      text: fixerResult.text || builderResult.text || "Workflow created successfully.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[WorkflowBuilder] Error generating workflow", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    sendProgress("error", `Error: ${errorMessage}`);
    throw error;
  } finally {
    // Always export the final state as JSON (even if incomplete or errored)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadWorkflowJson(state, `workflow_state_${timestamp}.json`);
  }
}
