import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";

import { InsertCard, SelectCard } from "@/db/schema/cards";
import {
  Card,
  CardType,
  CharacterCard,
  CreateCardProps,
  PlotCard,
} from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";

export class CardDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectCard): Card {
    // Create card
    let cardOrError: Result<Card>;
    const commonProps: CreateCardProps = {
      title: row.common.title,
      iconAssetId: row.common.icon_asset_id
        ? new UniqueEntityID(row.common.icon_asset_id)
        : undefined,
      tags: row.common.tags,
      creator: row.common.creator ?? undefined,
      cardSummary: row.common.card_summary ?? undefined,
      version: row.common.version ?? undefined,
      conceptualOrigin: row.common.conceptual_origin ?? undefined,
      imagePrompt: row.common.image_prompt ?? undefined,
      createdAt: row.common.created_at,
      updatedAt: row.common.updated_at,
    };
    if (row.character) {
      cardOrError = CharacterCard.create(
        {
          ...commonProps,
          type: row.common.type as CardType,
          name: row.character.name,
          description: row.character.description ?? undefined,
          exampleDialogue: row.character.example_dialogue ?? undefined,
          lorebook: row.character.lorebook
            ? Lorebook.fromJSON(row.character.lorebook)
                .throwOnFailure()
                .getValue()
            : undefined,
        },
        new UniqueEntityID(row.common.id),
      );
    } else if (row.plot) {
      cardOrError = PlotCard.create(
        {
          ...commonProps,
          type: row.common.type as CardType,
          description: row.plot.description ?? undefined,
          scenarios: row.plot.scenarios ?? undefined,
          lorebook: row.plot.lorebook
            ? Lorebook.fromJSON(row.plot.lorebook).getValue()
            : undefined,
        },
        new UniqueEntityID(row.common.id),
      );
    } else {
      throw new Error("Invalid card type");
    }

    // Check error
    if (cardOrError.isFailure) {
      throw new Error(cardOrError.getError());
    }

    // Return card
    return cardOrError.getValue();
  }

  private static isCharacterCard(card: Card): card is CharacterCard {
    return card.props.type === CardType.Character;
  }

  private static isPlotCard(card: Card): card is PlotCard {
    return card.props.type === CardType.Plot;
  }

  public static toPersistence(domain: Card): InsertCard {
    // Set common props
    const insertRow: InsertCard = {
      common: {
        id: domain.id.toString(),
        title: domain.props.title,
        icon_asset_id: domain.props.iconAssetId?.toString() ?? null,
        type: domain.props.type,
        tags: domain.props.tags,
        creator: domain.props.creator,
        card_summary: domain.props.cardSummary,
        version: domain.props.version,
        conceptual_origin: domain.props.conceptualOrigin,
        image_prompt: domain.props.imagePrompt,
        created_at: domain.props.createdAt,
        updated_at: domain.props.updatedAt,
      },
    };

    // Set each card type props
    if (this.isCharacterCard(domain)) {
      insertRow.character = {
        id: domain.id.toString(),
        name: domain.props.name ?? "",
        description: domain.props.description,
        example_dialogue: domain.props.exampleDialogue,
        lorebook: domain.props.lorebook ? domain.props.lorebook.toJSON() : null,
        created_at: domain.props.createdAt,
        updated_at: domain.props.updatedAt,
      };
    } else if (this.isPlotCard(domain)) {
      insertRow.plot = {
        id: domain.id.toString(),
        description: domain.props.description,
        scenarios: domain.props.scenarios,
        lorebook: domain.props.lorebook ? domain.props.lorebook.toJSON() : null,
        created_at: domain.props.createdAt,
        updated_at: domain.props.updatedAt,
      };
    } else {
      // Unknown card type
      throw new Error("Invalid card type");
    }

    // Return insert row
    return insertRow;
  }
}
