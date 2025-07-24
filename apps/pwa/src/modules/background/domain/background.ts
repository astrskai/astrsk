import { Guard, Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

export interface BackgroundProps {
  name: string;
  assetId: UniqueEntityID;
  updatedAt: Date;
}

export const BackgroundPropsKeys = ["name", "assetId", "updatedAt"];

type CreateBackgroundProps = Partial<BackgroundProps>;

export class Background extends AggregateRoot<BackgroundProps> {
  get name(): string {
    return this.props.name;
  }

  get assetId(): UniqueEntityID {
    return this.props.assetId;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public setName(name: string): Result<void> {
    if (Guard.againstNullOrUndefined(name, "name").isFailure) {
      return formatFail("name is null or undefined");
    }

    this.props.name = name;
    return Result.ok<void>();
  }

  public static create(
    props: CreateBackgroundProps,
    id?: UniqueEntityID,
  ): Result<Background> {
    try {
      const guardResult = Guard.againstNullOrUndefinedBulk([
        { argument: props.name, argumentName: "name" },
      ]);
      if (guardResult.isFailure) {
        return formatFail(guardResult.getError());
      }

      const background = new Background(
        {
          name: props.name ?? "",
          assetId: props.assetId ?? new UniqueEntityID(),
          updatedAt: props.updatedAt ?? new Date(),
        },
        id,
      );

      return Result.ok<Background>(background);
    } catch (error) {
      return formatFail("Failed to create Background", error);
    }
  }
}
