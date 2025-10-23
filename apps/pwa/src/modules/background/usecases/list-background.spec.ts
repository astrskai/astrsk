import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/lib/test";

import { Background } from "@/modules/background/domain";
import { DrizzleBackgroundRepo } from "@/modules/background/repos/impl/drizzle-background-repo";
import { ListBackground } from "@/modules/background/usecases/list-background";

describe("ListBackground", () => {
  let target: ListBackground;
  let backgroundRepo: DrizzleBackgroundRepo;

  beforeEach(() => {
    backgroundRepo = new DrizzleBackgroundRepo();
    target = new ListBackground(backgroundRepo);
  });

  const createBackground = async (name: string) => {
    const file = await readFile("test/common/rubber-duck.png");
    const fileBase64 = (await FileBase64.create(file)).getValue();
    const background = Background.create({
      name,
      file: fileBase64,
    }).getValue();
    await backgroundRepo.saveBackground(background);
  };

  it("[B-U-LB-001] 배경화면 목록 조회 - 배경화면을 목록 조회한다.", async () => {
    // Given
    await createBackground("Background 1");
    await createBackground("Background 2");
    await createBackground("Background 3");

    // When
    const backgroundsOrError = await target.execute({
      limit: 2,
    });

    // Then
    expect(backgroundsOrError.isSuccess).toBe(true);
    const backgrounds = backgroundsOrError.getValue();
    expect(backgrounds.length).toBe(2);
  });
});
