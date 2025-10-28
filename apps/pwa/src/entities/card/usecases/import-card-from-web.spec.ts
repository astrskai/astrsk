import { beforeEach, describe, expect, it } from "vitest";

import { CardType, CharacterCard, PlotCard } from "@/entities/card/domain";
import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { ImportCardFromWeb } from "@/entities/card/usecases/import-card-from-web";
import * as ChubaiCharacter from "@test/card/import-card-from-web/chubai-character-ccv2.json";
import * as JanitoraiCharacter from "@test/card/import-card-from-web/janitorai-character-ccv2.json";
import * as RisurealmCharacter from "@test/card/import-card-from-web/risurealm-character-ccv2.json";

describe("ImportCardFromWeb", () => {
  let target: ImportCardFromWeb;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    cardRepo = new DrizzleCardRepo();

    target = new ImportCardFromWeb();
  });

  describe("[C-U-ICFW-001] 카드 웹에서 가져오기 - 카드를 웹에서 가져와 DB에 저장한다.", async () => {
    describe("https://chub.ai/", () => {
      it.todo("Character: 캐릭터 카드, 시나리오 카드", async () => {
        // Given
        const url = "https://chub.ai/Anonymous/example-character";

        // When
        const result = await target.execute(url);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().length).toBe(2);

        const characterCard = (
          await cardRepo.searchCards({ type: [CardType.Character], limit: 1 })
        ).getValue()[0] as CharacterCard;
        expect(characterCard.props.title).toBe(ChubaiCharacter.data.name);
        expect(characterCard.props.description).toBe(
          ChubaiCharacter.data.description,
        );
        expect(characterCard.props.lorebook?.props.entries.length).toBe(
          ChubaiCharacter.data.character_book.entries.length,
        );

        const scenarioCard = (
          await cardRepo.searchCards({ type: [CardType.Plot], limit: 1 })
        ).getValue()[0] as PlotCard;
        expect(scenarioCard.props.description).toBe(
          ChubaiCharacter.data.scenario,
        );
        expect(scenarioCard.props.scenarios?.[0]?.description).toBe(
          ChubaiCharacter.data.first_mes,
        );
      });
    });

    describe("https://janitorai.com/", () => {
      it.todo("Character: 캐릭터 카드, 시나리오 카드", async () => {
        // Given
        const url =
          "https://janitorai.com/characters/ddd1498a-a370-4136-b138-a8cd9461fdfe_character-aqua-the-useless-goddess";

        // When
        const result = await target.execute(url);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().length).toBe(2);

        const characterCard = (
          await cardRepo.searchCards({ type: [CardType.Character], limit: 1 })
        ).getValue()[0] as CharacterCard;
        expect(characterCard.props.title).toBe(JanitoraiCharacter.name);
        expect(characterCard.props.description).toBe(
          JanitoraiCharacter.description,
        );

        const scenarioCard = (
          await cardRepo.searchCards({ type: [CardType.Plot], limit: 1 })
        ).getValue()[0] as PlotCard;
        expect(scenarioCard.props.description).toBe(
          JanitoraiCharacter.scenario,
        );
        expect(scenarioCard.props.scenarios?.[0]?.description).toBe(
          JanitoraiCharacter.first_mes,
        );
      });
    });

    it.skip("https://realm.risuai.net/", () => {
      it.todo("Character: 캐릭터 카드, 시나리오 카드", async () => {
        // Given
        const url =
          "https://realm.risuai.net/character/3ca54c71-6efe-46a2-b9d0-4f62df23d712";

        // When
        const result = await target.execute(url);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().length).toBe(2);

        const characterCard = (
          await cardRepo.searchCards({ type: [CardType.Character], limit: 1 })
        ).getValue()[0] as CharacterCard;
        expect(characterCard.props.title).toBe(RisurealmCharacter.data.name);
        expect(characterCard.props.description).toBe(
          RisurealmCharacter.data.description,
        );

        const scenarioCard = (
          await cardRepo.searchCards({ type: [CardType.Plot], limit: 1 })
        ).getValue()[0] as PlotCard;
        expect(scenarioCard.props.description).toBe(
          RisurealmCharacter.data.scenario,
        );
        expect(scenarioCard.props.scenarios?.[0]?.description).toBe(
          RisurealmCharacter.data.first_mes,
        );
      });
    });
  });
});
