import { OpenAIComptableEndpoint } from "@/shared/endpoints/openai-compatible";
import { HttpClient } from "@/shared/infra";
import { logger } from "@/shared/utils";

import { ApiModel } from "@/modules/api/domain";

export class OpenRouterEndpoint extends OpenAIComptableEndpoint {
  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "https://openrouter.ai/api",
  ) {
    super(httpClient, apiKey, baseUrl);
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    try {
      const response = await this.httpClient.get(
        `${this.getBaseUrl()}/v1/models`,
        {},
      );

      if (response.status === 200 && response.data.data) {
        return response.data.data
          .filter(
            (model: any) =>
              model.architecture.input_modalities.includes("text") &&
              model.architecture.output_modalities.includes("text"),
          )
          .map((model: any) =>
            ApiModel.create({
              id: model.id,
              name: model.name,
              inputPricePerToken: Number.parseFloat(model.pricing.prompt),
              outputPricePerToken: Number.parseFloat(model.pricing.completion),
            }).getValue(),
          );
      } else {
        logger.info("Failed to fetch available models");
        return [];
      }
    } catch (error) {
      logger.error("Error fetching available models:", error);
      throw error;
    }
  }
}
