import { beforeEach, describe, expect, it } from "vitest";

import { DrizzleAssetRepo } from "@/entities/asset/repos/impl/drizzle-asset-repo";
import {
  CharacterCard,
  Entry,
  Lorebook,
  PlotCard,
  Role,
} from "@/entities/card/domain";
import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { ExportCardToFile } from "@/entities/card/usecases";
import * as CharacterCardResult from "@test/card/export-card-to-file/character-card-ccv2.json";
import * as ScenarioCardResult from "@test/card/export-card-to-file/scenario-card.json";

describe("ExportCardToFile", () => {
  let target: ExportCardToFile;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();
    const assetRepo = new DrizzleAssetRepo();

    target = new ExportCardToFile(cardRepo, assetRepo);
  });

  describe("[C-U-ECTF-001] 카드 파일로 내보내기 - 카드를 파일로 내보낸다.", () => {
    it.todo("캐릭터 카드", async () => {
      // Given
      const lorebook = Lorebook.create({
        entries: [
          Entry.create({
            name: "entry-test",
            enabled: true,
            keys: ["key1", "key2"],
            recallRange: 2,
            content: "content-test",
          }).getValue(),
        ],
      }).getValue();
      const characterCard = CharacterCard.create({
        // Card
        title: "title-test",
        tags: ["tag1", "tag2"],
        creator: "creator-test",
        version: "version-test",
        // CharacterCard
        name: "name-test",
        description: "description-test",
        exampleDialogue: "example-dialogue-test",
        lorebook: lorebook,
      }).getValue();
      await cardRepo.saveCard(characterCard);

      // When
      const result = await target.execute({ cardId: characterCard.id });

      // Then
      expect(result.isSuccess).toBe(true);
      const file = result.getValue();
      const fileJson = JSON.parse(
        new TextDecoder().decode(await file.arrayBuffer()),
      );
      delete fileJson.data.extensions.createdAt;
      delete fileJson.data.extensions.updatedAt;
      expect(fileJson).toEqual(CharacterCardResult);
    });

    it.todo("시나리오 카드", async () => {
      // Given
      const scenarioCard = PlotCard.create({
        // Card
        title: "title-test",
        tags: ["tag1", "tag2"],
        creator: "creator-test",
        version: "version-test",
        // ScenarioCard
        description: "description-test",
        scenarios: [
          { name: "role1", description: "role1-description" },
          { name: "role2", description: "role2-description" },
        ],
      }).getValue();
      await cardRepo.saveCard(scenarioCard);

      // When
      const result = await target.execute({ cardId: scenarioCard.id });

      // Then
      expect(result.isSuccess).toBe(true);
      const file = result.getValue();
      const fileJson = JSON.parse(
        new TextDecoder().decode(await file.arrayBuffer()),
      );
      delete fileJson.data.extensions.createdAt;
      delete fileJson.data.extensions.updatedAt;
      expect(fileJson).toEqual(ScenarioCardResult);
    });
  });
});
