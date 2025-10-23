import { formatError } from "@/shared/lib";

export interface ResultJson<T> {
  isSuccess: boolean;
  isFailure: boolean;
  error?: string;
  value?: T;
}

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  private _error?: string;
  private _value?: T;

  public constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && typeof error !== "undefined") {
      throw formatError(
        "InvalidOperation: A result cannot be successful and contain an error",
      );
    }
    if (!isSuccess && typeof error === "undefined") {
      throw formatError(
        "InvalidOperation: A failing result needs to contain an error message",
      );
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      console.log(this._error);
      throw formatError(
        "Can't get the value of an error result. Use 'getError()' instead.",
      );
    }
    if (typeof this._value === "undefined") {
      throw formatError("IllegalState: A successful result without a value");
    }

    return this._value;
  }

  public getError(): string {
    if (this.isSuccess) {
      console.log(this._error);
      throw formatError(
        "Can't get the error of a successful result. Use 'getValue()' instead.",
      );
    }
    if (typeof this._error === "undefined") {
      throw formatError("IllegalState: A error result without an error");
    }

    return this._error;
  }

  public throwOnFailure(): Result<T> {
    if (this.isFailure) {
      const error = new Error(this._error);
      Error.captureStackTrace(error, this.throwOnFailure);
      throw error;
    }
    return this;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) {
        return result;
      }
    }
    return Result.ok();
  }
}
