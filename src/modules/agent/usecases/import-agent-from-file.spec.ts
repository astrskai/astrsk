import fs from "fs/promises";
import path from "path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMemoryDB } from "@/shared/infra";
import { BlockType } from "@/shared/prompt/domain";

import { ApiType, PlainBlock } from "@/modules/agent/domain";
import { PouchdbAgentRepo } from "@/modules/agent/repos/impl";
import { ImportAgentFromFile } from "@/modules/agent/usecases";

describe("ImportPromptFromFile", () => {
  let target: ImportAgentFromFile;

  let promptDb: PouchDB.Database;
  let promptRepo: PouchdbAgentRepo;

  beforeEach(async () => {
    promptDb = createMemoryDB("TEST-PROMPT");
    promptRepo = await PouchdbAgentRepo.create(promptDb);

    target = new ImportAgentFromFile(promptRepo);
  });

  afterEach(async () => {
    await promptDb.destroy();
  });

  it("[PP-U-IPPFF-001] 프롬프트 프리셋 파일에서 가져오기 - 프롬프트 프리셋을 파일에서 가져와 DB에 저장한다.", async () => {
    // Given
    const buffer = await fs.readFile(
      path.resolve(
        process.cwd(),
        "test/promptpreset/import-prompt-preset-from-file/prompt-preset.json",
      ),
    );
    const blob = new Blob([buffer], { type: "application/json" });
    const file = new File([blob], "prompt-preset.json", {
      type: "application/json",
    });

    // When
    const result = await target.execute(file);

    // Then
    expect(result.isSuccess).toBe(true);

    const prompt = (await promptRepo.searchAgents({ limit: 1 })).getValue()[0];
    expect(prompt.props.name).toBe("preset-test");
    expect(prompt.props.targetApiType).toBe(ApiType.Chat);
    expect(prompt.props.targetModel).toBe("gpt-4o");
    expect(prompt.props.promptMessages[0].props.promptBlocks.length).toBe(1);
    const foundPromptBlock = prompt.props.promptMessages[0].props
      .promptBlocks[0] as PlainBlock;
    expect(foundPromptBlock.props.name).toBe("block-test");
    expect(foundPromptBlock.props.type).toBe(BlockType.Plain);
    expect(foundPromptBlock.props.template).toBe("template-test");
    expect(foundPromptBlock.props.isDeleteUnnecessaryCharacters).toBe(true);
    expect(prompt.props.parameterValues).toEqual(
      new Map<string, any>(Object.entries({ "param-test": 0.25 })),
    );
  });
});
