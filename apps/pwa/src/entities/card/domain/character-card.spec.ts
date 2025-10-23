import { describe, expect, it } from "vitest";

import { OpenAITokenizer } from "@/shared/lib";

import { CharacterCard } from "@/entities/card/domain/character-card";

describe("CharacterCard", () => {
  describe("calculateTokenSize()", () => {
    it("[SC-D-CC-001] 캐릭터 카드 토큰 사이즈 계산 - 설정한 토크나이저로 캐릭터 카드 텍스트 정보의 토큰 사이즈를 계산한다.", () => {
      // Given
      const card = CharacterCard.create({
        // Card
        title: "title-test",
        tags: ["tags-test"],
        creator: "creator-test",
        cardSummary: "cardSummary-test",
        version: "version-test",
        conceptualOrigin: "conceptualOrigin-test",

        // CharacterCard
        name: "name-test",
        description: "description-test",
        exampleDialogue: "exampleDialogue-test",
        customProps: {
          customProp1: "customProp1-test",
          customProp2: "customProp2-test",
        },
      }).getValue();
      const tokenizer = new OpenAITokenizer();

      // When
      const tokenSize = CharacterCard.calculateTokenSize(card.props, tokenizer);

      // Then
      expect(typeof tokenSize).toBe("number");
      expect(Number.isFinite(tokenSize)).toBe(true);
      // TODO: 토크나이저 별 구체적인 값 추가
    });
  });

  describe("addCustomProperty()", () => {
    it("[SC-D-CC-002] 캐릭터 카드 커스텀 프로퍼티 추가 - 캐릭터 카드의 커스텀 프로퍼티를 추가한다.", () => {
      // Given
      const card = CharacterCard.create({
        // Card
        title: "title-test",
        tags: ["tags-test"],
        creator: "creator-test",
        cardSummary: "cardSummary-test",
        version: "version-test",
        conceptualOrigin: "conceptualOrigin-test",

        // CharacterCard
        name: "name-test",
        description: "description-test",
        exampleDialogue: "exampleDialogue-test",
        customProps: {
          customProp1: "customProp1-test",
          customProp2: "customProp2-test",
        },
      }).getValue();

      // When
      const result = card.addCustomProperty("customProp3", "customProp3-test");

      // Then
      expect(result.isSuccess).toBe(true);
      expect(card.props.customProps).toEqual({
        customProp1: "customProp1-test",
        customProp2: "customProp2-test",
        customProp3: "customProp3-test",
      });
    });
  });

  describe("updateCustomProperty()", () => {
    it("[SC-D-CC-003] 캐릭터 카드 커스텀 프로퍼티 수정 - 캐릭터 카드의 커스텀 프로퍼티를 수정한다.", () => {
      // Given
      const card = CharacterCard.create({
        // Card
        title: "title-test",
        tags: ["tags-test"],
        creator: "creator-test",
        cardSummary: "cardSummary-test",
        version: "version-test",
        conceptualOrigin: "conceptualOrigin-test",

        // CharacterCard
        name: "name-test",
        description: "description-test",
        exampleDialogue: "exampleDialogue-test",
        customProps: {
          customProp1: "customProp1-test",
          customProp2: "customProp2-test",
        },
      }).getValue();

      // When
      const result = card.updateCustomProperty(
        "customProp1",
        "customProp1-updated",
      );

      // Then
      expect(result.isSuccess).toBe(true);
      expect(card.props.customProps).toEqual({
        customProp1: "customProp1-updated",
        customProp2: "customProp2-test",
      });
    });
  });

  describe("deleteCustomProperty()", () => {
    it("[SC-D-CC-004] 캐릭터 카드 커스텀 프로퍼티 삭제 - 캐릭터 카드의 커스텀 프로퍼티를 삭제한다.", () => {
      // Given
      const card = CharacterCard.create({
        // Card
        title: "title-test",
        tags: ["tags-test"],
        creator: "creator-test",
        cardSummary: "cardSummary-test",
        version: "version-test",
        conceptualOrigin: "conceptualOrigin-test",

        // CharacterCard
        name: "name-test",
        description: "description-test",
        exampleDialogue: "exampleDialogue-test",
        customProps: {
          customProp1: "customProp1-test",
          customProp2: "customProp2-test",
        },
      }).getValue();

      // When
      const result = card.deleteCustomProperty("customProp1");

      // Then
      expect(result.isSuccess).toBe(true);
      expect(card.props.customProps).toEqual({
        customProp2: "customProp2-test",
      });
    });
  });
});
