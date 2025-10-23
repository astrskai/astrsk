import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";

import { PouchdbAgentRepo } from "@/entities/agent/repos/impl";
import { SaveAgent } from "@/entities/agent/usecases";
import { createAgent } from "@/entities/agent/utils/test-util";

describe("SavePrompt", () => {
  let target: SaveAgent;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    const pouchdbPromptRepo = await PouchdbAgentRepo.create(promptDb);
    promptRepo = pouchdbPromptRepo;

    target = new SaveAgent(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  describe("[PP-U-SPP-001] 프롬프트 프리셋 저장 - 프롬프트 프리셋을 DB에 저장한다.", () => {
    it("프롬프트 프리셋 객체를 생성하고 저장하면 생성일시가 설정된다.", async () => {
      // Given
      const prompt = createAgent();

      // When
      await target.execute(prompt);

      // Then
      const savedPromptResult = await promptRepo.getAgentById(prompt.id);
      expect(savedPromptResult.isSuccess).toBe(true);
      const savedPrompt = savedPromptResult.getValue();
      expect(savedPrompt.props.name).toBe(prompt.props.name);
      expect(savedPrompt.props.createdAt).toBeInstanceOf(Date);
      expect(savedPrompt.props.updatedAt).toBeUndefined();
    });

    it("이미 존재하는 프롬프트 프리셋을 저장하면 수정일시가 갱신된다.", async () => {
      // Given
      const prompt = createAgent();
      await promptRepo.saveAgent(prompt);
      prompt.update({
        name: "Updated prompt name",
      });

      // When
      await target.execute(prompt);

      // Then
      const savedPromptResult = await promptRepo.getAgentById(prompt.id);
      expect(savedPromptResult.isSuccess).toBe(true);
      const savedPrompt = savedPromptResult.getValue();
      expect(savedPrompt.props.name).toBe(prompt.props.name);
      expect(savedPrompt.props.updatedAt).toBeInstanceOf(Date);
    });
  });
});
