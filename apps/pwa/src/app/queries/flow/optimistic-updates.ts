/**
 * Flow Optimistic Updates
 * 
 * Utilities for optimistically updating the flow cache before server confirmation.
 * These provide immediate UI feedback while mutations are in progress.
 */

import { QueryClient } from "@tanstack/react-query";
import { flowKeys } from "./query-factory";
import { 
  Flow,
  Node,
  Edge,
  DataStoreSchemaField,
  ReadyState 
} from "@/modules/flow/domain/flow";
import { ValidationIssue } from "@/flow-multi/validation/types/validation-types";

/**
 * Update a node optimistically
 * Updates both the individual node query and the full flow
 */
export const updateNode = (
  queryClient: QueryClient,
  flowId: string,
  nodeId: string,
  updater: (node: Node) => Node
) => {
  // Update the specific node query
  queryClient.setQueryData<Node>(
    flowKeys.node(flowId, nodeId),
    (old) => (old ? updater(old) : old)
  );

  // Update the nodes array
  queryClient.setQueryData<Node[]>(
    flowKeys.nodes(flowId),
    (old) => {
      if (!old) return old;
      const index = old.findIndex(n => n.id === nodeId);
      if (index === -1) return old;
      const updated = [...old];
      updated[index] = updater(updated[index]);
      return updated;
    }
  );

  // Update the full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      // Check if flow has the expected structure
      if (!old.props || !old.props.nodes) {
        console.warn('[optimistic.updateNode] Flow in cache does not have props.nodes structure');
        return old;
      }
      const nodes = [...old.props.nodes];
      const index = nodes.findIndex(n => n.id === nodeId);
      if (index === -1) return old;
      nodes[index] = updater(nodes[index]);
      const result = old.update({ nodes });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Add a new node optimistically
 */
export const addNode = (
  queryClient: QueryClient,
  flowId: string,
  node: Node
) => {
  // Add to nodes array
  queryClient.setQueryData<Node[]>(
    flowKeys.nodes(flowId),
    (old) => [...(old || []), node]
  );

  // Add to full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update({ nodes: [...old.props.nodes, node] });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Remove a node optimistically
 * Also removes connected edges
 */
export const removeNode = (
  queryClient: QueryClient,
  flowId: string,
  nodeId: string
) => {
  // Remove from nodes array
  queryClient.setQueryData<Node[]>(
    flowKeys.nodes(flowId),
    (old) => old?.filter(n => n.id !== nodeId)
  );

  // Remove specific node query
  queryClient.removeQueries({ queryKey: flowKeys.node(flowId, nodeId) });

  // Update full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update({
        nodes: old.props.nodes.filter(n => n.id !== nodeId),
        // Also remove edges connected to this node
        edges: old.props.edges.filter(
          e => e.source !== nodeId && e.target !== nodeId
        ),
      });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Update an edge optimistically
 */
export const updateEdge = (
  queryClient: QueryClient,
  flowId: string,
  edgeId: string,
  updater: (edge: Edge) => Edge
) => {
  // Update the specific edge query
  queryClient.setQueryData<Edge>(
    flowKeys.edge(flowId, edgeId),
    (old) => (old ? updater(old) : old)
  );

  // Update the edges array
  queryClient.setQueryData<Edge[]>(
    flowKeys.edges(flowId),
    (old) => {
      if (!old) return old;
      const index = old.findIndex(e => e.id === edgeId);
      if (index === -1) return old;
      const updated = [...old];
      updated[index] = updater(updated[index]);
      return updated;
    }
  );

  // Update the full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const edges = [...old.props.edges];
      const index = edges.findIndex(e => e.id === edgeId);
      if (index === -1) return old;
      edges[index] = updater(edges[index]);
      const result = old.update({ edges });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Add a new edge optimistically
 */
export const addEdge = (
  queryClient: QueryClient,
  flowId: string,
  edge: Edge
) => {
  // Add to edges array
  queryClient.setQueryData<Edge[]>(
    flowKeys.edges(flowId),
    (old) => [...(old || []), edge]
  );

  // Add to full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update({ edges: [...old.props.edges, edge] });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Remove an edge optimistically
 */
export const removeEdge = (
  queryClient: QueryClient,
  flowId: string,
  edgeId: string
) => {
  // Remove from edges array
  queryClient.setQueryData<Edge[]>(
    flowKeys.edges(flowId),
    (old) => old?.filter(e => e.id !== edgeId)
  );

  // Remove specific edge query
  queryClient.removeQueries({ queryKey: flowKeys.edge(flowId, edgeId) });

  // Update full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update({
        edges: old.props.edges.filter(e => e.id !== edgeId),
      });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Update data store field optimistically
 */
export const updateDataStoreField = (
  queryClient: QueryClient,
  flowId: string,
  fieldId: string,
  updater: (field: DataStoreSchemaField) => DataStoreSchemaField
) => {
  // Update the specific field query
  queryClient.setQueryData<DataStoreSchemaField>(
    flowKeys.dataStoreField(flowId, fieldId),
    (old) => (old ? updater(old) : old)
  );

  // Update the fields array
  queryClient.setQueryData<DataStoreSchemaField[]>(
    flowKeys.dataStoreFields(flowId),
    (old) => {
      if (!old) return old;
      const index = old.findIndex(f => f.id === fieldId);
      if (index === -1) return old;
      const updated = [...old];
      updated[index] = updater(updated[index]);
      return updated;
    }
  );

  // Update the full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old || !old.props.dataStoreSchema) return old;
      const fields = [...old.props.dataStoreSchema.fields];
      const index = fields.findIndex(f => f.id === fieldId);
      if (index === -1) return old;
      fields[index] = updater(fields[index]);
      const result = old.update({
        dataStoreSchema: {
          ...old.props.dataStoreSchema,
          fields,
        },
      });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Update metadata optimistically
 */
export const updateMetadata = (
  queryClient: QueryClient,
  flowId: string,
  metadata: { name?: string; description?: string }
) => {
  // Update metadata query
  queryClient.setQueryData(
    flowKeys.metadata(flowId),
    (old: any) => old ? { ...old, ...metadata } : old
  );

  // Update full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update(metadata);
      return result.isSuccess ? result.getValue() : old;
    }
  );
};

/**
 * Update response template optimistically
 */
export const updateResponseTemplate = (
  queryClient: QueryClient,
  flowId: string,
  template: string
) => {
  // Update response query
  queryClient.setQueryData(flowKeys.response(flowId), template);

  // Update full flow if cached - handle persistence format
  queryClient.setQueryData(
    flowKeys.detail(flowId),
    (old: any) => {
      if (!old) return old;
      // The cached data is in persistence format, not domain format
      // Just update the responseTemplate property directly
      return {
        ...old,
        responseTemplate: template
      };
    }
  );
};

/**
 * Set validation issues optimistically
 */
export const setValidationIssues = (
  queryClient: QueryClient,
  flowId: string,
  issues: ValidationIssue[]
) => {
  // Update issues array
  queryClient.setQueryData(flowKeys.validationIssues(flowId), issues);

  // Update validation state
  queryClient.setQueryData(flowKeys.validation(flowId), (old: any) => ({
    ...old,
    issues,
    readyState: issues.some(i => i.severity === 'error') ? ReadyState.Error : ReadyState.Ready,
  }));

  // Update full flow if cached
  queryClient.setQueryData<Flow>(
    flowKeys.detail(flowId),
    (old) => {
      if (!old) return old;
      const result = old.update({
        validationIssues: issues,
        readyState: issues.some(i => i.severity === 'error') ? ReadyState.Error : ReadyState.Ready,
      });
      return result.isSuccess ? result.getValue() : old;
    }
  );
};