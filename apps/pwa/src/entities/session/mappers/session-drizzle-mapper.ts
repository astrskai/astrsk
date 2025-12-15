import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

import { InsertSession, SelectSession } from "@/db/schema/sessions";
import { CardType } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";

export interface CardListItemJson {
  id: string;
  type: string;
  enabled: boolean;
}

export interface PromptToggleJson {
  enabled: {
    [key: string]: boolean;
  };
  values: {
    [key: string]: string;
  };
}

export class SessionDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectSession): Session {
    // Create session
    const sessionOrError = Session.create(
      {
        title: row.title,
        name: row.name, // Now required (NOT NULL in DB)
        tags: row.tags || [],
        summary: row.summary ?? undefined,
        allCards: row.all_cards.map((cardJson) => ({
          id: new UniqueEntityID(cardJson.id),
          type: cardJson.type as CardType,
          enabled: cardJson.enabled,
        })),
        userCharacterCardId: row.user_character_card_id
          ? new UniqueEntityID(row.user_character_card_id)
          : undefined,
        turnIds: row.turn_ids.map((id) => new UniqueEntityID(id)),
        backgroundId: row.background_id
          ? new UniqueEntityID(row.background_id)
          : undefined,
        coverId: row.cover_id
          ? new UniqueEntityID(row.cover_id)
          : undefined,
        translation: row.translation
          ? TranslationConfig.fromJSON(row.translation)
              .throwOnFailure()
              .getValue()
          : undefined,
        chatStyles: row.chat_styles ? row.chat_styles : undefined,
        flowId: row.flow_id ? new UniqueEntityID(row.flow_id) : undefined,
        autoReply: row.auto_reply,
        dataSchemaOrder: row.data_schema_order || [],
        widgetLayout: row.widget_layout || undefined,
        isPlaySession: row.is_play_session ?? false,
        config: row.config ?? {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (sessionOrError.isFailure) {
      logger.error(sessionOrError.getError());
      throw new Error(sessionOrError.getError());
    }

    // Return session
    return sessionOrError.getValue();
  }

  public static toPersistence(domain: Session): InsertSession {
    return {
      id: domain.id.toString(),
      title: domain.props.title,
      name: domain.props.name, // Now required (NOT NULL in DB)
      tags: domain.props.tags,
      summary: domain.props.summary ?? null,
      all_cards: domain.props.allCards.map((card) => ({
        id: card.id.toString(),
        type: card.type,
        enabled: card.enabled,
      })),
      user_character_card_id:
        domain.props.userCharacterCardId?.toString() ?? null,
      turn_ids: domain.props.turnIds.map((id) => id.toString()),
      background_id: domain.props.backgroundId?.toString() ?? null,
      cover_id: domain.props.coverId?.toString() ?? null,
      translation: domain.props.translation
        ? domain.props.translation
        : null,
      chat_styles: domain.props.chatStyles,
      flow_id: domain.props.flowId?.toString() ?? null,
      auto_reply: domain.props.autoReply,
      data_schema_order: domain.props.dataSchemaOrder || [],
      widget_layout: domain.props.widgetLayout || null,
      is_play_session: domain.props.isPlaySession ?? false,
      config: domain.props.config ?? {},
      created_at: domain.props.createdAt,
      updated_at: domain.props.updatedAt,
    };
  }

  public static toStorage(domain: Session): InsertSession {
    const row = this.toPersistence(domain);
    return {
      ...row,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}
