import { describe, expect, it } from "vitest";
import { evaluateConditionOperator } from "./session-play-service";

describe("evaluateConditionOperator", () => {
  describe("String Operators", () => {
    describe("string_exists", () => {
      it("should return true when value exists", () => {
        expect(evaluateConditionOperator("string_exists", "hello", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("string_exists", "", null)).toBe(true);
        expect(evaluateConditionOperator("string_exists", "0", null)).toBe(
          true,
        );
      });

      it("should return false when value is null or undefined", () => {
        expect(evaluateConditionOperator("string_exists", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("string_exists", undefined, null),
        ).toBe(false);
      });
    });

    describe("string_not_exists", () => {
      it("should return false when value exists", () => {
        expect(
          evaluateConditionOperator("string_not_exists", "hello", null),
        ).toBe(false);
        expect(evaluateConditionOperator("string_not_exists", "", null)).toBe(
          false,
        );
      });

      it("should return true when value is null or undefined", () => {
        expect(evaluateConditionOperator("string_not_exists", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("string_not_exists", undefined, null),
        ).toBe(true);
      });
    });

    describe("string_is_empty", () => {
      it("should return true for empty values", () => {
        expect(evaluateConditionOperator("string_is_empty", "", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("string_is_empty", "   ", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("string_is_empty", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("string_is_empty", undefined, null),
        ).toBe(true);
      });

      it("should return false for non-empty values", () => {
        expect(
          evaluateConditionOperator("string_is_empty", "hello", null),
        ).toBe(false);
        expect(evaluateConditionOperator("string_is_empty", "0", null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("string_is_empty", " a ", null)).toBe(
          false,
        );
      });
    });

    describe("string_is_not_empty", () => {
      it("should return false for empty values", () => {
        expect(evaluateConditionOperator("string_is_not_empty", "", null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("string_is_not_empty", "   ", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_is_not_empty", null, null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_is_not_empty", undefined, null),
        ).toBe(false);
      });

      it("should return true for non-empty values", () => {
        expect(
          evaluateConditionOperator("string_is_not_empty", "hello", null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_is_not_empty", "0", null),
        ).toBe(true);
      });
    });

    describe("string_equals", () => {
      it("should return true when strings are equal", () => {
        expect(
          evaluateConditionOperator("string_equals", "hello", "hello"),
        ).toBe(true);
        expect(evaluateConditionOperator("string_equals", "", "")).toBe(true);
        expect(evaluateConditionOperator("string_equals", "123", "123")).toBe(
          true,
        );
      });

      it("should return false when strings are not equal", () => {
        expect(
          evaluateConditionOperator("string_equals", "hello", "world"),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_equals", "Hello", "hello"),
        ).toBe(false);
        // Note: number 123 is converted to string '123', so they are equal
        expect(evaluateConditionOperator("string_equals", "123", 123)).toBe(
          true,
        );
      });

      it("should handle null/undefined by converting to empty string", () => {
        expect(evaluateConditionOperator("string_equals", null, "")).toBe(true);
        expect(evaluateConditionOperator("string_equals", undefined, "")).toBe(
          true,
        );
        expect(evaluateConditionOperator("string_equals", null, null)).toBe(
          true,
        );
      });
    });

    describe("string_not_equals", () => {
      it("should return false when strings are equal", () => {
        expect(
          evaluateConditionOperator("string_not_equals", "hello", "hello"),
        ).toBe(false);
        expect(evaluateConditionOperator("string_not_equals", "", "")).toBe(
          false,
        );
      });

      it("should return true when strings are not equal", () => {
        expect(
          evaluateConditionOperator("string_not_equals", "hello", "world"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_not_equals", "Hello", "hello"),
        ).toBe(true);
      });
    });

    describe("string_contains", () => {
      it("should return true when string contains substring", () => {
        expect(
          evaluateConditionOperator("string_contains", "hello world", "world"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_contains", "hello world", "hello"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_contains", "hello world", "o w"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_contains", "hello world", ""),
        ).toBe(true);
      });

      it("should return false when string does not contain substring", () => {
        expect(
          evaluateConditionOperator("string_contains", "hello world", "xyz"),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_contains", "hello", "HELLO"),
        ).toBe(false);
      });
    });

    describe("string_not_contains", () => {
      it("should return false when string contains substring", () => {
        expect(
          evaluateConditionOperator(
            "string_not_contains",
            "hello world",
            "world",
          ),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_not_contains", "hello world", ""),
        ).toBe(false);
      });

      it("should return true when string does not contain substring", () => {
        expect(
          evaluateConditionOperator(
            "string_not_contains",
            "hello world",
            "xyz",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_not_contains", "hello", "HELLO"),
        ).toBe(true);
      });
    });

    describe("string_starts_with", () => {
      it("should return true when string starts with prefix", () => {
        expect(
          evaluateConditionOperator(
            "string_starts_with",
            "hello world",
            "hello",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_starts_with", "hello world", "h"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_starts_with", "hello world", ""),
        ).toBe(true);
      });

      it("should return false when string does not start with prefix", () => {
        expect(
          evaluateConditionOperator(
            "string_starts_with",
            "hello world",
            "world",
          ),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_starts_with", "hello", "Hello"),
        ).toBe(false);
      });
    });

    describe("string_not_starts_with", () => {
      it("should return false when string starts with prefix", () => {
        expect(
          evaluateConditionOperator(
            "string_not_starts_with",
            "hello world",
            "hello",
          ),
        ).toBe(false);
        expect(
          evaluateConditionOperator(
            "string_not_starts_with",
            "hello world",
            "",
          ),
        ).toBe(false);
      });

      it("should return true when string does not start with prefix", () => {
        expect(
          evaluateConditionOperator(
            "string_not_starts_with",
            "hello world",
            "world",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_not_starts_with", "hello", "Hello"),
        ).toBe(true);
      });
    });

    describe("string_ends_with", () => {
      it("should return true when string ends with suffix", () => {
        expect(
          evaluateConditionOperator("string_ends_with", "hello world", "world"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_ends_with", "hello world", "d"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_ends_with", "hello world", ""),
        ).toBe(true);
      });

      it("should return false when string does not end with suffix", () => {
        expect(
          evaluateConditionOperator("string_ends_with", "hello world", "hello"),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_ends_with", "world", "World"),
        ).toBe(false);
      });
    });

    describe("string_not_ends_with", () => {
      it("should return false when string ends with suffix", () => {
        expect(
          evaluateConditionOperator(
            "string_not_ends_with",
            "hello world",
            "world",
          ),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_not_ends_with", "hello world", ""),
        ).toBe(false);
      });

      it("should return true when string does not end with suffix", () => {
        expect(
          evaluateConditionOperator(
            "string_not_ends_with",
            "hello world",
            "hello",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_not_ends_with", "world", "World"),
        ).toBe(true);
      });
    });

    describe("string_matches_regex", () => {
      it("should return true when string matches regex", () => {
        expect(
          evaluateConditionOperator(
            "string_matches_regex",
            "hello123",
            "^hello\\d+",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator(
            "string_matches_regex",
            "test@email.com",
            "\\w+@\\w+\\.\\w+",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_matches_regex", "123", "\\d+"),
        ).toBe(true);
      });

      it("should return false when string does not match regex", () => {
        expect(
          evaluateConditionOperator("string_matches_regex", "hello", "^\\d+"),
        ).toBe(false);
        expect(
          evaluateConditionOperator(
            "string_matches_regex",
            "test",
            "\\w+@\\w+\\.\\w+",
          ),
        ).toBe(false);
      });

      it("should return false for invalid regex patterns", () => {
        expect(
          evaluateConditionOperator("string_matches_regex", "hello", "["),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_matches_regex", "hello", "(("),
        ).toBe(false);
      });
    });

    describe("string_not_matches_regex", () => {
      it("should return false when string matches regex", () => {
        expect(
          evaluateConditionOperator(
            "string_not_matches_regex",
            "hello123",
            "^hello\\d+",
          ),
        ).toBe(false);
        expect(
          evaluateConditionOperator("string_not_matches_regex", "123", "\\d+"),
        ).toBe(false);
      });

      it("should return true when string does not match regex", () => {
        expect(
          evaluateConditionOperator(
            "string_not_matches_regex",
            "hello",
            "^\\d+",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator(
            "string_not_matches_regex",
            "test",
            "\\w+@\\w+\\.\\w+",
          ),
        ).toBe(true);
      });

      it("should return true for invalid regex patterns", () => {
        expect(
          evaluateConditionOperator("string_not_matches_regex", "hello", "["),
        ).toBe(true);
        expect(
          evaluateConditionOperator("string_not_matches_regex", "hello", "(("),
        ).toBe(true);
      });
    });
  });

  describe("Number Operators", () => {
    describe("number_exists", () => {
      it("should return true when value exists", () => {
        expect(evaluateConditionOperator("number_exists", 123, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_exists", 0, null)).toBe(true);
        expect(evaluateConditionOperator("number_exists", -123, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_exists", 3.14, null)).toBe(
          true,
        );
      });

      it("should return false when value is null or undefined", () => {
        expect(evaluateConditionOperator("number_exists", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("number_exists", undefined, null),
        ).toBe(false);
      });
    });

    describe("number_not_exists", () => {
      it("should return false when value exists", () => {
        expect(evaluateConditionOperator("number_not_exists", 123, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_not_exists", 0, null)).toBe(
          false,
        );
      });

      it("should return true when value is null or undefined", () => {
        expect(evaluateConditionOperator("number_not_exists", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_not_exists", undefined, null),
        ).toBe(true);
      });
    });

    describe("number_is_empty", () => {
      it("should return true for empty values", () => {
        expect(evaluateConditionOperator("number_is_empty", "", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_is_empty", "   ", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_is_empty", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_is_empty", undefined, null),
        ).toBe(true);
      });

      it("should return false for numeric values", () => {
        expect(evaluateConditionOperator("number_is_empty", 0, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_is_empty", 123, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_is_empty", "123", null)).toBe(
          false,
        );
      });
    });

    describe("number_is_not_empty", () => {
      it("should return false for empty values", () => {
        expect(evaluateConditionOperator("number_is_not_empty", "", null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("number_is_not_empty", "   ", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("number_is_not_empty", null, null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("number_is_not_empty", undefined, null),
        ).toBe(false);
      });

      it("should return true for numeric values", () => {
        expect(evaluateConditionOperator("number_is_not_empty", 0, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_is_not_empty", 123, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_is_not_empty", "123", null),
        ).toBe(true);
      });
    });

    describe("number_equals", () => {
      it("should return true when numbers are equal", () => {
        expect(evaluateConditionOperator("number_equals", 123, 123)).toBe(true);
        expect(evaluateConditionOperator("number_equals", "123", "123")).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_equals", 0, 0)).toBe(true);
        expect(evaluateConditionOperator("number_equals", -5.5, -5.5)).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_equals", "3.14", 3.14)).toBe(
          true,
        );
      });

      it("should return false when numbers are not equal", () => {
        expect(evaluateConditionOperator("number_equals", 123, 456)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_equals", "123", "456")).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_equals", 0, 1)).toBe(false);
      });

      it("should return false for non-numeric values", () => {
        expect(evaluateConditionOperator("number_equals", "abc", 123)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_equals", "abc", "abc")).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_equals", NaN, NaN)).toBe(
          false,
        );
      });
    });

    describe("number_not_equals", () => {
      it("should return false when numbers are equal", () => {
        expect(evaluateConditionOperator("number_not_equals", 123, 123)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("number_not_equals", "123", "123"),
        ).toBe(false);
        expect(evaluateConditionOperator("number_not_equals", 0, 0)).toBe(
          false,
        );
      });

      it("should return true when numbers are not equal", () => {
        expect(evaluateConditionOperator("number_not_equals", 123, 456)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_not_equals", "123", "456"),
        ).toBe(true);
        expect(evaluateConditionOperator("number_not_equals", 0, 1)).toBe(true);
      });
    });

    describe("number_greater_than", () => {
      it("should return true when first number is greater", () => {
        expect(evaluateConditionOperator("number_greater_than", 10, 5)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_greater_than", "10", "5"),
        ).toBe(true);
        expect(evaluateConditionOperator("number_greater_than", 0, -1)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("number_greater_than", 3.14, 3.13),
        ).toBe(true);
      });

      it("should return false when first number is not greater", () => {
        expect(evaluateConditionOperator("number_greater_than", 5, 10)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_greater_than", 5, 5)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_greater_than", -1, 0)).toBe(
          false,
        );
      });
    });

    describe("number_less_than", () => {
      it("should return true when first number is less", () => {
        expect(evaluateConditionOperator("number_less_than", 5, 10)).toBe(true);
        expect(evaluateConditionOperator("number_less_than", "5", "10")).toBe(
          true,
        );
        expect(evaluateConditionOperator("number_less_than", -1, 0)).toBe(true);
        expect(evaluateConditionOperator("number_less_than", 3.13, 3.14)).toBe(
          true,
        );
      });

      it("should return false when first number is not less", () => {
        expect(evaluateConditionOperator("number_less_than", 10, 5)).toBe(
          false,
        );
        expect(evaluateConditionOperator("number_less_than", 5, 5)).toBe(false);
        expect(evaluateConditionOperator("number_less_than", 0, -1)).toBe(
          false,
        );
      });
    });

    describe("number_greater_than_or_equals", () => {
      it("should return true when first number is greater or equal", () => {
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", 10, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", 5, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", "10", "5"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", 0, -1),
        ).toBe(true);
      });

      it("should return false when first number is less", () => {
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", 5, 10),
        ).toBe(false);
        expect(
          evaluateConditionOperator("number_greater_than_or_equals", -1, 0),
        ).toBe(false);
      });
    });

    describe("number_less_than_or_equals", () => {
      it("should return true when first number is less or equal", () => {
        expect(
          evaluateConditionOperator("number_less_than_or_equals", 5, 10),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_less_than_or_equals", 5, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_less_than_or_equals", "5", "10"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("number_less_than_or_equals", -1, 0),
        ).toBe(true);
      });

      it("should return false when first number is greater", () => {
        expect(
          evaluateConditionOperator("number_less_than_or_equals", 10, 5),
        ).toBe(false);
        expect(
          evaluateConditionOperator("number_less_than_or_equals", 0, -1),
        ).toBe(false);
      });
    });
  });

  describe("Integer Operators", () => {
    describe("integer_exists", () => {
      it("should return true when value exists", () => {
        expect(evaluateConditionOperator("integer_exists", 123, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_exists", 0, null)).toBe(true);
        expect(evaluateConditionOperator("integer_exists", -123, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_exists", "456", null)).toBe(
          true,
        );
      });

      it("should return false when value is null or undefined", () => {
        expect(evaluateConditionOperator("integer_exists", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("integer_exists", undefined, null),
        ).toBe(false);
      });
    });

    describe("integer_not_exists", () => {
      it("should return false when value exists", () => {
        expect(evaluateConditionOperator("integer_not_exists", 123, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_not_exists", 0, null)).toBe(
          false,
        );
      });

      it("should return true when value is null or undefined", () => {
        expect(
          evaluateConditionOperator("integer_not_exists", null, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_not_exists", undefined, null),
        ).toBe(true);
      });
    });

    describe("integer_is_empty", () => {
      it("should return true for empty values", () => {
        expect(evaluateConditionOperator("integer_is_empty", "", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_is_empty", "   ", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_is_empty", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("integer_is_empty", undefined, null),
        ).toBe(true);
      });

      it("should return false for integer values", () => {
        expect(evaluateConditionOperator("integer_is_empty", 0, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_is_empty", 123, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_is_empty", "123", null)).toBe(
          false,
        );
      });
    });

    describe("integer_is_not_empty", () => {
      it("should return false for empty values", () => {
        expect(
          evaluateConditionOperator("integer_is_not_empty", "", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_is_not_empty", "   ", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_is_not_empty", null, null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_is_not_empty", undefined, null),
        ).toBe(false);
      });

      it("should return true for integer values", () => {
        expect(evaluateConditionOperator("integer_is_not_empty", 0, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("integer_is_not_empty", 123, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_is_not_empty", "123", null),
        ).toBe(true);
      });
    });

    describe("integer_equals", () => {
      it("should return true when integers are equal", () => {
        expect(evaluateConditionOperator("integer_equals", 123, 123)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_equals", "123", "123")).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_equals", 0, 0)).toBe(true);
        expect(evaluateConditionOperator("integer_equals", -5, -5)).toBe(true);
      });

      it("should truncate decimals and compare", () => {
        expect(evaluateConditionOperator("integer_equals", 3.14, 3)).toBe(true);
        expect(
          evaluateConditionOperator("integer_equals", "3.99", "3.01"),
        ).toBe(true);
        expect(evaluateConditionOperator("integer_equals", 5.9, 5.1)).toBe(
          true,
        );
      });

      it("should return false when integers are not equal", () => {
        expect(evaluateConditionOperator("integer_equals", 123, 456)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_equals", "123", "456")).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_equals", 0, 1)).toBe(false);
      });

      it("should return false for non-numeric values", () => {
        expect(evaluateConditionOperator("integer_equals", "abc", 123)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_equals", "abc", "abc")).toBe(
          false,
        );
      });
    });

    describe("integer_not_equals", () => {
      it("should return false when integers are equal", () => {
        expect(evaluateConditionOperator("integer_not_equals", 123, 123)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("integer_not_equals", "123", "123"),
        ).toBe(false);
        expect(evaluateConditionOperator("integer_not_equals", 0, 0)).toBe(
          false,
        );
      });

      it("should return false when truncated values are equal", () => {
        expect(evaluateConditionOperator("integer_not_equals", 3.14, 3)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("integer_not_equals", "3.99", "3.01"),
        ).toBe(false);
      });

      it("should return true when integers are not equal", () => {
        expect(evaluateConditionOperator("integer_not_equals", 123, 456)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("integer_not_equals", "123", "456"),
        ).toBe(true);
        expect(evaluateConditionOperator("integer_not_equals", 0, 1)).toBe(
          true,
        );
      });
    });

    describe("integer_greater_than", () => {
      it("should return true when first integer is greater", () => {
        expect(evaluateConditionOperator("integer_greater_than", 10, 5)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("integer_greater_than", "10", "5"),
        ).toBe(true);
        expect(evaluateConditionOperator("integer_greater_than", 0, -1)).toBe(
          true,
        );
      });

      it("should truncate decimals before comparison", () => {
        expect(
          evaluateConditionOperator("integer_greater_than", 5.9, 5.1),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_greater_than", 6.1, 5.9),
        ).toBe(true);
      });

      it("should return false when first integer is not greater", () => {
        expect(evaluateConditionOperator("integer_greater_than", 5, 10)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_greater_than", 5, 5)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_greater_than", -1, 0)).toBe(
          false,
        );
      });
    });

    describe("integer_less_than", () => {
      it("should return true when first integer is less", () => {
        expect(evaluateConditionOperator("integer_less_than", 5, 10)).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_less_than", "5", "10")).toBe(
          true,
        );
        expect(evaluateConditionOperator("integer_less_than", -1, 0)).toBe(
          true,
        );
      });

      it("should truncate decimals before comparison", () => {
        expect(evaluateConditionOperator("integer_less_than", 5.1, 5.9)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_less_than", 5.9, 6.1)).toBe(
          true,
        );
      });

      it("should return false when first integer is not less", () => {
        expect(evaluateConditionOperator("integer_less_than", 10, 5)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_less_than", 5, 5)).toBe(
          false,
        );
        expect(evaluateConditionOperator("integer_less_than", 0, -1)).toBe(
          false,
        );
      });
    });

    describe("integer_greater_than_or_equals", () => {
      it("should return true when first integer is greater or equal", () => {
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 10, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 5, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator(
            "integer_greater_than_or_equals",
            "10",
            "5",
          ),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 0, -1),
        ).toBe(true);
      });

      it("should truncate decimals before comparison", () => {
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 5.9, 5.1),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 5.1, 5.9),
        ).toBe(true);
      });

      it("should return false when first integer is less", () => {
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", 5, 10),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_greater_than_or_equals", -1, 0),
        ).toBe(false);
      });
    });

    describe("integer_less_than_or_equals", () => {
      it("should return true when first integer is less or equal", () => {
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 5, 10),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 5, 5),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", "5", "10"),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", -1, 0),
        ).toBe(true);
      });

      it("should truncate decimals before comparison", () => {
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 5.1, 5.9),
        ).toBe(true);
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 5.9, 5.1),
        ).toBe(true);
      });

      it("should return false when first integer is greater", () => {
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 10, 5),
        ).toBe(false);
        expect(
          evaluateConditionOperator("integer_less_than_or_equals", 0, -1),
        ).toBe(false);
      });
    });
  });

  describe("Boolean Operators", () => {
    describe("boolean_exists", () => {
      it("should return true when value exists", () => {
        expect(evaluateConditionOperator("boolean_exists", true, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_exists", false, null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_exists", "true", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_exists", 0, null)).toBe(true);
      });

      it("should return false when value is null or undefined", () => {
        expect(evaluateConditionOperator("boolean_exists", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_exists", undefined, null),
        ).toBe(false);
      });
    });

    describe("boolean_not_exists", () => {
      it("should return false when value exists", () => {
        expect(
          evaluateConditionOperator("boolean_not_exists", true, null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_not_exists", false, null),
        ).toBe(false);
      });

      it("should return true when value is null or undefined", () => {
        expect(
          evaluateConditionOperator("boolean_not_exists", null, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("boolean_not_exists", undefined, null),
        ).toBe(true);
      });
    });

    describe("boolean_is_empty", () => {
      it("should return true for empty values", () => {
        expect(evaluateConditionOperator("boolean_is_empty", "", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_is_empty", "   ", null)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_is_empty", null, null)).toBe(
          true,
        );
        expect(
          evaluateConditionOperator("boolean_is_empty", undefined, null),
        ).toBe(true);
      });

      it("should return false for boolean values", () => {
        expect(evaluateConditionOperator("boolean_is_empty", true, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_is_empty", false, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_is_empty", "true", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_is_empty", "false", null),
        ).toBe(false);
      });
    });

    describe("boolean_is_not_empty", () => {
      it("should return false for empty values", () => {
        expect(
          evaluateConditionOperator("boolean_is_not_empty", "", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_is_not_empty", "   ", null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_is_not_empty", null, null),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_is_not_empty", undefined, null),
        ).toBe(false);
      });

      it("should return true for boolean values", () => {
        expect(
          evaluateConditionOperator("boolean_is_not_empty", true, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("boolean_is_not_empty", false, null),
        ).toBe(true);
        expect(
          evaluateConditionOperator("boolean_is_not_empty", "true", null),
        ).toBe(true);
      });
    });

    describe("boolean_is_true", () => {
      it("should return true only for true boolean", () => {
        expect(evaluateConditionOperator("boolean_is_true", true, null)).toBe(
          true,
        );
      });

      it("should return false for all other values", () => {
        expect(evaluateConditionOperator("boolean_is_true", false, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_is_true", "true", null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_is_true", 1, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_is_true", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_is_true", undefined, null),
        ).toBe(false);
      });
    });

    describe("boolean_is_false", () => {
      it("should return true only for false boolean", () => {
        expect(evaluateConditionOperator("boolean_is_false", false, null)).toBe(
          true,
        );
      });

      it("should return false for all other values", () => {
        expect(evaluateConditionOperator("boolean_is_false", true, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_is_false", "false", null),
        ).toBe(false);
        expect(evaluateConditionOperator("boolean_is_false", 0, null)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_is_false", null, null)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_is_false", undefined, null),
        ).toBe(false);
      });
    });

    describe("boolean_equals", () => {
      it("should compare boolean values", () => {
        expect(evaluateConditionOperator("boolean_equals", true, true)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_equals", false, false)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_equals", true, false)).toBe(
          false,
        );
        expect(evaluateConditionOperator("boolean_equals", false, true)).toBe(
          false,
        );
      });

      it("should convert truthy/falsy values", () => {
        expect(evaluateConditionOperator("boolean_equals", 1, true)).toBe(true);
        // 0 is falsy, false is falsy, so Boolean(0) === Boolean(false) is true
        expect(evaluateConditionOperator("boolean_equals", 0, false)).toBe(
          true,
        );
        expect(evaluateConditionOperator("boolean_equals", "text", true)).toBe(
          true,
        );
        // '' is falsy, false is falsy, so Boolean('') === Boolean(false) is true
        expect(evaluateConditionOperator("boolean_equals", "", false)).toBe(
          true,
        );
        // null is falsy, false is falsy, so Boolean(null) === Boolean(false) is true
        expect(evaluateConditionOperator("boolean_equals", null, false)).toBe(
          true,
        );
      });
    });

    describe("boolean_not_equals", () => {
      it("should compare boolean values", () => {
        expect(
          evaluateConditionOperator("boolean_not_equals", true, true),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_not_equals", false, false),
        ).toBe(false);
        expect(
          evaluateConditionOperator("boolean_not_equals", true, false),
        ).toBe(true);
        expect(
          evaluateConditionOperator("boolean_not_equals", false, true),
        ).toBe(true);
      });

      it("should convert truthy/falsy values", () => {
        expect(evaluateConditionOperator("boolean_not_equals", 1, true)).toBe(
          false,
        );
        // 0 is falsy, false is falsy, so Boolean(0) !== Boolean(false) is false
        expect(evaluateConditionOperator("boolean_not_equals", 0, false)).toBe(
          false,
        );
        expect(
          evaluateConditionOperator("boolean_not_equals", "text", true),
        ).toBe(false);
        // '' is falsy, false is falsy, so Boolean('') !== Boolean(false) is false
        expect(evaluateConditionOperator("boolean_not_equals", "", false)).toBe(
          false,
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should return false for unknown operators", () => {
      expect(
        evaluateConditionOperator(
          "unknown_operator" as any,
          "value1",
          "value2",
        ),
      ).toBe(false);
      expect(evaluateConditionOperator("invalid" as any, 123, 456)).toBe(false);
    });

    it("should handle mixed types appropriately", () => {
      expect(evaluateConditionOperator("string_equals", 123, "123")).toBe(true);
      expect(evaluateConditionOperator("number_equals", "42", 42)).toBe(true);
      expect(evaluateConditionOperator("integer_equals", "10.5", 10.7)).toBe(
        true,
      );
    });

    it("should handle special numeric values", () => {
      expect(
        evaluateConditionOperator("number_equals", Infinity, Infinity),
      ).toBe(true);
      expect(
        evaluateConditionOperator("number_equals", -Infinity, -Infinity),
      ).toBe(true);
      expect(
        evaluateConditionOperator("number_greater_than", Infinity, 1000000),
      ).toBe(true);
      expect(
        evaluateConditionOperator("number_less_than", -Infinity, -1000000),
      ).toBe(true);
    });
  });
});
