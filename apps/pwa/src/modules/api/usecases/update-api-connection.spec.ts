import { beforeEach, describe, expect, it } from "vitest";

import { ApiConnection, ApiSource } from "@/modules/api/domain";
import { DrizzleApiConnectionRepo } from "@/modules/api/repos/impl/drizzle-api-connection-repo";
import { UpdateApiConnection } from "@/modules/api/usecases";

describe("UpdateApiConnection", () => {
  let target: UpdateApiConnection;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new UpdateApiConnection(apiConnectionRepo, apiConnectionRepo);
  });

  it("[A-U-UAC-001] API 연결 수정 - API 연결을 수정한다.", async () => {
    // Given
    const apiConnection = ApiConnection.create({
      title: "title-text",
      source: ApiSource.OpenAI,
      apiKey: "apiKey-test",
    }).getValue();
    await apiConnectionRepo.saveApiConnection(apiConnection);

    // When
    const result = await target.execute({
      id: apiConnection.id,
      title: "title-text-updated",
      source: ApiSource.Anthropic,
      apiKey: "apiKey-test-updated",
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const updatedApiConnection = (
      await apiConnectionRepo.getApiConnectionById(apiConnection.id)
    ).getValue();
    expect(updatedApiConnection.title).toBe("title-text-updated");
    expect(updatedApiConnection.source).toBe(ApiSource.Anthropic);
    expect(updatedApiConnection.apiKey).toBe("apiKey-test-updated");
  });
});
