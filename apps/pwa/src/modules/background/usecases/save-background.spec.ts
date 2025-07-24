import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/utils/test";

import { Background } from "@/modules/background/domain";
import { DrizzleBackgroundRepo } from "@/modules/background/repos/impl/drizzle-background-repo";
import { SaveBackground } from "@/modules/background/usecases/save-background";

describe("SaveBackground", () => {
  let target: SaveBackground;
  let backgroundRepo: DrizzleBackgroundRepo;

  beforeEach(() => {
    backgroundRepo = new DrizzleBackgroundRepo();
    target = new SaveBackground(backgroundRepo);
  });

  it("[B-U-SB-001] 배경화면 저장 - 배경화면 객체를 DB에 저장한다.", async () => {
    // Given
    const name = "Background name";
    const file = await readFile("test/common/rubber-duck.png");
    const fileBase64 = (await FileBase64.create(file)).getValue();
    const background = Background.create({
      name,
      file: fileBase64,
    }).getValue();
    background.setName(name);

    // When
    const result = await target.execute(background);

    // Then
    expect(result.isSuccess).toBe(true);
    const savedBackground = (
      await backgroundRepo.getBackgroundById(background.id)
    ).getValue();
    expect(savedBackground.name).toBe(name);
    expect(savedBackground.file.name).toBe("rubber-duck.png");
    expect(savedBackground.file.contentType).toBe("image/png");
    expect(savedBackground.file.data).toBeDefined();
  });
});
