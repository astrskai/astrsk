import { useState, useMemo, useCallback, useRef } from "react";
import { debounce } from "lodash-es";
import { SearchInput } from "@/components-v2/search-input";
import { ParameterSettingsFields } from "@/flow-multi/panels/parameter/parameter-settings/parameter-settings-fields";
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { ParameterPanelProps } from "./parameter-panel-types";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";

interface ParameterUpdate {
  parameterId: string;
  enabled: boolean;
  value?: any;
}

export function ParameterPanel({ 
  flowId, 
  agentId 
}: ParameterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use the new flow panel hook
  const { 
    agent, 
    isLoading, 
    updateAgent
  } = useFlowPanel({ flowId, agentId });
  
  // Operation queue to prevent race conditions
  const operationQueueRef = useRef<ParameterUpdate[]>([]);
  const isProcessingRef = useRef(false);
  
  // Process queued operations sequentially with fresh data
  const processOperationQueue = useCallback(async () => {
    if (isProcessingRef.current || operationQueueRef.current.length === 0 || !agentId) {
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      // Get fresh agent data to avoid stale state
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) {
        console.error("Failed to get fresh agent data:", agentResult.getError());
        return;
      }
      
      const freshAgent = agentResult.getValue();
      
      // Apply all queued operations to fresh data
      const enabledParameters = new Map(freshAgent.props.enabledParameters);
      const parameterValues = new Map(freshAgent.props.parameterValues);
      
      // Process all queued operations
      const operations = [...operationQueueRef.current];
      operationQueueRef.current = []; // Clear queue
      
      for (const operation of operations) {
        enabledParameters.set(operation.parameterId, operation.enabled);
        if (operation.enabled && operation.value !== undefined) {
          parameterValues.set(operation.parameterId, operation.value);
        } else if (!operation.enabled) {
          parameterValues.delete(operation.parameterId);
        }
      }
      
      // Save all changes in one batch
      await updateAgent(agentId, {
        enabledParameters,
        parameterValues
      });
      
    } catch (error) {
      console.error("Error processing parameter operations:", error);
    } finally {
      isProcessingRef.current = false;
      
      // Process any new operations that came in while we were working
      if (operationQueueRef.current.length > 0) {
        setTimeout(() => processOperationQueue(), 0);
      }
    }
  }, [agentId, updateAgent]);
  
  // Debounced queue processor
  const debouncedProcessQueue = useMemo(
    () => debounce(processOperationQueue, 200),
    [processOperationQueue]
  );
  
  // Queue parameter changes instead of processing immediately
  const queueParameterChange = useCallback((parameterId: string, enabled: boolean, value?: any) => {
    // Add to queue, replacing any existing operation for the same parameter
    const existingIndex = operationQueueRef.current.findIndex(op => op.parameterId === parameterId);
    const newOperation: ParameterUpdate = { parameterId, enabled, value };
    
    if (existingIndex >= 0) {
      operationQueueRef.current[existingIndex] = newOperation;
    } else {
      operationQueueRef.current.push(newOperation);
    }
    
    // Process the queue after a short delay
    debouncedProcessQueue();
  }, [debouncedProcessQueue]);

  // Prepare initial values for ParameterSettingsFields
  const initialEnabledParameters = agent?.props.enabledParameters || new Map();
  const initialParameterValues = agent?.props.parameterValues || new Map();

  // Loading state
  if (isLoading) {
    return <FlowPanelLoading message="Loading parameters..." />;
  }

  // Empty state
  if (!agent) {
    return <FlowPanelError message="Agent not found" />;
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2 p-4">
      <SearchInput
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ParameterSettingsFields
        searchTerm={searchTerm}
        initialEnabledParameters={initialEnabledParameters}
        initialParameterValues={initialParameterValues}
        onParameterChange={queueParameterChange}
        className="flex-1"
      />
    </div>
  );
}