import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";
import { readFileToString } from "@/shared/utils";

import { PouchdbAgentRepo } from "@/modules/agent/repos/impl";
import { ExportAgentToFile } from "@/modules/agent/usecases";
import { createAgent } from "@/modules/agent/utils/test-util";

describe("ExportPromptToFile", () => {
  let target: ExportAgentToFile;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    promptRepo = await PouchdbAgentRepo.create(promptDb);

    target = new ExportAgentToFile(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  it("[PP-U-EPPTF-001] 프롬프트 프리셋 파일로 내보내기 - 프롬프트 프리셋을 파일로 내보낸다.", async () => {
    // Given
    const prompt = createAgent();
    await promptRepo.saveAgent(prompt);

    // When
    const result = await target.execute(prompt.id);

    // Then
    expect(result.isSuccess).toBe(true);
    const file = result.getValue();
    const fileJson = JSON.parse(await readFileToString(file));
    expect(fileJson).toEqual(JSON.parse(JSON.stringify(prompt)));
  });

  it.todo("File type check");

  it.todo("Export large file");
});
