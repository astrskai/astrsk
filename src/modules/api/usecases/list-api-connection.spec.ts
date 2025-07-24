import { beforeEach, describe, expect, it } from "vitest";

import { ApiConnection, ApiSource } from "@/modules/api/domain";
import { DrizzleApiConnectionRepo } from "@/modules/api/repos/impl/drizzle-api-connection-repo";
import { ListApiConnection } from "@/modules/api/usecases";

describe("ListApiConnection", () => {
  let target: ListApiConnection;

  let apiConnectionRepo: DrizzleApiConnectionRepo;

  beforeEach(() => {
    apiConnectionRepo = new DrizzleApiConnectionRepo();

    target = new ListApiConnection(apiConnectionRepo);
  });

  const createApiConnection = async (title: string) => {
    const apiConnection = ApiConnection.create({
      title,
      source: ApiSource.OpenAI,
      apiKey: "apiKey-test",
    }).getValue();
    await apiConnectionRepo.saveApiConnection(apiConnection);
  };

  it("[A-U-LAC-001] API 연결 목록 조회 - API 연결을 목록 조회한다.", async () => {
    // Given
    await createApiConnection("API Connection 1");
    await createApiConnection("API Connection 2");
    await createApiConnection("API Connection 3");

    // When
    const result = await target.execute({
      limit: 2,
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const apiConnections = result.getValue();
    expect(apiConnections.length).toBe(2);
  });
});
