import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";
import { SaveSessionRepo } from "@/entities/session/repos";
import { CloneTemplateSession } from "./clone-template-session";
import { ListSession } from "./list-session";

type Command = Record<string, never>; // Empty command

type Response = {
  migratedCount: number;
  clonedCount: number;
};

/**
 * Migrates sessions with messages to play sessions.
 *
 * This is a limited-run migration that:
 * 1. Finds all sessions with messages that have isPlaySession = false
 * 2. Updates those sessions to isPlaySession = true
 * 3. Clones those sessions (without messages) as template sessions with isPlaySession = false
 *
 * This ensures:
 * - Sessions with conversation history are marked as play sessions
 * - Template versions (without history) are available in the session list
 *
 * Note: This migration runs a maximum of 5 times (tracked in localStorage).
 * After 5 runs, it will automatically skip to avoid unnecessary processing.
 */
export class MigrateSessionsWithMessagesToPlaySessions implements UseCase<Command, Result<Response>> {
  constructor(
    private listSession: ListSession,
    private saveSessionRepo: SaveSessionRepo,
    private cloneTemplateSession: CloneTemplateSession,
  ) {}

  async execute(_command: Command): Promise<Result<Response>> {
    try {
      // Check if migration has already been completed (max 5 runs)
      const MIGRATION_KEY = "session-play-migration-count";
      const MAX_RUNS = 5;
      const runCount = parseInt(localStorage.getItem(MIGRATION_KEY) || "0", 10);

      if (runCount >= MAX_RUNS) {
        console.log(`[MigrateSessionsWithMessagesToPlaySessions] Already ran ${runCount} times, skipping...`);
        return Result.ok({ migratedCount: 0, clonedCount: 0 });
      }

      console.log(`[MigrateSessionsWithMessagesToPlaySessions] Starting migration (run ${runCount + 1}/${MAX_RUNS})...`);

      // Find all sessions with messages that are not play sessions
      const sessionsResult = await this.listSession.execute({});
      if (sessionsResult.isFailure) {
        return formatFail(
          "Failed to load sessions",
          sessionsResult.getError(),
        );
      }

      const allSessions = sessionsResult.getValue();
      const sessionsToMigrate = allSessions.filter(
        (session) =>
          !session.props.isPlaySession &&
          session.props.turnIds.length > 0
      );

      if (sessionsToMigrate.length === 0) {
        // No sessions to migrate
        return Result.ok({ migratedCount: 0, clonedCount: 0 });
      }

      console.log(`Found ${sessionsToMigrate.length} sessions with messages to migrate`);

      let migratedCount = 0;
      let clonedCount = 0;

      for (const session of sessionsToMigrate) {
        console.log(`Migrating session ${session.id.toString()}: "${session.props.name}"`);

        // Step 1: Clone the session as a template (without messages)
        const cloneResult = await this.cloneTemplateSession.execute({
          sessionId: session.id,
        });

        if (cloneResult.isSuccess) {
          clonedCount++;
          console.log(`  ✓ Cloned as template session`);
        } else {
          console.warn(`  ⚠️  Failed to clone template: ${cloneResult.getError()}`);
          // Continue with migration even if clone fails
        }

        // Step 2: Mark original session as play session
        const updateResult = session.update({
          isPlaySession: true,
        });

        if (updateResult.isFailure) {
          console.error(`  ❌ Failed to update session: ${updateResult.getError()}`);
          continue;
        }

        // Step 3: Save the updated session
        const saveResult = await this.saveSessionRepo.saveSession(session);
        if (saveResult.isFailure) {
          console.error(`  ❌ Failed to save session: ${saveResult.getError()}`);
          continue;
        }

        migratedCount++;
        console.log(`  ✓ Marked as play session`);
      }

      console.log(`Migration complete: ${migratedCount} migrated, ${clonedCount} cloned`);

      // Increment run count
      localStorage.setItem(MIGRATION_KEY, String(runCount + 1));

      return Result.ok({ migratedCount, clonedCount });
    } catch (error) {
      return formatFail(
        "Migration failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
