import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { FlowCloudData } from "@/shared/lib/cloud-upload-helpers";

import { Flow, ReadyState } from "@/entities/flow/domain";
import { NodeType } from "@/entities/flow/model/node-types";
import { FlowDrizzleMapper } from "./flow-drizzle-mapper";

/**
 * Mapper for converting between Flow domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., response_template, data_store_schema)
 * - Domain: camelCase (e.g., responseTemplate, dataStoreSchema)
 *
 * Note: During import, node IDs and edge IDs are remapped using the provided nodeIdMap.
 * The flow itself gets a new ID to avoid conflicts.
 */
export class FlowSupabaseMapper {
  private constructor() {}

  // ============================================
  // Flow: Cloud → Domain
  // ============================================

  /**
   * Remap node IDs in the flow nodes array.
   * Also updates flowId references in data store nodes.
   */
  private static remapNodes(
    nodes: any[],
    nodeIdMap: Map<string, string>,
    newFlowId: string,
  ): any[] {
    return nodes.map((node: any) => {
      const newId = nodeIdMap.get(node.id) || node.id;
      let nodeData = {};

      // For dataStore nodes, update the flowId in data
      if (node.type === NodeType.DATA_STORE && node.data?.flowId) {
        nodeData = { flowId: newFlowId };
      }

      return {
        ...node,
        id: newId,
        data: nodeData,
      };
    });
  }

  /**
   * Remap edge IDs and source/target references.
   */
  private static remapEdges(
    edges: any[],
    nodeIdMap: Map<string, string>,
  ): any[] {
    return edges.map((edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      const newEdgeId = new UniqueEntityID().toString();

      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });
  }

  /**
   * Convert flow cloud data to domain entity.
   * Note: Always generates a new ID for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param nodeIdMap Map of original node IDs to new local node IDs
   * @param newFlowId New flow ID to use
   * @param sessionId Optional session ID to associate the flow with
   */
  public static fromCloud(
    data: FlowCloudData,
    nodeIdMap: Map<string, string>,
    newFlowId: string,
    sessionId?: UniqueEntityID,
  ): Result<Flow> {
    // Remap nodes with new IDs
    const newNodes = this.remapNodes(
      data.nodes as any[],
      nodeIdMap,
      newFlowId,
    );

    // Remap edges with new IDs
    const newEdges = this.remapEdges(data.edges as any[], nodeIdMap);

    return Flow.create(
      {
        name: data.name,
        description: data.description,
        nodes: newNodes,
        edges: newEdges,
        responseTemplate: data.response_template,
        dataStoreSchema: data.data_store_schema,
        // Don't import panelStructure/viewport - user should set their own layout
        sessionId,
        tags: data.tags ?? [],
        summary: data.summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        readyState: ReadyState.Draft, // Always start as draft
        // createdAt/updatedAt are set automatically by Flow.create()
      },
      new UniqueEntityID(newFlowId),
    );
  }

  // ============================================
  // Flow: Domain → Cloud
  // ============================================

  /**
   * Convert flow domain entity to cloud data format.
   *
   * @param flow Flow to convert
   * @param tokenCount Calculated token count from all agents
   * @param sessionId Optional session ID for session-bound exports
   */
  public static toCloud(
    flow: Flow,
    tokenCount: number,
    sessionId?: UniqueEntityID | null,
  ): FlowCloudData {
    // Use drizzle mapper to get persistence format
    const persistenceData = FlowDrizzleMapper.toPersistence(flow);

    // Extract fields from persistence data
    const {
      id,
      name,
      description,
      nodes,
      edges,
      response_template,
      data_store_schema,
      panel_structure,
      viewport,
      vibe_session_id,
      ready_state,
      validation_issues,
      tags,
      summary,
      version,
      conceptual_origin,
    } = persistenceData as any;

    return {
      id,
      name,
      description,
      nodes,
      edges,
      response_template,
      data_store_schema,
      panel_structure,
      viewport,
      vibe_session_id,
      ready_state,
      validation_issues,
      token_count: tokenCount,
      session_id: sessionId?.toString() || null,
      tags,
      summary,
      version,
      conceptual_origin,
      is_public: false,
      owner_id: null,
      created_at: flow.props.createdAt.toISOString(),
      updated_at: flow.props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  // ============================================
  // Helper: Create Node ID Map
  // ============================================

  /**
   * Create a mapping from original node IDs to new UUIDs.
   * Preserves start/end node IDs.
   *
   * @param flowNodes Nodes from the flow
   * @param agentIds Original agent IDs
   * @param dataStoreNodeIds Original data store node IDs
   * @param ifNodeIds Original if node IDs
   */
  public static createNodeIdMap(
    flowNodes: any[],
    agentIds: string[],
    dataStoreNodeIds: string[],
    ifNodeIds: string[],
  ): Map<string, string> {
    const nodeIdMap = new Map<string, string>();

    // Map agent IDs
    for (const agentId of agentIds) {
      nodeIdMap.set(agentId, new UniqueEntityID().toString());
    }

    // Map data store node IDs
    for (const nodeId of dataStoreNodeIds) {
      nodeIdMap.set(nodeId, new UniqueEntityID().toString());
    }

    // Map if node IDs
    for (const nodeId of ifNodeIds) {
      nodeIdMap.set(nodeId, new UniqueEntityID().toString());
    }

    // Map remaining flow nodes (start, end, etc.)
    for (const node of flowNodes) {
      if (!nodeIdMap.has(node.id)) {
        // For start/end nodes, keep the same ID
        if (node.type === NodeType.START || node.type === NodeType.END) {
          nodeIdMap.set(node.id, node.id);
        } else {
          nodeIdMap.set(node.id, new UniqueEntityID().toString());
        }
      }
    }

    return nodeIdMap;
  }
}
