import { describe, expect, it } from "vitest";

import { readFile } from "@/shared/utils/test";

import { Background } from "@/modules/background/domain";

describe("Background", () => {
  describe("setName()", () => {
    it("[B-D-B-001] 배경화면 이름 수정 - 배경화면의 이름을 변경한다.", async () => {
      // Given
      const file = await readFile("test/common/rubber-duck.png");
      const fileBase64 = (await FileBase64.create(file)).getValue();
      const background = Background.create({
        name: "Old Background Name",
        file: fileBase64,
      }).getValue();
      const newName = "New Background Name";

      // When
      const result = background.setName(newName);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(background.name).toBe(newName);
    });
  });
});
