import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Agent, ApiType } from "@/entities/agent/domain";
import { Flow } from "@/entities/flow/domain/flow";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { SaveFlowRepo } from "@/entities/flow/repos";
import { NodeType } from "@/entities/flow/model/node-types";

export class CreateFlow implements UseCase<void, Result<Flow>> {
  constructor(
    private saveAgentRepo: SaveAgentRepo,
    private saveFlowRepo: SaveFlowRepo,
  ) {}

  async execute(): Promise<Result<Flow>> {
    try {
      // Generate flow ID first (needed for agent creation)
      const flowId = new UniqueEntityID();

      // Create agent with flowId
      const agentOrError = Agent.create({
        name: "New Agent",
        targetApiType: ApiType.Chat,
        flowId: flowId,
      });
      if (agentOrError.isFailure) {
        throw new Error(agentOrError.getError());
      }
      const agent = agentOrError.getValue();

      // Create flow with the same flow ID
      const flowOrError = Flow.create({
        name: "New Flow",
        nodes: [
          {
            id: "start",
            type: NodeType.START,
            position: { x: 0, y: 0 },
            data: {},
            deletable: false,
            zIndex: 1000, // Ensure start node is always on top
          },
          {
            id: "end",
            type: NodeType.END,
            position: { x: 870, y: 0 },
            data: {},
            deletable: false,
            zIndex: 1000, // Ensure end node is always on top
          },
          {
            id: agent.id.toString(),
            type: NodeType.AGENT,
            position: { x: 400, y: -200 },
            data: {},
          },
        ],
        edges: [
          {
            id: "start-agent",
            source: "start",
            target: agent.id.toString(),
          },
        ],
        responseTemplate: "{{new_agent.response}}",
      }, flowId);
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      const flow = flowOrError.getValue();

      // Save flow FIRST (so agent's foreign key can reference it)
      const savedFlowOrError = await this.saveFlowRepo.saveFlow(flow);
      if (savedFlowOrError.isFailure) {
        throw new Error(savedFlowOrError.getError());
      }

      // Save agent AFTER flow exists in database
      const savedAgentOrError = await this.saveAgentRepo.saveAgent(agent);
      if (savedAgentOrError.isFailure) {
        throw new Error(savedAgentOrError.getError());
      }

      // Return flow
      return savedFlowOrError;
    } catch (error) {
      return Result.fail(
        `Failed to create flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
