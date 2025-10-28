import { UniqueEntityID } from "@/shared/domain";
import { type Viewport } from "@xyflow/react";
import { Flow } from "@/entities/flow/domain/flow";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";

/**
 * Calculate the center position of the viewport for placing new nodes
 */
export function calculateViewportCenter(
  viewport: Viewport,
  containerRef: React.RefObject<HTMLDivElement>,
  nodeWidth: number = 320,
  nodeHeight: number = 140,
): { x: number; y: number } {
  const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
  const containerHeight =
    containerRef.current?.clientHeight || window.innerHeight;

  return {
    x: (-viewport.x + containerWidth / 2) / viewport.zoom - nodeWidth / 2,
    y: (-viewport.y + containerHeight / 2) / viewport.zoom - nodeHeight / 2,
  };
}

/**
 * Generate a unique ID for a new node
 */
export function generateNodeId(): string {
  return new UniqueEntityID().toString();
}

/**
 * Generate a unique name for a node based on existing names
 */
export async function generateUniqueNodeName(
  baseName: string,
  existingNames: Set<string>,
): Promise<string> {
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
}

/**
 * Get existing names for a specific node type from the flow
 */
export async function getExistingNodeNames(
  nodeType: "agent" | "dataStore" | "if",
  flowData: Flow,
): Promise<Set<string>> {
  const existingNames = new Set<string>();

  switch (nodeType) {
    case "agent":
      if (flowData?.agentIds) {
        for (const agentId of flowData.agentIds) {
          const agentOrError = await AgentService.getAgent.execute(agentId);
          if (agentOrError.isSuccess) {
            const agent = agentOrError.getValue();
            if (agent.props.name) {
              existingNames.add(agent.props.name);
            }
          }
        }
      }
      break;

    case "dataStore":
      if (flowData?.dataStoreNodeIds) {
        for (const nodeId of flowData.dataStoreNodeIds) {
          const nodeOrError =
            await DataStoreNodeService.getDataStoreNode.execute(nodeId);
          if (nodeOrError.isSuccess) {
            const node = nodeOrError.getValue();
            if (node?.props.name) {
              existingNames.add(node.props.name);
            }
          }
        }
      }
      break;

    case "if":
      if (flowData?.ifNodeIds) {
        for (const nodeId of flowData.ifNodeIds) {
          const nodeOrError = await IfNodeService.getIfNode.execute(nodeId);
          if (nodeOrError.isSuccess) {
            const node = nodeOrError.getValue();
            if (node?.props.name) {
              existingNames.add(node.props.name);
            }
          }
        }
      }
      break;
  }

  return existingNames;
}

/**
 * Get the base name for a node type
 */
export function getNodeBaseName(
  nodeType: "agent" | "dataStore" | "if",
): string {
  switch (nodeType) {
    case "agent":
      return "New Agent";
    case "dataStore":
      return "New Data Update";
    case "if":
      return "New Condition";
    default:
      return "New Node";
  }
}
