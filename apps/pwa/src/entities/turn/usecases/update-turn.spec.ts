import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { UpdateTurn } from "@/entities/turn/usecases/update-turn";

describe("UpdateMessage", () => {
  let target: UpdateTurn;

  let turnRepo: DrizzleTurnRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();

    target = new UpdateTurn(turnRepo, turnRepo);
  });

  describe("[S-U-SM-001] 메시지 수정 - 변경된 메시지 객체를 DB에 저장한다.", () => {
    it("메시지 수정 성공", async () => {
      // Given
      const option = Option.create({
        content: "Message content",
        tokenSize: 2,
      }).getValue();
      const message = Turn.create({
        sessionId: new UniqueEntityID(),
        characterCardId: new UniqueEntityID(),
        characterName: "Character name",
        options: [option],
      }).getValue();
      await turnRepo.saveTurn(message);
      message.setContent("Updated message content");

      // When
      await target.execute(message);

      // Then
      const savedMessage = await turnRepo.getTurnById(message.id);
      expect(savedMessage.getValue().content).toBe(message.content);
    });

    it("메시지 수정 실패 - 메시지가 존재하지 않음", async () => {
      // Given
      const option = Option.create({
        content: "Message content",
        tokenSize: 2,
      }).getValue();
      const message = Turn.create({
        sessionId: new UniqueEntityID(),
        characterCardId: new UniqueEntityID(),
        characterName: "Character name",
        options: [option],
      }).getValue();

      // When
      const result = await target.execute(message);

      // Then
      expect(result.isFailure).toBe(true);
    });
  });
});
