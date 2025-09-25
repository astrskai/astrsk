import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DrizzleVibeSessionRepo } from "@/modules/vibe-session/repos/impl";
import {
  VibeSession,
  CreateVibeSessionProps,
  ResourceSnapshot,
  SnapshotResourceData,
} from "@/modules/vibe-session/domain";
import { SESSION_STATUS } from "vibe-shared-types";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { CardDrizzleMapper } from "@/modules/card/mappers/card-drizzle-mapper";
import { FlowDrizzleMapper } from "@/modules/flow/mappers/flow-drizzle-mapper";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import { DataStoreNodeDrizzleMapper } from "@/modules/data-store-node/mappers/data-store-node-drizzle-mapper";
import { IfNodeDrizzleMapper } from "@/modules/if-node/mappers/if-node-drizzle-mapper";

/**
 * Primary resources that can have vibe sessions
 */
export type PrimaryResourceType = "character_card" | "plot_card" | "flow";

/**
 * All resources that can be stored in snapshots
 */
export type SnapshotResourceType =
  | "character_card"
  | "plot_card"
  | "flow"
  | "agent"
  | "if-node"
  | "data-store-node";

/**
 * @deprecated Use PrimaryResourceType instead
 * ResourceType type alias for backward compatibility
 */
export type ResourceType = PrimaryResourceType;

/**
 * Service layer for vibe session operations
 *
 * Handles business logic for session persistence, restoration, and lifecycle management.
 * Provides a clean interface for the UI layer to interact with vibe sessions while
 * maintaining separation of concerns between domain logic and data persistence.
 */
export class VibeSessionService {
  public static vibeSessionRepo: DrizzleVibeSessionRepo;

  private constructor() {}

  public static init(): void {
    this.vibeSessionRepo = new DrizzleVibeSessionRepo();
  }

  /**
   * Save or update a vibe session for a specific resource
   *
   * @param resourceId - The ID of the resource (card or flow)
   * @param resourceType - The type of resource ('character_card' | 'plot_card' | 'flow')
   * @param sessionData - The session data to persist
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async saveSession(
    resourceId: string,
    resourceType: PrimaryResourceType,
    sessionData: CreateVibeSessionProps,
  ): Promise<Result<void>> {
    try {
      // Validate inputs
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      // Check if there's an existing session to preserve snapshots
      const existingResult = await this.vibeSessionRepo.findByResourceId(
        resourceId,
        resourceType,
      );
      if (existingResult.isFailure) {
        return Result.fail(
          `Failed to check existing session: ${existingResult.getError()}`,
        );
      }

      const existingSession = existingResult.getValue();
      const preservedSnapshots = existingSession
        ? existingSession.snapshots
        : [];

      // Ensure session data matches the resource and preserves existing snapshots
      const sessionWithResource: CreateVibeSessionProps = {
        ...sessionData,
        resourceId,
        resourceType,
        snapshots: preservedSnapshots, // Preserve existing snapshots
        status: sessionData.status || "active",
      };

      // Create or update the session
      const sessionResult = VibeSession.create(sessionWithResource);
      if (sessionResult.isFailure) {
        return Result.fail(
          `Failed to create session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();
      const saveResult = await this.vibeSessionRepo.save(session);

      if (saveResult.isFailure) {
        return Result.fail(`Failed to save session: ${saveResult.getError()}`);
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save session: ${error}`);
    }
  }

  /**
   * Restore a saved session for a specific resource
   *
   * @param resourceId - The ID of the resource to restore session for
   * @param resourceType - The type of resource
   * @returns Promise<Result<VibeSession | null>> - The restored session or null if not found
   */
  public static async restoreSession(
    resourceId: string,
    resourceType: PrimaryResourceType,
  ): Promise<Result<VibeSession | null>> {
    try {
      // Validate inputs
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      // Find the session by resource
      const sessionResult = await this.vibeSessionRepo.findByResourceId(
        resourceId,
        resourceType,
      );
      if (sessionResult.isFailure) {
        return Result.fail(
          `Failed to find session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();
      if (!session) {
        return Result.ok(null);
      }

      // Mark session as restored if it was active
      if (session.isActive()) {
        const restoredSessionResult = session.markAsRestored();
        if (restoredSessionResult.isFailure) {
          return Result.fail(
            `Failed to mark session as restored: ${restoredSessionResult.getError()}`,
          );
        }

        const restoredSession = restoredSessionResult.getValue();
        const updateResult = await this.vibeSessionRepo.save(restoredSession);
        if (updateResult.isFailure) {
          return Result.fail(
            `Failed to update restored session: ${updateResult.getError()}`,
          );
        }

        return Result.ok(updateResult.getValue());
      }

      return Result.ok(session);
    } catch (error) {
      return Result.fail(`Failed to restore session: ${error}`);
    }
  }

  /**
   * Clear (delete) a session for a specific resource
   *
   * @param resourceId - The ID of the resource
   * @param resourceType - The type of resource
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async clearSession(
    resourceId: string,
    resourceType: ResourceType,
  ): Promise<Result<void>> {
    try {
      // Validate inputs
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      // Delete ALL sessions for this resource (handles multiple sessions issue)
      const deleteResult = await this.vibeSessionRepo.deleteByResourceId(
        resourceId,
        resourceType,
      );
      if (deleteResult.isFailure) {
        return Result.fail(
          `Failed to delete sessions: ${deleteResult.getError()}`,
        );
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear session: ${error}`);
    }
  }

  /**
   * Link a session to a resource by updating the resource reference
   *
   * @param sessionId - The session ID to link
   * @param resourceId - The resource ID to link to
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async linkSessionToResource(
    sessionId: string,
    resourceId: string,
  ): Promise<Result<void>> {
    try {
      // Validate inputs
      if (!sessionId || sessionId.trim() === "") {
        return Result.fail("Session ID is required");
      }

      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      // Find the session
      const sessionResult =
        await this.vibeSessionRepo.findBySessionId(sessionId);
      if (sessionResult.isFailure) {
        return Result.fail(
          `Failed to find session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();
      if (!session) {
        return Result.fail("Session not found");
      }

      // Update the session with new resource ID
      const updatedSessionResult = session.update({ resourceId });
      if (updatedSessionResult.isFailure) {
        return Result.fail(
          `Failed to update session: ${updatedSessionResult.getError()}`,
        );
      }

      const updatedSession = updatedSessionResult.getValue();
      const saveResult = await this.vibeSessionRepo.save(updatedSession);

      if (saveResult.isFailure) {
        return Result.fail(
          `Failed to save linked session: ${saveResult.getError()}`,
        );
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to link session to resource: ${error}`);
    }
  }

  /**
   * Unlink a session from a resource (typically before resource deletion)
   *
   * @param resourceId - The resource ID to unlink from
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async unlinkSessionFromResource(
    resourceId: string,
  ): Promise<Result<void>> {
    try {
      // Validate input
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      // Find sessions linked to this resource across all types
      const resourceTypes: PrimaryResourceType[] = [
        "character_card",
        "plot_card",
        "flow",
      ];

      for (const resourceType of resourceTypes) {
        const sessionResult = await this.vibeSessionRepo.findByResourceId(
          resourceId,
          resourceType,
        );
        if (sessionResult.isFailure) {
          // Log error but continue with other types
          console.warn(
            `Failed to find session for resource ${resourceId} of type ${resourceType}: ${sessionResult.getError()}`,
          );
          continue;
        }

        const session = sessionResult.getValue();
        if (session) {
          // Mark session as completed instead of deleting it
          // This preserves the session data for potential future reference
          const completedSessionResult = session.markAsCompleted();
          if (completedSessionResult.isFailure) {
            console.warn(
              `Failed to mark session as completed: ${completedSessionResult.getError()}`,
            );
            continue;
          }

          const completedSession = completedSessionResult.getValue();
          const saveResult = await this.vibeSessionRepo.save(completedSession);
          if (saveResult.isFailure) {
            console.warn(
              `Failed to save completed session: ${saveResult.getError()}`,
            );
          }
        }
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to unlink session from resource: ${error}`);
    }
  }

  /**
   * Clean up stale sessions that haven't been active for a specified time
   *
   * @param thresholdHours - Number of hours after which a session is considered stale (default: 24)
   * @returns Promise<Result<number>> - Number of sessions cleaned up
   */
  public static async cleanupStaleSessions(
    thresholdHours: number = 24,
  ): Promise<Result<number>> {
    try {
      // Validate input
      if (thresholdHours <= 0) {
        return Result.fail("Threshold hours must be positive");
      }

      // Find stale sessions
      const staleSessionsResult =
        await this.vibeSessionRepo.findStale(thresholdHours);
      if (staleSessionsResult.isFailure) {
        return Result.fail(
          `Failed to find stale sessions: ${staleSessionsResult.getError()}`,
        );
      }

      const staleSessions = staleSessionsResult.getValue();
      let cleanedCount = 0;

      // Delete each stale session
      for (const session of staleSessions) {
        try {
          const deleteResult = await this.vibeSessionRepo.deleteBySessionId(
            session.sessionId,
          );
          if (deleteResult.isSuccess) {
            cleanedCount++;
          } else {
            console.warn(
              `Failed to delete stale session ${session.sessionId}: ${deleteResult.getError()}`,
            );
          }
        } catch (error) {
          console.warn(
            `Error deleting stale session ${session.sessionId}: ${error}`,
          );
        }
      }

      return Result.ok(cleanedCount);
    } catch (error) {
      return Result.fail(`Failed to cleanup stale sessions: ${error}`);
    }
  }

  /**
   * Get a session by its session ID
   *
   * @param sessionId - The session ID to find
   * @returns Promise<Result<VibeSession | null>> - The session or null if not found
   */
  public static async getSessionBySessionId(
    sessionId: string,
  ): Promise<Result<VibeSession | null>> {
    try {
      if (!sessionId || sessionId.trim() === "") {
        return Result.fail("Session ID is required");
      }

      return await this.vibeSessionRepo.findBySessionId(sessionId);
    } catch (error) {
      return Result.fail(`Failed to get session: ${error}`);
    }
  }

  /**
   * Get a session by resource ID and type
   *
   * @param resourceId - The resource ID
   * @param resourceType - The resource type
   * @returns Promise<Result<VibeSession | null>> - The session or null if not found
   */
  public static async getSessionByResource(
    resourceId: string,
    resourceType: PrimaryResourceType,
  ): Promise<Result<VibeSession | null>> {
    try {
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      return await this.vibeSessionRepo.findByResourceId(
        resourceId,
        resourceType,
      );
    } catch (error) {
      return Result.fail(`Failed to get session by resource: ${error}`);
    }
  }

  /**
   * Create a snapshot of a resource group and add it to the session
   *
   * For cards: Snapshots just the single card
   * For flows: Snapshots the flow + all its nodes (agents, if-nodes, data-store-nodes)
   *
   * @param primaryResourceId - The primary resource ID to snapshot
   * @param primaryResourceType - The primary resource type
   * @param description - Description for the snapshot
   * @param operationId - Optional operation ID that triggered this snapshot
   * @returns Promise<Result<string>> - The snapshot ID if successful
   */
  public static async createSnapshot(
    primaryResourceId: string,
    primaryResourceType: PrimaryResourceType,
    description: string,
    operationId?: string,
  ): Promise<Result<string>> {
    try {
      // Validate inputs
      if (!primaryResourceId || primaryResourceId.trim() === "") {
        return Result.fail("Primary resource ID is required");
      }

      if (!primaryResourceType) {
        return Result.fail("Primary resource type is required");
      }

      if (!description || description.trim() === "") {
        return Result.fail("Description is required");
      }

      const snapshotId = new UniqueEntityID().toString();
      const resources: SnapshotResourceData[] = [];

      // Collect all resources to snapshot based on primary resource type
      switch (primaryResourceType) {
        case "character_card":
        case "plot_card":
          // Use CardService to get complete card data
          const cardResult = await CardService.getCard.execute(
            new UniqueEntityID(primaryResourceId),
          );
          if (cardResult.isFailure) {
            return Result.fail(`Card not found: ${cardResult.getError()}`);
          }

          const card = cardResult.getValue();

          // Convert domain object to database format using the mapper
          // This format is JSON-serializable and can be restored properly
          const cardDbFormat = CardDrizzleMapper.toPersistence(card);

          resources.push({
            resourceId: primaryResourceId,
            resourceType: primaryResourceType,
            resourceData: cardDbFormat, // Store in database format for proper serialization
          });
          break;

        case "flow":
          // Use FlowService to get complete flow data with all nodes
          const flowResult = await FlowService.getFlowWithNodes.execute(
            new UniqueEntityID(primaryResourceId),
          );
          if (flowResult.isFailure) {
            return Result.fail(`Flow not found: ${flowResult.getError()}`);
          }

          const flow = flowResult.getValue();

          // Convert flow to database format using the mapper for proper serialization
          const flowDbFormat = FlowDrizzleMapper.toPersistence(flow);

          // Store the flow itself
          resources.push({
            resourceId: primaryResourceId,
            resourceType: "flow",
            resourceData: flowDbFormat,
          });

          // Capture all agents referenced by the flow
          const agentIds = flow.agentIds;
          console.log(
            `🤖 [SNAPSHOT] Flow has ${agentIds.length} agents to capture:`,
            agentIds.map((id) => id.toString()),
          );
          for (const agentId of agentIds) {
            try {
              const agentResult = await AgentService.getAgent.execute(agentId);
              if (agentResult.isSuccess) {
                const agent = agentResult.getValue();
                const agentDbFormat = AgentDrizzleMapper.toPersistence(agent);

                resources.push({
                  resourceId: agentId.toString(),
                  resourceType: "agent",
                  resourceData: agentDbFormat,
                });
                console.log(
                  `✅ [SNAPSHOT] Captured agent ${agentId.toString()}`,
                );
              } else {
                console.warn(
                  `❌ [SNAPSHOT] Failed to get agent ${agentId.toString()}: ${agentResult.getError()}`,
                );
              }
            } catch (error) {
              console.warn(
                `⚠️ [SNAPSHOT] Failed to capture agent ${agentId.toString()}:`,
                error,
              );
            }
          }

          // Capture all data store nodes for this flow
          try {
            console.log(
              `📦 [SNAPSHOT] Getting data store nodes for flow ${primaryResourceId}`,
            );
            const dataStoreNodesResult =
              await DataStoreNodeService.getAllDataStoreNodesByFlow.execute({
                flowId: primaryResourceId,
              });
            if (dataStoreNodesResult.isSuccess) {
              const dataStoreNodes = dataStoreNodesResult.getValue();
              console.log(
                `📦 [SNAPSHOT] Flow has ${dataStoreNodes.length} data store nodes to capture:`,
                dataStoreNodes.map((node) => node.id.toString()),
              );
              for (const dataStoreNode of dataStoreNodes) {
                const dataStoreNodeDbFormat =
                  DataStoreNodeDrizzleMapper.toPersistence(dataStoreNode);

                resources.push({
                  resourceId: dataStoreNode.id.toString(),
                  resourceType: "data-store-node",
                  resourceData: dataStoreNodeDbFormat,
                });
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ [SNAPSHOT] Failed to capture data store nodes for flow ${primaryResourceId}:`,
              error,
            );
          }

          // Capture all if-nodes for this flow
          try {
            const ifNodesResult =
              await IfNodeService.getAllIfNodesByFlow.execute({
                flowId: primaryResourceId,
              });
            if (ifNodesResult.isSuccess) {
              const ifNodes = ifNodesResult.getValue();
              for (const ifNode of ifNodes) {
                const ifNodeDbFormat =
                  IfNodeDrizzleMapper.toPersistence(ifNode);

                resources.push({
                  resourceId: ifNode.id.toString(),
                  resourceType: "if-node",
                  resourceData: ifNodeDbFormat,
                });
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ [SNAPSHOT] Failed to capture if-nodes for flow ${primaryResourceId}:`,
              error,
            );
          }

          break;

        default:
          return Result.fail(
            `Unsupported primary resource type: ${primaryResourceType}`,
          );
      }

      // Create snapshot object with all collected resources
      const snapshot: ResourceSnapshot = {
        id: snapshotId,
        primaryResourceId,
        primaryResourceType,
        resources,
        description,
        timestamp: new Date().toISOString(),
        operationId,
      };

      // Get existing session or create new one for the primary resource
      const sessionResult = await this.getSessionByResource(
        primaryResourceId,
        primaryResourceType,
      );
      if (sessionResult.isFailure) {
        console.error(
          "❌ [SNAPSHOT-CREATE] Failed to get session:",
          sessionResult.getError(),
        );
        return Result.fail(
          `Failed to get session: ${sessionResult.getError()}`,
        );
      }

      let session = sessionResult.getValue();

      if (!session) {
        // Create new session for this resource
        const sessionData: CreateVibeSessionProps = {
          sessionId: new UniqueEntityID().toString(),
          resourceId: primaryResourceId,
          resourceType: primaryResourceType,
          messages: [],
          appliedChanges: [],
          conversationHistory: [],
          snapshots: [snapshot],
          status: SESSION_STATUS.ACTIVE,
        };

        const saveResult = await this.saveSession(
          primaryResourceId,
          primaryResourceType,
          sessionData,
        );
        if (saveResult.isFailure) {
          console.error(
            "❌ [SNAPSHOT-CREATE] Failed to create session with snapshot:",
            saveResult.getError(),
          );
          return Result.fail(
            `Failed to create session with snapshot: ${saveResult.getError()}`,
          );
        }
      } else {
        // Add snapshot to existing session
        const updatedSessionResult = session.addSnapshot(snapshot);
        if (updatedSessionResult.isFailure) {
          console.error(
            "❌ [SNAPSHOT-CREATE] Failed to add snapshot to session:",
            updatedSessionResult.getError(),
          );
          return Result.fail(
            `Failed to add snapshot to session: ${updatedSessionResult.getError()}`,
          );
        }

        const updatedSession = updatedSessionResult.getValue();
        const saveResult = await this.vibeSessionRepo.save(updatedSession);
        if (saveResult.isFailure) {
          console.error(
            "❌ [SNAPSHOT-CREATE] Failed to save session with new snapshot:",
            saveResult.getError(),
          );
          return Result.fail(
            `Failed to save session with new snapshot: ${saveResult.getError()}`,
          );
        }
      }

      return Result.ok(snapshotId);
    } catch (error) {
      return Result.fail(`Failed to create snapshot: ${error}`);
    }
  }

  /**
   * Revert a resource group to a specific snapshot
   *
   * @param primaryResourceId - The primary resource ID to revert
   * @param primaryResourceType - The primary resource type
   * @param snapshotId - The snapshot ID to revert to
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async revertToSnapshot(
    primaryResourceId: string,
    primaryResourceType: PrimaryResourceType,
    snapshotId: string,
  ): Promise<Result<void>> {
    try {
      // Validate inputs
      if (!primaryResourceId || primaryResourceId.trim() === "") {
        return Result.fail("Primary resource ID is required");
      }

      if (!primaryResourceType) {
        return Result.fail("Primary resource type is required");
      }

      if (!snapshotId || snapshotId.trim() === "") {
        return Result.fail("Snapshot ID is required");
      }

      // Get the session that contains this snapshot
      const sessionResult = await this.getSessionByResource(
        primaryResourceId,
        primaryResourceType,
      );
      if (sessionResult.isFailure) {
        return Result.fail(
          `Failed to get session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();
      if (!session) {
        return Result.fail("No session found for this resource");
      }

      // Find the snapshot
      const snapshot = session.getSnapshot(snapshotId);
      if (!snapshot) {
        return Result.fail(`Snapshot not found: ${snapshotId}`);
      }

      // Verify the snapshot matches the primary resource
      if (
        snapshot.primaryResourceId !== primaryResourceId ||
        snapshot.primaryResourceType !== primaryResourceType
      ) {
        return Result.fail(
          "Snapshot does not match the specified primary resource",
        );
      }

      for (const resource of snapshot.resources) {
        switch (resource.resourceType) {
          case "character_card":
          case "plot_card":
            // Use CardService to restore the card
            const restoreResult =
              await CardService.restoreCardFromSnapshot.execute(
                resource.resourceData,
              );
            if (restoreResult.isFailure) {
              throw new Error(
                `Failed to restore card ${resource.resourceId}: ${restoreResult.getError()}`,
              );
            }
            break;

          case "flow":
            // Use FlowService to restore the flow from database format
            const flowRestoreResult =
              await FlowService.restoreFlowFromSnapshot.execute(
                resource.resourceData,
              );
            if (flowRestoreResult.isFailure) {
              throw new Error(
                `Failed to restore flow ${resource.resourceId}: ${flowRestoreResult.getError()}`,
              );
            }
            break;

          case "agent":
            // Use AgentService to restore the agent from database format
            const agentRestoreResult =
              await AgentService.restoreAgentFromSnapshot.execute(
                resource.resourceData,
              );
            if (agentRestoreResult.isFailure) {
              throw new Error(
                `Failed to restore agent ${resource.resourceId}: ${agentRestoreResult.getError()}`,
              );
            }
            break;

          case "data-store-node":
            // Use DataStoreNodeService to restore the data store node from database format
            const dataStoreNodeRestoreResult =
              await DataStoreNodeService.restoreDataStoreNodeFromSnapshot.execute(
                resource.resourceData,
              );
            if (dataStoreNodeRestoreResult.isFailure) {
              throw new Error(
                `Failed to restore data store node ${resource.resourceId}: ${dataStoreNodeRestoreResult.getError()}`,
              );
            }
            break;

          case "if-node":
            // Use IfNodeService to restore the if-node from database format
            const ifNodeRestoreResult =
              await IfNodeService.restoreIfNodeFromSnapshot.execute(
                resource.resourceData,
              );
            if (ifNodeRestoreResult.isFailure) {
              throw new Error(
                `Failed to restore if-node ${resource.resourceId}: ${ifNodeRestoreResult.getError()}`,
              );
            }
            break;

          default:
            throw new Error(
              `Unsupported resource type for restoration: ${resource.resourceType}`,
            );
        }
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to revert to snapshot: ${error}`);
    }
  }

  /**
   * Get all snapshots for a resource
   *
   * @param resourceId - The resource ID
   * @param resourceType - The resource type
   * @returns Promise<Result<ResourceSnapshot[]>> - Array of snapshots
   */
  public static async getResourceSnapshots(
    resourceId: string,
    resourceType: "character_card" | "plot_card" | "flow",
  ): Promise<Result<ResourceSnapshot[]>> {
    try {
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      const sessionResult = await this.getSessionByResource(
        resourceId,
        resourceType,
      );
      if (sessionResult.isFailure) {
        console.error(
          "❌ [GET-SNAPSHOTS] Failed to get session:",
          sessionResult.getError(),
        );
        return Result.fail(
          `Failed to get session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();

      if (!session) {
        return Result.ok([]); // No session = no snapshots
      }

      // Sort snapshots by timestamp (newest first)
      const sortedSnapshots = [...session.snapshots].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return Result.ok(sortedSnapshots);
    } catch (error) {
      console.error("❌ [GET-SNAPSHOTS] Error:", error);
      return Result.fail(`Failed to get resource snapshots: ${error}`);
    }
  }

  /**
   * Remove a specific snapshot from a session
   *
   * @param resourceId - The resource ID
   * @param resourceType - The resource type
   * @param snapshotId - The snapshot ID to remove
   * @returns Promise<Result<void>> - Success/failure result
   */
  public static async removeSnapshot(
    resourceId: string,
    resourceType: "character_card" | "plot_card" | "flow",
    snapshotId: string,
  ): Promise<Result<void>> {
    try {
      if (!resourceId || resourceId.trim() === "") {
        return Result.fail("Resource ID is required");
      }

      if (!resourceType) {
        return Result.fail("Resource type is required");
      }

      if (!snapshotId || snapshotId.trim() === "") {
        return Result.fail("Snapshot ID is required");
      }

      const sessionResult = await this.getSessionByResource(
        resourceId,
        resourceType,
      );
      if (sessionResult.isFailure) {
        return Result.fail(
          `Failed to get session: ${sessionResult.getError()}`,
        );
      }

      const session = sessionResult.getValue();
      if (!session) {
        return Result.fail("No session found for this resource");
      }

      const updatedSessionResult = session.removeSnapshot(snapshotId);
      if (updatedSessionResult.isFailure) {
        return Result.fail(
          `Failed to remove snapshot: ${updatedSessionResult.getError()}`,
        );
      }

      const updatedSession = updatedSessionResult.getValue();
      const saveResult = await this.vibeSessionRepo.save(updatedSession);
      if (saveResult.isFailure) {
        return Result.fail(
          `Failed to save session after removing snapshot: ${saveResult.getError()}`,
        );
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to remove snapshot: ${error}`);
    }
  }
}
