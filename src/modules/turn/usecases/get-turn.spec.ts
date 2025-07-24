import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";
import { DrizzleTurnRepo } from "@/modules/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/modules/turn/usecases/get-turn";

describe("GetMessage", () => {
  let target: GetTurn;

  let turnRepo: DrizzleTurnRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();

    target = new GetTurn(turnRepo);
  });

  it("[S-U-GM-001] 메시지 조회 - 메시지를 조회한다.", async () => {
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

    // When
    const messageOrError = await target.execute(message.id);

    // Then
    expect(messageOrError.isSuccess).toBe(true);
    const savedMessage = messageOrError.getValue();
    expect(savedMessage.content).toBe(message.content);
  });
});
