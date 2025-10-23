import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";

import { ApiType } from "@/entities/agent/domain";
import { PouchdbAgentRepo } from "@/entities/agent/repos/impl";
import { SearchAgent } from "@/entities/agent/usecases";
import { createAgent } from "@/entities/agent/utils/test-util";

describe("SearchPrompt", () => {
  let target: SearchAgent;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    const pouchdbPromptRepo = await PouchdbAgentRepo.create(promptDb);
    promptRepo = pouchdbPromptRepo;

    target = new SearchAgent(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  describe("[PP-U-SPP-001] 프롬프트 프리셋 검색 - 프롬프트 프리셋을 검색한다.", () => {
    it("페이지네이션", async () => {
      // Given
      const prompt1 = createAgent({ name: "Prompt 1" });
      const prompt2 = createAgent({ name: "Prompt 2" });
      const prompt3 = createAgent({ name: "Prompt 3" });
      await promptRepo.saveAgent(prompt1);
      await promptRepo.saveAgent(prompt2);
      await promptRepo.saveAgent(prompt3);

      // When
      const promptsOrError = await target.execute({
        limit: 2,
      });

      // Then
      expect(promptsOrError.isSuccess).toBe(true);
      const prompts = promptsOrError.getValue();
      expect(prompts.length).toBe(2);
    });

    it("필터링 - API 타입", async () => {
      // Given
      const prompt1 = createAgent({
        name: "Preset 1",
        targetApiType: ApiType.Chat,
      });
      const prompt2 = createAgent({
        name: "Preset 2",
        targetApiType: ApiType.Chat,
      });
      const prompt3 = createAgent({
        name: "Preset 3",
        targetApiType: ApiType.Text,
      });
      await promptRepo.saveAgent(prompt1);
      await promptRepo.saveAgent(prompt2);
      await promptRepo.saveAgent(prompt3);

      // When
      const promptsOrError = await target.execute({
        limit: 3,
        targetApiType: ApiType.Chat,
      });

      // Then
      expect(promptsOrError.isSuccess).toBe(true);
      const prompts = promptsOrError.getValue();
      expect(prompts.length).toBe(2);
      expect(prompts).toContainEqual(prompt1);
      expect(prompts).toContainEqual(prompt2);
      expect(prompts).not.toContainEqual(prompt3);
    });

    it.skip("필터링 - 모델", async () => {
      // Given
      const prompt1 = createAgent({
        name: "Preset 1",
        targetModel: "gpt-4o",
      });
      const prompt2 = createAgent({
        name: "Preset 2",
        targetModel: "claude-3-5-sonnet-20240620",
      });
      const prompt3 = createAgent({
        name: "Preset 3",
        targetModel: "meta-llama/llama-3.1-8b-instruct",
      });
      await promptRepo.saveAgent(prompt1);
      await promptRepo.saveAgent(prompt2);
      await promptRepo.saveAgent(prompt3);

      // When
      const promptsOrError = await target.execute({
        limit: 3,
        targetModel: "claude-3-5-sonnet-20240620",
      });

      // Then
      expect(promptsOrError.isSuccess).toBe(true);
      const prompts = promptsOrError.getValue();
      expect(prompts.length).toBe(1);
      expect(prompts).not.toContainEqual(prompt1);
      expect(prompts).toContainEqual(prompt2);
      expect(prompts).not.toContainEqual(prompt3);
    });
  });
});
