import { useState, useEffect, useRef } from "react";
import { useCodingSessionStatus } from "@/app/hooks/use-vibe-coding-convex";
import { applyOperations } from "../lib/operation-processor";
import { VibeSessionService } from "@/app/services/vibe-session-service";
import { SESSION_STATUS } from "vibe-shared-types";
import { UniqueEntityID } from "@/shared/domain";
import type {
  VibeAnalysisResult,
  VibeGeneratorResult,
  StructuredChange,
} from "vibe-shared-types";

interface UseVibeSessionProps {
  primaryResourceId: string | null;
  resourceType?: 'character_card' | 'plot_card' | 'flow';
  onAnalysisReady?: (analysis: VibeAnalysisResult, estimatedOps: number, processingTime: number) => void;
  onReviewReady: (
    reviewData: any,
    aiResults?: {
      analysis?: VibeAnalysisResult;
      generatorResult?: VibeGeneratorResult;
    },
  ) => void;
  onSimpleAnswer: (answer: string) => void;
  onError: (error: string, metadata?: any) => void;
}

export function useVibeSession({
  primaryResourceId,
  resourceType,
  onAnalysisReady,
  onReviewReady,
  onSimpleAnswer,
  onError,
}: UseVibeSessionProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shownAnalysisForSession, setShownAnalysisForSession] = useState<
    string | null
  >(null);
  // Track processed sessions to prevent duplicate processing
  const [processedSessions, setProcessedSessions] = useState<Set<string>>(new Set());
  // Keep AI results even after session is cleared for display purposes
  const [lastAIResults, setLastAIResults] = useState<{
    analysis?: VibeAnalysisResult;
    generatorResult?: VibeGeneratorResult;
  } | null>(null);

  // Store unfiltered original data for proper merging
  const unfilteredOriginalDataRef = useRef<Record<string, any>>({});

  const sessionStatus = useCodingSessionStatus(activeSessionId);

  // Save session data for persistence
  const saveSessionData = async (
    operations: StructuredChange[],
    aiResults: {
      analysis?: VibeAnalysisResult;
      generatorResult?: VibeGeneratorResult;
    }
  ) => {
    if (!primaryResourceId || !resourceType) {
      return;
    }

    try {
      const sessionData = {
        sessionId: new UniqueEntityID().toString(),
        resourceId: primaryResourceId,
        resourceType,
        messages: [], // Messages are handled by useMessageHistory
        appliedChanges: operations,
        aiResults,
        conversationHistory: [], // Conversation history is handled by useMessageHistory
        snapshots: [], // Initialize empty snapshots array
        status: SESSION_STATUS.COMPLETED,
      };

      const result = await VibeSessionService.saveSession(
        primaryResourceId,
        resourceType,
        sessionData
      );

    } catch (error) {
      console.error("❌ [USE-VIBE-SESSION] Failed to save session:", error);
    }
  };

  // Handle session status changes
  useEffect(() => {
    if (!sessionStatus?.data || !activeSessionId) {
      // Reset processing state if no active session
      if (isProcessing && !activeSessionId) {
        setIsProcessing(false);
      }
      return;
    }

    // Handle simple answers
    if (
      sessionStatus.data.analysis?.isSimpleAnswer &&
      sessionStatus.data.analysis?.simpleAnswer &&
      shownAnalysisForSession !== activeSessionId
    ) {
      // Check if we've already processed this session to prevent duplicates
      if (!processedSessions.has(activeSessionId)) {
        setProcessedSessions(prev => new Set(prev).add(activeSessionId));
        onSimpleAnswer(sessionStatus.data.analysis.simpleAnswer);
        setShownAnalysisForSession(activeSessionId);
        setIsProcessing(false);

        // Store AI results and clear session for simple answers
        if (sessionStatus.data.status === SESSION_STATUS.COMPLETED) {
          setLastAIResults({
            analysis: sessionStatus.data.analysis,
            generatorResult: (sessionStatus.data as any)?.generatorResult,
          });
          setActiveSessionId(null);
        }
      } else {
        console.log(`🚫 [USE-VIBE-SESSION] Simple answer for session ${activeSessionId} already processed, skipping`);
      }
    }

    // Handle analysis_ready status (analysis complete, operations still generating)
    if (sessionStatus.data.status === SESSION_STATUS.ANALYSIS_READY && 
        sessionStatus.data.analysisPhase &&
        shownAnalysisForSession !== activeSessionId) {
      
      // Check if we've already processed this analysis to prevent duplicates
      if (!processedSessions.has(`${activeSessionId}-analysis`)) {
        setProcessedSessions(prev => new Set(prev).add(`${activeSessionId}-analysis`));
        
        const analysisPhase = (sessionStatus.data as any).analysisPhase;
        
        if (onAnalysisReady) {
          console.log(`🎯 [USE-VIBE-SESSION] Analysis ready for session ${activeSessionId}:`, {
            estimatedOps: analysisPhase.estimatedOperations,
            processingTime: analysisPhase.processingTimeMs,
            hasAnalysis: !!analysisPhase.analysis,
          });
          
          onAnalysisReady(
            analysisPhase.analysis,
            analysisPhase.estimatedOperations,
            analysisPhase.processingTimeMs
          );
        }
        
        setShownAnalysisForSession(activeSessionId);
        // Keep processing state - operations are still being generated
      } else {
        console.log(`🚫 [USE-VIBE-SESSION] Analysis for session ${activeSessionId} already processed, skipping`);
      }
    }

    // Handle session completion
    if (sessionStatus.data.status === SESSION_STATUS.COMPLETED && sessionStatus.data.found) {
      setIsProcessing(false);

      // Check if we've already processed this session to prevent duplicates
      if (processedSessions.has(activeSessionId)) {
        console.log(`🚫 [USE-VIBE-SESSION] Session ${activeSessionId} already processed, skipping`);
        return;
      }

      // Mark session as processed
      setProcessedSessions(prev => new Set(prev).add(activeSessionId));

      // Check if this was a simple answer (already handled above)
      if (
        sessionStatus.data.analysis?.isSimpleAnswer &&
        sessionStatus.data.analysis?.simpleAnswer
      ) {
        setLastAIResults({
          analysis: sessionStatus.data.analysis,
          generatorResult: (sessionStatus.data as any)?.generatorResult,
        });
        setActiveSessionId(null);
      }
      // Check if we have operations to apply and review
      else if (
        sessionStatus.data.appliedChanges &&
        sessionStatus.data.resourceSnapshots &&
        primaryResourceId
      ) {
        // Apply operations to create the edited resource
        const operations =
          sessionStatus.data.appliedChanges?.[primaryResourceId] || [];
        const originalSnapshot =
          sessionStatus.data.resourceSnapshots?.[primaryResourceId];

        // DEBUG: Log what frontend is receiving from backend
        console.log(`📨 [FRONTEND-OPERATIONS] Frontend received session data:`, {
          sessionId: activeSessionId,
          primaryResourceId,
          hasAppliedChanges: !!sessionStatus.data.appliedChanges,
          appliedChangesKeys: Object.keys(sessionStatus.data.appliedChanges || {}),
          hasOperationsForResource: operations.length > 0,
          operationsCount: operations.length,
          operationsPreview: operations.map((op: StructuredChange) => ({
            path: op.path,
            operation: op.operation,
            hasValue: op.value !== undefined
          })),
          hasResourceSnapshot: !!originalSnapshot,
          fullAppliedChanges: sessionStatus.data.appliedChanges,
          fullSessionData: sessionStatus.data
        });

        // Apply operations to show preview of changes
        // operations are already filtered by resourceId from sessionStatus.data.appliedChanges[primaryResourceId]
        const operationsToApply = operations;

        
        if (operationsToApply.length > 0) {
          // Use async operation processing for preview
          applyOperations(originalSnapshot, operationsToApply, primaryResourceId)
            .then(({ result, errors, successCount }) => {

              // Continue with the processed result
              processPreviewResult(result);
            })
            .catch(error => {
              console.error(`❌ [PREVIEW-OPERATIONS] Failed to apply operations for preview:`, error);
              // Fallback to original snapshot if operation processing fails
              processPreviewResult(originalSnapshot);
            });
          
          // Early return - async processing will handle the rest
          return;
        }
        
        // If no operations, process immediately with original snapshot
        processPreviewResult(originalSnapshot);
        
        function processPreviewResult(editedResource: any) {
          const filteredSnapshotFromBackend =
            sessionStatus.data?.resourceSnapshots?.[primaryResourceId!];

          // Use the unfiltered original data we stored earlier for proper merging
          const originalResourceForMerging =
            unfilteredOriginalDataRef.current[primaryResourceId!] ||
            filteredSnapshotFromBackend;

          // Helper function to deep merge edited changes into original resource
          const deepMergeChanges = (original: any, edited: any) => {
            // Deep clone the original to avoid mutations
            const result = JSON.parse(JSON.stringify(original));

            // Deep merge function that handles arrays specially
            const merge = (target: any, source: any, path: string = "") => {
              Object.keys(source).forEach((key) => {
                // Prevent prototype pollution
                if (key === "__proto__" || key === "constructor" || key === "prototype") {
                  return;
                }
                const currentPath = path ? `${path}.${key}` : key;

                if (source[key] === null) {
                  // Explicitly set null values
                  target[key] = null;
                } else if (Array.isArray(source[key])) {
                  // For arrays, completely replace them
                  target[key] = source[key];
                } else if (
                  typeof source[key] === "object" &&
                  source[key] !== null
                ) {
                  // For objects, ensure target has the key as an object and recurse
                  if (
                    !target[key] ||
                    typeof target[key] !== "object" ||
                    Array.isArray(target[key])
                  ) {
                    target[key] = {};
                  }
                  merge(target[key], source[key], currentPath);
                } else {
                  // For primitive values, just set them
                  target[key] = source[key];
                }
              });
            };

            merge(result, edited);
            return result;
          };

          // Merge the edited resource with the original to preserve unedited fields
          const mergedResource = deepMergeChanges(
            originalResourceForMerging,
            editedResource,
          );

          onReviewReady(
            {
              sessionId: activeSessionId,
              resourceId: primaryResourceId,
              original: originalResourceForMerging,
              edited: mergedResource,
              appliedChanges:
                sessionStatus.data?.appliedChanges?.[primaryResourceId!] || [],
            },
            {
              analysis: sessionStatus.data?.analysis,
              generatorResult: (sessionStatus.data as any)?.generatorResult,
            },
          );

          // Store AI results for display even after session is cleared
          setLastAIResults({
            analysis: sessionStatus.data?.analysis,
            generatorResult: (sessionStatus.data as any)?.generatorResult,
          });

          // Auto-save session on completion
          saveSessionData(
            operations,
            {
              analysis: sessionStatus.data?.analysis,
              generatorResult: (sessionStatus.data as any)?.generatorResult,
            }
          );

          // Clear active session as we're moving to review
          setActiveSessionId(null);
          setIsProcessing(false);
        }
      }
    }

    // Handle errors
    if (sessionStatus.data.status === SESSION_STATUS.ERROR) {
      const errorMessage =
        (sessionStatus.data as any)?.errorDetails ||
        "Session encountered an error";
      const errorMetadata = (sessionStatus.data as any)?.errorMetadata;

      onError(errorMessage, errorMetadata);
      setIsProcessing(false);
      setActiveSessionId(null);
    }

    // Safety check: ensure processing is reset for any completed session
    if (sessionStatus.data.status === SESSION_STATUS.COMPLETED && isProcessing) {
      setIsProcessing(false);
    }
  }, [
    sessionStatus?.data?.status,
    activeSessionId,
    primaryResourceId,
    shownAnalysisForSession,
    isProcessing,
    onAnalysisReady,
    onReviewReady,
    onSimpleAnswer,
    onError,
    processedSessions,
  ]);

  const startSession = (
    sessionId: string,
    resourceData: Record<string, any>,
  ) => {
    setActiveSessionId(sessionId);
    setIsProcessing(true);
    unfilteredOriginalDataRef.current = resourceData;
  };

  const cancelSession = () => {
    setActiveSessionId(null);
    setIsProcessing(false);
    setLastAIResults(null); // Clear AI results when manually cancelling
  };

  return {
    activeSessionId,
    isProcessing,
    sessionStatus: sessionStatus?.data,
    // Return AI results from active session OR preserved results from last completed session
    analysis:
      (sessionStatus?.data?.analysis as VibeAnalysisResult | undefined) ||
      lastAIResults?.analysis,
    generatorResult:
      ((sessionStatus?.data as any)?.generatorResult as
        | VibeGeneratorResult
        | undefined) || lastAIResults?.generatorResult,
    startSession,
    cancelSession,
  };
}
