/**
 * Cleanup utility for stale session generation states
 *
 * When the app is refreshed or restarted while a session is generating,
 * the background generation process is interrupted but the session remains
 * stuck in "generating" state in the database.
 *
 * This module detects and marks such sessions as "completed" on app startup.
 * The session is still viable because it was created with characters and a Simple workflow.
 */

import { SessionService } from "@/app/services/session-service";
import { logger } from "@/shared/lib";

/**
 * Reset all sessions stuck in "generating" state to "completed"
 *
 * This should be called during app initialization after SessionService.init()
 * to clean up any sessions that were interrupted by page refresh/reload.
 *
 * Sessions are marked as "completed" (not "failed") because they were created
 * with all characters and a Simple workflow, making them fully functional.
 *
 * @returns Number of sessions cleaned up
 */
export async function cleanupStaleGeneratingSessions(): Promise<number> {
  try {
    // Get all sessions using searchSession with empty query
    const sessionsResult = await SessionService.searchSession.execute({});

    if (sessionsResult.isFailure) {
      logger.error(
        "[cleanupStaleGeneratingSessions] Failed to fetch sessions",
        sessionsResult.getError(),
      );
      return 0;
    }

    const sessions = sessionsResult.getValue();

    // Find sessions stuck in "generating" state
    const staleSessions = sessions.filter(
      (session) => session.config?.generationStatus === "generating",
    );

    if (staleSessions.length === 0) {
      return 0;
    }

    logger.info(
      `[cleanupStaleGeneratingSessions] Found ${staleSessions.length} stale generating sessions, marking as completed`,
    );

    // Mark each stale session as completed (they're still viable with Simple workflow)
    for (const session of staleSessions) {
      session.update({
        config: {
          ...session.config,
          generationStatus: "completed",
        },
      });

      const saveResult = await SessionService.saveSession.execute({ session });

      if (saveResult.isFailure) {
        logger.error(
          `[cleanupStaleGeneratingSessions] Failed to update session ${session.id.toString()}`,
          saveResult.getError(),
        );
      }
    }

    return staleSessions.length;
  } catch (error) {
    logger.error("[cleanupStaleGeneratingSessions] Unexpected error", error);
    return 0;
  }
}
