import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";
import { MessageRole } from "@/shared/prompt/domain";

import { ApiType } from "@/entities/agent/domain";
import { PouchdbAgentRepo } from "@/entities/agent/repos/impl";
import { GetAgent } from "@/entities/agent/usecases";
import { createAgent } from "@/entities/agent/utils/test-util";

describe("GetPrompt", () => {
  let target: GetAgent;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    const pouchdbPromptRepo = await PouchdbAgentRepo.create(promptDb);
    promptRepo = pouchdbPromptRepo;

    target = new GetAgent(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  it("[PP-U-GPP-001] 프롬프트 프리셋 상세 조회 - 프롬프트 프리셋을 상세 조회한다.", async () => {
    // Given
    const prompt = createAgent();
    await promptRepo.saveAgent(prompt);

    // When
    const promptOrError = await target.execute(prompt.id);

    // Then
    expect(promptOrError.isSuccess).toBe(true);
    const foundPrompt = promptOrError.getValue();
    expect(foundPrompt.props.name).toBe("preset-test");
    expect(foundPrompt.props.targetApiType).toBe(ApiType.Chat);
    expect(foundPrompt.props.targetModel).toBe("gpt-4o");
    expect(foundPrompt.props.promptMessages.length).toBe(1);
    const foundPromptMessage = foundPrompt.props.promptMessages[0];
    expect(foundPromptMessage.props.role).toBe(MessageRole.User);
    expect(foundPromptMessage.props.promptBlocks).toBeDefined();
    expect(foundPromptMessage.props.promptBlocks?.length).toBe(1);
    const foundPromptBlock = foundPromptMessage.props.promptBlocks?.[0];
    expect(foundPromptBlock?.props.template).toBe("Hello, world!");
    expect(foundPrompt.props.enabledParameters.get("param-test")).toBe(true);
    expect(foundPrompt.props.parameterValues.get("param-test")).toBe(0.25);
  });
});
