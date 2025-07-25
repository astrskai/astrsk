import { Result } from "@/shared/core/result";
import { formatFail } from "@/shared/utils/error-utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListOpenaiCompatibleModelStrategy implements ListApiModelStrategy {
  constructor() {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error("API key is missing for OpenAI compatible connection");
      }

      const modelList =
        apiConnection.modelUrls?.map((url) =>
          ApiModel.create({ id: url, name: url }).getValue(),
        ) ?? [];

      return Result.ok(modelList);
    } catch (error) {
      return formatFail("Failed to list OpenAI compatible model", error);
    }
  }
}
