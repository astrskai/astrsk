import { Result } from "@/shared/core/result";
import { formatFail } from "@/shared/utils/error-utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";
import { OpenAIComptableEndpoint } from "@/shared/endpoints";
import { HttpClient } from "@/shared/infra/http-client";
import { logger } from "@/shared/utils";

export class ListOpenaiCompatibleModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.apiKey) {
        throw new Error("API key is missing for OpenAI compatible connection");
      }

      const endpoint = new OpenAIComptableEndpoint(
        this.httpClient,
        apiConnection.apiKey,
        apiConnection.baseUrl,
      );

      let modelListFromApi: ApiModel[] = [];
      try {
        modelListFromApi = await endpoint.getAvailableModelList();
      } catch (apiError) {
        logger.warn(
          "Failed to fetch models from API, using input models only",
          apiError,
        );
      }

      const modelListFromUserInput =
        apiConnection.modelUrls
          ?.map((url) => url.trim())
          .filter((url) => url.length > 0)
          .map((url) => ApiModel.create({ id: url, name: url }).getValue()) ??
        [];

      return Result.ok([...modelListFromApi, ...modelListFromUserInput]);
    } catch (error) {
      return formatFail("Failed to list OpenAI compatible model", error);
    }
  }
}
