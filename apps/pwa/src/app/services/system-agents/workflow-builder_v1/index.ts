/**
 * Workflow Builder
 *
 * AI-powered workflow generation using Vercel AI SDK with tool calling.
 * The agent can create complete flow graphs with agents, conditions, and data store nodes.
 */

// Re-export types
export * from "./types";

// Re-export helpers
export {
  generateUniqueId,
  toSnakeCase,
  createPromptBlock,
  createPlainMessage,
  organizeNodePositions,
  workflowStateToFlowData,
  type WorkflowModelSettings,
} from "./helpers";

// Re-export system prompt builder
export {
  buildSystemPrompt,
  buildUserPrompt,
  buildFixerSystemPrompt,
  buildFixerUserPrompt,
} from "./system-prompt";

// Re-export tools
export { createWorkflowTools, TOOL_DESCRIPTIONS } from "./tools";

// Re-export the main function from service
export { generateWorkflow } from "./service";
