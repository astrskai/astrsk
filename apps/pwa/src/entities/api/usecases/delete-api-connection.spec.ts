import { beforeEach, describe, expect, it } from "vitest";

import { ApiConnection, ApiSource } from "@/entities/api/domain";
import { DrizzleApiConnectionRepo } from "@/entities/api/repos/impl/drizzle-api-connection-repo";
import { DeleteApiConnection } from "@/entities/api/usecases";

describe("DeleteApiConnection", () => {
  let target: DeleteApiConnection;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new DeleteApiConnection(apiConnectionRepo);
  });

  it("[A-U-DAC-001] API 연결 삭제 - API 연결을 삭제한다.", async () => {
    // Given
    const apiConnection = ApiConnection.create({
      title: "title-text",
      source: ApiSource.OpenAI,
      apiKey: "apiKey-test",
    }).getValue();
    await apiConnectionRepo.saveApiConnection(apiConnection);

    // When
    await target.execute(apiConnection.id);

    // Then
    expect(
      (await apiConnectionRepo.getApiConnectionById(apiConnection.id))
        .isFailure,
    ).toBe(true);
  });
});
