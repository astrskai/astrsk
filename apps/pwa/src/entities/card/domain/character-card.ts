import { Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { OpenAITokenizer } from "@/shared/lib/tokenizer/openai-tokenizer";
import { Tokenizer } from "@/shared/lib/tokenizer/tokenizer";

import {
  CardProps,
  CardType,
  CreateCardProps,
} from "@/entities/card/domain/card";
import { Lorebook } from "@/entities/card/domain/lorebook";

export interface CharacterCardProps {
  name?: string;
  description?: string;
  exampleDialogue?: string;
  lorebook?: Lorebook;
}

export interface CharacterCardPropsJSON {
  name?: string;
  description?: string;
  exampleDialogue?: string;
  lorebook?: ReturnType<Lorebook["toJSON"]>;
}

export type CreateCharacterCardProps = CreateCardProps &
  Partial<CharacterCardProps>;
export type UpdateCharacterCardProps = CreateCharacterCardProps;
export class CharacterCard extends AggregateRoot<
  CardProps & CharacterCardProps
> {
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateCharacterCardProps,
    id?: UniqueEntityID,
  ): Result<CharacterCard> {
    try {
      const characterCard = new CharacterCard(
        {
          title: props.title || "",
          name: props.name || "",
          iconAssetId: props.iconAssetId,
          type: props.type || CardType.Character,
          tags: props.tags || [],
          creator: props.creator,
          cardSummary: props.cardSummary,
          version: props.version,
          conceptualOrigin: props.conceptualOrigin,
          vibeSessionId: props.vibeSessionId,
          imagePrompt: props.imagePrompt,
          createdAt: props.createdAt || new Date(),
          description: props.description,
          exampleDialogue: props.exampleDialogue,
          lorebook: props.lorebook,
          sessionId: props.sessionId,
          updatedAt: props.updatedAt || new Date(),
        },
        id ?? new UniqueEntityID(),
      );
      Object.assign(characterCard.props, {
        tokenCount: CharacterCard.calculateTokenSize(
          characterCard.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<CharacterCard>(characterCard);
    } catch (error) {
      return Result.fail<CharacterCard>(
        `Failed to create CharacterCard: ${error}`,
      );
    }
  }

  public update(props: UpdateCharacterCardProps): Result<void> {
    try {
      Object.assign(this.props, {
        ...props,
        updatedAt: new Date(),
      });
      Object.assign(this.props, {
        tokenCount: CharacterCard.calculateTokenSize(
          this.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update CharacterCard: ${error}`);
    }
  }

  public static getTokenText(props: CharacterCard["props"]): string {
    return [props.name, props.description, props.exampleDialogue]
      .filter(Boolean)
      .join(" ");
  }

  public static calculateTokenSize(
    props: CharacterCard["props"],
    tokenizer: Tokenizer,
  ): number {
    const textToTokenize = CharacterCard.getTokenText(props);
    return tokenizer.encode(textToTokenize).length;
  }

  public clone(
    newId?: UniqueEntityID,
    overrides?: Partial<CreateCharacterCardProps>,
  ): Result<CharacterCard> {
    return CharacterCard.create(
      {
        ...this.props,
        ...overrides,
      },
      newId ?? new UniqueEntityID(),
    );
  }
}
