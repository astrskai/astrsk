import { describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain";
import { OpenAITokenizer } from "@/shared/lib";

import { Session } from "@/entities/session/domain/session";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";

describe("Session", () => {
  const createMessage = ({
    sessionId,
    content,
    tokenSize,
  }: {
    sessionId: UniqueEntityID;
    content: string;
    tokenSize: number;
  }) => {
    const option = Option.create({
      content,
      tokenSize,
    }).getValue();
    return Turn.create({
      sessionId,
      characterCardId: new UniqueEntityID(),
      characterName: "Character name",
      options: [option],
    }).getValue();
  };

  describe("setName()", () => {
    it("[S-D-S-001] 세션 이름 설정 - 세션의 이름을 변경한다.", () => {
      // Given
      const session = Session.create({}).getValue();
      const name = "New Session Name";

      // When
      session.setName(name);

      // Then
      expect(session.props.name).toBe(name);
    });
  });

  describe("addMessage()", () => {
    it("[S-D-S-002] 메시지 추가 - 세션에 메시지를 추가한다.", () => {
      // Given
      const session = Session.create({}).getValue();
      const message = createMessage({
        sessionId: session.id,
        content: "Message content",
        tokenSize: 2,
      });

      // When
      session.addMessage(message.id);

      // Then
      expect(session.props.turnIds).toContain(message.id);
    });
  });

  describe("swapMessages()", () => {
    it("[S-D-S-003] 메시지 순서 변경 - 세션의 메시지 순서를 변경한다.", () => {
      // Given
      const session = Session.create({}).getValue();
      const message1 = createMessage({
        sessionId: session.id,
        content: "message 1",
        tokenSize: 2,
      });
      const message2 = createMessage({
        sessionId: session.id,
        content: "message 2",
        tokenSize: 2,
      });
      session.addMessage(message1.id);
      session.addMessage(message2.id);

      // When
      session.swapMessages(message1.id, message2.id);

      // Then
      expect(session.props.turnIds[0]).toBe(message2.id);
      expect(session.props.turnIds[1]).toBe(message1.id);
    });
  });

  describe("setAutoContinueEnabled()", () => {
    it("[S-D-S-016] 자동 이어쓰기 사용 여부 설정 - 세션의 자동 이어쓰기 사용 여부를 설정한다.", () => {
      // Given
      const session = Session.create({}).getValue();
      const enabled = true;

      // When
      session.setAutoContinueEnabled(enabled);

      // Then
      expect(session.props.continue.autoContinueEnabled).toBe(enabled);
    });
  });

  describe("setAutoContinueTargetTokenSize()", () => {
    it("[S-D-S-017] 자동 이어쓰기 타겟 토큰 사이즈 설정 - 세션의 자동 이어쓰기 타겟 토큰 사이즈를 설정한다.", () => {
      // Given
      const session = Session.create({}).getValue();
      const size = 200;

      // When
      session.setAutoContinueTargetTokenSize(size);

      // Then
      expect(session.props.continue.autoContinueTargetTokenSize).toBe(size);
    });
  });

  describe("shouldAutoContinue()", () => {
    describe("[S-D-S-019] 세션 자동 이어쓰기 실행 여부 판단 - 자동 이어쓰기 설정에 따라 실행 여부를 판단한다.", () => {
      it("활성화, 목표 토큰 50, 짧은 메시지(3 토큰): 실행함", () => {
        // Given
        const session = Session.create({}).getValue();
        session.setAutoContinueEnabled(true);
        session.setAutoContinueTargetTokenSize(50);
        const message = createMessage({
          sessionId: session.id,
          content: "very short message",
          tokenSize: 3,
        });
        const tokenizer = new OpenAITokenizer();

        // When
        const result = session.shouldAutoContinue(tokenizer, message);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(true);
      });

      it("활성화, 목표 토큰 5, 긴 메시지(15 토큰): 실행하지 않음", () => {
        // Given
        const session = Session.create({}).getValue();
        session.setAutoContinueEnabled(true);
        session.setAutoContinueTargetTokenSize(5);
        const message = createMessage({
          sessionId: session.id,
          content:
            "this is very long message. so long that it should not be continued.",
          tokenSize: 15,
        });
        const tokenizer = new OpenAITokenizer();

        // When
        const result = session.shouldAutoContinue(tokenizer, message);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(false);
      });

      it("비활성화, 목표 토큰 50, 짧은 메시지(3 토큰): 실행하지 않음", () => {
        // Given
        const session = Session.create({}).getValue();
        session.setAutoContinueEnabled(false);
        session.setAutoContinueTargetTokenSize(50);
        const message = createMessage({
          sessionId: session.id,
          content: "very short message",
          tokenSize: 3,
        });
        const tokenizer = new OpenAITokenizer();

        // When
        const result = session.shouldAutoContinue(tokenizer, message);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(false);
      });
    });
  });
});
