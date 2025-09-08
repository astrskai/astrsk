/**
 * Convex-based React hooks for Vibe Coding functionality
 *
 * Direct Convex integration following vibe-chat patterns
 */

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import { SESSION_STATUS } from "vibe-shared-types";
import type {
  StartVibeCodingRequest,
  VibeCodingSessionStatus,
  SessionStatus as SharedSessionStatus,
} from "vibe-shared-types";
import {
  isActiveStatus,
  isCompletedStatus,
  isErrorStatus,
  isRevertedStatus,
} from "vibe-shared-types";

// Session status interface for real-time updates
interface SessionStatus {
  sessionId?: string;
  status?: SharedSessionStatus;
  progress?: number;
  currentStep?: string;
  resourceIds?: string[];
  appliedChanges?: Record<string, any>;
  originalRequest?: string;
  resourceSnapshots?: Record<string, any>;
  currentResources?: Record<string, any>;
  // NEW: Two-phase session fields
  analysisPhase?: {
    completedAt: number;
    analysis: any;
    estimatedOperations: number;
    processingTimeMs: number;
  };
  operationPhase?: {
    completedAt: number;
    generatorResult: any;
    appliedChanges: Record<string, any>;
    pendingOperations: any[];
    processingTimeMs: number;
  };
  // Error details from backend
  errorDetails?: string;
  errorMetadata?: {
    category?: string;
    severity?: string;
    isRetryable?: boolean;
    recoveryAction?: string;
    timestamp?: string;
  };
}

// No health check needed with direct Convex integration

/**
 * Start a new coding session - matches vibe-chat pattern exactly
 */
export const useStartCodingSession = () => {
  const createEditingSession = useMutation(
    api.sessionMutations.createEditingSession,
  );

  return {
    mutateAsync: async (request: StartVibeCodingRequest) => {
      // Build data in exact format expected by backend (like vibe-chat does)
      const resourceData: Record<string, any> = {};
      const resourceTypes: Record<
        string,
        "character_card" | "plot_card" | "flow"
      > = {};
      const resourceIds: string[] = [];

      if (request.context?.availableResources) {
        request.context.availableResources.forEach((resource) => {
          resourceIds.push(resource.id);
          const data = resource.data || resource;
          resourceData[resource.id] = data;
          resourceTypes[resource.id] = resource.type as
            | "character_card"
            | "plot_card"
            | "flow";
        });
      }

      const sessionId = `pwa-vibe-${Date.now()}`;

      const result = await createEditingSession({
        sessionId,
        originalRequest: request.originalRequest,
        conversationHistory: request.context?.conversationHistory || [],
        resourceIds,
        resourceTypes,
        resourceData,
      });

      return {
        success: true,
        data: { sessionId: result.sessionId, status: SESSION_STATUS.ACTIVE },
      };
    },
    // Convex mutations don't have isPending - they're just async functions
    createEditingSession,
  };
};

/**
 * Get session status with real-time updates - matches vibe-chat pattern
 */
export const useCodingSessionStatus = (sessionId: string | null) => {
  // Direct Convex query with automatic real-time updates (no polling needed)
  const sessionStatus = useQuery(
    api.sessionMutations.getEditingSession,
    sessionId ? { sessionId } : "skip",
  ) as SessionStatus | undefined;

  return {
    data: sessionStatus
      ? {
          found: true,
          sessionId: sessionStatus.sessionId,
          status: sessionStatus.status,
          progress: sessionStatus.progress,
          currentStep: sessionStatus.currentStep,
          canCancel: sessionStatus.status
            ? isActiveStatus(sessionStatus.status)
            : false,
          resourceIds: sessionStatus.resourceIds,
          appliedChanges: sessionStatus.appliedChanges,
          currentResources: sessionStatus.currentResources,
          resourceSnapshots: sessionStatus.resourceSnapshots,
          analysis: (sessionStatus as any).analysis,
          generatorResult: (sessionStatus as any).generatorResult,
          conversationHistory: (sessionStatus as any).conversationHistory,
          // NEW: Two-phase fields
          analysisPhase: sessionStatus.analysisPhase,
          operationPhase: sessionStatus.operationPhase,
        }
      : null,
    isLoading: sessionStatus === undefined && !!sessionId,
  };
};

/**
 * Commit session changes - direct Convex mutation
 */
export const useConfirmEdit = () => {
  const commitSessionChanges = useMutation(
    api.sessionMutations.commitSessionChanges,
  );

  return {
    mutateAsync: async ({ sessionId }: { sessionId: string }) => {
      const result = await commitSessionChanges({ sessionId });
      return { success: result.success, message: result.message };
    },
    commitSessionChanges,
  };
};

/**
 * Revert session changes - direct Convex mutation
 */
export const useRejectEdit = () => {
  const revertSession = useMutation(api.sessionMutations.revertSession);

  return {
    mutateAsync: async ({ sessionId }: { sessionId: string }) => {
      const result = await revertSession({ sessionId });
      return { success: result.success, message: result.message };
    },
    revertSession,
  };
};

/**
 * Cancel a coding session (same as revert)
 */
export const useCancelSession = useRejectEdit;

/**
 * Get coding session results (same as status, no separate endpoint needed)
 */
export const useCodingResults = useCodingSessionStatus;

/**
 * Combined hook for managing a complete coding session workflow
 */
export const useVibeCodingSession = () => {
  const startSession = useStartCodingSession();
  const confirmEdit = useConfirmEdit();
  const rejectEdit = useRejectEdit();
  const cancelSession = useCancelSession();

  return {
    startSession,
    confirmEdit,
    rejectEdit,
    cancelSession,
    getSessionStatus: useCodingSessionStatus,
    getResults: useCodingSessionStatus,
  };
};

// Export helper functions from shared types
export {
  isActiveStatus,
  isCompletedStatus,
  isErrorStatus,
  isRevertedStatus,
} from "vibe-shared-types";

// Status checking helpers that work with the session data format
export const isSessionActive = (status?: SessionStatus): boolean => {
  return status?.status ? isActiveStatus(status.status) : false;
};

export const isSessionCompleted = (status?: SessionStatus): boolean => {
  return status?.status ? isCompletedStatus(status.status) : false;
};

export const isSessionErrored = (status?: SessionStatus): boolean => {
  return status?.status ? isErrorStatus(status.status) : false;
};

export const isSessionCancelled = (status?: SessionStatus): boolean => {
  return status?.status ? isRevertedStatus(status.status) : false;
};
