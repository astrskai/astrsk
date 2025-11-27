import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";

import { SelectCharacter, InsertCharacter } from "@/db/schema/characters";
import { SelectScenario, InsertScenario } from "@/db/schema/scenarios";
import {
  Card,
  CardType,
  CharacterCard,
  ScenarioCard,
  normalizeCardType,
} from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";

// Union type for database rows
type SelectCardRow = SelectCharacter | SelectScenario;
type InsertCardRow = InsertCharacter | InsertScenario;

export class CardDrizzleMapper {
  private constructor() {}

  // Type guard to check if row is a character
  private static isCharacterRow(row: SelectCardRow): row is SelectCharacter {
    return "example_dialogue" in row; // Characters have example_dialogue, scenarios don't
  }

  // Type guard to check if row is a scenario
  private static isScenarioRow(row: SelectCardRow): row is SelectScenario {
    return "first_messages" in row; // Scenarios have first_messages, characters don't
  }

  public static toDomain(row: SelectCardRow): Card {
    let cardOrError: Result<Card>;

    if (this.isCharacterRow(row)) {
      // Map character from flat schema
      cardOrError = CharacterCard.create(
        {
          title: row.title,
          iconAssetId: row.icon_asset_id
            ? new UniqueEntityID(row.icon_asset_id)
            : undefined,
          type: CardType.Character,
          tags: row.tags,
          creator: row.creator ?? undefined,
          cardSummary: row.card_summary ?? undefined,
          version: row.version ?? undefined,
          conceptualOrigin: row.conceptual_origin ?? undefined,
          vibeSessionId: row.vibe_session_id ?? undefined,
          imagePrompt: row.image_prompt ?? undefined,
          sessionId: row.session_id
            ? new UniqueEntityID(row.session_id)
            : undefined,
          name: row.name,
          description: row.description ?? undefined,
          exampleDialogue: row.example_dialogue ?? undefined,
          lorebook: row.lorebook
            ? Lorebook.fromJSON(row.lorebook).throwOnFailure().getValue()
            : undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        new UniqueEntityID(row.id),
      );
    } else if (this.isScenarioRow(row)) {
      // Map scenario from flat schema
      cardOrError = ScenarioCard.create(
        {
          title: row.title,
          iconAssetId: row.icon_asset_id
            ? new UniqueEntityID(row.icon_asset_id)
            : undefined,
          type: CardType.Scenario,
          tags: row.tags,
          creator: row.creator ?? undefined,
          cardSummary: row.card_summary ?? undefined,
          version: row.version ?? undefined,
          conceptualOrigin: row.conceptual_origin ?? undefined,
          vibeSessionId: row.vibe_session_id ?? undefined,
          imagePrompt: row.image_prompt ?? undefined,
          sessionId: row.session_id
            ? new UniqueEntityID(row.session_id)
            : undefined,
          name: row.name,
          description: row.description ?? undefined,
          firstMessages: row.first_messages ?? undefined,
          lorebook: row.lorebook
            ? Lorebook.fromJSON(row.lorebook).getValue()
            : undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        new UniqueEntityID(row.id),
      );
    } else {
      throw new Error("Invalid card type: row must be either character or scenario");
    }

    if (cardOrError.isFailure) {
      throw new Error(cardOrError.getError());
    }

    return cardOrError.getValue();
  }

  private static isCharacterCard(card: Card): card is CharacterCard {
    return normalizeCardType(card.props.type) === CardType.Character;
  }

  private static isScenarioCard(card: Card): card is ScenarioCard {
    return normalizeCardType(card.props.type) === CardType.Scenario;
  }

  public static toPersistence(domain: Card): InsertCardRow {
    if (this.isCharacterCard(domain)) {
      // Map to characters table
      const insertRow: InsertCharacter = {
        id: domain.id.toString(),
        title: domain.props.title,
        icon_asset_id: domain.props.iconAssetId?.toString() ?? null,
        tags: domain.props.tags,
        creator: domain.props.creator ?? null,
        card_summary: domain.props.cardSummary ?? null,
        version: domain.props.version ?? null,
        conceptual_origin: domain.props.conceptualOrigin ?? null,
        vibe_session_id: domain.props.vibeSessionId ?? null,
        image_prompt: domain.props.imagePrompt ?? null,
        session_id: domain.props.sessionId?.toString() ?? null,
        name: domain.props.name ?? "",
        description: domain.props.description ?? null,
        example_dialogue: domain.props.exampleDialogue ?? null,
        lorebook: domain.props.lorebook ? domain.props.lorebook.toJSON() : null,
        created_at: domain.props.createdAt,
        updated_at: domain.props.updatedAt,
      };
      return insertRow;
    } else if (this.isScenarioCard(domain)) {
      // Map to scenarios table
      const insertRow: InsertScenario = {
        id: domain.id.toString(),
        title: domain.props.title,
        icon_asset_id: domain.props.iconAssetId?.toString() ?? null,
        tags: domain.props.tags,
        creator: domain.props.creator ?? null,
        card_summary: domain.props.cardSummary ?? null,
        version: domain.props.version ?? null,
        conceptual_origin: domain.props.conceptualOrigin ?? null,
        vibe_session_id: domain.props.vibeSessionId ?? null,
        image_prompt: domain.props.imagePrompt ?? null,
        session_id: domain.props.sessionId?.toString() ?? null,
        // Use name if available (ScenarioCard), otherwise use title (PlotCard fallback)
        name: (domain.props as any).name ?? domain.props.title,
        description: domain.props.description ?? null,
        // Handle both new (firstMessages) and old (scenarios) field names
        first_messages: (domain.props as any).firstMessages ?? (domain.props as any).scenarios ?? null,
        lorebook: domain.props.lorebook ? domain.props.lorebook.toJSON() : null,
        created_at: domain.props.createdAt,
        updated_at: domain.props.updatedAt,
      };
      return insertRow;
    } else {
      throw new Error("Invalid card type");
    }
  }
}
