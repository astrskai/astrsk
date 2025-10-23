import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Agent } from "@/modules/agent/domain/agent";
import { LoadAgentRepo, SaveAgentRepo } from "@/modules/agent/repos";
import { Flow } from "@/modules/flow/domain/flow";
import { LoadFlowRepo } from "@/modules/flow/repos/load-flow-repo";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "@/modules/data-store-node/repos";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "@/modules/if-node/repos";
import { DataStoreNode } from "@/modules/data-store-node/domain";
import { IfNode } from "@/modules/if-node/domain";
import { NodeType } from "@/modules/flow/model/node-types";

export class CloneFlowWithNodes
  implements UseCase<UniqueEntityID, Promise<Result<Flow>>>
{
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
    private saveAgentRepo: SaveAgentRepo,
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    private loadIfNodeRepo: LoadIfNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  private async getFlow(id: UniqueEntityID): Promise<Flow> {
    const flowOrError = await this.loadFlowRepo.getFlowById(id);
    if (flowOrError.isFailure) {
      throw new Error(flowOrError.getError());
    }
    return flowOrError.getValue();
  }

  private async getAgent(id: UniqueEntityID): Promise<Agent> {
    const agentOrError = await this.loadAgentRepo.getAgentById(id);
    if (agentOrError.isFailure) {
      throw new Error(agentOrError.getError());
    }
    return agentOrError.getValue();
  }

  private async cloneAgent(agent: Agent): Promise<Agent> {
    // Clone agent with updated timestamp to force React updates
    const { id, createdAt, updatedAt, ...agentJson } = agent.toJSON();
    const clonedAgentOrError = Agent.fromJSON({
      ...agentJson,
      // Force new timestamp to ensure React sees this as different data
      updatedAt: new Date(),
    });
    if (clonedAgentOrError.isFailure) {
      throw new Error(
        `Failed to clone agent: ${clonedAgentOrError.getError()}`,
      );
    }
    const clonedAgent = clonedAgentOrError.getValue();

    // Save agent
    const savedAgentOrError = await this.saveAgentRepo.saveAgent(clonedAgent);
    if (savedAgentOrError.isFailure) {
      throw new Error(
        `Failed to save cloned agent: ${savedAgentOrError.getError()}`,
      );
    }
    const savedAgent = savedAgentOrError.getValue();

    return savedAgent;
  }

  private async cloneDataStoreNode(
    originalNodeId: string, 
    newNodeId: string, 
    originalFlowId: string,
    newFlowId: string
  ): Promise<DataStoreNode | null> {
    try {
      // Get original data store node
      const dataStoreOrError = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
        originalFlowId,
        originalNodeId
      );

      if (dataStoreOrError.isFailure || !dataStoreOrError.getValue()) {
        return null; // No separate data store node exists
      }

      const originalDataStoreNode = dataStoreOrError.getValue()!;

      // Create new data store node with new IDs
      const clonedDataStoreNodeOrError = DataStoreNode.create({
        flowId: newFlowId,
        name: originalDataStoreNode.name,
        color: originalDataStoreNode.color,
        dataStoreFields: originalDataStoreNode.dataStoreFields,
      }, new UniqueEntityID(newNodeId));

      if (clonedDataStoreNodeOrError.isFailure) {
        throw new Error(clonedDataStoreNodeOrError.getError());
      }

      const clonedDataStoreNode = clonedDataStoreNodeOrError.getValue();

      // Save cloned data store node
      const savedDataStoreOrError = await this.saveDataStoreNodeRepo.saveDataStoreNode(clonedDataStoreNode);
      if (savedDataStoreOrError.isFailure) {
        throw new Error(savedDataStoreOrError.getError());
      }

      return savedDataStoreOrError.getValue();
    } catch (error) {
      console.error(`Failed to clone data store node ${originalNodeId}:`, error);
      return null;
    }
  }

  private async cloneIfNode(
    originalNodeId: string, 
    newNodeId: string, 
    originalFlowId: string,
    newFlowId: string
  ): Promise<IfNode | null> {
    try {
      // Get original if node
      const ifNodeOrError = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
        originalFlowId,
        originalNodeId
      );

      if (ifNodeOrError.isFailure || !ifNodeOrError.getValue()) {
        return null; // No separate if node exists
      }

      const originalIfNode = ifNodeOrError.getValue()!;

      // Create new if node with new IDs
      const clonedIfNodeOrError = IfNode.create({
        flowId: newFlowId,
        name: originalIfNode.name,
        color: originalIfNode.color,
        logicOperator: originalIfNode.logicOperator,
        conditions: originalIfNode.conditions,
      }, new UniqueEntityID(newNodeId));

      if (clonedIfNodeOrError.isFailure) {
        throw new Error(clonedIfNodeOrError.getError());
      }

      const clonedIfNode = clonedIfNodeOrError.getValue();

      // Save cloned if node
      const savedIfNodeOrError = await this.saveIfNodeRepo.saveIfNode(clonedIfNode);
      if (savedIfNodeOrError.isFailure) {
        throw new Error(savedIfNodeOrError.getError());
      }

      return savedIfNodeOrError.getValue();
    } catch (error) {
      console.error(`Failed to clone if node ${originalNodeId}:`, error);
      return null;
    }
  }

  private async cloneFlow(flow: Flow, newFlowId: string): Promise<Flow> {
    // Clone agents with id map
    const agentIds = flow.agentIds;
    const agentIdMap = new Map<string, string>();
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      const clonedAgent = await this.cloneAgent(agent);
      agentIdMap.set(agent.id.toString(), clonedAgent.id.toString());
    }

    // Create node ID map for all nodes (not just agents)
    const nodeIdMap = new Map<string, string>();
    
    // Generate new IDs for all nodes
    for (const node of flow.props.nodes) {
      if (node.type === NodeType.AGENT) {
        // For agent nodes, use the cloned agent ID
        const newAgentId = agentIdMap.get(node.id);
        if (newAgentId) {
          nodeIdMap.set(node.id, newAgentId);
        }
      } else {
        // For other nodes, generate new UUID
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(node.id, newNodeId);
      }
    }

    // Clone data store nodes and if nodes with new IDs
    const originalFlowId = flow.id.toString();
    for (const node of flow.props.nodes) {
      const newNodeId = nodeIdMap.get(node.id);
      if (!newNodeId) continue;

      if (node.type === NodeType.DATA_STORE) {
        await this.cloneDataStoreNode(node.id, newNodeId, originalFlowId, newFlowId);
      } else if (node.type === NodeType.IF) {
        await this.cloneIfNode(node.id, newNodeId, originalFlowId, newFlowId);
      }
    }

    // Clone flow with updated timestamp to force React updates
    // Remove layout information so copied flow starts fresh
    const { id, createdAt, updatedAt, panelStructure, viewport, ...flowJson } = flow.toJSON();
    const clonedFlowOrError = Flow.fromJSON({
      ...flowJson,
      // Force new timestamp to ensure React sees this as different data
      updatedAt: new Date(),
      // Remove panel layout and viewport so copied flow starts with defaults
      panelStructure: null,
      viewport: null,
    });
    if (clonedFlowOrError.isFailure) {
      throw new Error(`Failed to clone flow: ${clonedFlowOrError.getError()}`);
    }
    const clonedFlow = clonedFlowOrError.getValue();

    // Replace all node IDs with new IDs
    const newNodes = clonedFlow.props.nodes.slice().map((node) => {
      const newId = nodeIdMap.get(node.id);
      const newDataAgentId = node.data && typeof node.data === 'object' && 'agentId' in node.data 
        ? agentIdMap.get(node.data.agentId as string) 
        : undefined;
      
      return {
        ...node,
        id: newId ?? node.id,
        data: node.type === NodeType.AGENT
          ? (newDataAgentId ? { ...node.data, agentId: newDataAgentId } : node.data)
          : node.type === NodeType.DATA_STORE || node.type === NodeType.IF
            ? { flowId: newFlowId } // New data structure uses flowId
            : node.data
      };
    });

    // Replace node IDs in edges
    const newEdges = clonedFlow.props.edges.slice().map((edge) => {
      const newSource = nodeIdMap.get(edge.source);
      const newTarget = nodeIdMap.get(edge.target);
      
      return {
        ...edge,
        id: new UniqueEntityID().toString(), // Generate new edge ID
        source: newSource ?? edge.source,
        target: newTarget ?? edge.target,
        // Convert null handles to undefined for React Flow compatibility
        sourceHandle: edge.sourceHandle === null ? undefined : edge.sourceHandle,
        targetHandle: edge.targetHandle === null ? undefined : edge.targetHandle,
      };
    });

    // Update flow with new ids
    const flowWithNewIdsOrError = clonedFlow.update({
      nodes: newNodes,
      edges: newEdges,
    });
    if (flowWithNewIdsOrError.isFailure) {
      throw new Error(
        `Failed to clone flow: ${flowWithNewIdsOrError.getError()}`,
      );
    }

    return flowWithNewIdsOrError.getValue();
  }

  private async changeFlowName(flow: Flow): Promise<Flow> {
    let copyCount = 0;
    while (true) {
      const baseName = flow.props.name;
      const name =
        copyCount === 0
          ? `Copy of ${baseName}`
          : `Copy of ${baseName} (${copyCount})`;
      flow.update({ name });
      const canUseFlowNameOrError =
        await this.loadFlowRepo.canUseFlowName(name);
      if (canUseFlowNameOrError.isFailure) {
        throw new Error(
          `Failed to check flow name: ${canUseFlowNameOrError.getError()}`,
        );
      }
      if (canUseFlowNameOrError.isSuccess && canUseFlowNameOrError.getValue()) {
        break;
      }
      copyCount++;
      if (copyCount > 10) {
        throw new Error(`Unable to find available name after 10 retries.`);
      }
    }
    return flow;
  }

  private async saveFlow(flow: Flow): Promise<Result<Flow>> {
    return this.saveFlowRepo.saveFlow(flow);
  }

  async execute(flowId: UniqueEntityID): Promise<Result<Flow>> {
    try {
      // Get flow
      const flow = await this.getFlow(flowId);

      // Generate new flow ID
      const newFlowId = new UniqueEntityID().toString();

      // Clone flow with all node types
      const clonedFlow = await this.cloneFlow(flow, newFlowId);

      // Change name
      const flowWithNewName = await this.changeFlowName(clonedFlow);

      // Update the flow with the correct new ID
      const finalFlowOrError = Flow.create(flowWithNewName.props, new UniqueEntityID(newFlowId));
      if (finalFlowOrError.isFailure) {
        throw new Error(finalFlowOrError.getError());
      }

      // Save flow
      const savedFlow = await this.saveFlow(finalFlowOrError.getValue());

      // Return cloned and saved flow
      return savedFlow;
    } catch (error) {
      return Result.fail(
        `Failed to clone flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}