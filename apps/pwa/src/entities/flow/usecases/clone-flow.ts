import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Transaction } from "@/db/transaction";

import { Agent } from "@/entities/agent/domain/agent";
import { LoadAgentRepo, SaveAgentRepo } from "@/entities/agent/repos";
import { Flow } from "@/entities/flow/domain/flow";
import { LoadFlowRepo } from "@/entities/flow/repos/load-flow-repo";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "@/entities/if-node/repos";
import { DataStoreNode } from "@/entities/data-store-node/domain";
import { IfNode } from "@/entities/if-node/domain";
import { NodeType } from "@/entities/flow/model/node-types";

interface Command {
  flowId: UniqueEntityID;
  sessionId?: UniqueEntityID; // Optional - if provided, creates session-local copy
  shouldRename?: boolean; // Optional - if true, renames to "Copy of..."
  tx?: Transaction; // Optional - if provided, uses this transaction for all operations
}

export class CloneFlow
  implements UseCase<Command | UniqueEntityID, Promise<Result<Flow>>>
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

  private async cloneAgent(agent: Agent, newFlowId: string, tx?: Transaction): Promise<Agent> {
    // Clone agent with new flow_id and updated timestamp
    const { id, createdAt, updatedAt, ...agentJson } = agent.toJSON();
    const clonedAgentOrError = Agent.fromJSON({
      ...agentJson,
      flowId: newFlowId, // Associate with new flow
      updatedAt: new Date(),
    });
    if (clonedAgentOrError.isFailure) {
      throw new Error(
        `Failed to clone agent: ${clonedAgentOrError.getError()}`,
      );
    }
    const clonedAgent = clonedAgentOrError.getValue();

    // Save agent (with transaction if provided)
    const savedAgentOrError = await this.saveAgentRepo.saveAgent(clonedAgent, tx);
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
    newFlowId: string,
    tx?: Transaction
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

      // Save cloned data store node (with transaction if provided)
      const savedDataStoreOrError = await this.saveDataStoreNodeRepo.saveDataStoreNode(clonedDataStoreNode, tx);
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
    newFlowId: string,
    tx?: Transaction
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

      // Save cloned if node (with transaction if provided)
      const savedIfNodeOrError = await this.saveIfNodeRepo.saveIfNode(clonedIfNode, tx);
      if (savedIfNodeOrError.isFailure) {
        throw new Error(savedIfNodeOrError.getError());
      }

      return savedIfNodeOrError.getValue();
    } catch (error) {
      console.error(`Failed to clone if node ${originalNodeId}:`, error);
      return null;
    }
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

  async execute(command: Command | UniqueEntityID): Promise<Result<Flow>> {
    try {
      // Support both old (UniqueEntityID) and new (Command) signatures for backward compatibility
      const flowId = command instanceof UniqueEntityID ? command : command.flowId;
      const sessionId = command instanceof UniqueEntityID ? undefined : command.sessionId;
      const shouldRename = command instanceof UniqueEntityID ? true : (command.shouldRename ?? true);
      const tx = command instanceof UniqueEntityID ? undefined : command.tx;

      // Get flow
      const flow = await this.getFlow(flowId);

      // Generate new flow ID
      const newFlowId = new UniqueEntityID().toString();

      // Create flow entity first (without cloning child entities yet)
      const { id, createdAt, updatedAt, panelStructure, viewport, ...flowJson } = flow.toJSON();
      const clonedFlowOrError = Flow.fromJSON({
        ...flowJson,
        sessionId: sessionId?.toString(),
        updatedAt: new Date(),
        panelStructure: null,
        viewport: null,
      });
      if (clonedFlowOrError.isFailure) {
        throw new Error(`Failed to clone flow: ${clonedFlowOrError.getError()}`);
      }
      let clonedFlow = clonedFlowOrError.getValue();

      // Change name (optional)
      clonedFlow = shouldRename ? await this.changeFlowName(clonedFlow) : clonedFlow;

      // Update the flow with the correct new ID
      const flowToSaveOrError = Flow.create(clonedFlow.props, new UniqueEntityID(newFlowId));
      if (flowToSaveOrError.isFailure) {
        throw new Error(flowToSaveOrError.getError());
      }

      // Save flow FIRST (so foreign key constraints will pass)
      const savedFlowOrError = await this.saveFlow(flowToSaveOrError.getValue());
      if (savedFlowOrError.isFailure) {
        throw new Error(`Failed to save flow: ${savedFlowOrError.getError()}`);
      }

      // NOW clone and save child entities (agents, nodes) with the flow already in database
      // Clone agents with id map
      const agentIds = flow.agentIds;
      const agentIdMap = new Map<string, string>();
      for (const agentId of agentIds) {
        const agent = await this.getAgent(agentId);
        const clonedAgent = await this.cloneAgent(agent, newFlowId, tx);
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
          await this.cloneDataStoreNode(node.id, newNodeId, originalFlowId, newFlowId, tx);
        } else if (node.type === NodeType.IF) {
          await this.cloneIfNode(node.id, newNodeId, originalFlowId, newFlowId, tx);
        }
      }

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

      // Update flow with new nodes and edges
      const savedFlow = savedFlowOrError.getValue();
      const finalFlowOrError = savedFlow.update({
        nodes: newNodes,
        edges: newEdges,
      });
      if (finalFlowOrError.isFailure) {
        throw new Error(
          `Failed to update flow with cloned nodes: ${finalFlowOrError.getError()}`,
        );
      }

      // Save updated flow with nodes/edges
      const finalSavedFlowOrError = await this.saveFlow(finalFlowOrError.getValue());
      if (finalSavedFlowOrError.isFailure) {
        throw new Error(`Failed to save updated flow: ${finalSavedFlowOrError.getError()}`);
      }

      // Return cloned and saved flow
      return finalSavedFlowOrError;
    } catch (error) {
      return Result.fail(
        `Failed to clone flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}