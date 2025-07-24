import { beforeEach, describe, expect, it } from "vitest";

import { readFile } from "@/shared/utils/test";

import { CharacterCard } from "@/modules/card/domain";
import { DrizzleCardRepo } from "@/modules/card/repos/impl/drizzle-card-repo";
import { CloneCard } from "@/modules/card/usecases";

describe("CloneCard", () => {
  let target: CloneCard;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new CloneCard(cardRepo, cardRepo);
  });

  it("[C-U-CC-001] 카드 복제 - 세부 정보가 동일하지만 ID가 다른 객체를 생성하고 DB에 저장한다.", async () => {
    // Given
    const iconFile = await readFile("test/common/rubber-duck.png");
    const iconFileBase64 = (await FileBase64.create(iconFile)).getValue();
    const card = CharacterCard.create({
      title: "title-test",
      icon: iconFileBase64,
      tags: ["tags-test"],
      creator: "creator-test",
      cardSummary: "creatorNote-test",
      version: "version-test",
      conceptualOrigin: "source-test",
    }).getValue();
    await cardRepo.saveCard(card);

    // When
    const clonedCardOrError = await target.execute({ cardId: card.id });

    // Then
    expect(clonedCardOrError.isSuccess).toBe(true);
    const clonedCard = (
      await cardRepo.getCard(clonedCardOrError.getValue().id)
    ).getValue();
    expect(clonedCard.id).not.toEqual(card.id);
    expect(clonedCard.props.title).toBe(card.props.title);
    expect(clonedCard.props.icon).toEqual(card.props.icon);
    expect(clonedCard.props.tags).toEqual(card.props.tags);
    expect(clonedCard.props.creator).toBe(card.props.creator);
    expect(clonedCard.props.creatorNote).toBe(card.props.creatorNote);
    expect(clonedCard.props.version).toBe(card.props.version);
    expect(clonedCard.props.source).toBe(card.props.source);
    expect(clonedCard.props.createdAt).toBeInstanceOf(Date);
    expect(clonedCard.props.updatedAt).toBeUndefined();
  });
});
