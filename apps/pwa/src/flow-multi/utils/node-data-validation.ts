/**
 * Node Data Validation Utilities
 * Ensures node data integrity before saving to prevent flow corruption
 */

import type { Node as FlowNode } from "@/modules/flow/domain/flow";
import type { DataStoreNodeData } from "@/flow-multi/nodes/data-store-node";
import type { IfNodeData } from "@/flow-multi/nodes/if-node";
import type { AgentNodeData } from "@/flow-multi/nodes/agent-node";

// Extended node type with union of all possible data types
type CustomNodeData = AgentNodeData | DataStoreNodeData | IfNodeData | Record<string, any>;
type CustomNode = FlowNode & { data: CustomNodeData };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single node's data structure
 */
export function validateNodeData(node: CustomNode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Basic structure validation
  if (!node) {
    errors.push("Node is null or undefined");
    return { isValid: false, errors, warnings };
  }
  
  if (!node.id) {
    errors.push("Node ID is missing");
  }
  
  if (!node.type) {
    errors.push("Node type is missing");
  }
  
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    errors.push("Node position is invalid or missing");
  }
  
  // 2. Type-specific validation
  switch (node.type) {
    case 'agent':
      validateAgentNode(node, errors, warnings);
      break;
    case 'dataStore':
      validateDataStoreNode(node, errors, warnings);
      break;
    case 'if':
      validateIfNode(node, errors, warnings);
      break;
    case 'start':
    case 'end':
      // Start and end nodes have minimal data requirements
      break;
    default:
      warnings.push(`Unknown node type: ${node.type}`);
  }
  
  // 3. Data field validation
  if (node.data === null || node.data === undefined) {
    errors.push("Node data field is null or undefined");
  } else if (typeof node.data !== 'object') {
    errors.push("Node data field is not an object");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates agent node specific data
 */
function validateAgentNode(node: CustomNode, errors: string[], warnings: string[]) {
  const data = node.data as any;
  
  if (!data) {
    errors.push(`Agent node ${node.id}: data is missing`);
    return;
  }
  
  // agentId is optional - if not present, the node ID is used as the agent ID (backward compatibility)
  if (!data.agentId) {
    warnings.push(`Agent node ${node.id}: agentId is missing, will use node ID as fallback`);
  }
  
  // Check for common data corruption patterns
  if (data.agentId && typeof data.agentId !== 'string') {
    errors.push(`Agent node ${node.id}: agentId is not a string`);
  }
}

/**
 * Validates data store node specific data
 */
function validateDataStoreNode(node: CustomNode, errors: string[], warnings: string[]) {
  const data = node.data as any;
  
  if (!data) {
    errors.push(`Data store node ${node.id}: data is missing`);
    return;
  }
  
  // Label is optional but should be string if present
  if (data.label !== undefined && typeof data.label !== 'string') {
    errors.push(`Data store node ${node.id}: label is not a string`);
  }
  
  // Color should be a valid hex color if present
  if (data.color && typeof data.color === 'string') {
    if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      warnings.push(`Data store node ${node.id}: color is not a valid hex color`);
    }
  }
  
  // Validate dataStoreFields if present
  if (data.dataStoreFields) {
    if (!Array.isArray(data.dataStoreFields)) {
      errors.push(`Data store node ${node.id}: dataStoreFields is not an array`);
    } else {
      data.dataStoreFields.forEach((field: any, index: number) => {
        if (!field.schemaFieldId) {
          errors.push(`Data store node ${node.id}: field[${index}] missing schemaFieldId`);
        }
        if (field.value === undefined) {
          warnings.push(`Data store node ${node.id}: field[${index}] missing value`);
        }
      });
    }
  }
}

/**
 * Validates if node specific data
 */
function validateIfNode(node: CustomNode, errors: string[], warnings: string[]) {
  const data = node.data as any;
  
  if (!data) {
    errors.push(`If node ${node.id}: data is missing`);
    return;
  }
  
  // Label is optional but should be string if present
  if (data.label !== undefined && typeof data.label !== 'string') {
    errors.push(`If node ${node.id}: label is not a string`);
  }
  
  // Logic operator validation
  if (data.logicOperator && !['AND', 'OR'].includes(data.logicOperator)) {
    errors.push(`If node ${node.id}: invalid logic operator "${data.logicOperator}"`);
  }
  
  // Conditions validation
  if (data.conditions) {
    if (!Array.isArray(data.conditions)) {
      errors.push(`If node ${node.id}: conditions is not an array`);
    } else {
      data.conditions.forEach((condition: any, index: number) => {
        if (!condition.id) {
          errors.push(`If node ${node.id}: condition[${index}] missing id`);
        }
        // Note: operator can be null during creation, so we don't mark it as error
        if (condition.operator && typeof condition.operator !== 'string') {
          errors.push(`If node ${node.id}: condition[${index}] operator is not a string`);
        }
      });
    }
  }
  
  // Color validation
  if (data.color && typeof data.color === 'string') {
    if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      warnings.push(`If node ${node.id}: color is not a valid hex color`);
    }
  }
}

/**
 * Validates all nodes in a flow
 */
export function validateAllNodes(nodes: CustomNode[]): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  if (!Array.isArray(nodes)) {
    allErrors.push("Nodes is not an array");
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }
  
  // Check for duplicate IDs
  const nodeIds = new Set<string>();
  const duplicateIds = new Set<string>();
  
  nodes.forEach(node => {
    if (node.id) {
      if (nodeIds.has(node.id)) {
        duplicateIds.add(node.id);
      }
      nodeIds.add(node.id);
    }
  });
  
  if (duplicateIds.size > 0) {
    allErrors.push(`Duplicate node IDs found: ${Array.from(duplicateIds).join(', ')}`);
  }
  
  // Validate each node
  nodes.forEach(node => {
    const result = validateNodeData(node);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Attempts to repair common node data issues
 */
export function repairNodeData(node: CustomNode): CustomNode {
  const repaired = { ...node };
  
  // Ensure data object exists
  if (!repaired.data) {
    repaired.data = {} as CustomNodeData;
  }
  
  // Ensure position exists
  if (!repaired.position) {
    repaired.position = { x: 0, y: 0 };
  }
  
  // Type-specific repairs with proper type casting
  const data = repaired.data as any;
  
  switch (repaired.type) {
    case 'dataStore':
      // Ensure label exists
      if (!data.label) {
        data.label = 'Data Store';
      }
      // Ensure dataStoreFields is an array
      if (!Array.isArray(data.dataStoreFields)) {
        data.dataStoreFields = [];
      }
      break;
      
    case 'if':
      // Ensure label exists
      if (!data.label) {
        data.label = 'If Condition';
      }
      // Ensure conditions is an array
      if (!Array.isArray(data.conditions)) {
        data.conditions = [];
      }
      // Ensure logicOperator exists
      if (!data.logicOperator) {
        data.logicOperator = 'AND';
      }
      break;
      
    case 'agent':
      // Ensure agentId exists (though it might be invalid)
      if (!data.agentId) {
        console.error('Agent node missing agentId, cannot auto-repair');
      }
      break;
  }
  
  return repaired;
}