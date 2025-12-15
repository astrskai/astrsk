/**
 * Shared Workflow Builder Types
 *
 * Common type definitions shared between workflow-builder versions.
 * This file exists to prevent duplication between workflow-builder and workflow-builder_v1.
 */

/**
 * Data store schema field for context (from Stats step)
 */
export interface StatsDataStoreField {
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
  dataStoreSchema: StatsDataStoreField[];
}
