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

/**
 * Type guard to check if a string is a valid NodeType
 */
export function isValidNodeType(value: string): value is NodeType {
  return Object.values(NodeType).includes(value as NodeType);
}

/**
 * Get all available node types as an array
 */
export function getAllNodeTypes(): NodeType[] {
  return Object.values(NodeType);
}
