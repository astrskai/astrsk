import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/utils/test";

import { CharacterCard } from "@/modules/card/domain";
import { DrizzleCardRepo } from "@/modules/card/repos/impl/drizzle-card-repo";
import { GetCard } from "@/modules/card/usecases";

describe("GetCard", () => {
  let target: GetCard;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new GetCard(cardRepo);
  });

  it("[C-U-GC-001] 카드 상세 조회 - 카드를 상세 조회한다.", async () => {
    // Given
    const iconFile = await readFile("test/common/rubber-duck.png");
    const iconFileBase64 = (await FileBase64.create(iconFile)).getValue();
    const card = CharacterCard.create({
      title: "title-test",
      icon: iconFileBase64,
      tags: ["tags-test"],
      creator: "creator-test",
      creatorNote: "creatorNote-test",
      version: "version-test",
      source: "source-test",
    }).getValue();
    await cardRepo.saveCard(card);

    // When
    const cardOrError = await target.execute(card.id);

    // Then
    expect(cardOrError.isSuccess).toBe(true);
    const foundCard = cardOrError.getValue();
    expect(foundCard.props.title).toBe("title-test");
    expect(foundCard.props.icon).toBeDefined();
    expect(foundCard.props.icon?.data).toBeDefined();
    expect(foundCard.props.tags).toEqual(["tags-test"]);
    expect(foundCard.props.creator).toBe("creator-test");
    expect(foundCard.props.creatorNote).toBe("creatorNote-test");
    expect(foundCard.props.version).toBe("version-test");
    expect(foundCard.props.source).toBe("source-test");
  });
});
