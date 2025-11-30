import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import { fetchFlowFromCloud } from "@/shared/lib/cloud-download-helpers";

import { Flow } from "@/entities/flow/domain/flow";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { SaveIfNodeRepo } from "@/entities/if-node/repos";
import { FlowSupabaseMapper } from "@/entities/flow/mappers/flow-supabase-mapper";
import { AgentSupabaseMapper } from "@/entities/agent/mappers/agent-supabase-mapper";
import { DataStoreNodeSupabaseMapper } from "@/entities/data-store-node/mappers/data-store-node-supabase-mapper";
import { IfNodeSupabaseMapper } from "@/entities/if-node/mappers/if-node-supabase-mapper";

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

      // 2. Create ID mappings for all nodes using mapper helper
      const newFlowId = new UniqueEntityID().toString();
      const nodeIdMap = FlowSupabaseMapper.createNodeIdMap(
        flowData.nodes as any[],
        agents.map((a) => a.id),
        dataStoreNodes.map((n) => n.id),
        ifNodes.map((n) => n.id),
      );

      // 3. Create and save the flow using mapper
      const flowResult = FlowSupabaseMapper.fromCloud(
        flowData,
        nodeIdMap,
        newFlowId,
        sessionId,
      );

      if (flowResult.isFailure) {
        return Result.fail(flowResult.getError());
      }

      const savedFlowResult = await this.saveFlowRepo.saveFlow(flowResult.getValue());
      if (savedFlowResult.isFailure) {
        return Result.fail(savedFlowResult.getError());
      }

      // 4. Create and save agents using supabase mapper
      for (const agentData of agents) {
        const newNodeId = nodeIdMap.get(agentData.id);
        if (!newNodeId) continue;

        try {
          const modelOverride = agentModelOverrides?.get(agentData.id);

          const agentResult = AgentSupabaseMapper.fromCloud(
            agentData,
            newFlowId,
            newNodeId,
            modelOverride,
          );

          if (agentResult.isFailure) {
            console.error(`[ImportFlowFromCloud] Failed to create agent ${agentData.id}:`, agentResult.getError());
            continue;
          }

          await this.saveAgentRepo.saveAgent(agentResult.getValue());
        } catch (error) {
          console.error(`[ImportFlowFromCloud] Failed to import agent ${agentData.id}:`, error);
        }
      }

      // 5. Create and save data store nodes using supabase mapper
      for (const nodeData of dataStoreNodes) {
        const newNodeId = nodeIdMap.get(nodeData.id);
        if (!newNodeId) continue;

        try {
          const nodeResult = DataStoreNodeSupabaseMapper.fromCloud(
            nodeData,
            newFlowId,
            newNodeId,
          );

          if (nodeResult.isFailure) {
            console.error(`[ImportFlowFromCloud] Failed to create data store node ${nodeData.id}:`, nodeResult.getError());
            continue;
          }

          await this.saveDataStoreNodeRepo.saveDataStoreNode(nodeResult.getValue());
        } catch (error) {
          console.error(`[ImportFlowFromCloud] Failed to import data store node ${nodeData.id}:`, error);
        }
      }

      // 6. Create and save if nodes using supabase mapper
      for (const nodeData of ifNodes) {
        const newNodeId = nodeIdMap.get(nodeData.id);
        if (!newNodeId) continue;

        try {
          const nodeResult = IfNodeSupabaseMapper.fromCloud(
            nodeData,
            newFlowId,
            newNodeId,
          );

          if (nodeResult.isFailure) {
            console.error(`[ImportFlowFromCloud] Failed to create if node ${nodeData.id}:`, nodeResult.getError());
            continue;
          }

          await this.saveIfNodeRepo.saveIfNode(nodeResult.getValue());
        } catch (error) {
          console.error(`[ImportFlowFromCloud] Failed to import if node ${nodeData.id}:`, error);
        }
      }

      return savedFlowResult;
    } catch (error) {
      return formatFail("Failed to import flow from cloud", error);
    }
  }
}
