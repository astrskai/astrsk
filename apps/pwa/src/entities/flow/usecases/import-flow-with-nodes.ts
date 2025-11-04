import { Result, UseCase } from "@/shared/core";
import { readFileToString } from "@/shared/lib/file-utils";

import { Flow } from "@/entities/flow/domain/flow";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { ApiSource } from "@/entities/api/domain";
import { Agent, ModelTier } from "@/entities/agent/domain";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { SaveIfNodeRepo } from "@/entities/if-node/repos";
import { DataStoreNode } from "@/entities/data-store-node/domain";
import { IfNode } from "@/entities/if-node/domain";
import { UniqueEntityID } from "@/shared/domain";
import { NodeType } from "@/entities/flow/model/node-types";
import {
  isOldFlowFormat,
  migrateFlowToNewFormat,
} from "@/entities/flow/utils/migrate-flow-format";

interface ImportCommand {
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

export class ImportFlowWithNodes
  implements UseCase<ImportCommand, Result<Flow>>
{
  constructor(
    private saveFlowRepo: SaveFlowRepo,
    private saveAgentRepo: SaveAgentRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
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

  private isEnhancedFormat(data: any): boolean {
    // Enhanced format has separate node data sections alongside legacy structure
    const hasDataStoreNodes = data.dataStoreNodes !== undefined;
    const hasIfNodes = data.ifNodes !== undefined;
    const isEnhanced = hasDataStoreNodes || hasIfNodes;

    return isEnhanced;
  }

  private isLegacyFormat(data: any): boolean {
    // Legacy format: has agents but no separate node data sections
    const hasAgents = data.agents !== undefined;
    const noDataStoreNodes = data.dataStoreNodes === undefined;
    const noIfNodes = data.ifNodes === undefined;
    const isLegacy = hasAgents && noDataStoreNodes && noIfNodes;

    return isLegacy;
  }

  private convertSillyTavernPrompt(prompt: STPrompt, filename: string): any {
    // Get the first (and typically only) prompt order configuration
    const orderConfig = prompt.prompt_order[0];
    if (!orderConfig) {
      throw new Error("No prompt order configuration found");
    }

    // Create a map of prompts by identifier for easy lookup
    const promptMap = new Map();
    prompt.prompts.forEach((p) => {
      promptMap.set(p.identifier, p);
    });

    // Filter and order prompts based on the order configuration
    const orderedPrompts = orderConfig.order
      .filter((order) => order.enabled && promptMap.has(order.identifier))
      .map((order) => promptMap.get(order.identifier))
      .filter((p) => p.content && p.content.trim() !== "");

    // Convert orderedPrompts to plain promptMessages with single text block
    const promptMessages = orderedPrompts.map((p) => ({
      type: "plain",
      enabled: true,
      role: p.role || "user",
      promptBlocks: [
        {
          name: p.name || "Imported Block",
          template: p.content,
          isDeleteUnnecessaryCharacters: false,
          type: "plain",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Generate a clean name from filename
    const baseName = filename
      .replace(/\.(json|st)$/i, "")
      .replace(/[^a-zA-Z0-9\s_-]/g, "");
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
      updatedAt: new Date().toISOString(),
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
          zIndex: 1000,
        },
        {
          id: "end",
          type: "end",
          position: { x: 870, y: 0 },
          data: {},
          deletable: false,
          zIndex: 1000,
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
          label: "",
        },
        {
          id: "agent-to-end",
          source: agentId,
          target: "end",
          label: "",
        },
      ],
      responseTemplate: "{{new_agent.response}}",
      agents: {
        [agentId]: agent,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return flow;
  }

  private async importEnhancedFormat(
    data: any,
    agentModelOverrides?: Map<string, any>,
  ): Promise<Result<Flow>> {
    try {
      // Enhanced format: extract separate node data while keeping flow structure
      // Exclude panelStructure and viewport (dockview layout) - user should set their own layout
      const {
        agents,
        dataStoreNodes,
        ifNodes,
        exportedAt,
        exportedBy,
        metadata,
        panelStructure,
        viewport,
        ...flowData
      } = data;

      // Create node ID mapping for all node types to prevent conflicts
      const nodeIdMap = new Map<string, string>();
      const agentIdMap = new Map<string, string>();

      // Generate new UUIDs for all nodes to prevent conflicts
      for (const node of flowData.nodes) {
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(node.id, newNodeId);

        // For agent nodes, also track agent ID mapping
        if (node.type === NodeType.AGENT) {
          const oldAgentId = (node.data as any)?.agentId || node.id;
          agentIdMap.set(oldAgentId, newNodeId);
        }
      }

      const newFlowId = new UniqueEntityID().toString();

      // Import agents with new IDs
      for (const [oldNodeId, agentData] of Object.entries(agents || {})) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        let agent = Agent.fromJSON(agentData);
        if (agent.isFailure) continue;

        // Apply model overrides if provided
        if (agentModelOverrides && agentModelOverrides.has(oldNodeId)) {
          const override = agentModelOverrides.get(oldNodeId);
          const updateResult = agent.getValue().update({
            apiSource: override.apiSource as ApiSource,
            modelId: override.modelId,
            modelName: override.modelName,
          });
          if (updateResult.isSuccess) {
            agent = updateResult;
          }
        }

        // Create agent with new ID using the create method
        const agentWithNewId = Agent.create(
          agent.getValue().props,
          new UniqueEntityID(newNodeId),
        );
        if (agentWithNewId.isSuccess) {
          await this.saveAgentRepo.saveAgent(agentWithNewId.getValue());
        }
      }

      // Import data store nodes with new IDs
      for (const [oldNodeId, nodeData] of Object.entries(
        dataStoreNodes || {},
      )) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        const dataStoreNode = DataStoreNode.create(
          {
            flowId: newFlowId,
            name: (nodeData as any).name,
            color: (nodeData as any).color,
            dataStoreFields: (nodeData as any).dataStoreFields || [],
          },
          new UniqueEntityID(newNodeId),
        );

        if (dataStoreNode.isSuccess) {
          await this.saveDataStoreNodeRepo.saveDataStoreNode(
            dataStoreNode.getValue(),
          );
        }
      }

      // Import if nodes with new IDs
      for (const [oldNodeId, nodeData] of Object.entries(ifNodes || {})) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        const ifNode = IfNode.create(
          {
            flowId: newFlowId,
            name: (nodeData as any).name,
            color: (nodeData as any).color,
            logicOperator: (nodeData as any).logicOperator,
            conditions: (nodeData as any).conditions || [],
          },
          new UniqueEntityID(newNodeId),
        );

        if (ifNode.isSuccess) {
          await this.saveIfNodeRepo.saveIfNode(ifNode.getValue());
        }
      }

      // Update flow nodes and edges with new IDs
      const newNodes = flowData.nodes.map((node: any) => {
        const newId = nodeIdMap.get(node.id) || node.id;

        // For dataStore nodes, update the flowId in data if present
        let nodeData = {};
        if (node.type === "dataStore" && node.data && node.data.flowId) {
          nodeData = { flowId: newFlowId };
        }

        return {
          ...node,
          id: newId,
          data: nodeData,
        };
      });

      const newEdges = this.remapEdgeIds(flowData.edges, nodeIdMap);

      // Create and save flow (without panelStructure/viewport - user sets their own layout)
      const flow = Flow.create(
        {
          ...flowData,
          nodes: newNodes,
          edges: newEdges,
        },
        new UniqueEntityID(newFlowId),
      );

      if (flow.isFailure) {
        return Result.fail(flow.getError());
      }

      const savedFlow = await this.saveFlowRepo.saveFlow(flow.getValue());

      if (savedFlow.isFailure) {
        return Result.fail(savedFlow.getError());
      }

      return savedFlow;
    } catch (error) {
      return Result.fail(
        `Failed to import new format flow: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async importLegacyFormat(
    data: any,
    agentModelOverrides?: Map<string, any>,
  ): Promise<Result<Flow>> {
    try {
      // Use existing legacy import logic for current user flows
      const { agents, panelStructure, viewport, ...flowJson } = data;

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
            throw new Error(
              `Failed to update agent model: ${updateResult.getError()}`,
            );
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

      // Replace agent id in nodes and create separate node data for new types
      const newNodes = flow.props.nodes.slice().map((node) => {
        if (node.type === NodeType.AGENT) {
          const newId = agentIdMap.get(node.id);
          return {
            ...node,
            id: newId ?? node.id,
          };
        }

        // For data store and if nodes, preserve the existing data in node.data
        // This handles the current embedded data structure
        return node;
      });

      // Replace agent id in edges and generate new edge IDs to prevent conflicts
      const newEdges = this.remapEdgeIds(flow.props.edges, agentIdMap);

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
        `Failed to import legacy format flow: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private remapEdgeIds(edges: any[], nodeIdMap: Map<string, string>): any[] {
    return edges.map((edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;

      // Generate new edge ID to prevent conflicts
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
    file,
    agentModelOverrides,
  }: ImportCommand): Promise<Result<Flow>> {
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

      // Route to appropriate import method based on format
      if (this.isEnhancedFormat(parsedData)) {
        return this.importEnhancedFormat(parsedData, agentModelOverrides);
      } else if (this.isLegacyFormat(parsedData)) {
        return this.importLegacyFormat(parsedData, agentModelOverrides);
      } else {
        console.error("❌ Unknown flow format detected:", {
          isEnhanced: this.isEnhancedFormat(parsedData),
          isLegacy: this.isLegacyFormat(parsedData),
          dataKeys: Object.keys(parsedData),
        });
        return Result.fail(
          "Unknown flow format. This file may be corrupted or from an unsupported version.",
        );
      }
    } catch (error) {
      return Result.fail(
        `Failed to import flow from file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
