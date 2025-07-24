import { beforeEach, describe, expect, it } from "vitest";

import { ApiConnection, ApiSource } from "@/modules/api/domain";
import { DrizzleApiConnectionRepo } from "@/modules/api/repos/impl/drizzle-api-connection-repo";
import { SaveApiConnection } from "@/modules/api/usecases";

describe("SaveApiConnection", () => {
  let target: SaveApiConnection;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new SaveApiConnection(apiConnectionRepo);
  });

  it("[A-U-SAC-001] API 연결 저장 - API 연결 객체를 DB에 저장한다.", async () => {
    // Given
    const apiConnection = ApiConnection.create({
      title: "title-text",
      source: ApiSource.OpenAI,
      apiKey: "apiKey-test",
    }).getValue();

    // When
    const result = await target.execute(apiConnection);

    // Then
    expect(result.isSuccess).toBe(true);
    const savedApiConnection = (
      await apiConnectionRepo.getApiConnectionById(apiConnection.id)
    ).getValue();
    expect(savedApiConnection.props.title).toBe("title-text");
    expect(savedApiConnection.props.source).toBe("openai");
    expect(savedApiConnection.props.apiKey).toBe("apiKey-test");
  });
});
