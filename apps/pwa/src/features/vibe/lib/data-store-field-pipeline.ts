/**
 * Data Store Field Generation Pipeline
 *
 * Integrates with the existing vibe coding backend to handle data store field operations
 * The backend analysis agent detects data store requests and generates coordinated operations
 * This module provides utilities for processing those operations on the frontend
 */

import { Operation } from "../lib/operation-processor";

export interface DataStoreFieldContext {
  flowId: string;
  nodeId: string;
  fieldName: string;
  fieldType: "string" | "number" | "boolean" | "integer";
  fieldValue: string;
  fieldLogic?: string;
}

export interface DataStoreSchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "integer";
  initialValue: string;
  description?: string;
}

export interface DataStoreNodeField {
  id: string;
  schemaFieldId: string;
  value: string;
  logic?: string;
}

/**
 * UUID Management for Data Store Field Operations
 * Ensures referential integrity between schema fields and node fields
 */
export class DataStoreUUIDManager {
  /**
   * Verify UUID chain integrity in operations
   * Ensures schema field IDs match node field schema references
   */
  static verifyOperationChain(operations: Operation[]): boolean {

    const schemaOp = operations.find(
      (op) =>
        op.path.includes("data_store_schema") && op.path.includes("fields"),
    );
    const nodeOp = operations.find(
      (op) => op.path.includes("dataStoreNodes") && op.path.includes("fields"),
    );

    if (schemaOp && nodeOp) {
      const schemaId = schemaOp.value.id;
      const nodeSchemaRef = nodeOp.value.schemaFieldId;

      console.log(`🔗 Schema field ID: ${schemaId}`);
      console.log(`🔗 Node field schema reference: ${nodeSchemaRef}`);

      if (schemaId === nodeSchemaRef) {

        return true;
      } else {

        console.error(`❌ Expected: ${schemaId}, Got: ${nodeSchemaRef}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Extract data store field operations from a list of operations
   */
  static extractDataStoreOperations(operations: Operation[]): {
    schemaOperations: Operation[];
    nodeOperations: Operation[];
  } {
    const schemaOperations = operations.filter((op) =>
      op.path.includes("flow.data_store_schema.fields"),
    );

    const nodeOperations = operations.filter(
      (op) => op.path.includes("dataStoreNodes") && op.path.includes("fields"),
    );

    return { schemaOperations, nodeOperations };
  }

  /**
   * Log operation details for debugging
   */
  static logOperationDetails(operations: Operation[]): void {
    const { schemaOperations, nodeOperations } =
      this.extractDataStoreOperations(operations);


    if (schemaOperations.length > 0) {
      console.log(
        "📋 Schema Field Operations:",
        schemaOperations.map((op) => ({
          path: op.path,
          operation: op.operation,
          fieldId: op.value?.id,
          fieldName: op.value?.name,
          fieldType: op.value?.type,
        })),
      );
    }

    if (nodeOperations.length > 0) {
      console.log(
        "🎯 Node Field Operations:",
        nodeOperations.map((op) => ({
          path: op.path,
          operation: op.operation,
          fieldId: op.value?.id,
          schemaFieldId: op.value?.schemaFieldId,
          value: op.value?.value,
        })),
      );
    }
  }
}

/**
 * Data Store Field Detector
 * Analyzes user requests to identify data store field operations
 */
export class DataStoreFieldDetector {
  /**
   * Detect if a user request involves data store field operations
   */
  static detectDataStoreFieldRequest(
    userRequest: string,
  ): DataStoreFieldContext | null {
    // Simple detection patterns - in practice, this would be more sophisticated
    const patterns = [
      {
        regex: /add\s+(\w+)\s+(string|number|boolean|integer)\s+field/i,
        fieldNameIndex: 1,
        fieldTypeIndex: 2,
        fieldValueIndex: null,
      },
      {
        regex: /create\s+(\w+)\s+(string|number|boolean|integer)\s+field/i,
        fieldNameIndex: 1,
        fieldTypeIndex: 2,
        fieldValueIndex: null,
      },
      {
        regex: /set\s+(\w+)\s+field\s+to\s+(.+)/i,
        fieldNameIndex: 1,
        fieldTypeIndex: null,
        fieldValueIndex: 2,
      },
      {
        regex: /update\s+(\w+)\s+field/i,
        fieldNameIndex: 1,
        fieldTypeIndex: null,
        fieldValueIndex: null,
      },
    ];

    for (const pattern of patterns) {
      const match = userRequest.match(pattern.regex);
      if (match) {
        return {
          flowId: "detected-from-context", // Would be provided by calling context
          nodeId: "detected-from-context", // Would be provided by calling context
          fieldName: match[pattern.fieldNameIndex] || "field_name",
          fieldType: (pattern.fieldTypeIndex
            ? match[pattern.fieldTypeIndex]
            : "string") as "string" | "number" | "boolean" | "integer",
          fieldValue: pattern.fieldValueIndex
            ? match[pattern.fieldValueIndex]
            : "default_value",
        };
      }
    }

    return null;
  }

  /**
   * Extract field information from operations (for backend-generated operations)
   */
  static extractFieldInfoFromOperations(
    operations: Operation[],
  ): DataStoreFieldContext[] {
    const contexts: DataStoreFieldContext[] = [];
    const { nodeOperations } =
      DataStoreUUIDManager.extractDataStoreOperations(operations);

    for (const op of nodeOperations) {
      const nodeIdMatch = op.path.match(/dataStoreNodes\.([^.]+)\./);
      if (nodeIdMatch && op.value) {
        contexts.push({
          flowId: "extracted-from-operation",
          nodeId: nodeIdMatch[1],
          fieldName: "extracted-from-operation",
          fieldType: "string", // Default, would be determined from schema
          fieldValue: op.value.value || "",
          fieldLogic: op.value.logic,
        });
      }
    }

    return contexts;
  }
}

/**
 * Backend Integration Helper
 * Facilitates communication with the vibe coding backend for data store analysis
 */
export class DataStoreBackendIntegration {
  /**
   * Prepare context for backend analysis
   * Includes flow data and available resources for the analysis agent
   */
  static prepareAnalysisContext(flowData: any, availableResources: any[]): any {
    return {
      resourceId: flowData.id,
      resourceType: "flow_data",
      resourceName: flowData.name,
      resourceData: {
        ...flowData,
        // Ensure data store schema is available for analysis
        data_store_schema: flowData.data_store_schema || { fields: [] },
      },
      availableResources: availableResources.map((resource) => ({
        id: resource.id,
        type: "data_store_node",
        name: resource.name,
        description: `Data store node: ${resource.name}`,
      })),
    };
  }

  /**
   * Process backend response containing data store operations
   * Validates and logs the coordinated operations
   */
  static processBackendOperations(operations: Operation[]): {
    valid: boolean;
    dataStoreOperations: Operation[];
    errors: string[];
  } {
    const errors: string[] = [];

    // Extract data store specific operations
    const { schemaOperations, nodeOperations } =
      DataStoreUUIDManager.extractDataStoreOperations(operations);
    const dataStoreOperations = [...schemaOperations, ...nodeOperations];

    // Log operation details for debugging
    DataStoreUUIDManager.logOperationDetails(operations);

    // Verify UUID chain integrity
    const chainValid = DataStoreUUIDManager.verifyOperationChain(operations);
    if (!chainValid) {
      errors.push(
        "UUID chain verification failed - referential integrity broken",
      );
    }

    // Validate schema operations
    for (const op of schemaOperations) {
      if (!op.value?.id) {
        errors.push(`Schema field operation missing ID: ${op.path}`);
      }
      if (!op.value?.name) {
        errors.push(`Schema field operation missing name: ${op.path}`);
      }
    }

    // Validate node operations
    for (const op of nodeOperations) {
      if (!op.value?.id) {
        errors.push(`Node field operation missing ID: ${op.path}`);
      }
      if (!op.value?.schemaFieldId) {
        errors.push(
          `Node field operation missing schemaFieldId reference: ${op.path}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      dataStoreOperations,
      errors,
    };
  }
}

/**
 * Main Data Store Field Pipeline
 * Orchestrates the complete data store field generation process
 */
export class DataStoreFieldPipeline {
  /**
   * Process data store field request through the complete pipeline
   */
  static async processFieldRequest(
    userRequest: string,
    flowData: any,
    availableNodes: any[] = [],
  ): Promise<{
    needsBackendAnalysis: boolean;
    context?: any;
    detectedField?: DataStoreFieldContext;
  }> {
    // 1. Detect if this is a data store field request
    const detectedField =
      DataStoreFieldDetector.detectDataStoreFieldRequest(userRequest);

    if (detectedField) {
      // 2. Prepare context for backend analysis
      const analysisContext =
        DataStoreBackendIntegration.prepareAnalysisContext(
          flowData,
          availableNodes,
        );

      return {
        needsBackendAnalysis: true,
        context: analysisContext,
        detectedField,
      };
    }

    return { needsBackendAnalysis: false };
  }

  /**
   * Validate and process backend-generated operations
   */
  static validateBackendOperations(operations: Operation[]): {
    success: boolean;
    errors: string[];
    dataStoreOperations: Operation[];
  } {
    const result =
      DataStoreBackendIntegration.processBackendOperations(operations);

    return {
      success: result.valid,
      errors: result.errors,
      dataStoreOperations: result.dataStoreOperations,
    };
  }
}
