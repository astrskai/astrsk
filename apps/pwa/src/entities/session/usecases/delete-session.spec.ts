import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Session } from "@/entities/session/domain/session";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import { DeleteSession } from "@/entities/session/usecases";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";

describe("DeleteSession", () => {
  let target: DeleteSession;

  let turnRepo: DrizzleTurnRepo;
  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();
    sessionRepo = new DrizzleSessionRepo();

    target = new DeleteSession(turnRepo, sessionRepo, sessionRepo);
  });

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

  it("[S-U-DS-001] 세션 삭제 - 세션을 DB에서 삭제한다.", async () => {
    // Given
    const session = Session.create({}).getValue();
    const message1 = createMessage({
      sessionId: session.id,
      content: "Message 1",
      tokenSize: 2,
    });
    const message2 = createMessage({
      sessionId: session.id,
      content: "Message 2",
      tokenSize: 2,
    });
    session.addMessage(message1.id);
    session.addMessage(message2.id);
    await sessionRepo.saveSession(session);
    await turnRepo.saveTurn(message1);
    await turnRepo.saveTurn(message2);

    // When
    const result = await target.execute(session.id);

    // Then
    expect(result.isSuccess).toBe(true);
    expect((await sessionRepo.getSessionById(session.id)).isFailure).toBe(true);
    expect((await turnRepo.getTurnById(message1.id)).isFailure).toBe(true);
    expect((await turnRepo.getTurnById(message2.id)).isFailure).toBe(true);
  });
});
