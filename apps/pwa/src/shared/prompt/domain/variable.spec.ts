import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Variable, VariableLibrary } from "@/shared/prompt/domain";

describe("VariableLibrary", () => {
  beforeEach(() => {
    VariableLibrary.setVariableList([
      {
        variable: "char",
        description: "Name of main character.",
        dataType: "string",
      },
      {
        variable: "user",
        description: "Name of user character.",
        dataType: "string",
      },
      {
        variable: "description",
        description: "Description of main character.",
        dataType: "string",
      },
    ]);
  });

  afterEach(() => {
    VariableLibrary.initialize();
  });

  describe("searchVariables()", () => {
    it("[SP-D-VL-002] 배리어블 검색 - 배리어블 목록에서 검색어를 포함하는 배리어블을 찾아 반환한다.", () => {
      // Given
      const macroList: Variable[] = [
        {
          variable: "char",
          description: "Name of main character.",
          dataType: "string",
        },
        {
          variable: "user",
          description: "Name of user character.",
          dataType: "string",
        },
        {
          variable: "description",
          description: "Description of main character.",
          dataType: "string",
        },
      ];

      // When
      const result = VariableLibrary.searchVariables("user");

      // Then
      expect(result.isSuccess).toBe(true);
      const macros = result.getValue();
      expect(macros).toHaveLength(1);
      expect(macros[0].variable).toBe("user");
      expect(macros[0].description).toBe("Name of user character.");
      expect(macros[0].dataType).toBe("string");
      expect(macros[0].link).toBeUndefined();
    });
  });
});
