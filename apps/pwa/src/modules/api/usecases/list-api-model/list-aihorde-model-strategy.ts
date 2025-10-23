import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/lib";
import { logger } from "@/shared/lib/logger";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListAIHordeModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      const response = await this.httpClient.get(
        "https://aihorde.net/api/v2/status/models?type=text&model_state=all",
      );

      if (response.status !== 200) {
        logger.error(response.status, response.statusText, response.data);
        throw new Error(
          `response status is not 200: ${response.status} ${response.statusText}`,
        );
      }

      return Result.ok(
        response.data.map((model: any) =>
          ApiModel.create({
            id: model.name,
            name: model.name,
          }).getValue(),
        ),
      );
    } catch (error) {
      return formatFail("Failed to list AIHorde model", error);
    }
  }
}
