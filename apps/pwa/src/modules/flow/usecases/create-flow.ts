import { Result, UseCase } from "@/shared/core";

import { Agent, ApiType } from "@/modules/agent/domain";
import { Flow } from "@/modules/flow/domain/flow";
import { SaveAgentRepo } from "@/modules/agent/repos";
import { SaveFlowRepo } from "@/modules/flow/repos";
import { NodeType } from "@/modules/flow/model/node-types";

export class CreateFlow implements UseCase<void, Result<Flow>> {
  constructor(
    private saveAgentRepo: SaveAgentRepo,
    private saveFlowRepo: SaveFlowRepo,
  ) {}

  async execute(): Promise<Result<Flow>> {
    try {
      // Create agent
      const agentOrError = Agent.create({
        name: "New Agent",
        targetApiType: ApiType.Chat,
      });
      if (agentOrError.isFailure) {
        throw new Error(agentOrError.getError());
      }
      const agent = agentOrError.getValue();

      // Create flow
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
      });
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      const flow = flowOrError.getValue();

      // Save agent
      const savedAgentOrError = await this.saveAgentRepo.saveAgent(agent);
      if (savedAgentOrError.isFailure) {
        throw new Error(savedAgentOrError.getError());
      }

      // Save flow
      const savedFlowOrError = await this.saveFlowRepo.saveFlow(flow);
      if (savedFlowOrError.isFailure) {
        throw new Error(savedFlowOrError.getError());
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
