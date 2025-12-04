/**
 * Workflow Builder Types
 *
 * Type definitions for the workflow builder service.
 */

import type { Node, Edge, DataStoreSchemaField, DataStoreField } from "@/entities/flow/domain/flow";
import type { SchemaField } from "@/entities/agent/domain/agent";
import type { IfCondition } from "@/features/flow/nodes/if-node";
import { ModelTier } from "@/entities/agent/domain/agent";

// Re-export ModelTier for convenience
export { ModelTier };

/**
 * Data store schema field for context (from HUD step)
 */
export interface HudDataStoreField {
  id: string;
  name: string;
  type: "integer" | "number" | "boolean" | "string";
  description: string;
  initial: number | boolean | string;
  min?: number;
  max?: number;
}

/**
 * Context passed to the workflow builder agent
 */
export interface WorkflowBuilderContext {
  scenario?: string;
  dataStoreSchema: HudDataStoreField[];
}

/**
 * Prompt block structure (used in prompt messages)
 */
export interface AgentPromptBlock {
  id: string;
  name: string;
  type: "plain";
  template: string;
  isDeleteUnnecessaryCharacters?: boolean;
}

/**
 * Plain prompt message structure for agents
 */
export interface AgentPlainPromptMessage {
  id: string;
  type: "plain";
  role: "system" | "user" | "assistant";
  enabled: boolean;
  promptBlocks: AgentPromptBlock[];
}

/**
 * History prompt message structure for agents
 * Automatically includes conversation history in the prompt
 */
export interface AgentHistoryPromptMessage {
  id: string;
  type: "history";
  enabled: boolean;
  historyType: "split" | "merge";
  start: number;
  end: number;
  countFromEnd: boolean;
  userPromptBlocks: AgentPromptBlock[];
  assistantPromptBlocks: AgentPromptBlock[];
  userMessageRole: "user" | "assistant";
  charMessageRole: "user" | "assistant";
  subCharMessageRole: "user" | "assistant";
}

/**
 * Union type for all prompt message types
 */
export type AgentPromptMessage = AgentPlainPromptMessage | AgentHistoryPromptMessage;

/**
 * Agent configuration within the workflow
 */
export interface WorkflowAgent {
  id: string;
  nodeId: string;
  name: string;
  description: string;
  modelTier: ModelTier;
  promptMessages: AgentPromptMessage[];
  historyEnabled: boolean;
  historyCount: number;
  enabledStructuredOutput: boolean;
  schemaFields: SchemaField[];
}

/**
 * If Node configuration
 */
export interface WorkflowIfNode {
  id: string;
  nodeId: string;
  name: string;
  logicOperator: "AND" | "OR";
  conditions: IfCondition[];
}

/**
 * Data Store Node configuration
 */
export interface WorkflowDataStoreNode {
  id: string;
  nodeId: string;
  name: string;
  fields: DataStoreField[];
}

/**
 * Current workflow state being built
 */
export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  agents: Map<string, WorkflowAgent>;
  ifNodes: Map<string, WorkflowIfNode>;
  dataStoreNodes: Map<string, WorkflowDataStoreNode>;
  dataStoreSchema: DataStoreSchemaField[];
}

/**
 * Progress update for UI display
 */
export interface WorkflowBuilderProgress {
  step: number;
  totalSteps: number;
  phase: "initializing" | "building" | "validating" | "fixing" | "complete" | "error";
  toolName?: string;
  toolDescription?: string;
  message: string;
  timestamp: Date;
}

/**
 * Callbacks for workflow state changes
 */
export interface WorkflowBuilderCallbacks {
  onStateChange: (state: WorkflowState) => void;
  onProgress?: (progress: WorkflowBuilderProgress) => void;
}

/**
 * Result of workflow generation
 */
export interface WorkflowBuilderResult {
  state: WorkflowState;
  text: string;
}
