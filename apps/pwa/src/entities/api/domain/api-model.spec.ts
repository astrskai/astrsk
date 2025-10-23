import { describe, expect, it } from "vitest";

import { ApiModel } from "@/entities/api/domain/api-model";

describe("ApiModel", () => {
  describe("calculatePrice()", () => {
    describe("[A-D-AM-001] API 모델 요청 비용 계산 - 모델의 입출력 가격과 입출력 토큰으로 비용을 계산해 반환한다.", () => {
      it("모델 입출력 가격 존재: 계산 가능", () => {
        // Given
        const apiModel = ApiModel.create({
          id: "api-model-id-test",
          name: "api-model-name-test",
          inputPricePerToken: 0.000003,
          outputPricePerToken: 0.000015,
        }).getValue();

        // When
        const result = apiModel.calculatePrice(8000, 300);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(0.0285);
      });

      it("모델 입출력 가격 존재하지 않음: 계산 불가능", () => {
        // Given
        const apiModel = ApiModel.create({
          id: "api-model-id-test",
          name: "api-model-name-test",
        }).getValue();

        // When
        const result = apiModel.calculatePrice(8000, 300);

        // Then
        expect(result.isFailure).toBe(true);
      });
    });
  });
});
