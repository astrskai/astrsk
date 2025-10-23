import { Result } from "@/shared/core/result";
import { formatFail } from "@/shared/lib";

export type GuardResponse = string;

export interface GuardArgument {
  argument: any;
  argumentName: string;
}

export type GuardArgumentCollection = GuardArgument[];

export class Guard {
  private constructor() {}

  public static combine(guardResults: Result<any>[]): Result<GuardResponse> {
    for (const result of guardResults) {
      if (result.isFailure) return result;
    }

    return Result.ok<GuardResponse>();
  }

  public static greaterThan(
    minValue: number,
    actualValue: number,
  ): Result<GuardResponse> {
    return actualValue > minValue
      ? Result.ok<GuardResponse>()
      : Result.fail<GuardResponse>(
          `Number given {${actualValue}} is not greater than {${minValue}}`,
        );
  }

  public static againstAtLeast(
    numChars: number,
    text: string,
  ): Result<GuardResponse> {
    return text.length >= numChars
      ? Result.ok<GuardResponse>()
      : Result.fail<GuardResponse>(`Text is not at least ${numChars} chars.`);
  }

  public static againstAtMost(
    numChars: number,
    text: string,
  ): Result<GuardResponse> {
    return text.length <= numChars
      ? Result.ok<GuardResponse>()
      : Result.fail<GuardResponse>(`Text is greater than ${numChars} chars.`);
  }

  public static againstNullOrUndefined(
    argument: any,
    argumentName: string,
  ): Result<GuardResponse> {
    if (argument === null || argument === undefined) {
      return Result.fail<GuardResponse>(`${argumentName} is null or undefined`);
    } else {
      return Result.ok<GuardResponse>();
    }
  }

  public static againstNullOrUndefinedBulk(
    args: GuardArgumentCollection,
  ): Result<GuardResponse> {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(
        arg.argument,
        arg.argumentName,
      );
      if (result.isFailure) return result;
    }

    return Result.ok<GuardResponse>();
  }

  public static hasRequiredProps<T extends object>(
    obj: T,
    requiredProps: (keyof T)[],
  ): Result<GuardResponse> {
    const nullGuard = this.againstNullOrUndefinedBulk(
      requiredProps.map((prop) => ({
        argument: obj[prop],
        argumentName: prop as string,
      })),
    );

    if (nullGuard.isFailure) {
      return formatFail("Missing required properties", nullGuard.getError());
    }

    return Result.ok();
  }

  public static isOneOf(
    value: any,
    validValues: any[],
    argumentName: string,
  ): Result<GuardResponse> {
    let isValid = false;
    for (const validValue of validValues) {
      if (value === validValue) {
        isValid = true;
      }
    }

    if (isValid) {
      return Result.ok<GuardResponse>();
    } else {
      return Result.fail<GuardResponse>(
        `${argumentName} isn't oneOf the correct types in ${JSON.stringify(
          validValues,
        )}. Got "${value}".`,
      );
    }
  }

  public static inRange(
    num: number,
    min: number,
    max: number,
    argumentName: string,
  ): Result<GuardResponse> {
    const isInRange = num >= min && num <= max;
    if (!isInRange) {
      return Result.fail<GuardResponse>(
        `${argumentName} is not within range ${min} to ${max}.`,
      );
    } else {
      return Result.ok<GuardResponse>();
    }
  }

  public static allInRange(
    numbers: number[],
    min: number,
    max: number,
    argumentName: string,
  ): Result<GuardResponse> {
    for (const num of numbers) {
      const numIsInRangeResult = this.inRange(num, min, max, argumentName);
      if (numIsInRangeResult.isFailure) {
        return Result.fail<GuardResponse>(
          `${argumentName} is not within the range.`,
        );
      }
    }

    return Result.ok<GuardResponse>();
  }
}
