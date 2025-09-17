import { toast } from "sonner";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { getNextAvailableColor } from "@/flow-multi/utils/node-color-assignment";
import { ensureNodeSafety } from "@/flow-multi/utils/ensure-node-safety";
import { ensureEdgeSelectable } from "@/flow-multi/utils/ensure-edge-selectable";
import { Flow } from "@/modules/flow/domain/flow";
import { CustomNodeType } from "@/flow-multi/nodes";
import { NodeType } from "@/flow-multi/types/node-types";
import { UniqueEntityID } from "@/shared/domain";

// Define CustomEdgeType locally
type CustomEdgeType = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  type?: string;
};

// Helper function to generate unique agent name
export const generateUniqueAgentName = async (
  flow: Flow | { props?: { nodes: any[] }; id: string },
  baseName: string = "New Agent",
): Promise<string> => {
  const existingNames = new Set<string>();

  // Collect existing agent names from current flow
  // Check if we have nodes in the flow
  const nodes = (flow as any)?.props?.nodes || [];
  const agentNodes = nodes.filter((n: any) => n.type === "agent");

  for (const node of agentNodes) {
    // Agent nodes have agentId in their data
    const agentId = node.data?.agentId || node.id;
    try {
      const agentOrError = await AgentService.getAgent.execute(
        new UniqueEntityID(agentId),
      );
      if (agentOrError.isSuccess) {
        const agent = agentOrError.getValue();
        if (agent.props.name) {
          existingNames.add(agent.props.name);
        }
      }
    } catch (error) {
      // If we can't get the agent, skip it
    }
  }

  // If base name is available, use it
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  // Otherwise, find the next available number
  let counter = 1;
  let candidateName: string;
  do {
    candidateName = `${baseName} ${counter}`;
    counter++;
  } while (existingNames.has(candidateName));

  return candidateName;
};

// Create node with specific type and connection
export const createNodeWithConnection = async (
  nodeType: "agent" | "dataStore" | "if",
  sourceNodeId: string,
  sourceHandleId: string | undefined,
  position: { x: number; y: number },
  flow: Flow | { props: { nodes: any[] }; id: string },
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
  filterExistingConnections: (
    edges: CustomEdgeType[],
    sourceNode: CustomNodeType | undefined,
    targetNode: CustomNodeType | undefined,
    connection: {
      source?: string | null;
      target?: string | null;
      sourceHandle?: string | null;
    },
  ) => CustomEdgeType[],
): Promise<{
  updatedNodes: CustomNodeType[];
  updatedEdges: CustomEdgeType[];
} | null> => {
  try {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    const sourceNodePosition = sourceNode?.position || position;

    // Position the new node to the right and slightly below the source node
    const newNodePosition = {
      x: sourceNodePosition.x + 400, // 400px to the right
      y: sourceNodePosition.y + 50, // 50px down
    };

    let newNode: CustomNodeType;

    if (nodeType === "agent") {
      // Create a new agent with unique name and color
      const uniqueName = await generateUniqueAgentName(flow);
      const nextColor = await getNextAvailableColor(flow);
      const newAgent = Agent.create({
        name: uniqueName,
        targetApiType: ApiType.Chat,
        color: nextColor,
      }).getValue();

      // Save the new agent
      if (
        !AgentService.saveAgent ||
        typeof AgentService.saveAgent.execute !== "function"
      ) {
        console.warn("⚠️ AgentService.saveAgent not initialized yet");
        throw new Error("AgentService not initialized");
      }
      const savedAgentResult = await AgentService.saveAgent.execute(newAgent);
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }
      const savedAgent = savedAgentResult.getValue();

      newNode = ensureNodeSafety({
        id: savedAgent.id.toString(),
        type: "agent",
        position: newNodePosition,
        data: {
          agentId: savedAgent.id.toString(),
        },
      });
    } else if (nodeType === "dataStore") {
      // Use UniqueEntityID for node IDs instead of custom string patterns
      const nodeId = new UniqueEntityID().toString();
      const nextColor = await getNextAvailableColor(flow);

      // Get flowId from flow object
      const flowId = (flow as any)?.props?.id || (flow as any)?.id;
      if (!flowId) {
        throw new Error("Cannot create data store node: Flow ID not found");
      }

      // 1. Create separate node data entry first
      const createResult =
        await DataStoreNodeService.createDataStoreNode.execute({
          flowId: flowId.toString(),
          nodeId: nodeId,
          name: "New Data Update",
          color: nextColor,
          dataStoreFields: [],
        });

      if (createResult.isFailure) {
        throw new Error(createResult.getError());
      }

      // 2. Create flow node with only flowId
      newNode = ensureNodeSafety({
        id: nodeId,
        type: NodeType.DATA_STORE,
        position: newNodePosition,
        data: { flowId: flowId.toString() },
      });
    } else if (nodeType === "if") {
      // Use UniqueEntityID for node IDs instead of custom string patterns
      const nodeId = new UniqueEntityID().toString();
      const nextColor = await getNextAvailableColor(flow);

      // Get flowId from flow object
      const flowId = (flow as any)?.props?.id || (flow as any)?.id;
      if (!flowId) {
        throw new Error("Cannot create if node: Flow ID not found");
      }

      // 1. Create separate node data entry first
      const createResult = await IfNodeService.createIfNode.execute({
        flowId: flowId.toString(),
        nodeId: nodeId,
        name: "New If",
        logicOperator: "AND",
        conditions: [],
        color: nextColor,
      });

      if (createResult.isFailure) {
        throw new Error(createResult.getError());
      }

      // 2. Create flow node with only flowId
      newNode = ensureNodeSafety({
        id: nodeId,
        type: NodeType.IF,
        position: newNodePosition,
        data: { flowId: flowId.toString() },
      });
    } else {
      return null;
    }

    // Create edge connecting source to new node
    // Add label for if-node edges based on the handle
    const edgeLabel =
      sourceNode?.type === "if" && sourceHandleId
        ? sourceHandleId === "true"
          ? "True"
          : "False"
        : undefined;

    const newEdge: CustomEdgeType = ensureEdgeSelectable({
      id: sourceHandleId
        ? `${sourceNodeId}-${sourceHandleId}-${newNode.id}`
        : `${sourceNodeId}-${newNode.id}`,
      source: sourceNodeId,
      sourceHandle: sourceHandleId,
      target: newNode.id,
      type: undefined,
      label: edgeLabel,
    } as CustomEdgeType);

    // Remove existing connections from the same source handle
    const filteredEdges = filterExistingConnections(
      edges,
      sourceNode,
      undefined,
      { source: sourceNodeId, sourceHandle: sourceHandleId },
    );

    // Return updated state
    return {
      updatedNodes: [...nodes, newNode],
      updatedEdges: [...filteredEdges, newEdge],
    };
  } catch (error) {
    console.error(`Error creating ${nodeType} node:`, error);
    toast.error(`Failed to create ${nodeType} node`);
    return null;
  }
};
