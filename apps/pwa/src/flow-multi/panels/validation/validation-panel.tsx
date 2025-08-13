import { useCallback, useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { Button } from "@/components-v2/ui/button";
import { cn } from "@/shared/utils";
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { ValidationPanelProps } from "./validation-panel-types";
import { useQueries } from "@tanstack/react-query";
import { IssueItem } from "./issue-item";
import { Agent } from "@/modules/agent/domain";
import { ReadyState } from "@/modules/flow/domain";
import { ValidationIssue, ValidationContext } from "@/flow-multi/validation/types/validation-types";
import { agentQueries } from "@/app/queries/agent-queries";
import { useApiConnectionsWithModels } from "@/app/hooks/use-api-connections-with-models";
import { traverseFlowCached } from "@/flow-multi/utils/flow-traversal-cache";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";
import { invalidateAllAgentQueries } from "@/flow-multi/utils/invalidate-agent-queries";
import {
  validateFlowPath,
  validateModelSelection,
  validateAgentName,
  validatePromptMessages,
  validateStructuredOutput,
  validateSystemMessagePlacement,
  validateGeminiMessageStructure,
  validateHistoryMessage,
  validateUndefinedOutputVariables,
  validateUnusedOutputVariables,
  validateUnusedDataStoreFields,
  validateTemplateSyntax,
  validateStructuredOutputSupport,
  validateProviderParameters,
  validateDataStoreSchemaInitialValues,
} from "@/flow-multi/validation/validators";

export function ValidationPanel({ flowId }: ValidationPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [apiConnectionsWithModels] = useApiConnectionsWithModels();
  const [hasLoadedInitialIssues, setHasLoadedInitialIssues] = useState(false);
  
  // Use the flow panel hook
  const { 
    flow,
    isLoading,
    saveFlow
  } = useFlowPanel({ flowId });
  
  // Query all agents using the same pattern as preview panel
  const agentIds = flow?.agentIds || [];
  const agentQueriesResults = useQueries({
    queries: agentIds.map(agentId => ({
      ...agentQueries.detail(agentId),
      enabled: !!flow,
    })),
  });
  
  // Get connected agents, nodes and agent positions from flow traversal
  const { connectedAgents, connectedNodes, agentPositions } = useMemo(() => {
    if (!flow) return { 
      connectedAgents: new Set<string>(), 
      connectedNodes: new Set<string>(),
      agentPositions: new Map()
    };
    
    const traversalResult = traverseFlowCached(flow);
    const agents = new Set<string>();
    
    for (const [agentId, position] of traversalResult.agentPositions) {
      if (position.isConnectedToStart && position.isConnectedToEnd) {
        agents.add(agentId);
      }
    }
    
    // Build connected nodes set (includes all process nodes: agents, if, dataStore)
    const nodes = new Set<string>(traversalResult.connectedSequence);
    
    return {
      connectedAgents: agents,
      connectedNodes: nodes,
      agentPositions: traversalResult.agentPositions
    };
  }, [flow]);
  
  // Convert agents to Map for validation context
  const agentsMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agentQueriesResults.forEach((query, index) => {
      if (query.data && agentIds[index]) {
        map.set(agentIds[index].toString(), query.data);
      }
    });
    return map;
  }, [agentQueriesResults, agentIds]);
  
  // Check if any agents are still loading
  const isLoadingAgents = agentQueriesResults.some(query => query.isLoading);
  
  // Load validation issues from flow when it first loads
  useEffect(() => {
    if (flow && flow.props.validationIssues && !hasLoadedInitialIssues) {
      setValidationIssues(flow.props.validationIssues);
      setHasLoadedInitialIssues(true);
      // Mark that validation has been run if we loaded issues from flow
      setHasRunValidation(true);
    }
  }, [flow, hasLoadedInitialIssues]);
  
  // Validate function
  const runValidation = useCallback(() => {
    if (!flow || !agentsMap.size) {
      return;
    }
    
    // Create validation context
    const context: ValidationContext = {
      flow,
      agents: agentsMap,
      connectedAgents,
      connectedNodes,
      agentPositions,
      apiConnectionsWithModels,
    };
    
    const allIssues: ValidationIssue[] = [];
    
    // VALIDATION CHECKLIST:
    // ✅ validateFlowPath - correctly implemented
    // ✅ validateModelSelection - correctly implemented
    // ✅ validateAgentName - now validates: missing name, min 3 chars, no duplicates
    // ✅ validatePromptMessages - correctly implemented
    // ✅ validateStructuredOutput - correctly implemented
    // ✅ validateSystemMessagePlacement - checks for non-system messages between system messages (Google & Claude only)
    // ✅ validateGeminiMessageStructure - checks if user/history message comes right after last system message
    // ✅ validateHistoryMessage - correctly implemented
    // ✅ validateUndefinedOutputVariables - now excludes Jinja2 loop variables (for, set)
    // ✅ validateUnusedOutputVariables - now checks for parent agent usage (e.g., {{analyzer}})
    // ✅ validateTemplateSyntax
    // ✅ validateStructuredOutputSupport - shows "unverified" warning for unknown models on OpenRouter/OpenAI-compatible
    // ✅ validateProviderParameters - validates parameter min/max ranges, shows warnings for undefined parameters
    
    // Run each validator and collect issues
    // Flow structure validators
    allIssues.push(...validateFlowPath(context));
    
    // Agent configuration validators
    allIssues.push(...validateModelSelection(context));
    allIssues.push(...validateAgentName(context));
    allIssues.push(...validatePromptMessages(context));
    allIssues.push(...validateStructuredOutput(context));
    
    // Message structure validators
    allIssues.push(...validateSystemMessagePlacement(context));
    allIssues.push(...validateGeminiMessageStructure(context));
    allIssues.push(...validateHistoryMessage(context));
    
    // Variable validators
    allIssues.push(...validateUndefinedOutputVariables(context));
    allIssues.push(...validateUnusedOutputVariables(context));
    allIssues.push(...validateUnusedDataStoreFields(context));
    allIssues.push(...validateTemplateSyntax(context));
    
    // Data store validators
    allIssues.push(...validateDataStoreSchemaInitialValues(context));
    
    // Provider compatibility validators
    allIssues.push(...validateStructuredOutputSupport(context));
    allIssues.push(...validateProviderParameters(context));
    
    // Sort issues: errors first, then warnings
    allIssues.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === 'error' ? -1 : 1;
    });
    
    setValidationIssues(allIssues);
    setHasRunValidation(true);
    
    // Update flow state and validation issues based on validation results
    const hasErrors = allIssues.some(issue => issue.severity === 'error');
    if (flow) {
      let needsSave = false;
      let updatedFlow = flow;
      
      // Update validation issues
      const updateIssuesResult = updatedFlow.update({ validationIssues: allIssues });
      if (updateIssuesResult.isSuccess) {
        needsSave = true;
      }
      
      // Update ready state
      if (hasErrors && flow.props.readyState !== ReadyState.Error) {
        // Set to Error state if there are errors
        const updateFlowResult = updatedFlow.setReadyState(ReadyState.Error);
        if (updateFlowResult.isSuccess) {
          needsSave = true;
        }
      } else if (!hasErrors && flow.props.readyState !== ReadyState.Ready) {
        // Set to Ready state if there are no errors
        const updateFlowResult = updatedFlow.setReadyState(ReadyState.Ready);
        if (updateFlowResult.isSuccess) {
          needsSave = true;
        }
      }
      
      // Save flow if any changes were made
      if (needsSave) {
        saveFlow(updatedFlow).catch(error => {
          console.error('Failed to save flow with validation results:', error);
        });
      }
    }
  }, [flow, agentsMap, connectedAgents, apiConnectionsWithModels, saveFlow]);
  
  // Track if we had a successful validation (no errors) before
  const [hadSuccessfulValidation, setHadSuccessfulValidation] = useState(false);
  // Track if validation has been run at least once
  const [hasRunValidation, setHasRunValidation] = useState(false);
  
  // Track flow readyState changes
  useEffect(() => {
    // Update hadSuccessfulValidation based on current validation state
    if (validationIssues.length > 0) {
      const hasErrors = validationIssues.some(issue => issue.severity === 'error');
      setHadSuccessfulValidation(!hasErrors);
    }
  }, [validationIssues]);
  
  // Validation will only run when refresh button is pressed
  
  // Refresh handler - invalidates data and runs validation
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate queries to trigger refetch
      await Promise.all([
        invalidateSingleFlowQueries(flowId),
        invalidateAllAgentQueries() // This will invalidate all agent detail queries
      ]);
      
      // Wait for queries to update, then run validation
      setTimeout(() => {
        runValidation();
        setIsRefreshing(false);
      }, 500); // Give React Query time to update
    } catch (error) {
      console.error('Failed to refresh validation data:', error);
      setIsRefreshing(false);
    }
  }, [flowId, runValidation]);
  
  // Loading state
  if (isLoading || isLoadingAgents) {
    return <FlowPanelLoading message="Validating flow..." />;
  }
  
  // Error state
  if (!flow) {
    return <FlowPanelError message="Flow not found" />;
  }
  
  return (
    <div className="h-full p-2 bg-background-surface-2 flex flex-col overflow-hidden">
      <div className="flex-1 min-w-44 flex flex-col overflow-hidden">
        {/* Refresh button */}
        <div className="py-4 flex justify-center items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-light"
          >
            <RefreshCw className={cn(
              "min-w-4 min-h-4",
              isRefreshing && "animate-spin"
            )} />
            <span className="text-xs font-semibold">Refresh</span>
          </Button>
        </div>
        
        {/* Validation issues list */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="flex flex-col">
            {(() => {
              const hasErrors = validationIssues.some(issue => issue.severity === 'error');
              const warnings = validationIssues.filter(issue => issue.severity === 'warning');
              
              // If no validation has been run yet, show appropriate message based on state
              if (validationIssues.length === 0) {
                if (flow.props.readyState === ReadyState.Draft) {
                  return (
                    <IssueItem
                      variant="draft"
                      title="Draft"
                      description='Your flow has been updated. Click "Refresh" to validate'
                    />
                  );
                } else if (flow.props.readyState === ReadyState.Error) {
                  return (
                    <IssueItem
                      variant="error"
                      title="Error"
                      description='Your flow has been updated. Click "Refresh" to validate'
                    />
                  );
                }
              }
              
              // If flow is in draft/error state but we previously had successful validation (with warnings)
              if ((flow.props.readyState === ReadyState.Draft || flow.props.readyState === ReadyState.Error) && hadSuccessfulValidation && !hasErrors) {
                return (
                  <>
                    <IssueItem
                      variant={flow.props.readyState === ReadyState.Error ? "error" : "draft"}
                      title={flow.props.readyState === ReadyState.Error ? "Error" : "Draft"}
                      description='Your flow has been updated. Click "Refresh" to validate'
                    />
                    {/* Keep showing previous warnings */}
                    {warnings.map((issue) => (
                      <IssueItem
                        key={issue.id}
                        variant={issue.severity}
                        title={issue.title}
                        description={issue.description}
                        suggestion={issue.suggestion}
                      />
                    ))}
                  </>
                );
              }
              
              // If validation passed (Ready state or after validation with no errors)
              // Show ready message when validation has run and there are no errors
              if (!hasErrors && hasRunValidation) {
                return (
                  <>
                    <IssueItem
                      variant="success"
                      title="Now you are ready!"
                      description="There's no error in your flow"
                    />
                    {/* Show warnings if any */}
                    {warnings.map((issue) => (
                      <IssueItem
                        key={issue.id}
                        variant={issue.severity}
                        title={issue.title}
                        description={issue.description}
                        suggestion={issue.suggestion}
                      />
                    ))}
                  </>
                );
              }
              
              // Show all issues if there are errors
              return validationIssues.map((issue) => (
                <IssueItem
                  key={issue.id}
                  variant={issue.severity}
                  title={issue.title}
                  description={issue.description}
                  suggestion={issue.suggestion}
                />
              ));
            })()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}