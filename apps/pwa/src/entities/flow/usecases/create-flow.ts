import { Result, UseCase } from "@/shared/core";

import { Agent, ApiType } from "@/entities/agent/domain";
import { Flow } from "@/entities/flow/domain/flow";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { SaveFlowRepo } from "@/entities/flow/repos";
import { NodeType } from "@/entities/flow/model/node-types";
import { StartNodeType } from "@/entities/flow/model/start-node-types";
import { EndNodeType } from "@/entities/flow/model/end-node-types";

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

      // Create flow with 3 START nodes and 3 END nodes
      const flowOrError = Flow.create({
        name: "New Flow",
        nodes: [
          // 3 START nodes (left side)
          {
            id: "start", // Character START uses "start" for backward compatibility
            type: NodeType.START,
            position: { x: 0, y: 0 },
            data: {
              startType: StartNodeType.CHARACTER,
            },
            deletable: false,
            zIndex: 1000,
          },
          {
            id: "start-user",
            type: NodeType.START,
            position: { x: 0, y: 150 },
            data: {
              startType: StartNodeType.USER,
            },
            deletable: false,
            zIndex: 1000,
          },
          {
            id: "start-plot",
            type: NodeType.START,
            position: { x: 0, y: 300 },
            data: {
              startType: StartNodeType.PLOT,
            },
            deletable: false,
            zIndex: 1000,
          },
          // 3 END nodes (right side)
          {
            id: "end", // Character END uses "end" for backward compatibility
            type: NodeType.END,
            position: { x: 870, y: 0 },
            data: {
              endType: EndNodeType.CHARACTER,
              agentId: "end",
            },
            deletable: false,
            zIndex: 1000,
          },
          {
            id: "end-user",
            type: NodeType.END,
            position: { x: 870, y: 150 },
            data: {
              endType: EndNodeType.USER,
              agentId: "end-user",
            },
            deletable: false,
            zIndex: 1000,
          },
          {
            id: "end-plot",
            type: NodeType.END,
            position: { x: 870, y: 300 },
            data: {
              endType: EndNodeType.PLOT,
              agentId: "end-plot",
            },
            deletable: false,
            zIndex: 1000,
          },
          // AGENT node (middle)
          {
            id: agent.id.toString(),
            type: NodeType.AGENT,
            position: { x: 400, y: 0 },
            data: {
              agentId: agent.id.toString(),
            },
          },
        ],
        edges: [
          // Connect Character START to AGENT to Character END (default active path)
          {
            id: "start-agent",
            source: "start", // Character START id
            target: agent.id.toString(),
          },
          {
            id: "agent-end",
            source: agent.id.toString(),
            target: "end", // Character END id
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
