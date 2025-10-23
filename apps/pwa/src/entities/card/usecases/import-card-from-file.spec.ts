import fs from "fs/promises";
import path from "path";

import { beforeEach, describe, expect, it } from "vitest";

import { CardType, CharacterCard, PlotCard } from "@/entities/card/domain";
import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { ImportCardFromFile } from "@/entities/card/usecases";

describe("ImportCardFromFile", () => {
  let target: ImportCardFromFile;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new ImportCardFromFile(cardRepo);
  });

  it("[C-U-ICFF-001] 카드 파일에서 가져오기 - 카드를 파일에서 가져와 DB에 저장한다.", async () => {
    // Given
    const buffer = await fs.readFile(
      path.resolve(process.cwd(), "test/card/import-card-from-file/ccv2.json"),
    );
    const blob = new Blob([buffer], { type: "application/json" });
    const file = new File([blob], "ccv2.json", {
      type: "application/json",
    });

    // When
    const result = await target.execute(file);

    // Then
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(2);

    const characterCard = (
      await cardRepo.searchCards({ type: [CardType.Character], limit: 1 })
    ).getValue()[0] as CharacterCard;
    expect(characterCard.props.name).toBe("Seraphina");

    const plotCard = (
      await cardRepo.searchCards({ type: [CardType.Plot], limit: 1 })
    ).getValue()[0] as PlotCard;
    expect(plotCard.props.scenario).toBe(
      "You were attacked by beasts while wandering the magical forest of Eldoria. Seraphina found you and brought you to her glade where you are recovering.",
    );
  });
});
