import { isArray } from "lodash-es";

import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { readFileToString } from "@/shared/lib/file-utils";
import { PNGMetadata } from "@/shared/lib/png-metadata";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import {
  Card,
  CardType,
  CharacterCard,
  Lorebook,
  PlotCard,
  ScenarioCard,
} from "@/entities/card/domain";
import { SaveCardRepo } from "@/entities/card/repos";

const validSpecs = [
  "chara_card_v2",
  "chara_card_v3",
  "plot_card_v1",
  "scenario_card_v2",
];

// TODO: re-implement import and export card logics
export class ImportCardFromFile implements UseCase<File, Result<Card[]>> {
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveCardRepo: SaveCardRepo,
  ) {}

  private async importCharacterCard(json: any): Promise<Result<CharacterCard>> {
    const cardOrError = CharacterCard.create(
      {
        iconAssetId: json.data.iconAssetId ? new UniqueEntityID(json.data.iconAssetId) : undefined,
        title: json.data.extensions?.title ?? json.data.name,
        name: json.data.name,
        type: CardType.Character,
        tags: json.data.tags ?? json.data.extensions?.tags,
        creator: json.data.creator ?? json.data.extensions?.creator,
        cardSummary:
          json.data.extensions?.cardSummary ??
          json.data.creator_notes ??
          json.data.extensions?.creatorNote,
        version: json.data.character_version ?? json.data.extensions?.version,
        conceptualOrigin:
          json.data.extensions?.conceptualOrigin ?? json.data.extensions?.source,
        description: json.data.description,
        exampleDialogue: json.data.mes_example,
        lorebook: json.data.character_book?.entries
          ? Lorebook.fromJSON({
              entries: json.data.character_book.entries.map((entry: any) => ({
                id: entry.extensions.id,
                name: entry.name,
                enabled: entry.enabled,
                keys: entry.keys,
                recallRange:
                  entry.extensions.recallRange ?? entry.extensions.scanDepth,
                content: entry.content,
              })),
            }).getValue()
          : undefined,
        createdAt: new Date(), // Always use current timestamp on import
        updatedAt: new Date(), // Always use current timestamp on import
      },
      json.id ? new UniqueEntityID(json.id) : undefined,
    );
    if (cardOrError.isFailure) {
      return Result.fail(cardOrError.getError());
    }
    const card = cardOrError.getValue();
    const tokenCount = CharacterCard.calculateTokenSize(
      card.props,
      await getTokenizer(),
    );
    card.update({ tokenCount });
    return Result.ok(card as CharacterCard);
  }

  private async importPlotCard(json: any): Promise<Result<PlotCard>> {
    const cardOrError = PlotCard.create(
      {
        iconAssetId: json.data.iconAssetId ? new UniqueEntityID(json.data.iconAssetId) : undefined,
        title: json.data.title,
        type: CardType.Plot,
        tags: json.data.extensions.tags,
        creator: json.data.extensions.creator,
        cardSummary:
          json.data.extensions?.cardSummary ??
          json.data.creator_notes ??
          json.data.extensions?.creatorNote,
        version: json.data.extensions.version,
        conceptualOrigin:
          json.data.conceptualOrigin ?? json.data.extensions?.source,
        description: json.data.description ?? json.data.scenario,
        scenarios: json.data.scenarios ?? [],
        lorebook: json.data.entries
          ? Lorebook.fromJSON({
              entries: json.data.entries.map((entry: any) => ({
                id: entry.extensions.id,
                name: entry.name,
                enabled: entry.enabled,
                keys: entry.keys,
                recallRange:
                  entry.extensions.recallRange ?? entry.extensions.scanDepth,
                content: entry.content,
              })),
            }).getValue()
          : undefined,
        createdAt: new Date(), // Always use current timestamp on import
        updatedAt: new Date(), // Always use current timestamp on import
      },
      json.id ? new UniqueEntityID(json.id) : undefined,
    );
    if (cardOrError.isFailure) {
      return Result.fail(cardOrError.getError());
    }
    const card = cardOrError.getValue();
    const tokenCount = PlotCard.calculateTokenSize(
      card.props,
      await getTokenizer(),
    );
    card.update({ tokenCount });
    return Result.ok(card as PlotCard);
  }

  private async importScenarioCard(json: any): Promise<Result<ScenarioCard>> {
    const cardOrError = ScenarioCard.create(
      {
        iconAssetId: json.data.iconAssetId ? new UniqueEntityID(json.data.iconAssetId) : undefined,
        title: json.data.title,
        name: json.data.title, // ScenarioCard requires name field
        type: CardType.Scenario,
        tags: json.data.extensions?.tags ?? [],
        creator: json.data.extensions?.creator,
        cardSummary: json.data.extensions?.cardSummary,
        version: json.data.extensions?.version,
        conceptualOrigin: json.data.extensions?.conceptualOrigin,
        description: json.data.description,
        firstMessages: json.data.first_messages ?? [],
        lorebook: json.data.entries
          ? Lorebook.fromJSON({
              entries: json.data.entries.map((entry: any) => ({
                id: entry.extensions.id,
                name: entry.name,
                enabled: entry.enabled,
                keys: entry.keys,
                recallRange:
                  entry.extensions.recallRange ?? entry.extensions.scanDepth,
                content: entry.content,
              })),
            }).getValue()
          : undefined,
        createdAt: new Date(), // Always use current timestamp on import
        updatedAt: new Date(), // Always use current timestamp on import
      },
      json.id ? new UniqueEntityID(json.id) : undefined,
    );
    if (cardOrError.isFailure) {
      return Result.fail(cardOrError.getError());
    }
    const card = cardOrError.getValue();
    const tokenCount = ScenarioCard.calculateTokenSize(
      card.props,
      await getTokenizer(),
    );
    card.update({ tokenCount });
    return Result.ok(card as ScenarioCard);
  }

  async execute(file: File): Promise<Result<Card[]>> {
    try {
      let jsonData: any;

      if (file.type === "image/png") {
        // Handle PNG file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = PNGMetadata.extractMetadataFromImage(buffer);

        if (!result) {
          return Result.fail("No character metadata found in PNG file");
        }

        jsonData = result.metadata;

        // Check if V1 character card
        if (
          "spec" in jsonData === false &&
          "name" in jsonData &&
          "description" in jsonData &&
          "personality" in jsonData &&
          "scenario" in jsonData &&
          "first_mes" in jsonData &&
          "mes_example" in jsonData
        ) {
          // Convert to V2 character card
          jsonData.data = {
            ...jsonData,
          };
          jsonData.spec = "chara_card_v2";
        }

        // Save image to icon asset
        const id = new UniqueEntityID();
        jsonData.id = id.toString();
        const iconAssetOrError = await this.saveFileToAsset.execute({
          file: file,
        });
        if (iconAssetOrError.isFailure) {
          return Result.fail(iconAssetOrError.getError());
        }
        const iconAsset = iconAssetOrError.getValue();
        jsonData.data.iconAssetId = iconAsset.id;
      } else {
        // Handle JSON file
        const fileText = await readFileToString(file);
        jsonData = JSON.parse(fileText);
      }

      // Check spec
      if ("spec" in jsonData === false || !validSpecs.includes(jsonData.spec)) {
        return Result.fail("Invalid card file");
      }

      const cards: Card[] = [];

      if (
        jsonData.spec === "chara_card_v2" ||
        jsonData.spec === "chara_card_v3"
      ) {
        // Import character card
        const characterCardResult = await this.importCharacterCard(jsonData);
        if (characterCardResult.isSuccess) {
          const savedCharacterCardResult = await this.saveCardRepo.saveCard(
            characterCardResult.getValue(),
          );
          cards.push(savedCharacterCardResult.getValue());
        }

        // If file has scenario data, Import scenario card (new format)
        if (
          jsonData.data.scenario !== "" ||
          jsonData.data.first_mes !== "" ||
          (jsonData.data.alternate_greetings &&
            jsonData.data.alternate_greetings.length > 0)
        ) {
          let firstMessages = [];
          if (jsonData.data.first_mes) {
            // @ts-ignore
            firstMessages.push({
              name: "firstMessage",
              description: jsonData.data.first_mes,
            });
          }
          if (
            jsonData.data.alternate_greetings &&
            isArray(jsonData.data.alternate_greetings) &&
            jsonData.data.alternate_greetings.length > 0
          ) {
            firstMessages = firstMessages.concat(
              jsonData.data.alternate_greetings.map((greeting: string) => ({
                name: "alternateGreeting",
                description: greeting,
              })),
            );
          }

          const scenarioCardResult = await this.importScenarioCard({
            spec: "scenario_card_v2",
            version: "2.0",
            data: {
              title: jsonData.data.name,
              description: jsonData.data.scenario,
              first_messages: firstMessages,
              extensions: {
                tags: jsonData.data.tags,
                creator: jsonData.data.creator,
                cardSummary:
                  jsonData.data.cardSummary ??
                  jsonData.data.creator_notes ??
                  jsonData.data.extensions?.creatorNote,
                version: jsonData.data.character_version,
                conceptualOrigin:
                  jsonData.data.conceptualOrigin ??
                  jsonData.data.extensions?.source,
              },
            },
          });
          if (scenarioCardResult.isSuccess) {
            const savedScenarioCardResult = await this.saveCardRepo.saveCard(
              scenarioCardResult.getValue(),
            );
            cards.push(savedScenarioCardResult.getValue());
          }
        }
      } else if (jsonData.spec === "plot_card_v1") {
        // Import plot card (legacy)
        const plotCardResult = await this.importPlotCard(jsonData);
        if (plotCardResult.isSuccess) {
          const savedPlotCardResult = await this.saveCardRepo.saveCard(
            plotCardResult.getValue(),
          );
          cards.push(savedPlotCardResult.getValue());
        }
      } else if (jsonData.spec === "scenario_card_v2") {
        // Import scenario card (new format)
        const scenarioCardResult = await this.importScenarioCard(jsonData);
        if (scenarioCardResult.isSuccess) {
          const savedScenarioCardResult = await this.saveCardRepo.saveCard(
            scenarioCardResult.getValue(),
          );
          cards.push(savedScenarioCardResult.getValue());
        }
      }

      return Result.ok(cards);
    } catch (error) {
      return Result.fail<Card[]>(`Failed to import card from file: ${error}`);
    }
  }
}
