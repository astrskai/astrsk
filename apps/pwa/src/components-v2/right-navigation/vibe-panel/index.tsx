import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { vibeToast } from "./utils/vibe-toast";
import { cn } from "@/shared/utils";
import type {
  VibeAnalysisResult,
  VibeGeneratorResult,
} from "vibe-shared-types";
import { cardKeys } from "@/app/queries/card/query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { agentKeys } from "@/app/queries/agent/query-factory";
import { dataStoreNodeKeys } from "@/app/queries/data-store-node/query-factory";
import { ifNodeKeys } from "@/app/queries/if-node/query-factory";

// Hooks
import { useVibeSession } from "./hooks/use-vibe-session";
import { useMessageHistory } from "./hooks/use-message-history";
import { useResourceData } from "./hooks/use-resource-data";
import { useStartCodingSession } from "@/app/hooks/use-vibe-coding-convex";
import { useAppStore, Page } from "@/app/stores/app-store";
import { useAgentStore } from "@/app/stores/agent-store";
import { UniqueEntityID } from "@/shared/domain";
import { CardType } from "@/modules/card/domain";
import { VibeSessionService } from "@/app/services/vibe-session-service";

// Components
import { VibePanelHeader } from "./components/vibe-panel-header";
import { MessageList } from "./components/message-list";
import { ChatInput } from "./components/chat-input";

// Utilities
import {
  getResourceType,
} from "./utils/resource-helpers";
import {
  formatStepPlan,
  formatErrorMessage,
} from "./utils/message-formatter";
import { createSnapshotWithVerification } from "@/utils/snapshot-utils";
import {
  mapCharacterEditsToUpdates,
  mapPlotEditsToUpdates,
  applyCharacterCardUpdates,
  applyPlotCardUpdates,
  applyOperationsToResource,
} from "./utils/edit-mappers";
import {
  DataStoreFieldPipeline,
} from "@/utils/data-store-field-pipeline";

// Types
import { VibePanelProps, ReviewData, SimpleMessage } from "./types";

export const VibeCodingPanel: React.FC<VibePanelProps> = ({
  className,
  onToggle,
  isCollapsed: initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [appliedChanges, setAppliedChanges] = useState<
    { sessionId: string; resourceId: string }[]
  >([]);
  const queryClient = useQueryClient();

  // Get selected resource from app stores
  const selectedCardId = useAppStore((state) => state.selectedCardId);
  const selectedFlowId = useAgentStore((state) => state.selectedFlowId);
  const activePage = useAppStore((state) => state.activePage);

  // Determine primary resource based on active page
  const isCardPage = activePage === Page.Cards || activePage === Page.CardPanel;
  const isFlowPage = activePage === Page.Flow || activePage === Page.Agents;

  const primaryResourceId = useMemo(() => {
    if (isCardPage && selectedCardId) return selectedCardId;
    if (isFlowPage && selectedFlowId) return selectedFlowId;
    return null;
  }, [isCardPage, isFlowPage, selectedCardId, selectedFlowId]);

  // Load and prepare resource data
  const {
    resourceType: currentResourceType,
    resourceName: currentResourceName,
    editableData,
    selectedCard,
  } = useResourceData({
    selectedCardId,
    selectedFlowId,
    isCardPage,
    isFlowPage,
  });

  // Compute resource type based on current resource data
  const resourceType = useMemo(() => {
    if (isCardPage && selectedCard) {
      return selectedCard.props.type === CardType.Character ? 'character_card' : 'plot_card';
    } else if (isFlowPage && selectedFlowId) {
      return 'flow';
    }
    return null;
  }, [isCardPage, isFlowPage, selectedCard, selectedFlowId]);

  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    // addProcessingMessage,
    addEditApprovalMessage,
    addAnalysisReadyMessage,
    updateMessage,
    removeMessage,
    clearHistory,
    clearSession,
    getConversationHistory,
    isRestored,
  } = useMessageHistory({ 
    resourceId: primaryResourceId || undefined, 
    resourceType: resourceType || undefined
  });

  // Vibe session management
  const createSessionMutation = useStartCodingSession();

  const handleReviewReady = useCallback(
    (
      data: ReviewData,
      aiResults?: {
        analysis?: VibeAnalysisResult;
        generatorResult?: VibeGeneratorResult;
      },
    ) => {
      // Remove processing message
      const processingMsg = messages.find(
        (m) => m.isProcessing && m.sessionId === data.sessionId,
      );
      if (processingMsg) {
        removeMessage(processingMsg.id);
      }

      // ========== DATA STORE OPERATIONS VALIDATION ==========
      const operations = data.appliedChanges || [];
      if (operations.length > 0) {
        try {
          const validationResult =
            DataStoreFieldPipeline.validateBackendOperations(operations);

          if (validationResult.dataStoreOperations.length > 0) {
            if (!validationResult.success) {
              // Show validation errors to user but don't block the operation
              vibeToast.error(
                `Data store validation warnings: ${validationResult.errors.join(", ")}`,
              );
            } else {
              vibeToast.success(
                "Data store operations validated - UUID integrity maintained",
              );
            }
          }
        } catch (error) {
          console.warn("⚠️ [VIBE-PANEL] Data store validation failed:", error);
          // Don't block the operation if validation fails
        }
      }

      // Create comprehensive analysis summary
      let content = "";
      let operationCount = 0;
      let stepCount = 0;

      // Count operations from generator result
      if (aiResults?.generatorResult?.stepResults) {
        operationCount = aiResults.generatorResult.stepResults.length;
      }

      // Count steps from analysis
      if (aiResults?.analysis?.stepByStepPlan) {
        stepCount = aiResults.analysis.stepByStepPlan.length;
      }

      // Create the summary message requested by user
      const actualOperationCount =
        data.appliedChanges?.length || operationCount;
      content = `Based on the request "${data.original || "unknown request"}", I analyzed the resource data and generated ${actualOperationCount} structured operations across ${stepCount} steps to implement the requested changes.`;

      // Add step details if available
      if (
        aiResults?.analysis?.stepByStepPlan &&
        aiResults.analysis.stepByStepPlan.length > 0
      ) {
        content += "\n\nStep-by-step plan:\n";
        aiResults.analysis.stepByStepPlan.forEach((step, index) => {
          content += `${step.step}. ${step.description} (${step.estimatedComplexity} complexity)\n`;
        });
      }

      // Add reasoning if available
      if (aiResults?.generatorResult?.overallReasoning) {
        content += `\n\nAI Reasoning:\n${aiResults.generatorResult.overallReasoning}`;
      }

      addEditApprovalMessage(
        content,
        data,
        data.sessionId,
        aiResults?.analysis,
      );
    },
    [messages, removeMessage, addEditApprovalMessage],
  );

  const handleSimpleAnswer = useCallback(
    (answer: string) => {
      addAssistantMessage(answer);
    },
    [addAssistantMessage],
  );

  // NEW: Handle analysis ready (analysis complete, operations still generating)
  const handleAnalysisReady = useCallback(
    (analysis: VibeAnalysisResult, estimatedOps: number, processingTime: number) => {

      // Create analysis-ready message content
      const analysisContent = `## Analysis Complete

${formatStepPlan(analysis.stepByStepPlan || [])}

**Summary:**
- Estimated Operations: **${estimatedOps}**
- Analysis Time: **${processingTime}ms**

Operations are being generated and will be ready for review shortly.`;

      // Use addAnalysisReadyMessage for proper typing and structure
      addAnalysisReadyMessage(
        analysisContent,
        {
          analysis,
          estimatedOperations: estimatedOps,
          processingTime,
          operationStatus: 'generating',
        },
        primaryResourceId || undefined,
      );
    },
    [addAnalysisReadyMessage, primaryResourceId],
  );

  const handleSessionError = useCallback(
    (error: string, metadata?: any) => {
      // Session error occurred
      vibeToast.error(formatErrorMessage(error));

      // Remove processing message if exists
      const processingMsg = messages.find((m) => m.isProcessing);
      if (processingMsg) {
        removeMessage(processingMsg.id);
      }

      addAssistantMessage(`Error: ${formatErrorMessage(error)}`);
    },
    [messages, removeMessage, addAssistantMessage],
  );

  const {
    activeSessionId,
    isProcessing,
    sessionStatus,
    startSession,
    cancelSession,
  } = useVibeSession({
    primaryResourceId,
    resourceType: (resourceType as 'character_card' | 'plot_card' | 'flow') || undefined,
    onAnalysisReady: handleAnalysisReady,
    onReviewReady: handleReviewReady,
    onSimpleAnswer: handleSimpleAnswer,
    onError: handleSessionError,
  });

  // We'll initialize these hooks when we actually need to apply changes
  // since they require specific card/flow IDs

  // Handle sending message
  const handleSendMessage = useCallback(
    async (prompt: string) => {
      if (!primaryResourceId || !currentResourceType || !editableData) {
        console.error("❌ [VIBE-PANEL] Missing required data:", {
          primaryResourceId,
          currentResourceType,
          hasEditableData: !!editableData,
        });
        vibeToast.error("Please select a card or flow to edit");
        return;
      }

      // Add user message
      addUserMessage(prompt, [primaryResourceId]);

      // Create session
      const sessionId = new UniqueEntityID().toString();
      // const processingMessage = addProcessingMessage(sessionId);

      // ========== DATA STORE FIELD PIPELINE INTEGRATION ==========
      let enhancedContext: any = {
        availableResources: [
          {
            id: primaryResourceId,
            name: currentResourceName,
            type: currentResourceType,
            data: editableData,
          },
        ],
        conversationHistory: getConversationHistory(),
      };

      // Check if this is a flow request and detect data store field operations
      if (currentResourceType === "flow" && editableData) {

        try {
          const fieldPipelineResult =
            await DataStoreFieldPipeline.processFieldRequest(
              prompt,
              editableData,
              [], // TODO: Pass available data store nodes from flow
            );

          if (fieldPipelineResult.needsBackendAnalysis) {

            // Enhance context with data store analysis information
            enhancedContext = {
              ...enhancedContext,
              dataStoreAnalysis: {
                detected: true,
                fieldContext: fieldPipelineResult.detectedField,
                analysisContext: fieldPipelineResult.context,
              },
            };
          }
        } catch (error) {
          console.warn(
            "⚠️ [VIBE-PANEL] Data store field detection failed:",
            error,
          );
          // Continue with normal processing if detection fails
        }
      }
      // Log the full resource data being sent to backend
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📤 Full resource data being sent to backend:",
          JSON.stringify(
            {
              resourceId: primaryResourceId,
              resourceType: currentResourceType,
              resourceName: currentResourceName,
              data: editableData,
            },
            null,
            2,
          ),
        );
      }

      try {

        const result = await createSessionMutation.mutateAsync({
          originalRequest: prompt,
          context: enhancedContext,
        });

        if (result.success && result.data?.sessionId) {
          // Pass the actual resource data to the session for proper merging later
          const resourceDataMap = {
            [primaryResourceId]: editableData,
          };
          startSession(result.data.sessionId, resourceDataMap);
        }
      } catch (error) {
        handleSessionError(formatErrorMessage(error));
      }
    },
    [
      primaryResourceId,
      currentResourceType,
      currentResourceName,
      editableData,
      addUserMessage,
      // addProcessingMessage,
      createSessionMutation,
      getConversationHistory,
      startSession,
      sessionStatus,
      updateMessage,
      handleSessionError,
      removeMessage,
    ],
  );

  // Handle approve action
  const handleApprove = useCallback(
    async (messageId: string, sessionId: string, resourceId: string) => {
      
      const message = messages.find((m) => m.id === messageId);
      if (!message?.editData) {
        return;
      }

      const resourceType = getResourceType(message.editData.edited);

      try {
        if (resourceType === "flow") {
          
          // Create snapshot before applying changes
          await createSnapshotWithVerification(resourceId, 'flow', sessionId);
          
          // Apply flow changes using modern operation system
          const result = await applyOperationsToResource(
            resourceId,
            message.editData.appliedChanges,
            "flow",
          );

          if (result.success) {
            // Query invalidation is already handled by applyOperationsToResource via invalidateSingleFlowQueries
            // No need to duplicate the invalidation here
            vibeToast.success(
              `Flow changes applied successfully (${message.editData.appliedChanges.length} operations)`,
            );

            // Update button state immediately after toast
            setAppliedChanges((prev) => [
              ...prev,
              {
                sessionId,
                resourceId,
              },
            ]);
            updateMessage(messageId, {
              status: "approved",
            });
          } else {
            // Show a summary toast and individual error toasts
            vibeToast.error(
              `Failed to apply ${result.errors.length} operations out of ${message.editData.appliedChanges.length} total`,
            );
            result.errors.forEach((error, index) => {
              vibeToast.error(`Operation ${index + 1}: ${error}`, {
                duration: 5000,
                description: "Check console for details",
              });
            });
          }
        } else {
          // Apply card changes using operations
          if (resourceType === "character_card") {
            // Create snapshot before applying changes
            await createSnapshotWithVerification(resourceId, 'character_card', sessionId);
            
            // Check if we have individual operations to apply
            if (
              message.editData.appliedChanges &&
              message.editData.appliedChanges.length > 0
            ) {
              // Apply operations one by one using our operation system
              const result = await applyOperationsToResource(
                resourceId,
                message.editData.appliedChanges,
                "character_card",
              );

              if (result.success) {
                // Show success toast immediately
                vibeToast.success(
                  `Character card changes applied successfully (${message.editData.appliedChanges.length} operations)`,
                );

                // Update button state immediately after toast
                setAppliedChanges((prev) => [
                  ...prev,
                  {
                    sessionId,
                    resourceId,
                  },
                ]);
                updateMessage(messageId, {
                  status: "approved",
                });
                
                // Fire-and-forget card query invalidation
                queryClient.invalidateQueries({
                  queryKey: cardKeys.detail(resourceId),
                });
                queryClient.invalidateQueries({
                  queryKey: cardKeys.lists(),
                });
              } else {
                // Show a summary toast and individual error toasts
                vibeToast.error(
                  `Failed to apply ${result.errors.length} operations out of ${message.editData.appliedChanges.length} total`,
                );
                result.errors.forEach((error, index) => {
                  // Show detailed error with delay to avoid overwhelming the user
                  setTimeout(
                    () => vibeToast.error(`Error ${index + 1}: ${error}`),
                    index * 500,
                  );
                });
              }
            } else {
              // Fallback to old system using the processed result
              const updates = mapCharacterEditsToUpdates(
                message.editData.edited,
              );
              const result = await applyCharacterCardUpdates(
                resourceId,
                updates,
              );

              if (result.success) {
                // Show success toast immediately
                vibeToast.success(
                  "Character card changes applied successfully (legacy system)",
                );

                // Update button state immediately after toast
                setAppliedChanges((prev) => [
                  ...prev,
                  {
                    sessionId,
                    resourceId,
                  },
                ]);
                updateMessage(messageId, {
                  status: "approved",
                });
                
                // Fire-and-forget card query invalidation
                queryClient.invalidateQueries({
                  queryKey: cardKeys.detail(resourceId),
                });
                queryClient.invalidateQueries({
                  queryKey: cardKeys.lists(),
                });
              } else {
                vibeToast.error(
                  `Failed to apply character card updates: ${result.errors.length} errors`,
                );
                result.errors.forEach((error, index) => {
                  setTimeout(
                    () => vibeToast.error(`Error ${index + 1}: ${error}`),
                    index * 500,
                  );
                });
              }
            }
          } else {
            // Update plot card - use new operation system like character cards
            console.log("🎯 [PLOT-APPROVAL] Processing plot card approval:", {
              resourceId,
              hasAppliedChanges: !!message.editData.appliedChanges,
              appliedChangesCount: message.editData.appliedChanges?.length || 0,
              appliedChanges:
                message.editData.appliedChanges?.map((op) => ({
                  path: op.path,
                  operation: op.operation,
                  hasValue: !!op.value,
                })) || [],
            });

            // Create snapshot before applying changes
            await createSnapshotWithVerification(resourceId, 'plot_card', sessionId);

            if (
              message.editData.appliedChanges &&
              message.editData.appliedChanges.length > 0
            ) {
              console.log(
                "✅ [PLOT-APPROVAL] Calling applyOperationsToResource with:",
                {
                  resourceId,
                  operationCount: message.editData.appliedChanges.length,
                  operations: message.editData.appliedChanges,
                },
              );
              // Apply operations one by one using our operation system
              const result = await applyOperationsToResource(
                resourceId,
                message.editData.appliedChanges,
                "plot_card",
              );

              if (result.success) {
                // Show success toast immediately
                vibeToast.success(
                  `Plot card changes applied successfully (${message.editData.appliedChanges.length} operations)`,
                );

                // Update button state immediately after toast
                setAppliedChanges((prev) => [
                  ...prev,
                  {
                    sessionId,
                    resourceId,
                  },
                ]);
                updateMessage(messageId, {
                  status: "approved",
                });
                
                // Fire-and-forget card query invalidation
                queryClient.invalidateQueries({
                  queryKey: cardKeys.detail(resourceId),
                });
                queryClient.invalidateQueries({
                  queryKey: cardKeys.lists(),
                });
              } else {
                // Show a summary toast and individual error toasts
                vibeToast.error(
                  `Failed to apply ${result.errors.length} operations out of ${message.editData.appliedChanges.length} total`,
                );
                result.errors.forEach((error, index) => {
                  // Show detailed error with delay to avoid overwhelming the user
                  setTimeout(
                    () => vibeToast.error(`Error ${index + 1}: ${error}`),
                    index * 500,
                  );
                });
              }
            } else {
              // Fallback to legacy system if no operations
              const updates = mapPlotEditsToUpdates(message.editData.edited);
              const result = await applyPlotCardUpdates(resourceId, updates);

              if (result.success) {
                // Show success toast immediately
                vibeToast.success(
                  "Plot card changes applied successfully (legacy system)",
                );

                // Update button state immediately after toast
                setAppliedChanges((prev) => [
                  ...prev,
                  {
                    sessionId,
                    resourceId,
                  },
                ]);
                updateMessage(messageId, {
                  status: "approved",
                });
                
                // Fire-and-forget card query invalidation
                queryClient.invalidateQueries({
                  queryKey: cardKeys.detail(resourceId),
                });
                queryClient.invalidateQueries({
                  queryKey: cardKeys.lists(),
                });
              } else {
                vibeToast.error(
                  `Failed to apply plot card updates: ${result.errors.length} errors`,
                );
                result.errors.forEach((error, index) => {
                  setTimeout(
                    () => vibeToast.error(`Error ${index + 1}: ${error}`),
                    index * 500,
                  );
                });
              }
            }
          }
        }
      } catch (error) {
        vibeToast.error(`Failed to apply changes: ${formatErrorMessage(error)}`);
      }
    },
    [messages, updateMessage],
  );

  // Handle reject action
  const handleReject = useCallback(
    async (messageId: string, _sessionId: string, _resourceId: string) => {
      // Update message status
      updateMessage(messageId, {
        status: "rejected",
      });

      vibeToast.success("Changes rejected");
    },
    [updateMessage],
  );

  // Handle revert action using snapshots
  const handleRevert = useCallback(
    async (messageId: string, sessionId: string, resourceId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message?.editData) return;

      const resourceType = getResourceType(message.editData.edited);
      
      try {

        // Get the latest snapshot for this resource
        if (resourceType === "character_card" || resourceType === "plot_card" || resourceType === "flow") {
          const snapshotsResult = await VibeSessionService.getResourceSnapshots(
            resourceId, 
            resourceType
          );
          
          
          if (snapshotsResult.isSuccess) {
            const snapshots = snapshotsResult.getValue();
            
            if (snapshots.length > 0) {
              // Get the most recent snapshot
              const latestSnapshot = snapshots[0]; // Already sorted by timestamp desc
              
              // Revert to the snapshot
              const revertResult = await VibeSessionService.revertToSnapshot(
                resourceId,
                resourceType,
                latestSnapshot.id
              );
              
              if (revertResult.isSuccess) {
                
                // Show success toast immediately
                vibeToast.success(`Reverted to: ${latestSnapshot.description}`);
                
                // Invalidate queries to refresh UI in background (fire-and-forget)
                if (resourceType === "character_card" || resourceType === "plot_card") {
                  
                  // Fire-and-forget invalidations
                  queryClient.invalidateQueries({
                    queryKey: cardKeys.detail(resourceId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: cardKeys.lists(),
                  });
                  queryClient.refetchQueries({
                    queryKey: cardKeys.detail(resourceId),
                  });
                } else if (resourceType === "flow") {
                  
                  // Fire-and-forget background invalidation
                  (async () => {
                    try {
                      const { FlowService } = await import("@/app/services/flow-service");
                      const flowResult = await FlowService.getFlow.execute(
                        new UniqueEntityID(resourceId)
                      );
                      
                      if (flowResult.isSuccess) {
                        const flow = flowResult.getValue();
                        const agentIds = flow.agentIds.map(id => id.toString());
                        const dataStoreNodeIds = flow.dataStoreNodeIds.map(id => id.toString());
                        const ifNodeIds = flow.ifNodeIds.map(id => id.toString());
                        
                        // Fire-and-forget invalidations
                        queryClient.invalidateQueries({ queryKey: flowKeys.detail(resourceId) });
                        queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
                      
                        // Fire-and-forget invalidations for related resources
                        if (agentIds.length > 0) {
                          agentIds.forEach(agentId => {
                            queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
                          });
                          queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
                        }
                        
                        if (dataStoreNodeIds.length > 0) {
                          dataStoreNodeIds.forEach(nodeId => {
                            queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.detail(resourceId, nodeId) });
                          });
                          queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.all, exact: false });
                        }
                        
                        if (ifNodeIds.length > 0) {
                          ifNodeIds.forEach(nodeId => {
                            queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(resourceId, nodeId) });
                          });
                          queryClient.invalidateQueries({ queryKey: ifNodeKeys.all, exact: false });
                        }
                        
                        queryClient.refetchQueries({ queryKey: flowKeys.detail(resourceId) });
                        
                        // Notify flow panel of nodes/edges update to ensure UI reflects reverted state
                        const { notifyFlowNodesEdgesUpdate } = await import("@/utils/flow-local-state-sync");
                        const flowNodes = flow.props.nodes || [];
                        const flowEdges = (flow.props.edges || []).map((edge: any) => ({
                          ...edge,
                          type: edge.type || 'default'
                        }));
                        
                        console.log('🔄 [VIBE-REVERT] Notifying flow panel of reverted flow state:', {
                          flowId: resourceId.slice(0, 8) + '...',
                          nodeCount: flowNodes.length,
                          edgeCount: flowEdges.length
                        });
                        
                        notifyFlowNodesEdgesUpdate(resourceId, flowNodes, flowEdges);
                      
                      } else {
                        // Fallback invalidation
                        queryClient.invalidateQueries({ queryKey: flowKeys.detail(resourceId) });
                        queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
                      }
                    } catch (error) {
                      // Fallback invalidation
                      queryClient.invalidateQueries({ queryKey: flowKeys.detail(resourceId) });
                      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
                    }
                  })();
                }
              } else {
                vibeToast.error(`Failed to revert: ${revertResult.getError()}`);
              }
            } else {
              vibeToast.warning("No snapshots available to revert to");
            }
          } else {
            vibeToast.error(`Failed to get snapshots: ${snapshotsResult.getError()}`);
          }
        } else {
          vibeToast.warning("Revert is only supported for cards and flows currently");
        }
      } catch (error) {
        vibeToast.error(`Revert failed: ${formatErrorMessage(error)}`);
      }
    },
    [messages, updateMessage, queryClient],
  );

  // Handle collapse
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
    onToggle?.();
  }, [onToggle]);

  // Handle reset
  const handleReset = useCallback(async () => {
    await clearSession(); // Delete session from database and clear UI
    setAppliedChanges([]);
    cancelSession();
  }, [clearSession, cancelSession]);


  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "w-12 h-[calc(100vh-40px)] border-l bg-background",
          className,
        )}
      >
        <VibePanelHeader
          isCollapsed={true}
          onToggleCollapse={handleToggleCollapse}
          isRestored={isRestored}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-[calc(100vh-40px)] min-w-80 bg-background-surface-1 rounded-lg flex flex-col",
        className,
      )}
    >
      <VibePanelHeader
        isCollapsed={false}
        onToggleCollapse={handleToggleCollapse}
        isProcessing={isProcessing}
        onReset={handleReset}
        resourceName={currentResourceName}
        resourceType={
          currentResourceType === "flow"
            ? "flow"
            : currentResourceType
              ? "card"
              : null
        }
        isRestored={isRestored}
      />

      <MessageList
        messages={messages}
        resourceId={primaryResourceId}
        resourceName={currentResourceName}
        onApprove={handleApprove}
        onReject={handleReject}
        onRevert={handleRevert}
        appliedChanges={appliedChanges}
        isProcessing={isProcessing}
      />

      <div className="px-4 pb-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          hasResource={!!primaryResourceId}
          hasMessages={messages.length > 0}
        />
      </div>
      
    </div>
  );
};

export default VibeCodingPanel;
