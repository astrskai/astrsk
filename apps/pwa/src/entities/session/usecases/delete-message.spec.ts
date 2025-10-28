import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Session } from "@/entities/session/domain";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import { DeleteMessage } from "@/entities/session/usecases";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";

describe("DeleteMessage", () => {
  let target: DeleteMessage;

  let turnRepo: DrizzleTurnRepo;
  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();
    sessionRepo = new DrizzleSessionRepo();

    target = new DeleteMessage(turnRepo, sessionRepo, sessionRepo);
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

  it("[S-U-DM-001] 메시지 삭제 - 메시지를 삭제한다.", async () => {
    // Given
    const session = Session.create({}).getValue();
    const sessionName = "Session Name";
    session.setName(sessionName);

    const message1Content = "Message 1";
    const message1 = createMessage({
      sessionId: session.id,
      content: message1Content,
      tokenSize: 2,
    });
    session.addMessage(message1.id);

    const message2Content = "Message 2";
    const message2 = createMessage({
      sessionId: session.id,
      content: message2Content,
      tokenSize: 2,
    });
    session.addMessage(message2.id);

    await sessionRepo.saveSession(session);
    await turnRepo.saveTurn(message1);
    await turnRepo.saveTurn(message2);

    // When
    const result = await target.execute({
      sessionId: session.id,
      messageId: message1.id,
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const sessionFromDb = (
      await sessionRepo.getSessionById(session.id)
    ).getValue();
    expect(sessionFromDb.props.turnIds).not.toContainEqual(message1.id);
    expect(sessionFromDb.props.turnIds).toContainEqual(message2.id);
    expect(result.isSuccess).toBe(true);
    const messageFromDb = await turnRepo.getTurnById(message1.id);
    expect(messageFromDb.isFailure).toBe(true);
  });
});
