import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Agent } from "@/modules/agent/domain/agent";
import { LoadAgentRepo, SaveAgentRepo } from "@/modules/agent/repos";
import { Flow } from "@/modules/flow/domain/flow";
import { LoadFlowRepo } from "@/modules/flow/repos/load-flow-repo";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";

export class CloneFlow
  implements UseCase<UniqueEntityID, Promise<Result<Flow>>>
{
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
    private saveAgentRepo: SaveAgentRepo,
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

  private async cloneFlow(flow: Flow): Promise<Flow> {
    // Clone agent with id map
    const agentIds = flow.agentIds;
    const agentIdMap = new Map<string, string>();
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      const clonedAgent = await this.cloneAgent(agent);
      agentIdMap.set(agent.id.toString(), clonedAgent.id.toString());
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

    // Replace agent id in nodes
    const newNodes = clonedFlow.props.nodes.slice().map((node) => {
      const newId = agentIdMap.get(node.id);
      const newDataAgentId = node.data && typeof node.data === 'object' && 'agentId' in node.data 
        ? agentIdMap.get(node.data.agentId as string) 
        : undefined;
      
      return {
        ...node,
        id: newId ?? node.id,
        data: newDataAgentId ? { ...node.data, agentId: newDataAgentId } : node.data,
      };
    });

    // Replace agent id in edges
    const newEdges = clonedFlow.props.edges.slice().map((edge) => {
      const newSource = agentIdMap.get(edge.source);
      const newTarget = agentIdMap.get(edge.target);
      return {
        ...edge,
        source: newSource ?? edge.source,
        target: newTarget ?? edge.target,
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
    // Get flow
    const flow = await this.getFlow(flowId);

    // Clone flow
    const clonedFlow = await this.cloneFlow(flow);

    // Change name
    const flowWithNewName = await this.changeFlowName(clonedFlow);

    // Save flow
    const savedFlow = await this.saveFlow(flowWithNewName);

    // Return cloned and saved flow
    return savedFlow;
  }
}
