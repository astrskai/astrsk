import { Result } from "@/shared/core";
import { Transaction } from "@/db/transaction";
import { VibeSession } from "@/modules/vibe-session/domain";

/**
 * Repository interface for vibe session persistence operations
 * 
 * Provides operations for managing persistent vibe sessions across resource changes,
 * allowing sessions to survive resource rollbacks and be restored when switching
 * between resources.
 */
export interface VibeSessionRepository {
  /**
   * Save a vibe session (insert or update)
   * @param session - The vibe session to save
   * @param tx - Optional database transaction
   */
  save(session: VibeSession, tx?: Transaction): Promise<Result<VibeSession>>;

  /**
   * Find a vibe session by its internal ID
   * @param id - The internal database ID of the session
   * @param tx - Optional database transaction
   */
  findById(id: string, tx?: Transaction): Promise<Result<VibeSession | null>>;

  /**
   * Find a vibe session by resource ID and type
   * @param resourceId - The ID of the resource (card or flow)
   * @param resourceType - The type of resource ('character_card' | 'plot_card' | 'flow')
   * @param tx - Optional database transaction
   */
  findByResourceId(
    resourceId: string,
    resourceType: string,
    tx?: Transaction
  ): Promise<Result<VibeSession | null>>;

  /**
   * Find a vibe session by session ID
   * @param sessionId - The vibe system session ID
   * @param tx - Optional database transaction
   */
  findBySessionId(sessionId: string, tx?: Transaction): Promise<Result<VibeSession | null>>;

  /**
   * Delete a vibe session by its internal ID
   * @param id - The internal database ID of the session to delete
   * @param tx - Optional database transaction
   */
  delete(id: string, tx?: Transaction): Promise<Result<void>>;

  /**
   * Find all stale sessions (sessions that haven't been active for a given threshold)
   * @param thresholdHours - Number of hours after which a session is considered stale
   * @param tx - Optional database transaction
   */
  findStale(thresholdHours: number, tx?: Transaction): Promise<Result<VibeSession[]>>;

  /**
   * Delete ALL vibe sessions for a specific resource (for clearing resource sessions)
   * @param resourceId - The ID of the resource
   * @param resourceType - The type of resource
   * @param tx - Optional database transaction
   */
  deleteByResourceId(resourceId: string, resourceType: string, tx?: Transaction): Promise<Result<void>>;
}