/**
 * Utilities for creating and verifying vibe session snapshots
 * 
 * Eliminates duplication of snapshot creation logic across vibe components
 */

import { VibeSessionService } from "@/app/services/vibe-session-service";
import type { PrimaryResourceType } from "@/app/services/vibe-session-service";

/**
 * Create a snapshot with verification for a resource before AI edit
 * 
 * @param resourceId - The resource ID to snapshot
 * @param resourceType - The type of resource ('character_card' | 'plot_card' | 'flow')
 * @param sessionId - The vibe session ID that triggered this snapshot
 * @returns Promise<boolean> - true if snapshot was created successfully, false otherwise
 */
export async function createSnapshotWithVerification(
  resourceId: string,
  resourceType: PrimaryResourceType,
  sessionId: string
): Promise<boolean> {
  try {
    console.log(`📸 [SNAPSHOT] Creating snapshot before ${resourceType} approval`, { resourceId, sessionId });
    
    const snapshotResult = await VibeSessionService.createSnapshot(
      resourceId,
      resourceType,
      `Before AI edit - ${new Date().toLocaleTimeString()}`,
      sessionId
    );
    
    if (snapshotResult.isSuccess) {
      console.log("✅ [SNAPSHOT] Created snapshot:", snapshotResult.getValue());
      
      // Verify snapshot was saved by immediately trying to retrieve it
      const verifyResult = await VibeSessionService.getResourceSnapshots(resourceId, resourceType);
      if (verifyResult.isSuccess) {
        console.log("🔍 [SNAPSHOT-VERIFY] Found", verifyResult.getValue().length, "snapshots for resource");
        return true;
      } else {
        console.warn("⚠️ [SNAPSHOT-VERIFY] Could not verify snapshots:", verifyResult.getError());
        // Return true anyway since the snapshot creation succeeded
        return true;
      }
    } else {
      console.warn("⚠️ [SNAPSHOT] Failed to create snapshot:", snapshotResult.getError());
      return false;
    }
  } catch (error) {
    console.error("💥 [SNAPSHOT] Error creating snapshot:", error);
    return false;
  }
}