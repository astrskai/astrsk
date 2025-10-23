import { Result } from "@/shared/core/result";
import { formatFail } from "@/shared/lib";

import { ApiConnection, ApiModel } from "@/entities/api/domain";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

export class ListWllamaModelStrategy implements ListApiModelStrategy {
  constructor() {}

  private getNameFromUrl(url: string): string {
    if (url.startsWith("https://huggingface.co/") && url.endsWith(".gguf")) {
      const filename = url.split("/").pop();
      return filename?.replace(".gguf", "") ?? url;
    }
    return url;
  }

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      return Result.ok(
        apiConnection.modelUrls?.map((url) =>
          ApiModel.create({
            id: url,
            name: this.getNameFromUrl(url),
          }).getValue(),
        ) ?? [],
      );
    } catch (error) {
      return formatFail("Failed to list Wllama model", error);
    }
  }
}
