import { beforeEach, describe, expect, it } from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Session } from "@/modules/session/domain/session";
import { DrizzleSessionRepo } from "@/modules/session/repos/impl/drizzle-session-repo";
import { AddMessage, CloneSession } from "@/modules/session/usecases";
import { Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";
import { DrizzleTurnRepo } from "@/modules/turn/repos/impl/drizzle-turn-repo";

describe("CloneSession", () => {
  let target: CloneSession;

  let turnRepo: DrizzleTurnRepo;
  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();
    sessionRepo = new DrizzleSessionRepo();

    const addMessage = new AddMessage(turnRepo, sessionRepo, sessionRepo);

    target = new CloneSession(sessionRepo, sessionRepo, turnRepo, addMessage);
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

  it("[S-U-CS-001] 세션 복제 - 세부 정보가 동일하지만 ID가 다른 객체를 생성하고 DB에 저장한다.", async () => {
    // Given
    const session = Session.create({}).getValue();
    const name = "Session name";
    session.setName(name);
    await sessionRepo.saveSession(session);

    // When
    const clonedSessionOrError = await target.execute({
      sessionId: session.id,
    });

    // Then
    expect(clonedSessionOrError.isSuccess).toBe(true);
    const clonedSession = await sessionRepo.getSessionById(
      clonedSessionOrError.getValue().id,
    );
    expect(clonedSession.getValue().props.title).toBe(`Copy of ${name}`);
    expect(clonedSession.getValue().id).not.toBe(session.id);
    // TODO: 세션의 다른 속성들도 동일한지 확인
  });

  it("[S-U-CS-002] 세션 브랜치 생성 - 선택한 메시지까지 메시지 목록 정보와 세부 정보가 동일하지만 ID가 다른 세션 객체를 생성하고 DB에 저장한다.", async () => {
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
      messageId: message2.id,
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const branchedSession = result.getValue();
    expect(branchedSession).not.toBe(session);
    expect(branchedSession.id).not.toEqual(session.id);
    expect(branchedSession.props.title).toBe(`Copy of ${sessionName}`);
    expect(branchedSession.props.turnIds.length).toBe(2);
    expect(branchedSession.props.turnIds).not.toEqual(session.props.turnIds);
  });
});
