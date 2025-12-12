import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";
import { Session } from "@/entities/session/domain/session";
import { CloneSession } from "./clone-session";
import { LoadSessionRepo } from "@/entities/session/repos";

type Command = {
  /** The template session to clone */
  sessionId: UniqueEntityID;
  /** Whether to include message history */
  includeHistory?: boolean;
};

/**
 * Clones a template session and marks it as a play session.
 *
 * Play sessions are clones of template sessions with isPlaySession=true.
 * The user character must remain in allCards to maintain data integrity.
 *
 * Data Integrity Rule: userCharacterCardId MUST be in allCards.
 */
export class ClonePlaySession implements UseCase<Command, Result<Session>> {
  constructor(
    private cloneSession: CloneSession,
    private loadSessionRepo: LoadSessionRepo,
  ) {}

  async execute({
    sessionId,
    includeHistory = false,
  }: Command): Promise<Result<Session>> {
    // Load the original session to get the original title
    const originalSessionResult = await this.loadSessionRepo.getSessionById(sessionId);
    if (originalSessionResult.isFailure) {
      return formatFail(
        "Failed to load original session",
        originalSessionResult.getError(),
      );
    }
    const originalSession = originalSessionResult.getValue();
    const originalTitle = originalSession.props.title;

    // Clone the template session
    const clonedSessionResult = await this.cloneSession.execute({
      sessionId,
      includeHistory,
    });

    if (clonedSessionResult.isFailure) {
      return formatFail(
        "Failed to clone session",
        clonedSessionResult.getError(),
      );
    }

    const clonedSession = clonedSessionResult.getValue();

    // Mark as play session and restore original title (not "Copy of...")
    // IMPORTANT: Keep all cards including user character (data integrity)
    const updateResult = clonedSession.update({
      isPlaySession: true,
      title: originalTitle,
    });

    if (updateResult.isFailure) {
      return formatFail(
        "Failed to update cloned session",
        updateResult.getError(),
      );
    }

    return Result.ok(clonedSession);
  }
}
