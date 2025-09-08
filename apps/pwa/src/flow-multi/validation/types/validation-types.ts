import { Agent } from "@/modules/agent/domain/agent";
import { Flow } from "@/modules/flow/domain/flow";
import { ApiConnectionWithModels } from "@/app/hooks/use-api-connections-with-models";
import { ApiSource } from "@/modules/api/domain";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  id: string;
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  title: string;
  description: string;
  suggestion: string;
  agentId?: string;
  agentName?: string;
  metadata?: Record<string, any>;
}

export enum ValidationIssueCode {
  // Agent Configuration Errors
  NO_MODEL_SELECTED = "NO_MODEL_SELECTED",
  MODEL_NOT_AVAILABLE = "MODEL_NOT_AVAILABLE",
  MISSING_AGENT_NAME = "MISSING_AGENT_NAME",
  AGENT_NAME_TOO_SHORT = "AGENT_NAME_TOO_SHORT",
  DUPLICATE_AGENT_NAME = "DUPLICATE_AGENT_NAME",
  MISSING_PROMPT = "MISSING_PROMPT",
  MISSING_STRUCTURED_OUTPUT_SCHEMA = "MISSING_STRUCTURED_OUTPUT_SCHEMA",

  // Message Structure Errors
  SYSTEM_MESSAGE_IN_MIDDLE = "SYSTEM_MESSAGE_IN_MIDDLE",
  MISSING_USER_MESSAGE_AFTER_SYSTEM = "MISSING_USER_MESSAGE_AFTER_SYSTEM",
  GEMINI_INVALID_MESSAGE_ENDING = "GEMINI_INVALID_MESSAGE_ENDING",
  GEMINI_SYSTEM_MESSAGE_AFTER_NON_SYSTEM = "GEMINI_SYSTEM_MESSAGE_AFTER_NON_SYSTEM",
  NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES = "NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES",

  // Variable Errors
  UNDEFINED_OUTPUT_VARIABLE = "UNDEFINED_OUTPUT_VARIABLE",
  // UNUSED_VARIABLE_IN_CARDS = 'UNUSED_VARIABLE_IN_CARDS',
  TURN_VARIABLE_OUTSIDE_HISTORY = "TURN_VARIABLE_OUTSIDE_HISTORY",

  // Flow Structure Errors
  INVALID_FLOW_STRUCTURE = "INVALID_FLOW_STRUCTURE",
  IF_NODE_MISSING_BRANCHES = "IF_NODE_MISSING_BRANCHES",
  IF_NODE_BRANCH_NOT_REACHING_END = "IF_NODE_BRANCH_NOT_REACHING_END",

  // Warnings
  MISSING_HISTORY_MESSAGE = "MISSING_HISTORY_MESSAGE",
  UNSUPPORTED_PARAMETERS = "UNSUPPORTED_PARAMETERS",
  // SO_PARAMETER_MISMATCH = 'SO_PARAMETER_MISMATCH',
  SYNTAX_ERROR = "SYNTAX_ERROR",
  UNUSED_OUTPUT_VARIABLE = "UNUSED_OUTPUT_VARIABLE",
  // UNVERIFIED_MODEL = 'UNVERIFIED_MODEL',
  UNDEFINED_PROVIDER_PARAMETER = "UNDEFINED_PROVIDER_PARAMETER",

  // Parameter Errors
  PARAMETER_OUT_OF_RANGE = "PARAMETER_OUT_OF_RANGE",

  // Data Store Errors
  DATA_STORE_INVALID_INITIAL_VALUE = "DATA_STORE_INVALID_INITIAL_VALUE",
  DATA_STORE_MISSING_INITIAL_VALUE = "DATA_STORE_MISSING_INITIAL_VALUE",
}

export interface ValidationContext {
  flow: Flow;
  agents: Map<string, Agent>;
  connectedAgents: Set<string>;
  connectedNodes: Set<string>; // All connected nodes (agents, if, dataStore, etc.)
  agentPositions: Map<
    string,
    { isConnectedToStart: boolean; isConnectedToEnd: boolean }
  >;
  apiConnectionsWithModels?: ApiConnectionWithModels[];
}

export interface ModelProviderInfo {
  provider: ApiSource;
  modelPatterns: RegExp[];
  supportedFeatures: {
    structuredOutput: boolean;
  };
}
