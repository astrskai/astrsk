import { isArray } from "lodash-es";

import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { readFileToString } from "@/shared/utils/file-utils";
import { PNGMetadata } from "@/shared/utils/png-metadata";
import { getTokenizer } from "@/shared/utils/tokenizer/tokenizer";

import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import {
  Card,
  CardType,
  CharacterCard,
  Lorebook,
  PlotCard,
} from "@/modules/card/domain";
import { SaveCardRepo } from "@/modules/card/repos";

const validSpecs = ["chara_card_v2", "chara_card_v3", "plot_card_v1"];

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

        // If file has scenario data, Import plot card
        if (
          jsonData.data.scenario !== "" ||
          jsonData.data.first_mes !== "" ||
          (jsonData.data.alternate_greetings &&
            jsonData.data.alternate_greetings.length > 0)
        ) {
          let scenarios = [];
          if (jsonData.data.first_mes) {
            // @ts-ignore
            scenarios.push({
              name: "firstMessage",
              description: jsonData.data.first_mes,
            });
          }
          if (
            jsonData.data.alternate_greetings &&
            isArray(jsonData.data.alternate_greetings) &&
            jsonData.data.alternate_greetings.length > 0
          ) {
            scenarios = scenarios.concat(
              jsonData.data.alternate_greetings.map((greeting: string) => ({
                name: "alternateGreeting",
                description: greeting,
              })),
            );
          }

          const plotCardResult = await this.importPlotCard({
            spec: "plot_card_v1",
            version: "1.0",
            data: {
              title: jsonData.data.name,
              description: jsonData.data.scenario,
              scenarios: scenarios,
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
                createdAt: jsonData.data.extensions?.createdAt,
                updatedAt: jsonData.data.extensions?.updatedAt,
              },
            },
          });
          if (plotCardResult.isSuccess) {
            const savedPlotCardResult = await this.saveCardRepo.saveCard(
              plotCardResult.getValue(),
            );
            cards.push(savedPlotCardResult.getValue());
          }
        }
      } else if (jsonData.spec === "plot_card_v1") {
        // Import plot card
        const plotCardResult = await this.importPlotCard(jsonData);
        if (plotCardResult.isSuccess) {
          const savedPlotCardResult = await this.saveCardRepo.saveCard(
            plotCardResult.getValue(),
          );
          cards.push(savedPlotCardResult.getValue());
        }
      }

      return Result.ok(cards);
    } catch (error) {
      return Result.fail<Card[]>(`Failed to import card from file: ${error}`);
    }
  }
}
