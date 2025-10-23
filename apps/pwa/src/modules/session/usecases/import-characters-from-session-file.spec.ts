import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/lib/test";

import { ImportCharactersFromSessionFile } from "@/modules/session/usecases/import-characters-from-session-file";

describe("ImportCharactersFromSessionFile", () => {
  let target: ImportCharactersFromSessionFile;

  beforeEach(() => {
    target = new ImportCharactersFromSessionFile();
  });

  it("세션 파일에서 캐릭터 캐릭터 목록 가져오기 - 1:1 세션", async () => {
    // Given
    const file = await readFile(
      "test/session/import-characters-from-session-file/1-on-1.jsonl",
    );

    // When
    const resultOrError = await target.execute(file);

    // Then
    expect(resultOrError.isSuccess).toBe(true);
    const result = resultOrError.getValue();
    expect(result.length).toBe(2);
    expect(result).toContainEqual({
      name: "example1",
      isUser: true,
    });
    expect(result).toContainEqual({
      name: "Nami",
      isUser: false,
    });
  });

  it("세션 파일에서 캐릭터 캐릭터 목록 가져오기 - 그룹 세션", async () => {
    // Given
    const file = await readFile(
      "test/session/import-characters-from-session-file/group.jsonl",
    );

    // When
    const resultOrError = await target.execute(file);

    // Then
    expect(resultOrError.isSuccess).toBe(true);
    const result = resultOrError.getValue();
    expect(result.length).toBe(3);
    expect(result).toContainEqual({
      name: "example1",
      isUser: true,
    });
    expect(result).toContainEqual({
      name: "Nami",
      isUser: false,
    });
    expect(result).toContainEqual({
      name: "Harpy",
      isUser: false,
    });
  });
});
