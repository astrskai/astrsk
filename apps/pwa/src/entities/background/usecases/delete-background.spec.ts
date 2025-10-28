import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/lib/test";

import { Background } from "@/entities/background/domain";
import { DrizzleBackgroundRepo } from "@/entities/background/repos/impl/drizzle-background-repo";
import { DeleteBackground } from "@/entities/background/usecases/delete-background";

describe("DeleteBackground", () => {
  let target: DeleteBackground;
  let backgroundRepo: DrizzleBackgroundRepo;

  beforeEach(() => {
    backgroundRepo = new DrizzleBackgroundRepo();
    target = new DeleteBackground(backgroundRepo);
  });

  it("[B-U-DB-001] 배경화면 삭제 - 배경화면을 삭제한다.", async () => {
    // Given
    const file = await readFile("test/common/rubber-duck.png");
    const fileBase64 = (await FileBase64.create(file)).getValue();
    const background = Background.create({
      name: "Background name",
      file: fileBase64,
    }).getValue();
    await backgroundRepo.saveBackground(background);

    // When
    const result = await target.execute(background.id);

    // Then
    expect(result.isSuccess).toBe(true);
    const getBackgroundResult = await backgroundRepo.getBackgroundById(
      background.id,
    );
    expect(getBackgroundResult.isFailure).toBe(true);
  });
});
