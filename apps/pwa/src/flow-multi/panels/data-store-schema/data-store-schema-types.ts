// Re-export types from flow domain to maintain single source of truth
export type { DataStoreSchemaField, DataStoreSchema, DataStoreFieldType } from "@/modules/flow/domain/flow";

/**
 * Props for the Data Schema Panel
 */
export interface DataStoreSchemaProps {
  flowId: string;
}