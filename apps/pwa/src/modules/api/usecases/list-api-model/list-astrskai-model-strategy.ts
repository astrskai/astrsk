import { Result } from "@/shared/core/result";
import { OpenAIComptableEndpoint } from "@/shared/endpoints/openai-compatible";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/utils/error-utils";

import { ApiConnection } from "@/modules/api/domain/api-connection";
import { ApiModel } from "@/modules/api/domain/api-model";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListAstrskaiModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    return Result.ok([
      ApiModel.create({
        id: "gpt-5-mini",
        name: "gpt-5-mini",
      }).getValue(),
      ApiModel.create({
        id: "gemini-2.5-flash-preview-05-20",
        name: "gemini-2.5-flash-preview-05-20",
      }).getValue(),
    ]);
  }

  async listApiModelFromServer(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error("API key is missing for astrsk.ai connection");
      }

      const endpoint = new OpenAIComptableEndpoint(
        this.httpClient,
        apiConnection.props.apiKey,
        apiConnection.props.baseUrl,
      );

      let modelList = await endpoint.getAvailableModelList();
      if (apiConnection.modelUrls) {
        modelList = [
          ...modelList,
          ...apiConnection.modelUrls.map((url) =>
            ApiModel.create({ id: url, name: url }).getValue(),
          ),
        ];
      }

      return Result.ok(modelList);
    } catch (error) {
      return formatFail("Failed to list astrsk.ai model", error);
    }
  }
}
