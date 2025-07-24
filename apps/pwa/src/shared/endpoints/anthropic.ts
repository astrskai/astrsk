import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient } from "@/shared/infra";
import { logger } from "@/shared/utils";

import { ApiModel } from "@/modules/api/domain";

interface AnthropicRequestProps {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  maxTokens?: number;
  maxTokensToSample?: number;
  stream?: boolean;
}

interface AnthropicLegacyRequestProps extends AnthropicRequestProps {
  prompt: string;
  maxTokensToSample: number;
}

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

  private async makeMessagesRequest(props: AnthropicRequestProps) {
    const { model, messages, maxTokens, stream = false } = props;
    return this.httpClient.post(
      `${this.baseUrl}/v1/messages`,
      {
        model,
        messages,
        max_tokens: maxTokens,
        stream,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    );
  }

  private async makeLegacyRequest(props: AnthropicLegacyRequestProps) {
    const { model, prompt, maxTokensToSample, stream = false } = props;
    return this.httpClient.post(
      `${this.baseUrl}/v1/complete`,
      {
        model,
        prompt,
        max_tokens_to_sample: maxTokensToSample,
        stream,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    );
  }

  async makeRequest(
    props: AnthropicRequestProps | AnthropicLegacyRequestProps,
  ) {
    if ("messages" in props) {
      return this.makeMessagesRequest(props);
    } else {
      return this.makeLegacyRequest(props as AnthropicLegacyRequestProps);
    }
  }

  async checkConnection(
    props: AnthropicRequestProps | AnthropicLegacyRequestProps,
  ): Promise<boolean> {
    try {
      props.maxTokens = 1;
      const response = await this.makeRequest(props);

      if (props.stream) {
        logger.info("Anthropic API streaming connection successful");
        return true;
      } else if (response.status === 200) {
        logger.info("Anthropic API connection successful");
        return true;
      } else {
        logger.info("Anthropic API connection failed");
        return false;
      }
    } catch (error) {
      logger.error("Error connecting to Anthropic API:", error);
      return false;
    }
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
