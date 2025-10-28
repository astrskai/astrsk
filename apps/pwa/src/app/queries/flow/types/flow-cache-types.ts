/**
 * Type definitions for Flow data structures in React Query cache
 *
 * IMPORTANT: React Query cache stores persistence format data, not domain objects.
 * This is different from the Flow domain object structure.
 */

import { Node, Edge } from "@/entities/flow/domain/flow";

/**
 * Flow data as stored in React Query cache (persistence format)
 * This matches the structure returned by FlowDrizzleMapper.toPersistence()
 */
export interface FlowCacheData {
  // Direct properties with snake_case naming
  id: string;
  name: string;
  description: string;
  nodes: Node[];              // Direct access, not wrapped in props
  edges: Edge[];              // Direct access, not wrapped in props
  response_template?: string;  // Snake case
  data_store_schema?: any;     // Snake case
  panel_structure?: any;       // Snake case
  viewport?: any;
  ready_state: string;         // Snake case
  validation_issues?: any[];   // Snake case
  created_at?: Date;          // Snake case
  updated_at?: Date;          // Snake case
}

/**
 * Result of analyzing the flow data structure
 * Returned by debugFlowData helper
 */
export interface FlowDataDebugInfo {
  nodes: Node[] | null;
  edges: Edge[] | null;
  nodesLocation: "flowData.props.nodes" | "flowData.nodes" | "NOT_FOUND";
  edgesLocation: "flowData.props.edges" | "flowData.edges" | "NOT_FOUND";
  hasProps: boolean;
  hasSnakeCase: boolean;
}

/**
 * Type guard to check if data is in persistence format
 */
export function isFlowCacheData(data: any): data is FlowCacheData {
  return (
    data &&
    typeof data === 'object' &&
    'nodes' in data &&
    'edges' in data &&
    !('props' in data)
  );
}

/**
 * Type guard to check if data is a Flow domain object
 */
export function isFlowDomainObject(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'props' in data &&
    'nodes' in data.props &&
    'edges' in data.props
  );
}
