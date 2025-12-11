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
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
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
 * **Performance**: Uses optimized getSessionConfigs() to only fetch id and config
 * fields instead of loading full session data, making startup faster.
 *
 * @returns Number of sessions cleaned up
 */
export async function cleanupStaleGeneratingSessions(): Promise<number> {
  try {
    // Get only session configs (optimized: only fetches id and config fields)
    const configsResult = await SessionService.sessionRepo.getSessionConfigs();

    if (configsResult.isFailure) {
      logger.error(
        "[cleanupStaleGeneratingSessions] Failed to fetch session configs",
        configsResult.getError(),
      );
      return 0;
    }

    const configs = configsResult.getValue();

    // Find sessions stuck in "generating" state
    const staleSessionIds = configs
      .filter(
        (row) =>
          row.config &&
          typeof row.config === "object" &&
          "generationStatus" in row.config &&
          row.config.generationStatus === "generating",
      )
      .map((row) => row.id);

    if (staleSessionIds.length === 0) {
      return 0;
    }

    logger.info(
      `[cleanupStaleGeneratingSessions] Found ${staleSessionIds.length} stale generating sessions, marking as completed`,
    );

    // Load and update each stale session
    for (const sessionId of staleSessionIds) {
      // Get full session (needed to call domain methods)
      const sessionResult = await SessionService.getSession.execute(
        new UniqueEntityID(sessionId),
      );

      if (sessionResult.isFailure) {
        logger.error(
          `[cleanupStaleGeneratingSessions] Failed to load session ${sessionId}`,
          sessionResult.getError(),
        );
        continue;
      }

      const session = sessionResult.getValue();

      // Mark as completed (preserve existing config)
      session.update({
        config: {
          ...session.config,
          generationStatus: "completed",
        },
      });

      const saveResult = await SessionService.saveSession.execute({ session });

      if (saveResult.isFailure) {
        logger.error(
          `[cleanupStaleGeneratingSessions] Failed to update session ${sessionId}`,
          saveResult.getError(),
        );
      }
    }

    return staleSessionIds.length;
  } catch (error) {
    logger.error("[cleanupStaleGeneratingSessions] Unexpected error", error);
    return 0;
  }
}
