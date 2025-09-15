import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import JSZip from "jszip";
import { GetModelsFromFlowFile } from "@/modules/flow/usecases/get-models-from-flow-file";
import { ModelTier } from "@/modules/agent/domain/agent";

type ModelListItem = {
  agentId: string;
  agentName: string;
  modelName: string;
  modelTier?: ModelTier;
};

export class GetModelsFromSessionFile
  implements UseCase<File, Result<ModelListItem[]>>
{
  constructor(
    private getModelsFromFlowFile: GetModelsFromFlowFile
  ) {}

  async execute(file: File): Promise<Result<ModelListItem[]>> {
    try {
      // Initialize models array
      const allModels: ModelListItem[] = [];

      // Load zip file
      const zipData = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(zipData);

      // Get flows folder
      const folder = zip.folder("flows");
      if (!folder) {
        return Result.ok([]);
      }

      // Get all flow files in the folder
      const fileEntries = folder.filter(() => true);
      for (const fileEntry of fileEntries) {
        // Extract flow file from zip
        const fileBlob = await fileEntry.async("blob");
        const flowFile = new File([fileBlob], fileEntry.name);

        // Reuse GetModelsFromFlowFile logic
        const modelsResult = await this.getModelsFromFlowFile.execute(flowFile);
        if (modelsResult.isSuccess) {
          allModels.push(...modelsResult.getValue());
        }
      }

      return Result.ok(allModels);
    } catch (error) {
      return Result.fail(`Failed to get models from session file: ${error}`);
    }
  }
}
