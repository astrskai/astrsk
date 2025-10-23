import React, { useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flow } from "@/modules/flow/domain";
import { Agent } from "@/modules/agent/domain";
import { UniqueEntityID } from "@/shared/domain";
import { AgentService } from "@/app/services/agent-service";
import { flowQueries } from "@/app/queries/flow-queries";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { invalidateSingleFlowQueries } from "@/features/flow/flow-multi/utils/invalidate-flow-queries";

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
  lastInitializedAgentId: React.MutableRefObject<string | null>;
  updateAgent: (agentId: string, updates: Partial<Agent["props"]>) => Promise<void>;
}

/**
 * Common hook for flow panels that handles:
 * - Loading flow data with React Query
 * - Getting agent from flow
 * - Tracking initialization state
 */
export function useFlowPanel({ 
  flowId, 
  agentId 
}: UseFlowPanelOptions): UseFlowPanelReturn {
  const lastInitializedAgentId = useRef<string | null>(null);

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
    ...agentQueries.detail(agentId || ""),
    enabled: !!agentId,
  });

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

    
    // IMPORTANT: Invalidate flow queries including validation
    // Agent changes affect flow validity, so we must refresh validation state
    if (flow) {
      await invalidateSingleFlowQueries(flow.id);
    }
  }, [flow]);

  return {
    flow,
    agent,
    isLoading: isLoading || isAgentLoading,
    error: error || agentError,
    lastInitializedAgentId,
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