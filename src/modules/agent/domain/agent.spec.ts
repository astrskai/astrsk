import { describe, expect, it } from "vitest";

import { MessageRole } from "@/shared/prompt/domain";

import { PlainBlock } from "@/modules/agent/domain";
import { createAgent } from "@/modules/agent/utils";

describe("Prompt", () => {
  describe("addBlock()", () => {
    it("[PP-D-PP-001] 프롬프트 프리셋 프롬프트 블록 추가 - 프롬프트 프리셋에 프롬프트 블록을 추가한다.", () => {
      // Given
      const prompt = createAgent();
      const promptBlock = PlainBlock.create({
        name: "block1",
        role: MessageRole.System,
        template: "block1",
      }).getValue();

      // When
      prompt.addBlock(promptBlock);

      // Then
      expect(prompt.props.blocks).toContainEqual(promptBlock);
    });
  });

  describe("swapBlocks()", () => {
    it("[PP-D-PP-002] 프롬프트 프리셋 프롬프트 블록 순서 변경 - 프롬프트 프리셋의 프롬프트 블록 순서를 변경한다.", () => {
      // Given
      const promptPreset = createPromptPreset({
        blocks: [],
      });
      const promptBlock1 = PlainBlock.create({
        name: "block1",
        role: MessageRole.System,
        template: "block1",
      }).getValue();
      const promptBlock2 = PlainBlock.create({
        name: "block2",
        role: MessageRole.System,
        template: "block2",
      }).getValue();
      promptPreset.addBlock(promptBlock1);
      promptPreset.addBlock(promptBlock2);

      // When
      promptPreset.swapBlocks(promptBlock1.id, promptBlock2.id);

      // Then
      expect(promptPreset.props.blocks[0]).toBe(promptBlock2);
      expect(promptPreset.props.blocks[1]).toBe(promptBlock1);
    });
  });

  describe("updateBlock()", () => {
    it("[PP-D-PP-003] 프롬프트 프리셋 프롬프트 블록 수정 - 프롬프트 프리셋의 프롬프트 블록을 변경한다.", () => {
      // Given
      const promptPreset = createPromptPreset({
        blocks: [],
      });
      const promptBlock = PlainBlock.create({
        name: "block1",
        role: MessageRole.System,
        template: "block1",
      }).getValue();
      promptPreset.addBlock(promptBlock);

      // When
      const result = promptPreset.updateBlock(promptBlock.id, {
        template: "block1-updated",
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(promptPreset.props.blocks[0].props.template).toBe(
        "block1-updated",
      );
    });
  });

  describe("deleteBlock()", () => {
    it("[PP-D-PP-004] 프롬프트 프리셋 프롬프트 블록 삭제 - 프롬프트 프리셋의 프롬프트 블록을 삭제한다.", async () => {
      // Given
      const promptBlock = PlainBlock.create({
        name: "name-test",
        role: MessageRole.User,
        template: "template-test",
        isDeleteUnnecessaryCharacters: true,
      }).getValue();
      const promptPreset = createPromptPreset({
        blocks: [promptBlock],
      });

      // When
      const result = promptPreset.deleteBlock(promptBlock.id);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(promptPreset.props.blocks.length).toBe(0);
    });
  });

  describe("[PP-D-PP-005] 프롬프트 프리셋 프롬프트 렌더링 - 프롬프트 프리셋의 프롬프트 블록과 매크로를 조합해 프롬프트를 렌더링한다.", () => {
    it("renderMessages()", () => {
      // Given
      const promptPreset = createPromptPreset({
        blocks: [],
      });
      promptPreset.addBlock(
        PlainBlock.create({
          name: "block1",
          role: MessageRole.System,
          template: "{{char}} is {{description}}.",
        }).getValue(),
      );
      promptPreset.addBlock(
        PlainBlock.create({
          name: "block2",
          role: MessageRole.System,
          template: "{{user}} is {{persona}}.",
        }).getValue(),
      );

      // When
      const result = promptPreset.renderMessages({
        char: "John",
        description: "cool guy",
        user: "Jane",
        persona: "pretty woman",
        toggle: {
          enabled: new Map<string, boolean>(),
          values: new Map<string, string>(),
        },
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([
        {
          role: MessageRole.System,
          content: "John is cool guy.",
        },
        {
          role: MessageRole.System,
          content: "Jane is pretty woman.",
        },
      ]);
    });

    it("renderPrompt()", () => {
      // Given
      const promptPreset = createPromptPreset({
        blocks: [],
      });
      promptPreset.addBlock(
        PlainBlock.create({
          name: "block1",
          role: MessageRole.System,
          template: "{{char}} is {{description}}.\n",
        }).getValue(),
      );
      promptPreset.addBlock(
        PlainBlock.create({
          name: "block2",
          role: MessageRole.System,
          template: "{{user}} is {{persona}}.",
        }).getValue(),
      );

      // When
      const result = promptPreset.renderPrompt({
        char: "John",
        description: "cool guy",
        user: "Jane",
        persona: "pretty woman",
        toggle: {},
      });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(
        "John is cool guy.\nJane is pretty woman.",
      );
    });
  });

  describe("renderOutput()", () => {
    it("[PP-D-PP-006] 프롬프트 프리셋 아웃풋 렌더링 - 프롬프트 프리셋에서 정한 아웃풋 스키마로 출력된 응답과 아웃풋 템플릿을 조합해 최종 아웃풋을 렌더링한다.", () => {
      // Given
      const outputSchema = {
        type: "object",
        properties: {
          characterName: {
            type: "string",
          },
          emotion: {
            type: "string",
          },
          move: {
            type: "string",
          },
          speak: {
            type: "string",
          },
        },
        required: ["characterName", "emotion", "move", "speak"],
      };
      const outputTemplate = `{{name}}({{output.emotion}}): {{output.move}} "{{output.speak}}"`;
      const promptPreset = createPromptPreset({
        outputSchema: JSON.stringify(outputSchema),
        outputTemplate,
      });
      const context = {
        name: "Ken",
        output: {
          characterName: "Ken",
          emotion: "happy",
          move: "Ken smiles at you.",
          speak: "Hello!",
        },
        toggle: {},
      };

      // When
      const result = promptPreset.renderOutput(context);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(
        `Ken(happy): Ken smiles at you. "Hello!"`,
      );
    });
  });

  describe("toggleParameter()", () => {
    it("[PP-D-PP-007] 프롬프트 프리셋 파라미터 사용 여부 설정 - 프롬프트 프리셋에서 사용할 파라미터를 설정한다.", () => {
      // Given
      const promptPreset = createPromptPreset({
        enabledParameters: new Map<string, boolean>(),
        parameters: new Map<string, any>(),
      });

      // When
      const result = promptPreset.toggleParameter("top_p", true);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(promptPreset.props.enabledParameters).toEqual(
        new Map<string, boolean>(Object.entries({ top_p: true })),
      );
    });
  });

  describe("setParameterValue()", () => {
    it("[PP-D-PP-008] 프롬프트 프리셋 파라미터 값 설정 - 프롬프트 프리셋에서 사용하는 파라미터의 값을 변경한다.", () => {
      // Given
      const promptPreset = createPromptPreset({
        parameters: new Map<string, any>(),
      });

      // When
      const result = promptPreset.setParameterValue("top_p", 0.5);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(promptPreset.props.parameterValues).toEqual(
        new Map<string, any>(Object.entries({ top_p: 0.5 })),
      );
    });
  });

  describe("restoreAllParametersDefault()", () => {
    it("[PP-D-PP-009] 프롬프트 프리셋 파라미터 기본값 복원 - 프롬프트 프리셋에서 사용하는 파라미터의 값을 기본값으로 변경한다.", () => {
      // Given
      const promptPreset = createPromptPreset({
        enabledParameters: new Map<string, boolean>(
          Object.entries({ top_p: true }),
        ),
        parameters: new Map<string, any>(Object.entries({ top_p: 0.5 })),
      });

      // When
      const result = promptPreset.restoreAllParametersDefault();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(promptPreset.props.parameterValues).toEqual(
        new Map<string, any>(Object.entries({ top_p: 1 })),
      );
    });
  });
});
