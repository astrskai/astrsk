import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Session } from "@/entities/session/domain";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import { BulkDeleteMessage } from "@/entities/session/usecases";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";

describe("BulkDeleteMessage", () => {
  let target: BulkDeleteMessage;

  let turnRepo: DrizzleTurnRepo;
  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();
    sessionRepo = new DrizzleSessionRepo();

    target = new BulkDeleteMessage(turnRepo, sessionRepo, sessionRepo);
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

  it("[S-U-BDM-001] 메시지 대량 삭제 - 메시지 여러 개를 삭제한다.", async () => {
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

    const message3Content = "Message 3";
    const message3 = createMessage({
      sessionId: session.id,
      content: message3Content,
      tokenSize: 2,
    });
    session.addMessage(message3.id);

    await sessionRepo.saveSession(session);
    await turnRepo.saveTurn(message1);
    await turnRepo.saveTurn(message2);
    await turnRepo.saveTurn(message3);
    // When
    const result = await target.execute({
      sessionId: session.id,
      messageIds: [message1.id, message3.id],
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const sessionFromDb = (
      await sessionRepo.getSessionById(session.id)
    ).getValue();

    expect(sessionFromDb.props.turnIds.length).toBe(1);
    expect(sessionFromDb.props.turnIds).not.toContainEqual(message1.id);
    expect((await turnRepo.getTurnById(message1.id)).isFailure).toBe(true);
    expect(sessionFromDb.props.turnIds).toContainEqual(message2.id);
    expect(sessionFromDb.props.turnIds).not.toContainEqual(message3.id);
    expect((await turnRepo.getTurnById(message3.id)).isFailure).toBe(true);
  });
});
