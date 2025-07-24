import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { httpClient } from "@/shared/infra";

import { ApiConnection, ApiSource } from "@/modules/api/domain";
import { DrizzleApiConnectionRepo } from "@/modules/api/repos/impl/drizzle-api-connection-repo";
import { CheckApiModel } from "@/modules/api/usecases";
import mockAnthropic from "@test/api/check-api-model/mock-anthropic.json";
import mockOpenai from "@test/api/check-api-model/mock-openai.json";
import mockOpenrouter from "@test/api/check-api-model/mock-openrouter.json";

const restHandler = [
  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json(mockOpenai);
  }),
  http.post("https://api.anthropic.com/v1/messages", () => {
    return HttpResponse.json(mockAnthropic);
  }),
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json(mockOpenrouter);
  }),
];

const server = setupServer(...restHandler);

describe("CheckApiModel", () => {
  let target: CheckApiModel;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new CheckApiModel(httpClient, apiConnectionRepo);
  });

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("[A-U-CAM-001] API 연결 상태 확인 - API 연결 상태를 확인한다.", () => {
    it("OpenAI", async () => {
      // Given
      const apiConnection = ApiConnection.create({
        title: "title-text",
        source: ApiSource.OpenAI,
        apiKey: "test",
        updatedAt: new Date(),
      }).getValue();
      await apiConnectionRepo.saveApiConnection(apiConnection);

      // When
      const result = await target.execute({
        apiConnectionId: apiConnection.id,
        modelId: "gpt-3.5-turbo",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe("available");
    });

    it("Anthropic", async () => {
      // Given
      const apiConnection = ApiConnection.create({
        title: "title-text",
        source: ApiSource.Anthropic,
        apiKey: "test",
        updatedAt: new Date(),
      }).getValue();
      await apiConnectionRepo.saveApiConnection(apiConnection);

      // When
      const result = await target.execute({
        apiConnectionId: apiConnection.id,
        modelId: "claude-3-haiku-20240307",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe("available");
    });

    it("OpenRouter", async () => {
      // Given
      const apiConnection = ApiConnection.create({
        title: "title-text",
        source: ApiSource.OpenRouter,
        apiKey: "test",
        updatedAt: new Date(),
      }).getValue();
      await apiConnectionRepo.saveApiConnection(apiConnection);

      // When
      const result = await target.execute({
        apiConnectionId: apiConnection.id,
        modelId: "meta-llama/llama-3-8b-instruct:free",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe("available");
    });

    it("OpenAI Compatible", async () => {
      // Given
      const apiConnection = ApiConnection.create({
        title: "title-text",
        source: ApiSource.OpenAICompatible,
        baseUrl: "https://openrouter.ai/api",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        updatedAt: new Date(),
      }).getValue();
      await apiConnectionRepo.saveApiConnection(apiConnection);

      // TODO: mock models api

      // When
      const result = await target.execute({
        apiConnectionId: apiConnection.id,
        modelId: "meta-llama/llama-3-8b-instruct:free",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      // TODO: add assert mock result
    });

    it.skip("wllama", async () => {
      // Given
      const apiConnection = ApiConnection.create({
        title: "title-text",
        source: ApiSource.Wllama,
        modelUrls: [
          "https://huggingface.co/RichardErkhov/openai-community_-_gpt2-gguf/blob/main/gpt2.IQ3_M.gguf",
        ],
        updatedAt: new Date(),
      }).getValue();
      await apiConnectionRepo.saveApiConnection(apiConnection);

      // TODO: mock models api

      // When
      const result = await target.execute({
        apiConnectionId: apiConnection.id,
        modelId: "test-model-id",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      // TODO: add assert mock result
    });
  });
});
