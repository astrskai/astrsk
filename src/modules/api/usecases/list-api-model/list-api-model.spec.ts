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
import { ListApiModel } from "@/modules/api/usecases";
import mockOpenai from "@test/api/list-api-model/mock-openai.json";
import mockOpenrouter from "@test/api/list-api-model/mock-openrouter.json";

/**
 * GET https://api.openai.com/v1/models HTTP 호출에 대한 응답 Mock 데이터. (2024-10-01 기준)
 * OpenAI에서 전달한 API 키로 사용 가능한 모델 목록을 응답한다. 총 35개 모델.
 */

/**
 * GET https://openrouter.ai/api/v1/models HTTP 호출에 대한 응답 Mock 데이터. (2024-10-01 기준)
 * OpenRouter에서 전달한 API 키로 사용 가능한 모델 목록을 응답한다. 총 180개 모델.
 */

const restHandler = [
  http.get("https://api.openai.com/v1/models", () => {
    return HttpResponse.json(mockOpenai);
  }),
  http.get("https://openrouter.ai/api/v1/models", () => {
    return HttpResponse.json(mockOpenrouter);
  }),
];

const server = setupServer(...restHandler);

describe("ListApiModel", () => {
  let target: ListApiModel;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new ListApiModel(httpClient, apiConnectionRepo);
  });

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("[A-U-LAM-001] API 모델 목록 조회 - API 연결을 통해 사용할 수 있는 모델을 목록 조회한다.", () => {
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
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(35);
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
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(4);
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
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(180);
    });
  });

  describe("[A-U-LAM-002] API 모델 목록 조회 필터 - 모델 이름으로 목록을 필터링한다.", () => {
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
        keyword: "gpt-4",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(13);
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
        keyword: "sonnet",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(2);
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
        keyword: "meta-llama",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(18);
    });
  });
});
