/**
 * Schema field type definition
 */
export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

/**
 * Props for the Data Store Schema Panel
 */
export interface DataStoreSchemaProps {
  flowId: string;
  nodeId: string;
}