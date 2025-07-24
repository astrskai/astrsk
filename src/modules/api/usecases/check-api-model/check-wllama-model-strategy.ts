import { Result } from "@/shared/core";

import { ApiConnection } from "@/modules/api/domain";
import { ModelStatus } from "@/modules/api/usecases";
import { CheckApiModelStrategy } from "@/modules/api/usecases/check-api-model";

export class CheckWllamaModelStrategy implements CheckApiModelStrategy {
  async checkApiModel(
    apiConnection: ApiConnection,
    modelId: string,
  ): Promise<Result<ModelStatus>> {
    try {
      return Result.ok<ModelStatus>("error");
      // const wllama = window.wllama;
      // if (!wllama) {
      //   return Result.ok<ModelStatus>("error");
      // }
      // await wllama.loadModelFromUrl(modelId);
      // const completion = await wllama.createCompletion("test", {});
      // return completion
      //   ? Result.ok<ModelStatus>("ready")
      //   : Result.ok<ModelStatus>("error");
    } catch (error) {
      if (error instanceof Error && error.message.includes("downloading")) {
        return Result.ok<ModelStatus>("downloading");
      }
      return Result.ok<ModelStatus>("error");
    }
  }
}
