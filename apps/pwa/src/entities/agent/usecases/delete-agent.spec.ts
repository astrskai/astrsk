import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain";

import { DrizzleAgentRepo } from "@/entities/agent/repos/impl";
import { DeleteAgent } from "@/entities/agent/usecases";
import { createAgent } from "@/entities/agent/utils/test-util";

describe("DeletePrompt", () => {
  let target: DeleteAgent;

  let promptRepo: DrizzleAgentRepo;

  beforeEach(async () => {
    promptRepo = new DrizzleAgentRepo();

    target = new DeleteAgent(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  it("삭제 성공: 프롬프트 프리셋이 DB에 존재하는 경우", async () => {
    // Given
    const prompt = createAgent();
    await promptRepo.saveAgent(prompt);

    // When
    await target.execute(prompt.id);

    // Then
    const result = await promptRepo.getAgentById(prompt.id);
    expect(result.isFailure).toBe(true);
  });

  it("삭제 실패: 프롬프트 프리셋이 DB에 존재하지 않는 경우", async () => {
    // Given
    const promptId = new UniqueEntityID();

    // When
    const result = await target.execute(promptId);

    // Then
    expect(result.isFailure).toBe(true);
  });
});
