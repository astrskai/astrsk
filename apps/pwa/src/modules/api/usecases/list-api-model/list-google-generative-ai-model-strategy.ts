import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/utils";
import { logger } from "@/shared/utils/logger";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListGoogleGenerativeAIModelStrategy
  implements ListApiModelStrategy
{
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error(
          "API key is missing for Google Generative AI connection",
        );
      }

      const response = await this.httpClient.get(
        "https://generativelanguage.googleapis.com/v1beta/models",
        {
          params: {
            key: apiConnection.props.apiKey,
          },
        },
      );

      if (response.status !== 200) {
        logger.error(response.status, response.statusText, response.data);
        throw new Error(
          `response status is not 200: ${response.status} ${response.statusText}`,
        );
      }
      return Result.ok(
        response.data.models
          .filter((model: any) =>
            model.supportedGenerationMethods.includes("generateContent"),
          )
          .map((model: any) =>
            ApiModel.create({
              id: model.name.replace("models/", ""),
              name: model.name.replace("models/", ""),
            }).getValue(),
          ),
      );
    } catch (error) {
      return formatFail("Failed to list Google Generative AI model", error);
    }
  }
}
