import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain";

import { Session } from "@/modules/session/domain";
import { DrizzleSessionRepo } from "@/modules/session/repos/impl/drizzle-session-repo";
import { AddMessage } from "@/modules/session/usecases";
import { Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";
import { DrizzleTurnRepo } from "@/modules/turn/repos/impl/drizzle-turn-repo";

describe("AddMessage", () => {
  let target: AddMessage;

  let turnRepo: DrizzleTurnRepo;
  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();
    sessionRepo = new DrizzleSessionRepo();

    target = new AddMessage(turnRepo, sessionRepo, sessionRepo);
  });

  it("[S-U-SM-001] 메시지 추가 - 메시지를 저장하고 세션에 메시지를 추가한다.", async () => {
    // Given
    const session = Session.create({}).getValue();
    const option = Option.create({
      content: "Hello, World!",
      tokenSize: 2,
    }).getValue();
    const message = Turn.create({
      sessionId: session.id,
      characterCardId: new UniqueEntityID(),
      characterName: "Test",
      options: [option],
    }).getValue();
    await sessionRepo.saveSession(session);

    // When
    await target.execute({
      sessionId: session.id,
      message,
    });

    // Then
    const sessionResult = await sessionRepo.getSessionById(session.id);
    const savedSession = sessionResult.getValue();
    expect(savedSession.props.turnIds).toEqual([message.id]);
    const savedMessage = await turnRepo.getTurnById(message.id);
    expect(savedMessage.getValue().content).toBe(message.content);
  });
});
