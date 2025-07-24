import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient, isHttpError } from "@/shared/infra";
import { logger } from "@/shared/utils";

import { ApiModel } from "@/modules/api/domain";

interface OpenAIRequestProps {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  stream?: boolean;
  max_tokens?: number;
}

export class OpenAIComptableEndpoint implements LlmEndpoint {
  protected httpClient: HttpClient;
  private baseUrl: string;
  private apiKey: string;

  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "https://api.openai.com",
  ) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async makeRequest(props: OpenAIRequestProps) {
    const { model, messages, prompt, stream = false } = props;
    const endpoint = messages ? "chat/completions" : "completions";
    const data = messages
      ? { model, messages, stream }
      : { model, prompt, stream };

    try {
      const response = await this.httpClient.post(
        `${this.getBaseUrl()}/v1/${endpoint}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getApiKey()}`,
          },
        },
      );
      return response;
    } catch (error) {
      if (isHttpError(error) && error.response) {
        return error.response;
      }
      throw error;
    }
  }

  async checkConnection(props: OpenAIRequestProps): Promise<boolean> {
    try {
      props.max_tokens = 1;
      const response = await this.makeRequest(props);

      if (props.stream) {
        logger.info("OpenAI API streaming connection successful");
        return true;
      } else if (
        response.status === 200 &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        logger.info("OpenAI API connection successful");
        return true;
      } else {
        logger.info("OpenAI API connection failed");
        return false;
      }
    } catch (error) {
      logger.error("Error connecting to OpenAI API:", error);
      return false;
    }
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    try {
      const response = await this.httpClient.get(
        `${this.getBaseUrl()}/v1/models`,
        {
          headers: {
            Authorization: `Bearer ${this.getApiKey()}`,
          },
        },
      );

      if (response.status === 200 && response.data.data) {
        return response.data.data.map((model: any) =>
          ApiModel.create({ id: model.id, name: model.id }).getValue(),
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

// Usage
// const openAIEndpoint = new OpenAIComptableEndpoint();
// const result = await openAIEndpoint.checkConnection({
//   apiKey: 'your-openai-api-key-here',
//   baseUrl: 'https://api.openai.com',
//   model: 'gpt-3.5-turbo',
//   messages: [{role: 'user', content: 'Hello, this is a test message.'}],
//   stream: true // Add this line to enable streaming
// });
