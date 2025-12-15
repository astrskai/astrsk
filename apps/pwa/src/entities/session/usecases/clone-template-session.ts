import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";
import { Session } from "@/entities/session/domain/session";
import { CloneSession } from "./clone-session";
import { LoadSessionRepo } from "@/entities/session/repos";

type Command = {
  /** The play session to clone as template */
  sessionId: UniqueEntityID;
  /** Whether to include message history */
  includeHistory?: boolean;
};

/**
 * Clones a play session and marks it as a template session (non-play).
 *
 * Template sessions are clones of play sessions with isPlaySession=false.
 * Used for "Save as Asset" functionality to create reusable session templates.
 */
export class CloneTemplateSession implements UseCase<Command, Result<Session>> {
  constructor(
    private cloneSession: CloneSession,
    private loadSessionRepo: LoadSessionRepo,
  ) {}

  async execute({
    sessionId,
    includeHistory = false,
  }: Command): Promise<Result<Session>> {
    // Load the original session to get the original name
    const originalSessionResult = await this.loadSessionRepo.getSessionById(sessionId);
    if (originalSessionResult.isFailure) {
      return formatFail(
        "Failed to load original session",
        originalSessionResult.getError(),
      );
    }
    const originalSession = originalSessionResult.getValue();
    const originalName = originalSession.props.name;

    // Clone the play session
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

    // Mark as template session (non-play) and restore original name
    // History should NOT be included (includeHistory: false by default)
    const updateResult = clonedSession.update({
      isPlaySession: false,
      name: originalName, // Keep original name, not "Copy of..."
      title: originalName, // Keep title in sync
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
