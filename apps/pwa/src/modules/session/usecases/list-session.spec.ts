import { beforeEach, describe, expect, it } from "vitest";

import { Session } from "@/modules/session/domain/session";
import { DrizzleSessionRepo } from "@/modules/session/repos/impl/drizzle-session-repo";
import { ListSession } from "@/modules/session/usecases";

describe("ListSession", () => {
  let target: ListSession;

  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    sessionRepo = new DrizzleSessionRepo();

    target = new ListSession(sessionRepo);
  });

  const createSession = async (name: string) => {
    const session = Session.create({}).getValue();
    session.setName(name);
    await sessionRepo.saveSession(session);
  };

  it("S-U-LS-001 세션 목록 조회 - 세션을 목록 조회한다.", async () => {
    // Given
    await createSession("Session 1");
    await createSession("Session 2");
    await createSession("Session 3");

    // When
    const sessionsOrError = await target.execute({
      limit: 2,
    });

    // Then
    expect(sessionsOrError.isSuccess).toBe(true);
    const sessions = sessionsOrError.getValue();
    expect(sessions.length).toBe(2);
  });
});
