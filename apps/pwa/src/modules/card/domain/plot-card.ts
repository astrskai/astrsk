import { Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { OpenAITokenizer } from "@/shared/utils/tokenizer/openai-tokenizer";
import { Tokenizer } from "@/shared/utils/tokenizer/tokenizer";

import {
  CardProps,
  CardType,
  CreateCardProps,
  Lorebook,
} from "@/modules/card/domain";

export interface PlotCardProps {
  description?: string;
  scenarios?: { name: string; description: string }[];
  lorebook?: Lorebook;
}

export interface PlotCardPropsJSON {
  description?: string;
  scenarios?: { name: string; description: string }[];
  lorebook?: ReturnType<Lorebook["toJSON"]>;
}

export type CreatePlotCardProps = CreateCardProps & Partial<PlotCardProps>;
export type UpdatePlotCardProps = CreatePlotCardProps;

export class PlotCard extends AggregateRoot<CardProps & PlotCardProps> {
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreatePlotCardProps,
    id?: UniqueEntityID,
  ): Result<PlotCard> {
    try {
      const plotCard = new PlotCard(
        {
          title: props.title || "",
          iconAssetId: props.iconAssetId,
          type: props.type || CardType.Plot,
          tags: props.tags || [],
          creator: props.creator,
          cardSummary: props.cardSummary,
          version: props.version,
          conceptualOrigin: props.conceptualOrigin,
          createdAt: new Date(),
          description: props.description,
          scenarios: props.scenarios,
          lorebook: props.lorebook,
          updatedAt: new Date(),
        },
        id ?? new UniqueEntityID(),
      );
      Object.assign(plotCard.props, {
        tokenCount: PlotCard.calculateTokenSize(
          plotCard.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<PlotCard>(plotCard);
    } catch (error) {
      return Result.fail<PlotCard>(`Failed to create PlotCard: ${error}`);
    }
  }

  public update(props: UpdatePlotCardProps): Result<void> {
    try {
      Object.assign(this.props, {
        ...props,
        updatedAt: new Date(),
      });
      Object.assign(this.props, {
        tokenCount: PlotCard.calculateTokenSize(
          this.props,
          OpenAITokenizer.instance,
        ),
      });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update PlotCard: ${error}`);
    }
  }

  public static getTokenText(props: PlotCard["props"]): string {
    return [props.description].filter(Boolean).join(" ");
  }

  public static calculateTokenSize(
    props: PlotCard["props"],
    tokenizer: Tokenizer,
  ): number {
    const textToTokenize = PlotCard.getTokenText(props);
    return tokenizer.encode(textToTokenize).length;
  }

  public clone(
    newId?: UniqueEntityID,
    overrides?: Partial<CreatePlotCardProps>,
  ): Result<PlotCard> {
    return PlotCard.create(
      {
        ...this.props,
        ...overrides,
      },
      newId ?? new UniqueEntityID(),
    );
  }
}
