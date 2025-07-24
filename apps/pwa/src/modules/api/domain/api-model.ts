import { Guard, Result } from "@/shared/core";
import { ValueObject } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

export interface ApiModelProps {
  id: string;
  name: string;
  inputPricePerToken?: number;
  outputPricePerToken?: number;
}

export class ApiModel extends ValueObject<ApiModelProps> {
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get inputPricePerToken(): number | undefined {
    return this.props.inputPricePerToken;
  }

  get outputPricePerToken(): number | undefined {
    return this.props.outputPricePerToken;
  }

  public static create(props: ApiModelProps): Result<ApiModel> {
    const nullGuard = Guard.againstNullOrUndefinedBulk([
      { argument: props.id, argumentName: "id" },
      { argument: props.name, argumentName: "name" },
    ]);
    if (nullGuard.isFailure) {
      return formatFail("Failed to create API model", nullGuard.getError());
    }

    return Result.ok(new ApiModel(props));
  }

  public calculatePrice(
    inputTokens: number,
    outputTokens: number,
  ): Result<number> {
    if (
      typeof this.inputPricePerToken === "undefined" ||
      typeof this.outputPricePerToken === "undefined"
    ) {
      return formatFail("Cannot calculate without price");
    }

    const price =
      inputTokens * this.inputPricePerToken +
      outputTokens * this.outputPricePerToken;
    return Result.ok(price);
  }
}
