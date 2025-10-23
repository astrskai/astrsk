import { Result, UseCase } from "@/shared/core";
import { readFileToString } from "@/shared/lib/file-utils";

import { Flow } from "@/modules/flow/domain/flow";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";
import { ApiSource } from "@/modules/api/domain";
import { Agent } from "@/modules/agent/domain";
import { SaveAgentRepo } from "@/modules/agent/repos";
import {
  isOldFlowFormat,
  migrateFlowToNewFormat,
} from "@/modules/flow/utils/migrate-flow-format";

interface Command {
  file: File;
  agentModelOverrides?: Map<
    string,
    {
      apiSource: string;
      modelId: string;
      modelName: string;
    }
  >;
}

interface STPrompt {
  prompts: {
    name: string;
    role: string;
    content: string;
    identifier: string;
  }[];
  prompt_order: {
    order: {
      identifier: string;
      enabled: boolean;
    }[];
  }[];
}

export class ImportFlowFromFile implements UseCase<Command, Result<Flow>> {
  constructor(
    private saveFlowRepo: SaveFlowRepo,
    private saveAgentRepo: SaveAgentRepo,
  ) {}

  private isSillyTavernPrompt(json: any): json is STPrompt {
    if (
      "prompts" in json &&
      Array.isArray(json.prompts) &&
      "prompt_order" in json &&
      Array.isArray(json.prompt_order)
    ) {
      return true;
    }
    return false;
  }

  private convertSillyTavernPrompt(prompt: STPrompt, filename: string): any {
    // Get the first (and typically only) prompt order configuration
    const orderConfig = prompt.prompt_order[0];
    if (!orderConfig) {
      throw new Error("No prompt order configuration found");
    }

    // Create a map of prompts by identifier for easy lookup
    const promptMap = new Map();
    prompt.prompts.forEach(p => {
      promptMap.set(p.identifier, p);
    });

    // Filter and order prompts based on the order configuration
    const orderedPrompts = orderConfig.order
      .filter(order => order.enabled && promptMap.has(order.identifier))
      .map(order => promptMap.get(order.identifier))
      .filter(p => p.content && p.content.trim() !== "");

    // Convert orderedPrompts to plain promptMessages with single text block
    const promptMessages = orderedPrompts.map(p => ({
      type: "plain",
      enabled: true,
      role: p.role || "user",
      promptBlocks: [{
        name: p.name || "Imported Block",
        template: p.content,
        isDeleteUnnecessaryCharacters: false,
        type: "plain",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Generate a clean name from filename
    const baseName = filename.replace(/\.(json|st)$/i, "").replace(/[^a-zA-Z0-9\s_-]/g, "");
    const flowName = baseName || "Imported SillyTavern Flow";
    const agentName = "New Agent";
    const agentId = `new_agent`;

    // Create agent structure
    const agent = {
      name: agentName,
      description: `Agent imported from SillyTavern prompt: ${filename}`,
      targetApiType: "chat",
      apiSource: "openai",
      modelId: "unknown",
      modelName: "unknown",
      promptMessages: promptMessages,
      textPrompt: "",
      enabledStructuredOutput: false,
      outputFormat: "text_output",
      outputStreaming: true,
      schemaName: "",
      schemaDescription: "",
      schemaFields: [],
      tokenCount: 0,
      color: "#A5B4FC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create flow structure with a single agent node
    const flow = {
      name: flowName,
      description: `${filename}`,
      nodes: [
        {
          id: "start",
          type: "start",
          position: { x: 0, y: 0 },
          data: {},
          deletable: false,
          zIndex: 1000
        },
        {
          id: "end",
          type: "end",
          position: { x: 870, y: 0 },
          data: {},
          deletable: false,
          zIndex: 1000
        },
        {
          id: agentId,
          type: "agent",
          position: { x: 400, y: -200 },
          data: {},
        },
      ],
      edges: [
        {
          id: "start-to-agent",
          source: "start",
          target: agentId,
          label: ""
        },
        {
          id: "agent-to-end",
          source: agentId,
          target: "end",
          label: ""
        }
      ],
      responseTemplate: "{{new_agent.response}}",
      agents: {
        [agentId]: agent
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return flow;
  }

  async execute({ file, agentModelOverrides }: Command): Promise<Result<Flow>> {
    try {
      // Read file to string
      const text = await readFileToString(file);

      // Parse text to json
      let parsedData = JSON.parse(text);

      // Convert ST prompt
      if (this.isSillyTavernPrompt(parsedData)) {
        parsedData = this.convertSillyTavernPrompt(parsedData, file.name);
      }

      // Check if this is old format and migrate if needed
      if (isOldFlowFormat(parsedData)) {
        const migrationResult = migrateFlowToNewFormat(parsedData);
        if (migrationResult.isFailure) {
          throw new Error(migrationResult.getError());
        }
        parsedData = migrationResult.getValue();
      }

      // Destructure the flow data
      const { agents, panelStructure, viewport, ...flowJson } = parsedData;

      // Import agent with new id
      const agentIdMap = new Map<string, string>();
      for (const [oldId, agentJson] of Object.entries(agents)) {
        // Parse agent json
        const agentOrError = Agent.fromJSON(agentJson);
        if (agentOrError.isFailure) {
          throw new Error(agentOrError.getError());
        }
        let agent = agentOrError.getValue();

        // Override model
        if (agentModelOverrides && agentModelOverrides.has(oldId)) {
          const modelOverride = agentModelOverrides.get(oldId);
          
          const updateResult = agent.update({
            apiSource: modelOverride?.apiSource as ApiSource,
            modelId: modelOverride?.modelId,
            modelName: modelOverride?.modelName,
          });
          
          if (updateResult.isFailure) {
            throw new Error(`Failed to update agent model: ${updateResult.getError()}`);
          }
          
          // Update the agent reference to use the updated version
          agent = updateResult.getValue();
        }

        // Save agent
        const savedAgentOrError = await this.saveAgentRepo.saveAgent(agent);
        if (savedAgentOrError.isFailure) {
          throw new Error(savedAgentOrError.getError());
        }

        // Save new agent id
        agentIdMap.set(oldId, agent.id.toString());
      }

      // Create flow
      const flowOrError = Flow.fromJSON(flowJson);
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      const flow = flowOrError.getValue();

      // Replace agent id in nodes
      const newNodes = flow.props.nodes.slice().map((node) => {
        const newId = agentIdMap.get(node.id);
        return {
          ...node,
          id: newId ?? node.id,
        };
      });

      // Replace agent id in edges
      const newEdges = flow.props.edges.slice().map((edge) => {
        const newSource = agentIdMap.get(edge.source);
        const newTarget = agentIdMap.get(edge.target);
        return {
          ...edge,
          source: newSource ?? edge.source,
          target: newTarget ?? edge.target,
        };
      });

      // Update flow with new agent ids
      const flowWithNewIdsOrError = flow.update({
        nodes: newNodes,
        edges: newEdges,
      });
      if (flowWithNewIdsOrError.isFailure) {
        throw new Error(flowWithNewIdsOrError.getError());
      }

      // Save flow
      const savedFlowOrError = await this.saveFlowRepo.saveFlow(
        flowWithNewIdsOrError.getValue(),
      );
      if (savedFlowOrError.isFailure) {
        throw new Error(savedFlowOrError.getError());
      }

      return savedFlowOrError;
    } catch (error) {
      return Result.fail(
        `Failed to import flow from file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
