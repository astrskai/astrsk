import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient } from "@/shared/infra";
import { logger } from "@/shared/lib";

import { ApiModel } from "@/modules/api/domain";

export class AnthropicEndpoint implements LlmEndpoint {
  private httpClient: HttpClient;
  private apiKey: string;
  private baseUrl: string;

  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "https://api.anthropic.com",
  ) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    try {
      // Request models
      const response = await this.httpClient.get(`${this.baseUrl}/v1/models`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch model list");
      }

      // Parse response and return
      return response.data.data.map((model: any) =>
        ApiModel.create({
          id: model.id,
          name: model.display_name,
        }).getValue(),
      );
    } catch (error) {
      logger.error("Error fetching model list from Anthropic API:", error);
      throw error;
    }
  }
}
