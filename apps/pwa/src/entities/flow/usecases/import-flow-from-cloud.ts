import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import {
  fetchFlowFromCloud,
  type FlowCloudData,
  type AgentCloudData,
  type DataStoreNodeCloudData,
  type IfNodeCloudData,
} from "@/shared/lib/cloud-download-helpers";

import { Flow } from "@/entities/flow/domain/flow";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { Agent } from "@/entities/agent/domain";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { DataStoreNode } from "@/entities/data-store-node/domain";
import { SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { IfNode } from "@/entities/if-node/domain";
import { SaveIfNodeRepo } from "@/entities/if-node/repos";
import { ApiSource } from "@/entities/api/domain";
import { NodeType } from "@/entities/flow/model/node-types";

interface Command {
  flowId: string;
  sessionId?: UniqueEntityID; // Optional - if provided, creates session-local flow
  agentModelOverrides?: Map<
    string,
    {
      apiSource: string;
      modelId: string;
      modelName: string;
    }
  >;
}

/**
 * Import a flow from cloud storage by ID
 *
 * This usecase:
 * 1. Fetches flow data and all child nodes (agents, data store nodes, if nodes) from Supabase
 * 2. Creates new local entities with new IDs
 * 3. Remaps all node/edge references to use new IDs
 * 4. Saves everything to local database
 */
export class ImportFlowFromCloud implements UseCase<Command, Result<Flow>> {
  constructor(
    private saveFlowRepo: SaveFlowRepo,
    private saveAgentRepo: SaveAgentRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  private createAgentFromCloudData(
    agentData: AgentCloudData,
    newFlowId: string,
    newNodeId: string,
    modelOverride?: { apiSource: string; modelId: string; modelName: string },
  ): Result<Agent> {
    // Convert cloud data to agent JSON format
    const agentJson = {
      name: agentData.name,
      description: agentData.description,
      targetApiType: agentData.target_api_type,
      apiSource: modelOverride?.apiSource ?? agentData.api_source,
      modelId: modelOverride?.modelId ?? agentData.model_id,
      modelName: modelOverride?.modelName ?? agentData.model_name,
      modelTier: agentData.model_tier,
      promptMessages:
        typeof agentData.prompt_messages === "string"
          ? JSON.parse(agentData.prompt_messages)
          : agentData.prompt_messages,
      textPrompt: agentData.text_prompt,
      enabledParameters: agentData.enabled_parameters,
      parameterValues: agentData.parameter_values,
      enabledStructuredOutput: agentData.enabled_structured_output,
      outputFormat: agentData.output_format,
      outputStreaming: agentData.output_streaming,
      schemaName: agentData.schema_name,
      schemaDescription: agentData.schema_description,
      schemaFields: agentData.schema_fields,
      tokenCount: agentData.token_count,
      color: agentData.color,
      flowId: newFlowId,
    };

    const agentResult = Agent.fromJSON(agentJson);
    if (agentResult.isFailure) {
      return Result.fail(agentResult.getError());
    }

    // Create agent with new ID
    return Agent.create(agentResult.getValue().props, new UniqueEntityID(newNodeId));
  }

  private createDataStoreNodeFromCloudData(
    nodeData: DataStoreNodeCloudData,
    newFlowId: string,
    newNodeId: string,
  ): Result<DataStoreNode> {
    return DataStoreNode.create(
      {
        flowId: newFlowId,
        name: nodeData.name,
        color: nodeData.color,
        dataStoreFields: nodeData.data_store_fields ?? [],
      },
      new UniqueEntityID(newNodeId),
    );
  }

  private createIfNodeFromCloudData(
    nodeData: IfNodeCloudData,
    newFlowId: string,
    newNodeId: string,
  ): Result<IfNode> {
    // Convert cloud logicOperator (lowercase) to domain format (uppercase)
    const logicOperator = (nodeData.logicOperator?.toUpperCase() ?? "AND") as "AND" | "OR";

    return IfNode.create(
      {
        flowId: newFlowId,
        name: nodeData.name,
        color: nodeData.color,
        logicOperator,
        conditions: nodeData.conditions ?? [],
      },
      new UniqueEntityID(newNodeId),
    );
  }

  private remapEdgeIds(edges: any[], nodeIdMap: Map<string, string>): any[] {
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

  async execute({
    flowId,
    sessionId,
    agentModelOverrides,
  }: Command): Promise<Result<Flow>> {
    try {
      // 1. Fetch flow and all child nodes from cloud
      const fetchResult = await fetchFlowFromCloud(flowId);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      const { flow: flowData, agents, dataStoreNodes, ifNodes } = fetchResult.getValue();

      // 2. Create ID mappings for all nodes
      const nodeIdMap = new Map<string, string>();
      const newFlowId = new UniqueEntityID().toString();

      // Map agent IDs
      for (const agent of agents) {
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(agent.id, newNodeId);
      }

      // Map data store node IDs
      for (const node of dataStoreNodes) {
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(node.id, newNodeId);
      }

      // Map if node IDs
      for (const node of ifNodes) {
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(node.id, newNodeId);
      }

      // Map special nodes (start, end) and any other nodes in the flow
      const flowNodes = flowData.nodes as any[];
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

      // 3. Remap flow nodes with new IDs
      const newNodes = flowNodes.map((node: any) => {
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

      // 4. Remap edges with new IDs
      const newEdges = this.remapEdgeIds(flowData.edges as any[], nodeIdMap);

      // 5. Create and save the flow FIRST (so child nodes can reference it)
      const flowResult = Flow.create(
        {
          name: flowData.name,
          description: flowData.description,
          nodes: newNodes,
          edges: newEdges,
          responseTemplate: flowData.response_template,
          dataStoreSchema: flowData.data_store_schema,
          // Don't import panelStructure/viewport - user should set their own layout
          sessionId, // Already a UniqueEntityID or undefined
          tags: flowData.tags ?? [],
          summary: flowData.summary ?? undefined,
          version: flowData.version ?? undefined,
          conceptualOrigin: flowData.conceptual_origin ?? undefined,
        },
        new UniqueEntityID(newFlowId),
      );

      if (flowResult.isFailure) {
        return Result.fail(flowResult.getError());
      }

      const savedFlowResult = await this.saveFlowRepo.saveFlow(flowResult.getValue());
      if (savedFlowResult.isFailure) {
        return Result.fail(savedFlowResult.getError());
      }

      // 6. Create and save agents with new IDs
      for (const agentData of agents) {
        const newNodeId = nodeIdMap.get(agentData.id);
        if (!newNodeId) continue;

        const modelOverride = agentModelOverrides?.get(agentData.id);
        const agentResult = this.createAgentFromCloudData(
          agentData,
          newFlowId,
          newNodeId,
          modelOverride,
        );

        if (agentResult.isSuccess) {
          await this.saveAgentRepo.saveAgent(agentResult.getValue());
        }
      }

      // 7. Create and save data store nodes with new IDs
      for (const nodeData of dataStoreNodes) {
        const newNodeId = nodeIdMap.get(nodeData.id);
        if (!newNodeId) continue;

        const nodeResult = this.createDataStoreNodeFromCloudData(
          nodeData,
          newFlowId,
          newNodeId,
        );

        if (nodeResult.isSuccess) {
          await this.saveDataStoreNodeRepo.saveDataStoreNode(nodeResult.getValue());
        }
      }

      // 8. Create and save if nodes with new IDs
      for (const nodeData of ifNodes) {
        const newNodeId = nodeIdMap.get(nodeData.id);
        if (!newNodeId) continue;

        const nodeResult = this.createIfNodeFromCloudData(
          nodeData,
          newFlowId,
          newNodeId,
        );

        if (nodeResult.isSuccess) {
          await this.saveIfNodeRepo.saveIfNode(nodeResult.getValue());
        }
      }

      return savedFlowResult;
    } catch (error) {
      return formatFail("Failed to import flow from cloud", error);
    }
  }
}
