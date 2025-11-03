import { Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";

import { CardType } from "@/entities/card/domain";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { AutoReply } from "@/shared/stores/session-store";

export interface CardListItem {
  id: UniqueEntityID;
  type: CardType;
  enabled: boolean;
}

export interface SessionProps {
  // Metadata
  title: string;

  // Cards
  allCards: CardListItem[];
  userCharacterCardId?: UniqueEntityID;

  // Turns
  turnIds: UniqueEntityID[];

  // Images
  backgroundId?: UniqueEntityID; // Background image

  // Translation
  translation?: TranslationConfig;

  // Chat Styles
  chatStyles?: ChatStyles;

  // Flow
  flowId: UniqueEntityID;

  autoReply: AutoReply;

  // Data Schema
  dataSchemaOrder?: string[];

  // Set by system
  createdAt: Date;
  updatedAt: Date;
}

export const SessionPropsKeys = [
  "title",
  "allCards",
  "userCharacterCardId",
  "turnIds",
  "promptToggle",
  "isPlotBackground",
  "backgroundId",
  "translation",
  "aiResponse",
  "userResponse",
  "titleId",
  "chatStyles",
  "flowId",
  "createdAt",
  "updatedAt",
];

export class Session extends AggregateRoot<SessionProps> {
  get title(): string {
    return this.props.title;
  }

  get allCards(): CardListItem[] {
    return this.props.allCards;
  }

  get characterCards(): CardListItem[] {
    return this.props.allCards.filter(
      (card) => card.type === CardType.Character,
    );
  }

  get plotCard(): CardListItem | undefined {
    return this.props.allCards.find((card) => card.type === CardType.Plot);
  }

  get userCharacterCardId(): UniqueEntityID | undefined {
    return this.props.userCharacterCardId;
  }

  get aiCharacterCardIds(): UniqueEntityID[] {
    return this.props.allCards
      .filter((card) => card.type === CardType.Character)
      .map((card) => card.id)
      .filter((id) => !id.equals(this.userCharacterCardId));
  }

  get turnIds(): UniqueEntityID[] {
    return this.props.turnIds;
  }

  get backgroundId(): UniqueEntityID | undefined {
    return this.props.backgroundId;
  }

  get translation(): TranslationConfig | undefined {
    return this.props.translation;
  }

  get chatStyles(): ChatStyles | undefined {
    return this.props.chatStyles;
  }

  get flowId(): UniqueEntityID | undefined {
    return this.props.flowId;
  }

  get autoReply(): AutoReply {
    return this.props.autoReply;
  }

  get dataSchemaOrder(): string[] {
    return this.props.dataSchemaOrder || [];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: Partial<SessionProps>,
    id?: UniqueEntityID,
  ): Result<Session> {
    const propsWithDefaults: SessionProps = {
      title: props.title || "New Session",
      allCards: props.allCards || [],
      userCharacterCardId: props.userCharacterCardId,
      turnIds: props.turnIds || [],
      backgroundId: props.backgroundId,
      translation:
        props.translation ||
        TranslationConfig.create({
          displayLanguage: "none",
          promptLanguage: "none",
        }).getValue(),
      chatStyles: props.chatStyles,
      flowId: props.flowId!,
      autoReply: props.autoReply ?? AutoReply.Random,
      dataSchemaOrder: props.dataSchemaOrder || [],
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };

    const session = new Session(propsWithDefaults, id);
    return Result.ok(session);
  }

  public update(props: Partial<SessionProps>): Result<void> {
    try {
      Object.assign(this.props, {
        ...props,
        updatedAt: new Date(),
      });
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update session: ${error}`);
    }
  }

  public setName(name: string): void {
    this.props.title = name;
  }

  public addCard(cardId: UniqueEntityID, cardType: CardType): Result<void> {
    if (cardType === CardType.Plot && this.plotCard) {
      return Result.fail("Plot card already exists");
    }
    this.props.allCards.push({ id: cardId, type: cardType, enabled: true });
    return Result.ok();
  }

  public deleteCard(cardId: UniqueEntityID): void {
    this.props.allCards = this.allCards.filter(
      (card) => !card.id.equals(cardId),
    );
  }

  public setCardEnabled(cardId: UniqueEntityID, enabled: boolean): void {
    const card = this.props.allCards.find((card) => card.id.equals(cardId));
    if (card) {
      card.enabled = enabled;
    }
  }

  public setUserCharacterCardId(
    characterCardId: UniqueEntityID | null,
  ): Result<void> {
    if (
      characterCardId &&
      !this.characterCards.find((item) => item.id.equals(characterCardId))
    ) {
      return Result.fail("Character card not found in session");
    }

    this.props.userCharacterCardId = characterCardId || undefined;
    return Result.ok();
  }

  public addMessage(messageId: UniqueEntityID): void {
    this.props.turnIds.push(messageId);
  }

  public swapMessages(
    messageId1: UniqueEntityID,
    messageId2: UniqueEntityID,
  ): void {
    const index1 = this.props.turnIds.findIndex((id) => id.equals(messageId1));
    const index2 = this.props.turnIds.findIndex((id) => id.equals(messageId2));

    if (index1 !== -1 && index2 !== -1) {
      [this.props.turnIds[index1], this.props.turnIds[index2]] = [
        this.props.turnIds[index2],
        this.props.turnIds[index1],
      ];
    }
  }

  public deleteMessage(messageId: UniqueEntityID): void {
    this.props.turnIds = this.props.turnIds.filter(
      (id) => !id.equals(messageId),
    );
  }

  public setBackgroundId(backgroundId: UniqueEntityID | null): void {
    this.props.backgroundId = backgroundId || undefined;
  }

  public setTranslation(translation: TranslationConfig): void {
    this.props.translation = translation;
  }

  public setDataSchemaOrder(order: string[]): void {
    this.props.dataSchemaOrder = order;
  }
}
