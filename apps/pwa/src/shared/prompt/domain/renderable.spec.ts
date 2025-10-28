import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UniqueEntityID } from "@/shared/domain";
import {
  HistoryBlock,
  HistoryRole,
  MessageRole,
  PlainBlock,
  Renderable,
  ToggleBlock,
  ToggleType,
} from "@/shared/prompt/domain";
import { OpenAITokenizer } from "@/shared/lib";

const toggleBlockId = new UniqueEntityID();
describe.each([
  {
    name: "PlainBlock",
    targetFactory: (props: any) => PlainBlock.create(props).getValue(),
  },
  {
    name: "HistoryBlock",
    targetFactory: (props: any) =>
      HistoryBlock.create({
        ...props,
        historyRole: HistoryRole.Message,
      }).getValue(),
  },
  {
    name: "ToggleBlock",
    targetFactory: (props: any) =>
      ToggleBlock.create(
        {
          ...props,
          toggleType: ToggleType.Single,
        },
        toggleBlockId,
      ).getValue(),
  },
])(
  "Renderable - $name",
  ({ targetFactory }: { targetFactory: (props: any) => Renderable }) => {
    const dummyForTest = {
      history: [
        {
          name: "test",
          role: MessageRole.System,
          content: "dummy message for test history block",
        },
      ],
      toggle: {
        enabled: new Map([[toggleBlockId.toString(), true]]),
        values: new Map(),
      },
    };

    describe("[SP-D-R-001] 프롬프트 블록 렌더링 - 프롬프트 블록의 템플릿과 매크로를 조합해 프롬프트를 렌더링한다.", () => {
      const context = {
        ...dummyForTest,
        char: "John",
        description: "cool guy",
      };

      it("renderMessages()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "{{char}} is {{description}}.",
        });

        // When
        const result = target.renderMessages(context);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
          {
            role: MessageRole.System,
            content: "John is cool guy.",
          },
        ]);
      });

      it("renderPrompt()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "{{char}} is {{description}}.",
        });

        // When
        const result = target.renderPrompt(context);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual("John is cool guy.");
      });
    });

    describe("[SP-D-R-002] 프롬프트 블록 불필요한 토큰 제거하기 - 프롬프트 블록 렌더링 결과에서 앞뒤로 있는 공백문자와 반복되는 개행문자(\n)를 제거한다.", () => {
      const context = {
        ...dummyForTest,
        char: "John",
        description: "cool guy",
      };

      it("renderMessages()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "       {{char}}\n is \n\n\n{{description}}.      ",
          isDeleteUnnecessaryCharacters: true,
        });

        // When
        const result = target.renderMessages(context);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
          {
            role: MessageRole.System,
            content: "John\n is \ncool guy.",
          },
        ]);
      });

      it("renderPrompt()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "       {{char}}\n is \n\n\n{{description}}.      ",
          isDeleteUnnecessaryCharacters: true,
        });

        // When
        const result = target.renderPrompt(context);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual("John\n is \ncool guy.");
      });
    });

    describe("시간 관련 기능: FakeTimers 사용", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      describe("[SP-D-R-003] 매크로 now - 현재 시각을 ISO 포맷으로 반환한다.", () => {
        const context = {
          ...dummyForTest,
        };

        beforeEach(() => {
          const fakeNow = new Date("2024-09-12T21:14:15.000Z");
          vi.setSystemTime(fakeNow);
        });

        it("renderMessages()", () => {
          // Given
          const target = targetFactory({
            name: "test",
            role: MessageRole.System,
            template: "It's {{now}}",
            isDeleteUnnecessaryCharacters: true,
          });

          // When
          const result = target.renderMessages(context);

          // Then
          expect(result.isSuccess).toBe(true);
          expect(result.getValue()).toEqual([
            {
              role: MessageRole.System,
              content: "It's 2024-09-12T21:14:15.000Z",
            },
          ]);
        });

        it("renderPrompt()", () => {
          // Given
          const target = targetFactory({
            name: "test",
            role: MessageRole.System,
            template: "It's {{now}}",
            isDeleteUnnecessaryCharacters: true,
          });

          // When
          const result = target.renderPrompt(context);

          // Then
          expect(result.isSuccess).toBe(true);
          expect(result.getValue()).toEqual("It's 2024-09-12T21:14:15.000Z");
        });
      });

      describe("[SP-D-R-004] 필터 date_from - 비교 시각부터 입력 시각까지 시간을 상대적인 표현으로 반환한다.", () => {
        const context = {
          ...dummyForTest,
        };

        describe("비교 시각 2000-01-01, 입력 시각: 1999-01-01, 접미사 있음: a year ago", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from('2000-01-01')}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "a year ago",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from('2000-01-01')}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("a year ago");
          });
        });

        describe("비교 시각 2000-01-01, 입력 시각: 1999-01-01, 접미사 없음: a year", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from('2000-01-01', true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "a year",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from('2000-01-01', true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("a year");
          });
        });
      });

      describe("[SP-D-R-005] 필터 date_from_now - 현재 시각부터 입력 시각까지 시간을 상대적인 표현으로 반환한다.", () => {
        const context = {
          ...dummyForTest,
        };

        beforeEach(() => {
          const fakeNow = new Date("2009-01-01");
          vi.setSystemTime(fakeNow);
        });

        describe("현재 시각: 2009-01-01, 입력 시각 1999-01-01, 접미사 있음: 10 years ago", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from_now}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "10 years ago",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from_now}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("10 years ago");
          });
        });

        describe("현재 시각: 2009-01-01, 입력 시각 1999-01-01, 접미사 없음: 10 years", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from_now(true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "10 years",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_from_now(true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("10 years");
          });
        });
      });

      describe("[SP-D-R-006] 필터 date_to - 입력 시각부터 비교 시각까지 시간을 상대적인 표현으로 반환한다.", () => {
        const context = {
          ...dummyForTest,
        };

        describe("입력 시각: 1999-01-01, 비교 시각 2000-01-01, 접미사 있음: in a year", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to('2000-01-01')}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "in a year",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to('2000-01-01')}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("in a year");
          });
        });

        describe("입력 시각: 1999-01-01, 비교 시각 2000-01-01, 접미사 없음: a year", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to('2000-01-01', true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "a year",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to('2000-01-01', true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("a year");
          });
        });
      });

      describe("[SP-D-R-007] 필터 date_to_now - 입력 시각부터 현재 시각까지 시간을 상대적인 표현으로 반환한다.", () => {
        const context = {
          ...dummyForTest,
        };

        beforeEach(() => {
          const fakeNow = new Date("2009-01-01");
          vi.setSystemTime(fakeNow);
        });

        describe("입력 시각 1999-01-01, 현재 시각: 2009-01-01, 접미사 있음: in 10 years", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to_now}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "in 10 years",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to_now}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("in 10 years");
          });
        });

        describe("입력 시각 1999-01-01, 현재 시각: 2009-01-01, 접미사 없음: 10 years", () => {
          it("renderMessages()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to_now(true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderMessages(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([
              {
                role: MessageRole.System,
                content: "10 years",
              },
            ]);
          });

          it("renderPrompt()", () => {
            // Given
            const target = targetFactory({
              name: "test",
              role: MessageRole.System,
              template: "{{'1999-01-01' | date_to_now(true)}}",
              isDeleteUnnecessaryCharacters: true,
            });

            // When
            const result = target.renderPrompt(context);

            // Then
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual("10 years");
          });
        });
      });
    });

    describe("[SP-D-R-008] 필터 random - 입력한 값을 랜덤하게 반환한다.", () => {
      const context = {
        ...dummyForTest,
      };

      const trials = 200; // 200회 시행
      const expected = trials * 0.25; // 25% 기대 비율
      const error = expected * 0.15; // 15% 오차 범위
      const retry = 5; // 최대 5회 재시도

      it("renderMessages()", { retry }, () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.Assistant,
          template: `Do you like {{ ["apple", "banana", "kiwi", "orange"] | random }}?`,
        });

        // When
        let count = 0;
        for (let i = 0; i < trials; i++) {
          const result = target.renderMessages(context);
          const content = result.getValue()[0].content;
          if (content === "Do you like apple?") {
            count++;
          }
        }

        // Then
        expect(count).toBeGreaterThanOrEqual(expected - error);
        expect(count).toBeLessThanOrEqual(expected + error);
      });

      it("renderPrompt()", { retry }, () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.Assistant,
          template: `Do you like {{ ["apple", "banana", "kiwi", "orange"] | random }}?`,
        });

        // When
        let count = 0;
        for (let i = 0; i < trials; i++) {
          const result = target.renderPrompt(context);
          const content = result.getValue();
          if (content === "Do you like apple?") {
            count++;
          }
        }

        // Then
        expect(count).toBeGreaterThanOrEqual(expected - error);
        expect(count).toBeLessThanOrEqual(expected + error);
      });
    });

    describe("[SP-D-R-009] 필터 roll - 입력한 D&D 주사위 표현식에 따라 주사위를 굴려 값을 반환한다.", () => {
      const context = {
        ...dummyForTest,
      };

      const trials = 200; // 200회 시행
      const expected = trials * 0.25; // 25% 기대 비율
      const error = expected * 0.15; // 15% 오차 범위
      const retry = 5; // 최대 5회 재시도

      it("renderMessages()", { retry }, () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: `The result of rolling the dice is {{ "2d4" | roll }}.`,
        });

        // When
        let count = 0;
        for (let i = 0; i < trials; i++) {
          const result = target.renderMessages(context);
          const content = result.getValue()[0].content;
          if (content === "The result of rolling the dice is 5.") {
            count++;
          }
        }

        // Then
        expect(count).toBeGreaterThanOrEqual(expected - error);
        expect(count).toBeLessThanOrEqual(expected + error);
      });

      it("renderPrompt()", { retry }, () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: `The result of rolling the dice is {{ "2d4" | roll }}.`,
        });

        // When
        let count = 0;
        for (let i = 0; i < trials; i++) {
          const result = target.renderPrompt(context);
          const content = result.getValue();
          if (content === "The result of rolling the dice is 5.") {
            count++;
          }
        }

        // Then
        expect(count).toBeGreaterThanOrEqual(expected - error);
        expect(count).toBeLessThanOrEqual(expected + error);
      });
    });

    describe.skip("[SP-D-R-010] 필터 token_size - 입력한 문자열을 토크나이징해서 토큰 사이즈 반환한다.", () => {
      const context = {
        ...dummyForTest,
      };

      it("renderMessages()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "It's {{ someString | token_size }} tokens.",
        });

        // When
        const result = target.renderMessages({
          ...context,
          someString: "hello world",
          tokenizer: new OpenAITokenizer(),
        });

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
          {
            role: MessageRole.System,
            content: "It's 2 tokens.",
          },
        ]);
      });

      it("renderPrompt()", () => {
        // Given
        const target = targetFactory({
          name: "test",
          role: MessageRole.System,
          template: "It's {{ someString | token_size }} tokens.",
        });

        // When
        const result = target.renderPrompt({
          ...context,
          someString: "hello world",
          tokenizer: new OpenAITokenizer(),
        });

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual("It's 2 tokens.");
      });
    });
  },
);
