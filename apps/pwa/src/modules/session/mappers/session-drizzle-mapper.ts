import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils";

import { InsertSession, SelectSession } from "@/db/schema/sessions";
import { CardType } from "@/modules/card/domain";
import { Session } from "@/modules/session/domain";
import { TranslationConfig } from "@/modules/session/domain/translation-config";

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
        translation: row.translation
          ? TranslationConfig.fromJSON(row.translation)
              .throwOnFailure()
              .getValue()
          : undefined,
        chatStyles: row.chat_styles ? row.chat_styles : undefined,
        flowId: new UniqueEntityID(row.flow_id),
        autoReply: row.auto_reply,
        dataStore: row.data_store || {},
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
      all_cards: domain.props.allCards.map((card) => ({
        id: card.id.toString(),
        type: card.type,
        enabled: card.enabled,
      })),
      user_character_card_id:
        domain.props.userCharacterCardId?.toString() ?? null,
      turn_ids: domain.props.turnIds.map((id) => id.toString()),
      background_id: domain.props.backgroundId?.toString() ?? null,
      translation: domain.props.translation
        ? domain.props.translation
        : null,
      chat_styles: domain.props.chatStyles,
      flow_id: domain.props.flowId.toString(),
      auto_reply: domain.props.autoReply,
      data_store: domain.props.dataStore,
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
