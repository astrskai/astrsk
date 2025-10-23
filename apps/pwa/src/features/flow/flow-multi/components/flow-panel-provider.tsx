import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { DockviewApi } from "dockview";
import type { IDockviewPanel } from "dockview-core";
import { 
  PanelType, 
  getPanelTitle,
} from "@/features/flow/flow-multi/components/panel-types";
import { Agent } from "@/entities/agent/domain/agent";
import { Node } from "@/entities/flow/domain/flow";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { getAgentHexColor, getAgentState } from "@/features/flow/flow-multi/utils/node-color-assignment";


interface FlowPanelContextType {
  flowId: string;
  api: DockviewApi | null;
  openPanel: (panelType: PanelType, agentId?: string) => void;
  closePanel: (panelId: string) => void;
  isPanelOpen: (panelType: PanelType, agentId?: string) => boolean;
  updateAgentPanelStates: (agentId: string) => void;
  updateNodePanelStates: (nodeId: string, nodeName: string) => void;
  // Node creation functions
  addDataStoreNode: () => void;
  addIfNode: () => void;
  registerFlowActions: (actions: {
    addDataStoreNode: () => void;
    addIfNode: () => void;
  }) => void;
  // Monaco editor tracking for variable insertion (single source of truth)
  lastMonacoEditor: {
    agentId: string | null;
    panelId: string | null;
    editor: any;
    position: any;
  } | null;
  setLastMonacoEditor: (
    agentId: string | null,
    panelId: string | null,
    editor: any,
    position: any,
  ) => void;
  insertVariableAtLastCursor: (variableValue: string) => void;
  // Regular input field tracking for variable insertion
  lastInputField: {
    nodeId: string | null;
    fieldId: string | null;
    element: HTMLInputElement | null;
    onChange?: (value: string) => void;
  } | null;
  setLastInputField: (
    nodeId: string | null,
    fieldId: string | null,
    element: HTMLInputElement | null,
    onChange?: (value: string) => void,
  ) => void;
  insertVariableAtInputField: (variableValue: string) => void;
}

const FlowPanelContext = createContext<FlowPanelContextType | null>(null);

export function useFlowPanelContext() {
  const context = useContext(FlowPanelContext);
  if (!context) {
    throw new Error("useFlowPanelContext must be used within FlowPanelProvider");
  }
  
  return context;
}

interface FlowPanelProviderProps {
  children: React.ReactNode;
  flowId: string;
  api: DockviewApi | null;
  openPanel?: (panelType: PanelType, agentId?: string) => void;
}

export function FlowPanelProvider({
  children,
  flowId,
  api,
  openPanel,
}: FlowPanelProviderProps) {
  
  // Panel visibility state tracking to trigger re-renders
  const [panelVisibilityTrigger, setPanelVisibilityTrigger] = useState(0);
  
  // Store flow actions that will be registered by FlowPanel
  const [flowActions, setFlowActions] = useState<{
    addDataStoreNode: () => void;
    addIfNode: () => void;
  }>({
    addDataStoreNode: () => console.warn('addDataStoreNode not yet registered'),
    addIfNode: () => console.warn('addIfNode not yet registered'),
  });
  
  // Function to register flow actions
  const registerFlowActions = useCallback((actions: {
    addDataStoreNode: () => void;
    addIfNode: () => void;
  }) => {
    setFlowActions(actions);
  }, []);
  
  // Fetch flow data to get agent information
  const { data: flow } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
    enabled: !!flowId,
  });

  // Monaco editor tracking for variable insertion (single source of truth)
  const [lastMonacoEditor, setLastMonacoEditorState] = React.useState<{
    agentId: string | null;
    panelId: string | null;
    editor: any;
    position: any;
  } | null>(null);

  // Regular input field tracking for variable insertion
  const [lastInputField, setLastInputFieldState] = React.useState<{
    nodeId: string | null;
    fieldId: string | null;
    element: HTMLInputElement | null;
    onChange?: (value: string) => void;
  } | null>(null);

  // Monaco editor functions
  const setLastMonacoEditor = React.useCallback((
    agentId: string | null,
    panelId: string | null,
    editor: any,
    position: any,
  ) => {
    setLastMonacoEditorState({
      agentId,
      panelId,
      editor,
      position,
    });
    // Clear input field when monaco is focused
    setLastInputFieldState(null);
  }, []);

  const insertVariableAtLastCursor = React.useCallback((variableValue: string) => {
    if (lastMonacoEditor && lastMonacoEditor.editor && lastMonacoEditor.position) {
      try {
        lastMonacoEditor.editor.executeEdits("variable-insert", [
          {
            range: {
              startLineNumber: lastMonacoEditor.position.lineNumber,
              startColumn: lastMonacoEditor.position.column,
              endLineNumber: lastMonacoEditor.position.lineNumber,
              endColumn: lastMonacoEditor.position.column,
            },
            text: variableValue,
          },
        ]);

        // Update cursor position after insertion
        const newPosition = {
          lineNumber: lastMonacoEditor.position.lineNumber,
          column: lastMonacoEditor.position.column + variableValue.length,
        };
        lastMonacoEditor.editor.setPosition(newPosition);
        lastMonacoEditor.editor.focus();

        // Update stored position
        setLastMonacoEditorState(prev => prev ? {
          ...prev,
          position: newPosition,
        } : null);
      } catch (error) {
        // Ignore errors silently like the original implementation
      }
    }
  }, [lastMonacoEditor]);

  // Regular input field functions
  const setLastInputField = React.useCallback((
    nodeId: string | null,
    fieldId: string | null,
    element: HTMLInputElement | null,
    onChange?: (value: string) => void,
  ) => {
    setLastInputFieldState({
      nodeId,
      fieldId,
      element,
      onChange,
    });
    // Clear monaco editor when input is focused
    setLastMonacoEditorState(null);
  }, []);

  const insertVariableAtInputField = React.useCallback((variableValue: string) => {
    if (lastInputField && lastInputField.element) {
      try {
        const input = lastInputField.element;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value;
        
        // Insert the variable at cursor position
        const newValue = currentValue.slice(0, start) + variableValue + currentValue.slice(end);
        
        // Call the onChange handler if provided
        if (lastInputField.onChange) {
          lastInputField.onChange(newValue);
        }
        
        // Also update the input value directly for immediate visual feedback
        input.value = newValue;
        
        // Set cursor position after the inserted text
        const newPosition = start + variableValue.length;
        input.setSelectionRange(newPosition, newPosition);
        
        // Focus the input
        input.focus();
      } catch (error) {
        // Ignore errors silently
      }
    }
  }, [lastInputField]);


  // Close a panel
  const closePanel = useCallback(
    (panelId: string) => {
      if (!api) return;
      
      const panel = api.getPanel(panelId);
      if (panel) {
        api.removePanel(panel);
      }
    },
    [api]
  );

  // Listen for panel changes to trigger re-renders
  useEffect(() => {
    if (!api) return;
    
    const handlePanelChange = () => {
      // Increment trigger to force re-render of components using isPanelOpen
      setPanelVisibilityTrigger(prev => prev + 1);
    };
    
    const disposables = [
      api.onDidAddPanel(handlePanelChange),
      api.onDidRemovePanel(handlePanelChange),
    ];
    
    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [api]);

  // Unified function to check if a panel is open (agent-specific or standalone)
  const isPanelOpen = useCallback((panelType: PanelType, agentId?: string): boolean => {
    if (!api) return false;
    
    // Use panelVisibilityTrigger to ensure this function re-evaluates when panels change
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    panelVisibilityTrigger;
    
    if (agentId) {
      // Check for agent-specific panel ID patterns
      const possiblePanelIds = [
        `${panelType}-${agentId}`,              // FlowPanelMainCompact format
        `${panelType}-${agentId}-${flowId}`,    // FlowPanelProvider format
      ];
      
      // Also check by iterating through all panels and matching by params
      const allPanels = Object.values(api.panels);
      return allPanels.some((panel: IDockviewPanel) => {
        // Check exact panel ID match
        if (possiblePanelIds.includes(panel.id)) {
          return true;
        }
        
        // Check by panel params (agentId and panel type)
        if (panel.params?.agentId === agentId) {
          const panelTypeFromId = panel.id.split('-')[0];
          return panelTypeFromId === panelType;
        }
        
        return false;
      });
    } else {
      // Check for standalone panel ID patterns
      const possiblePanelIds = [
        `${panelType}-standalone`,          // FlowPanelMainCompact format
        `${panelType}-${flowId}`,          // FlowPanelProvider format
      ];
      
      // Also check by iterating through all panels and matching by type and flow
      const allPanels = Object.values(api.panels);
      return allPanels.some((panel: IDockviewPanel) => {
        // Check exact panel ID match
        if (possiblePanelIds.includes(panel.id)) {
          return true;
        }
        
        // Check by panel type and no agentId (standalone)
        const panelTypeFromId = panel.id.split('-')[0];
        return panelTypeFromId === panelType && 
               panel.params?.flowId === flowId &&
               !panel.params?.agentId;
      });
    }
  }, [api, flowId, panelVisibilityTrigger]);

  // Function to update agent panel states when agent connectivity changes
  const updateAgentPanelStates = useCallback(async (agentId: string) => {
    if (!api || !flow) return;
    // Get the most up-to-date agent data
    const agentResult = await AgentService.getAgent.execute(
      new UniqueEntityID(agentId)
    );
    
    if (!agentResult.isSuccess) return;
    
    const agent = agentResult.getValue();

    if (!agent) return;
    
    // Get current agent state
    const agentColor = getAgentHexColor(agent);
    const agentInactive = getAgentState(agent, flow);
    
    // Find all panels for this agent
    const allPanels = Object.values(api.panels);
    const agentPanels = allPanels.filter((panel: IDockviewPanel) => 
      panel.params?.agentId === agentId
    );
    
    // Update each panel's parameters
    agentPanels.forEach((panel: IDockviewPanel) => {
      // Get the panel type from the panel ID
      const panelType = panel.id.split('-')[0] as PanelType;
      const panelTitle = getPanelTitle(panelType, agent.props.name);
      
      const updatedParams = {
        ...panel.params,
        agentColor,
        agentInactive,
        title: panelTitle,
      };
      
      // Update the panel's parameters
      if (panel.api && panel.api.updateParameters) {
        panel.api.updateParameters(updatedParams);
      }
      
      // Force a re-render by updating the panel params directly if possible
      if ((panel as any).params) {
        Object.assign((panel as any).params, updatedParams);
      }
    });
  }, [api, flow]);

  // Function to update node panel states when node names change
  const updateNodePanelStates = useCallback((nodeId: string, nodeName: string) => {
    if (!api || !flow) return;
    
    // Get the node from flow to get its color
    const node = flow.props.nodes.find((n: Node) => n.id === nodeId);
    if (!node) return;
    
    const nodeData = node.data as any;
    const nodeColor = nodeData?.color as string | undefined;
    
    // Find all panels for this node (could be ifNode, dataStore, or dataStoreSchema)
    const allPanels = Object.values(api.panels);
    const nodePanels = allPanels.filter((panel: IDockviewPanel) => {
      // Check if panel is for this node
      // Node panels can have nodeId or agentId as the parameter
      return panel.params?.nodeId === nodeId || 
             (panel.params?.agentId === nodeId && 
              (panel.id.startsWith('ifNode') || 
               panel.id.startsWith('dataStore')));
    });
    
    // Update each panel's parameters
    nodePanels.forEach((panel: IDockviewPanel) => {
      // Get the panel type from the panel ID
      const panelType = panel.id.split('-')[0] as PanelType;
      const panelTitle = getPanelTitle(panelType, nodeName);
      
      const updatedParams = {
        ...panel.params,
        title: panelTitle,
        ...(nodeColor && { agentColor: nodeColor })
      };
      
      // Update the panel's parameters
      if (panel.api && panel.api.updateParameters) {
        panel.api.updateParameters(updatedParams);
      }
      
      // Force a re-render by updating the panel params directly if possible
      if ((panel as any).params) {
        Object.assign((panel as any).params, updatedParams);
      }
    });
  }, [api, flow]);

  // Provide a default implementation for openPanel when it's not provided as a prop
  const defaultOpenPanel = useCallback((_panelType: PanelType, _agentId?: string) => {
    console.warn('openPanel was called but no implementation was provided');
  }, []);

  const contextValue: FlowPanelContextType = {
    flowId,
    api,
    openPanel: openPanel || defaultOpenPanel,
    closePanel,
    isPanelOpen,
    updateAgentPanelStates,
    updateNodePanelStates,
    addDataStoreNode: flowActions.addDataStoreNode,
    addIfNode: flowActions.addIfNode,
    registerFlowActions,
    lastMonacoEditor,
    setLastMonacoEditor,
    insertVariableAtLastCursor,
    lastInputField,
    setLastInputField,
    insertVariableAtInputField,
  };

  return (
    <FlowPanelContext.Provider value={contextValue}>
      {children}
    </FlowPanelContext.Provider>
  );
}