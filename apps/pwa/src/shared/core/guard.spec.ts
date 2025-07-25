import { describe, expect, it } from "vitest";

import { Guard, GuardResponse } from "@/shared/core/guard";
import { Result } from "@/shared/core/result";

describe("guard", () => {
  let result: Result<GuardResponse>;
  const argName = "testArgument";
  const secondaryArgName = "secondaryTestArgument";

  describe("combined results", () => {
    it("knows that two successful results equates to success", () => {
      result = Guard.combine([Result.ok<any>(), Result.ok<any>()]);
      expect(result.isSuccess).toBe(true);
    });

    it("knows that one success, one failure equates to overall failure", () => {
      const failureMessage = "This one failed";
      result = Guard.combine([
        Result.ok<any>(),
        Result.fail<any>(failureMessage),
      ]);
      expect(result.isSuccess).toBeFalsy();
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toEqual(failureMessage);
    });
  });

  describe("against null or undefined", () => {
    it("knows that value provided equates to success", () => {
      result = Guard.againstNullOrUndefined(true, argName);
      expect(result.isSuccess).toBe(true);
    });

    it("knows that null value equates to failure", () => {
      result = Guard.againstNullOrUndefined(null, argName);
      expect(result.isSuccess).toBeFalsy();
      expect(result.getError()).toEqual(`${argName} is null or undefined`);
    });

    it("knows that undefined value equates to failure", () => {
      result = Guard.againstNullOrUndefined(undefined, argName);
      expect(result.isSuccess).toBeFalsy();
      expect(result.getError()).toEqual(`${argName} is null or undefined`);
    });

    it("knows that empty string still equates to success", () => {
      result = Guard.againstNullOrUndefined("", argName);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("against null or undefined bulk", () => {
    it("knows that values provided equates to success", () => {
      result = Guard.againstNullOrUndefinedBulk([
        { argumentName: argName, argument: true },
        { argumentName: secondaryArgName, argument: 12 },
      ]);
      expect(result.isSuccess).toBe(true);
    });

    it("knows that a single null value equates to failure", () => {
      result = Guard.againstNullOrUndefinedBulk([
        { argumentName: argName, argument: null },
        { argumentName: secondaryArgName, argument: 12 },
      ]);

      expect(result.isSuccess).toBeFalsy();
      expect(result.getError()).toEqual(`${argName} is null or undefined`);
    });

    it("knows that a single undefined value equates to failure", () => {
      result = Guard.againstNullOrUndefinedBulk([
        { argumentName: argName, argument: undefined },
        { argumentName: secondaryArgName, argument: 12 },
      ]);

      expect(result.isSuccess).toBeFalsy();
      expect(result.getError()).toEqual(`${argName} is null or undefined`);
    });
  });
});
