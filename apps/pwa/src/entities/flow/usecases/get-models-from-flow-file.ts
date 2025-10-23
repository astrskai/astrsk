import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { formatFail, logger, readFileToString } from "@/shared/lib";
import JSZip from "jszip";
import { Flow } from "@/entities/flow/domain/flow";
import { isOldFlowFormat, migrateFlowToNewFormat } from "@/entities/flow/utils/migrate-flow-format";
import { ModelTier } from "@/entities/agent/domain/agent";

type ModelListItem = {
  agentId: string;
  agentName: string;
  modelName: string;
  modelTier?: ModelTier;
};

export class GetModelsFromFlowFile
  implements UseCase<File, Result<ModelListItem[]>>
{
  async execute(file: File): Promise<Result<ModelListItem[]>> {
    try {
      // Make ID map
      const models: ModelListItem[] = [];

      // Read file to string
      const text = await readFileToString(file);
      let jsonData = JSON.parse(text);
      
      // Handle migration if needed
      if (isOldFlowFormat(jsonData)) {
        const migrationResult = migrateFlowToNewFormat(jsonData);
        if (migrationResult.isFailure) {
          throw new Error(migrationResult.getError());
        }
        jsonData = migrationResult.getValue();
      }

      // All formats (legacy and enhanced) have the same structure now
      const flowData = jsonData;
      const agentsData = jsonData.agents;

      // Get agents that are actually used in nodes
      const usedAgentIds = new Set<string>();
      if (flowData?.nodes) {
        flowData.nodes.forEach((node: any) => {
          if (node.type === "agent") {
            // Node.id is the agent ID for agent nodes
            usedAgentIds.add(node.id);
          }
        });
      }

      // Only include agents that are used in nodes
      if (agentsData) {
        for (const [agentId, agent] of Object.entries(agentsData)) {
          if (usedAgentIds.has(agentId)) {
            models.push({
              agentId: agentId,
              agentName: (agent as any).name || `Agent ${agentId.slice(0, 8)}`,
              modelName: (agent as any).modelName || "",
              modelTier: (agent as any).modelTier,
            });
          }
        }
      }

      // Return ID map
      return Result.ok(models);
    } catch (error) {
      return Result.fail(`Failed to get models from flow file: ${error}`);
    }
  }

}
