import React, { useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flow, ReadyState } from "@/modules/flow/domain";
import { Agent } from "@/modules/agent/domain";
import { UniqueEntityID } from "@/shared/domain";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { flowQueries } from "@/app/queries/flow-queries";
import { agentQueries } from "@/app/queries/agent-queries";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";
import { invalidateAllAgentQueries } from "@/flow-multi/utils/invalidate-agent-queries";

export interface FlowPanelProps {
  flowId: string;
  agentId?: string;
}

interface UseFlowPanelOptions extends FlowPanelProps {
  // Optional configuration
}

interface UseFlowPanelReturn {
  flow: Flow | null | undefined;
  agent: Agent | null | undefined;
  isLoading: boolean;
  error: Error | null;
  isSaving: boolean;
  lastInitializedAgentId: React.MutableRefObject<string | null>;
  saveFlow: (flow: Flow) => Promise<void>;
  updateAgent: (agentId: string, updates: Partial<Agent["props"]>) => Promise<void>;
}

/**
 * Common hook for flow panels that handles:
 * - Loading flow data with React Query
 * - Getting agent from flow
 * - Saving flow with proper invalidation
 * - Tracking initialization state
 */
export function useFlowPanel({ 
  flowId, 
  agentId 
}: UseFlowPanelOptions): UseFlowPanelReturn {
  const lastInitializedAgentId = useRef<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Load flow data
  const { 
    data: flow, 
    isLoading, 
    error 
  } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
  });

  // Load agent data separately
  const { 
    data: agent,
    isLoading: isAgentLoading,
    error: agentError
  } = useQuery({
    ...agentQueries.detail(agentId ? new UniqueEntityID(agentId) : undefined),
    enabled: !!agentId,
  });

  // Save flow with invalidation
  const saveFlow = useCallback(async (updatedFlow: Flow) => {
    if (isSaving) {
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await FlowService.saveFlow.execute(updatedFlow);
      
      if (result.isSuccess) {
        // Invalidate flow queries to refresh UI
        await invalidateSingleFlowQueries(updatedFlow.id);
      } else {
        console.error("[useFlowPanel] Failed to save flow:", result.getError());
        throw new Error(result.getError());
      }
    } catch (error) {
      console.error("[useFlowPanel] Error saving flow:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Helper to update an agent and save it
  const updateAgent = useCallback(async (
    targetAgentId: string, 
    updates: Partial<Agent["props"]>
  ) => {
    if (!targetAgentId) return;
    
    // Load the agent first
    const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(targetAgentId));
    if (agentResult.isFailure) {
      console.error("Failed to load agent:", agentResult.getError());
      return;
    }
    
    const agentToUpdate = agentResult.getValue();

    // Update the agent
    const updateResult = agentToUpdate.update(updates);
    if (updateResult.isFailure) {
      console.error("Failed to update agent:", updateResult.getError());
      return;
    }

    // Save the updated agent
    const saveResult = await AgentService.saveAgent.execute(agentToUpdate);
    if (saveResult.isFailure) {
      console.error("Failed to save agent:", saveResult.getError());
      return;
    }

    
    // Reset flow state when agent changes
    // If it was in Error state, keep it in Error state
    // If it was in Ready state, change to Draft
    if (flow && flow.props.readyState === ReadyState.Ready) {
      const updateFlowResult = flow.setReadyState(ReadyState.Draft);
      if (updateFlowResult.isSuccess) {
        await saveFlow(flow);
      }
    }
    
    // IMPORTANT: Also invalidate flow queries including validation
    // Agent changes affect flow validity, so we must refresh validation state
    if (flow) {
      await invalidateSingleFlowQueries(flow.id);
    }
  }, [flow, saveFlow]);

  return {
    flow,
    agent,
    isLoading: isLoading || isAgentLoading,
    error: error || agentError,
    isSaving,
    lastInitializedAgentId,
    saveFlow,
    updateAgent,
  };
}

// Common loading component for flow panels
export function FlowPanelLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-background-surface-2">
      <div className="text-text-subtle">{message}</div>
    </div>
  );
}

// Common error component for flow panels
export function FlowPanelError({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-background-surface-2">
      <div className="text-status-error">{message}</div>
    </div>
  );
}

// Common empty state component for flow panels
export function FlowPanelEmpty({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-background-surface-2">
      <div className="text-text-subtle text-center px-4">{message}</div>
    </div>
  );
}