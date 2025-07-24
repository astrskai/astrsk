import { beforeEach, describe, expect, it } from "vitest";

import { CardType, CharacterCard, PlotCard } from "@/modules/card/domain";
import { CreateCharacterCardProps } from "@/modules/card/domain/character-card";
import { CreatePlotCardProps } from "@/modules/card/domain/plot-card";
import { SearchCardsSort } from "@/modules/card/repos";
import { DrizzleCardRepo } from "@/modules/card/repos/impl/drizzle-card-repo";
import { SearchCard } from "@/modules/card/usecases";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("SearchCard", () => {
  let target: SearchCard;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new SearchCard(cardRepo);
  });

  const createCharacterCard = async (props: CreateCharacterCardProps) => {
    const card = CharacterCard.create(props).getValue();
    return await cardRepo.saveCard(card);
  };

  const createScenarioCard = async (props: CreatePlotCardProps) => {
    const card = PlotCard.create(props).getValue();
    return await cardRepo.saveCard(card);
  };

  describe("[C-U-LC-001] 카드 검색 - 카드를 텍스트 정보, 타입, 즐겨찾기 여부, 태그로 검색한다.", () => {
    it("페이지네이션", async () => {
      // Given
      const card1 = await createCharacterCard({ title: "Card 1" });
      const card2 = await createCharacterCard({ title: "Card 2" });
      const card3 = await createCharacterCard({ title: "Card 3" });

      // When
      const cardsOrError = await target.execute({
        limit: 2,
      });

      // Then
      expect(cardsOrError.isSuccess).toBe(true);
      const cards = cardsOrError.getValue();
      expect(cards.length).toBe(2);
    });

    it("검색 키워드", async () => {
      // Given
      const keyword = "test";
      const card1 = (await createCharacterCard({ title: "test" })).getValue();
      const card2 = (
        await createCharacterCard({
          title: "Card 2",
          creator: "test",
        })
      ).getValue();
      const card3 = (await createCharacterCard({ title: "Card 3" })).getValue();

      // When
      const cardsOrError = await target.execute({
        limit: 3,
        keyword,
      });

      // Then
      expect(cardsOrError.isSuccess).toBe(true);
      const cards = cardsOrError.getValue();
      expect(cards.length).toBe(2);
      expect(cards).toContainEqual(card1);
      expect(cards).toContainEqual(card2);
      expect(cards).not.toContainEqual(card3);
    });

    it("타입", async () => {
      // Given
      const type = [CardType.Character];
      const card1 = (await createCharacterCard({ title: "Card 1" })).getValue();
      const card2 = (await createScenarioCard({ title: "Card 2" })).getValue();

      // When
      const cardsOrError = await target.execute({
        limit: 3,
        type,
      });

      // Then
      expect(cardsOrError.isSuccess).toBe(true);
      const cards = cardsOrError.getValue();
      expect(cards.length).toBe(1);
      expect(cards).toContainEqual(card1);
      expect(cards).not.toContainEqual(card2);
    });

    describe("정렬", () => {
      it("Latest: 생성일자 기준 내림차순", async () => {
        // Given
        const card1 = await createCharacterCard({ title: "Card 1" });
        await sleep(10);
        const card2 = await createCharacterCard({ title: "Card 2" });
        await sleep(10);
        const card3 = await createCharacterCard({ title: "Card 3" });

        // When
        const cardsOrError = await target.execute({
          sort: SearchCardsSort.Latest,
        });

        // Then
        expect(cardsOrError.isSuccess).toBe(true);
        const cards = cardsOrError.getValue();
        expect(cards.length).toBe(3);
        expect(cards[0]).toEqual(card3.getValue());
        expect(cards[1]).toEqual(card2.getValue());
        expect(cards[2]).toEqual(card1.getValue());
      });

      it("Oldest: 생성일자 기준 오름차순", async () => {
        // Given
        const card1 = await createCharacterCard({ title: "Card 1" });
        await sleep(10);
        const card2 = await createCharacterCard({ title: "Card 2" });
        await sleep(10);
        const card3 = await createCharacterCard({ title: "Card 3" });

        // When
        const cardsOrError = await target.execute({
          sort: SearchCardsSort.Oldest,
        });

        // Then
        expect(cardsOrError.isSuccess).toBe(true);
        const cards = cardsOrError.getValue();
        expect(cards.length).toBe(3);
        expect(cards[0]).toEqual(card1.getValue());
        expect(cards[1]).toEqual(card2.getValue());
        expect(cards[2]).toEqual(card3.getValue());
      });

      it("TitleAtoZ: 타이틀 기준 오름차순", async () => {
        // Given
        const card1 = await createCharacterCard({ title: "Card A" });
        const card2 = await createCharacterCard({ title: "Card B" });
        const card3 = await createCharacterCard({ title: "Card C" });

        // When
        const cardsOrError = await target.execute({
          type: [CardType.Character],
          sort: SearchCardsSort.TitleAtoZ,
        });

        // Then
        expect(cardsOrError.isSuccess).toBe(true);
        const cards = cardsOrError.getValue();
        expect(cards.length).toBe(3);
        expect(cards[0]).toEqual(card1.getValue());
        expect(cards[1]).toEqual(card2.getValue());
        expect(cards[2]).toEqual(card3.getValue());
      });

      it("TitleZtoA: 타이틀 기준 내림차순", async () => {
        // Given
        const card1 = await createCharacterCard({ title: "Card A" });
        const card2 = await createCharacterCard({ title: "Card B" });
        const card3 = await createCharacterCard({ title: "Card C" });

        // When
        const cardsOrError = await target.execute({
          sort: SearchCardsSort.TitleZtoA,
        });

        // Then
        expect(cardsOrError.isSuccess).toBe(true);
        const cards = cardsOrError.getValue();
        expect(cards.length).toBe(3);
        expect(cards[0]).toEqual(card3.getValue());
        expect(cards[1]).toEqual(card2.getValue());
        expect(cards[2]).toEqual(card1.getValue());
      });
    });
  });
});
