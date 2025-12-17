import { Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { OpenAITokenizer } from "@/shared/lib/tokenizer/openai-tokenizer";
import { Tokenizer } from "@/shared/lib/tokenizer/tokenizer";

import {
  CardProps,
  CardType,
  CreateCardProps,
  Lorebook,
} from "@/entities/card/domain";

export interface ScenarioCardProps {
  name: string; // Required field from scenarios table
  description?: string;
  firstMessages?: { name: string; description: string }[]; // Renamed from 'scenarios'
  lorebook?: Lorebook;
}

export interface ScenarioCardPropsJSON {
  name: string;
  description?: string;
  firstMessages?: { name: string; description: string }[];
  lorebook?: ReturnType<Lorebook["toJSON"]>;
}

export type CreateScenarioCardProps = CreateCardProps & Partial<ScenarioCardProps>;
export type UpdateScenarioCardProps = CreateScenarioCardProps;

export class ScenarioCard extends AggregateRoot<CardProps & ScenarioCardProps> {
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateScenarioCardProps,
    id?: UniqueEntityID,
  ): Result<ScenarioCard> {
    try {
      const scenarioCard = new ScenarioCard(
        {
          title: props.title || "",
          iconAssetId: props.iconAssetId,
          type: props.type || CardType.Scenario,
          tags: props.tags || [],
          creator: props.creator,
          cardSummary: props.cardSummary,
          version: props.version,
          conceptualOrigin: props.conceptualOrigin,
          vibeSessionId: props.vibeSessionId,
          imagePrompt: props.imagePrompt,
          createdAt: props.createdAt || new Date(),
          name: props.name || props.title || "",
          description: props.description,
          firstMessages: props.firstMessages,
          lorebook: props.lorebook,
          sessionId: props.sessionId,
          config: props.config,
          updatedAt: props.updatedAt || new Date(),
        },
        id ?? new UniqueEntityID(),
      );
      Object.assign(scenarioCard.props, {
        tokenCount: ScenarioCard.calculateTokenSize(
          scenarioCard.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<ScenarioCard>(scenarioCard);
    } catch (error) {
      return Result.fail<ScenarioCard>(`Failed to create ScenarioCard: ${error}`);
    }
  }

  public update(props: UpdateScenarioCardProps): Result<void> {
    try {
      Object.assign(this.props, {
        ...props,
        updatedAt: new Date(),
      });
      Object.assign(this.props, {
        tokenCount: ScenarioCard.calculateTokenSize(
          this.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update ScenarioCard: ${error}`);
    }
  }

  public static getTokenText(props: ScenarioCard["props"]): string {
    return [props.description].filter(Boolean).join(" ");
  }

  public static calculateTokenSize(
    props: ScenarioCard["props"],
    tokenizer: Tokenizer,
  ): number {
    const textToTokenize = ScenarioCard.getTokenText(props);
    return tokenizer.encode(textToTokenize).length;
  }

  public clone(
    newId?: UniqueEntityID,
    overrides?: Partial<CreateScenarioCardProps>,
  ): Result<ScenarioCard> {
    return ScenarioCard.create(
      {
        ...this.props,
        ...overrides,
      },
      newId ?? new UniqueEntityID(),
    );
  }
}
