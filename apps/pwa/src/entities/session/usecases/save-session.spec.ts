import { beforeEach, describe, expect, it } from "vitest";

import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { Session } from "@/entities/session/domain/session";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import { SaveSession } from "@/entities/session/usecases";

describe("SaveSession", () => {
  let target: SaveSession;

  let sessionRepo: DrizzleSessionRepo;

  beforeEach(() => {
    sessionRepo = new DrizzleSessionRepo();

    const cardRepo = new DrizzleCardRepo();

    target = new SaveSession(sessionRepo, cardRepo);
  });

  it("[S-U-SS-001] 세션 저장 - 세션 객체를 DB에 저장한다.", async () => {
    // Given
    const session = Session.create({}).getValue();
    const name = "Session name";
    session.setName(name);

    // When
    await target.execute({ session });

    // Then
    const savedSession = await sessionRepo.getSessionById(session.id);
    expect(savedSession?.getValue().props.name).toBe(name);
  });
});
