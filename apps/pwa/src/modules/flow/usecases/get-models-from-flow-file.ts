import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { formatFail, logger, readFileToString } from "@/shared/utils";
import JSZip from "jszip";
import { Flow } from "@/modules/flow/domain/flow";
import { isOldFlowFormat, migrateFlowToNewFormat } from "@/modules/flow/utils/migrate-flow-format";

type ModelListItem = {
  agentId: string;
  agentName: string;
  modelName: string;
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
      
      // Check if this is old format and migrate if needed
      if (isOldFlowFormat(jsonData)) {
        const migrationResult = migrateFlowToNewFormat(jsonData);
        if (migrationResult.isFailure) {
          throw new Error(migrationResult.getError());
        }
        jsonData = migrationResult.getValue();
      }

      // Get agents that are actually used in nodes
      const usedAgentIds = new Set<string>();
      if (jsonData.nodes) {
        jsonData.nodes.forEach((node: any) => {
          if (node.type === "agent") {
            // After migration, node.id is always the agent ID for agent nodes
            usedAgentIds.add(node.id);
          }
        });
      }

      // Only include agents that are used in nodes
      if (jsonData.agents) {
        for (const [agentId, agent] of Object.entries(jsonData.agents)) {
          if (usedAgentIds.has(agentId)) {
            models.push({
              agentId: agentId,
              agentName: (agent as any).name || `Agent ${agentId.slice(0, 8)}`,
              modelName: (agent as any).modelName || "",
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
