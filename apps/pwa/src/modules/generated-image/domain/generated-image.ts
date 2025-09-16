import { Guard, Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

export interface GeneratedImageProps {
  name: string;
  assetId: UniqueEntityID;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  mediaType?: string; // 'image' or 'video'
  thumbnailAssetId?: UniqueEntityID; // For video thumbnails
  associatedCardId?: UniqueEntityID;
  isSessionGenerated?: boolean; // True for images/videos generated in sessions
  createdAt: Date;
  updatedAt: Date;
}

export const GeneratedImagePropsKeys = [
  "name",
  "assetId",
  "prompt",
  "style",
  "aspectRatio",
  "mediaType",
  "thumbnailAssetId",
  "associatedCardId",
  "isSessionGenerated",
  "createdAt",
  "updatedAt",
];

type CreateGeneratedImageProps = Partial<GeneratedImageProps>;

export class GeneratedImage extends AggregateRoot<GeneratedImageProps> {
  get name(): string {
    return this.props.name;
  }

  get assetId(): UniqueEntityID {
    return this.props.assetId;
  }

  get prompt(): string {
    return this.props.prompt;
  }

  get style(): string | undefined {
    return this.props.style;
  }

  get aspectRatio(): string | undefined {
    return this.props.aspectRatio;
  }

  get mediaType(): string | undefined {
    return this.props.mediaType;
  }

  get thumbnailAssetId(): UniqueEntityID | undefined {
    return this.props.thumbnailAssetId;
  }

  get associatedCardId(): UniqueEntityID | undefined {
    return this.props.associatedCardId;
  }

  get isSessionGenerated(): boolean {
    return this.props.isSessionGenerated || false;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public setName(name: string): Result<void> {
    if (Guard.againstNullOrUndefined(name, "name").isFailure) {
      return formatFail("name is null or undefined");
    }

    this.props.name = name;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public setPrompt(prompt: string): Result<void> {
    if (Guard.againstNullOrUndefined(prompt, "prompt").isFailure) {
      return formatFail("prompt is null or undefined");
    }

    this.props.prompt = prompt;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public setStyle(style: string): Result<void> {
    this.props.style = style;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public setAspectRatio(aspectRatio: string): Result<void> {
    this.props.aspectRatio = aspectRatio;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public associateWithCard(cardId: UniqueEntityID): Result<void> {
    this.props.associatedCardId = cardId;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public static create(
    props: CreateGeneratedImageProps,
    id?: UniqueEntityID,
  ): Result<GeneratedImage> {
    try {
      const guardResult = Guard.againstNullOrUndefinedBulk([
        { argument: props.name, argumentName: "name" },
        { argument: props.assetId, argumentName: "assetId" },
        { argument: props.prompt, argumentName: "prompt" },
      ]);
      if (guardResult.isFailure) {
        return formatFail(guardResult.getError());
      }

      const now = new Date();
      const generatedImage = new GeneratedImage(
        {
          name: props.name ?? "",
          assetId: props.assetId ?? new UniqueEntityID(),
          prompt: props.prompt ?? "",
          style: props.style,
          aspectRatio: props.aspectRatio,
          mediaType: props.mediaType,
          thumbnailAssetId: props.thumbnailAssetId,
          associatedCardId: props.associatedCardId,
          isSessionGenerated: props.isSessionGenerated ?? false,
          createdAt: props.createdAt ?? now,
          updatedAt: props.updatedAt ?? now,
        },
        id,
      );

      return Result.ok<GeneratedImage>(generatedImage);
    } catch (error) {
      return formatFail("Failed to create GeneratedImage", error);
    }
  }
}
