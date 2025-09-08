import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { PNGMetadata } from "@/shared/utils/png-metadata";

import { Asset } from "@/modules/asset/domain/asset";
import { LoadAssetRepo } from "@/modules/asset/repos/load-asset-repo";
import { Card, CharacterCard, PlotCard } from "@/modules/card/domain";
import { LoadCardRepo } from "@/modules/card/repos";
//TODO: replace them with electron path
import {
  character_card_placeholder,
  plot_card_placeholder,
} from "@/public/placeholders";

export interface ExportOptions {
  format: "json" | "png";
}

export class ExportCardToFile
  implements
    UseCase<{ cardId: UniqueEntityID; options?: ExportOptions }, Result<File>>
{
  constructor(
    private loadCardRepo: LoadCardRepo,
    private loadAssetRepo: LoadAssetRepo,
  ) {}

  async execute({
    cardId,
    options = { format: "json" },
  }: {
    cardId: UniqueEntityID;
    options?: ExportOptions;
  }): Promise<Result<File>> {
    const cardResult = await this.loadCardRepo.getCardById(cardId);

    if (cardResult.isFailure) {
      return Result.fail<File>(cardResult.getError());
    }

    const card = cardResult.getValue();
    let fileContent: any;

    if (card instanceof CharacterCard) {
      fileContent = this.exportCharacterCard(card);
    } else if (card instanceof PlotCard) {
      fileContent = this.exportPlotCard(card);
    } else {
      return Result.fail<File>("Unsupported card type");
    }

    if (options.format === "json") {
      let iconAsset: Asset;
      if (card.props.iconAssetId) {
        // Get asset
        const assetOrError = await this.loadAssetRepo.getAssetById(
          card.props.iconAssetId,
        );
        if (assetOrError.isFailure) {
          throw new Error(assetOrError.getError());
        }
        iconAsset = assetOrError.getValue();
      } else {
        let svgContent;
        if (card instanceof CharacterCard) {
          svgContent = character_card_placeholder;
        } else if (card instanceof PlotCard) {
          svgContent = plot_card_placeholder;
        }
        const placeholderBlob = new Blob([svgContent!], {
          type: "image/svg+xml",
        });

        // Create file with correct MIME type
        const placeholderFile = new File([placeholderBlob], "placeholder.svg", {
          type: "image/svg+xml",
        });

        // Set icon asset
        const iconAssetOrError = await Asset.createFromFile({
          file: placeholderFile,
        });

        if (iconAssetOrError.isFailure) {
          throw new Error(iconAssetOrError.getError());
        }
        iconAsset = iconAssetOrError.getValue();
      }

      // Create PNG with metadata using either the card's icon or placeholder
      const pngData = await PNGMetadata.createPNGWithMetadata(
        iconAsset,
        fileContent,
      );
      const file = new File([pngData], `${card.props.title}.png`, {
        type: "image/png",
      });
      return Result.ok<File>(file);
    } else {
      const blob = new Blob([JSON.stringify(fileContent, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], `${card.props.title}.json`, {
        type: "application/json",
      });

      return Result.ok<File>(file);
    }
  }

  private exportCharacterCard(card: CharacterCard): any {
    return {
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: {
        name: card.props.name,
        description: card.props.description,
        personality: "",
        scenario: "",
        first_mes: "",
        mes_example: card.props.exampleDialogue,
        creator_notes: card.props.cardSummary,
        system_prompt: "",
        post_history_instructions: "",
        alternate_greetings: [],
        character_book: this.exportLorebook(card.props.lorebook),
        tags: card.props.tags,
        creator: card.props.creator,
        character_version: card.props.version,
        extensions: {
          title: card.props.title,
          ...this.getCommonExtensions(card),
        },
      },
    };
  }

  private exportPlotCard(card: PlotCard): any {
    return {
      spec: "plot_card_v1",
      version: "1.0",
      data: {
        title: card.props.title,
        description: card.props.description,
        scenarios: card.props.scenarios,
        entries: this.exportLorebook(card.props.lorebook)?.entries,
        extensions: {
          ...this.getCommonExtensions(card),
        },
      },
    };
  }

  private getCommonExtensions(card: Card): any {
    return {
      tags: card.props.tags,
      creator: card.props.creator,
      cardSummary: card.props.cardSummary,
      version: card.props.version,
      conceptualOrigin: card.props.conceptualOrigin,
      createdAt: card.props.createdAt.toISOString(),
      updatedAt: card.props.updatedAt?.toISOString(),
    };
  }

  private exportLorebook(lorebook: any): any {
    if (!lorebook || !lorebook.entries) return undefined;
    return {
      entries: lorebook.entries.map((entry: any, index: number) => ({
        keys: entry.keys,
        content: entry.content,
        extensions: {
          id: entry.id.toString(),
          recallRange: entry.recallRange,
        },
        enabled: entry.enabled,
        insertion_order: index,
        case_sensitive: false,
        name: entry.name,
      })),
    };
  }
}
