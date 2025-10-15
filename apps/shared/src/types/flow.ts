export enum ReadyState {
  Draft = "draft",
  Ready = "ready",
  Error = "error",
}

/**
 * Node Type Enum
 * 
 * Replaces string literals for node types to ensure type safety
 * and consistency across the flow system.
 */
export enum NodeType {
  START = "start",
  END = "end", 
  AGENT = "agent",
  IF = "if",
  DATA_STORE = "dataStore"
}

// TODO: change name to `FlowNode`
export type Node = {
  id: string;
  type: NodeType; // Use enum instead of string literal
  position: {
    x: number;
    y: number;
  };
  data: object;
  deletable?: boolean;
  zIndex?: number; // Controls the layering order of nodes
};

// TODO: change name to `FlowEdge`
export type Edge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null; // Handle ID on source node (e.g., "true"/"false" for if-nodes)
  targetHandle?: string | null; // Handle ID on target node
  label?: string; // Optional label for visualization (e.g., "True"/"False" for if-nodes)
};

export type PanelLayout = {
  id: string;
  component: string;
  title: string;
  position?: {
    direction?: "left" | "right" | "above" | "below" | "within"; // Added 'within' for tabbed panels
    referencePanel?: string;
    referenceGroup?: string; // Added for group-based positioning
  };
  groupInfo?: {
    groupId: string;
    panelIndex: number;
    groupPanels: string[];
    isActiveInGroup: boolean;
  };
  params?: Record<string, any>;
  size?: {
    width?: number;
    height?: number;
  };
};

export type PanelStructure = {
  panels: PanelLayout[];
  activePanel?: string;
  version: number; // For future migrations
  serializedLayout?: any; // Dockview's native serialization
  panelMetadata?: Record<string, any>; // Panel metadata for consistent ID restoration
};

export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

// Data Store Schema types
export type DataStoreFieldType = "string" | "number" | "boolean" | "integer";

// Schema definition - defines the structure
export interface DataStoreSchemaField {
  id: string; // Will use UniqueEntityID().toString()
  name: string;
  type: DataStoreFieldType;
  initialValue: string; // Store as string, parse based on type
  description?: string;
}

// Runtime field - contains logic for computed fields
export interface DataStoreField {
  id: string; // Unique ID for this runtime field instance (will use UniqueEntityID().toString())
  schemaFieldId: string; // References DataStoreSchemaField.id
  logic?: string; // Optional logic/formula for computed fields using Jinja template syntax (validated in validation phase)
}

export interface DataStoreSchema {
  fields: DataStoreSchemaField[];
  version?: number; // For future migrations
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

// Data types for conditions
export type ConditionDataType = 'string' | 'number' | 'integer' | 'boolean';

// String operators
export type StringOperator = 
  | 'string_exists'
  | 'string_not_exists'
  | 'string_is_empty'
  | 'string_is_not_empty'
  | 'string_equals'
  | 'string_not_equals'
  | 'string_contains'
  | 'string_not_contains'
  | 'string_starts_with'
  | 'string_not_starts_with'
  | 'string_ends_with'
  | 'string_not_ends_with'
  | 'string_matches_regex'
  | 'string_not_matches_regex';

// Number operators
export type NumberOperator = 
  | 'number_exists'
  | 'number_not_exists'
  | 'number_is_empty'
  | 'number_is_not_empty'
  | 'number_equals'
  | 'number_not_equals'
  | 'number_greater_than'
  | 'number_less_than'
  | 'number_greater_than_or_equals'
  | 'number_less_than_or_equals';

// Integer operators (explicitly defined)
export type IntegerOperator = 
  | 'integer_exists'
  | 'integer_not_exists'
  | 'integer_is_empty'
  | 'integer_is_not_empty'
  | 'integer_equals'
  | 'integer_not_equals'
  | 'integer_greater_than'
  | 'integer_less_than'
  | 'integer_greater_than_or_equals'
  | 'integer_less_than_or_equals';

// Boolean operators
export type BooleanOperator = 
  | 'boolean_exists'
  | 'boolean_not_exists'
  | 'boolean_is_empty'
  | 'boolean_is_not_empty'
  | 'boolean_is_true'
  | 'boolean_is_false'
  | 'boolean_equals'
  | 'boolean_not_equals';

// Union of all operators
export type ConditionOperator = StringOperator | NumberOperator | IntegerOperator | BooleanOperator;

// Operators that don't require a second value
export const UNARY_OPERATORS: ConditionOperator[] = [
  'string_exists',
  'string_not_exists',
  'string_is_empty',
  'string_is_not_empty',
  'number_exists',
  'number_not_exists',
  'number_is_empty',
  'number_is_not_empty',
  'integer_exists',
  'integer_not_exists',
  'integer_is_empty',
  'integer_is_not_empty',
  'boolean_exists',
  'boolean_not_exists',
  'boolean_is_empty',
  'boolean_is_not_empty',
  'boolean_is_true',
  'boolean_is_false'
];

// Updated condition interface
export interface Condition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

// Operator configurations
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  // String operators
  'string_exists': 'exists',
  'string_not_exists': 'does not exist',
  'string_is_empty': 'is empty',
  'string_is_not_empty': 'is not empty',
  'string_equals': 'is equal to',
  'string_not_equals': 'is not equal to',
  'string_contains': 'contains',
  'string_not_contains': 'does not contain',
  'string_starts_with': 'starts with',
  'string_not_starts_with': 'does not start with',
  'string_ends_with': 'ends with',
  'string_not_ends_with': 'does not end with',
  'string_matches_regex': 'matches regex',
  'string_not_matches_regex': 'does not match regex',
  
  // Number operators
  'number_exists': 'exists',
  'number_not_exists': 'does not exist',
  'number_is_empty': 'is empty',
  'number_is_not_empty': 'is not empty',
  'number_equals': 'is equal to',
  'number_not_equals': 'is not equal to',
  'number_greater_than': 'is greater than',
  'number_less_than': 'is less than',
  'number_greater_than_or_equals': 'is greater than or equal to',
  'number_less_than_or_equals': 'is less than or equal to',
  
  // Integer operators
  'integer_exists': 'exists',
  'integer_not_exists': 'does not exist',
  'integer_is_empty': 'is empty',
  'integer_is_not_empty': 'is not empty',
  'integer_equals': 'is equal to',
  'integer_not_equals': 'is not equal to',
  'integer_greater_than': 'is greater than',
  'integer_less_than': 'is less than',
  'integer_greater_than_or_equals': 'is greater than or equal to',
  'integer_less_than_or_equals': 'is less than or equal to',
  
  // Boolean operators
  'boolean_exists': 'exists',
  'boolean_not_exists': 'does not exist',
  'boolean_is_empty': 'is empty',
  'boolean_is_not_empty': 'is not empty',
  'boolean_is_true': 'is true',
  'boolean_is_false': 'is false',
  'boolean_equals': 'is equal to',
  'boolean_not_equals': 'is not equal to'
};
