import { OpenAIComptableEndpoint } from "@/shared/endpoints/openai-compatible";
import { HttpClient } from "@/shared/infra";

export class OpenAIEndpoint extends OpenAIComptableEndpoint {
  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "https://api.openai.com",
  ) {
    super(httpClient, apiKey, baseUrl);
  }
}
