import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";

import { ApiType } from "@/modules/agent/domain";
import { PouchdbAgentRepo } from "@/modules/agent/repos/impl";
import { CloneAgent } from "@/modules/agent/usecases";
import { createAgent } from "@/modules/agent/utils/test-util";

describe("ClonePrompt", () => {
  let target: CloneAgent;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    const pouchdbPromptRepo = await PouchdbAgentRepo.create(promptDb);
    promptRepo = pouchdbPromptRepo;

    target = new CloneAgent(promptRepo, promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  it("[PP-U-CPP-001] 프롬프트 프리셋 복제 - 세부 정보가 동일하지만 ID와 이름이 다른 객체를 생성하고 DB에 저장한다.", async () => {
    // Given
    const prompt1 = createAgent({
      name: "name-test",
    });
    await promptRepo.saveAgent(prompt1);
    const prompt2 = createAgent({
      name: "Copy of name-test",
    });
    await promptRepo.saveAgent(prompt2);

    // When
    const clonedPromptOrError = await target.execute(prompt1.id);

    // Then
    expect(clonedPromptOrError.isSuccess).toBe(true);
    const clonedPrompt = (
      await promptRepo.getAgentById(clonedPromptOrError.getValue().id)
    ).getValue();
    expect(clonedPrompt.id).not.toBe(prompt1.id);
    // TODO: Copy test changed
    expect(clonedPrompt.props.name).toBe(`Copy of ${prompt2.props.name}`);
    expect(clonedPrompt.props.targetApiType).toBe(ApiType.Chat);
    expect(clonedPrompt.props.targetModel).toBe("gpt-4o");
    expect(clonedPrompt.props.promptMessages.length).toBe(1);
    expect(clonedPrompt.props.enabledParameters.size).toBe(1);
    expect(clonedPrompt.props.parameterValues.size).toBe(1);
  });
});
