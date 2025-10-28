import { beforeEach, describe, expect, it } from "vitest";

import { CharacterCard } from "@/entities/card/domain";
import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { SaveCard } from "@/entities/card/usecases";

describe("SaveCard", () => {
  let target: SaveCard;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new SaveCard(cardRepo);
  });

  describe("[C-U-SC-001] 카드 저장 - 카드 객체를 DB에 저장한다.", () => {
    it("카드 객체를 생성하고 저장하면 생성일시가 설정된다.", async () => {
      // Given
      const card = CharacterCard.create({
        title: "Card title",
      }).getValue();

      // When
      await target.execute(card);

      // Then
      const savedCardResult = await cardRepo.getCardById(card.id);
      expect(savedCardResult.isSuccess).toBe(true);
      const savedCard = savedCardResult.getValue();
      expect(savedCard.props.title).toBe(card.props.title);
      expect(savedCard.props.createdAt).toBeInstanceOf(Date);
      expect(savedCard.props.updatedAt).toBeUndefined();
    });

    it("이미 존재하는 카드를 저장하면 수정일시가 갱신된다.", async () => {
      // Given
      const card = CharacterCard.create({
        title: "Card title",
      }).getValue();
      await cardRepo.saveCard(card);
      card.update({
        title: "Updated card title",
      });

      // When
      await target.execute(card);

      // Then
      const savedCardResult = await cardRepo.getCardById(card.id);
      expect(savedCardResult.isSuccess).toBe(true);
      const savedCard = savedCardResult.getValue();
      expect(savedCard.props.title).toBe(card.props.title);
      expect(savedCard.props.updatedAt).toBeInstanceOf(Date);
    });
  });
});
