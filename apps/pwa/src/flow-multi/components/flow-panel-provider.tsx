import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { DockviewApi } from "dockview";
import type { IDockviewPanel } from "dockview-core";
import { 
  PanelType, 
  getPanelTitle,
} from "@/flow-multi/components/panel-types";
import { Agent } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { getAgentHexColor, getAgentState } from "@/flow-multi/utils/agent-color-assignment";


interface FlowPanelContextType {
  flowId: string;
  api: DockviewApi | null;
  openPanel: (panelType: PanelType, agentId?: string) => void;
  closePanel: (panelId: string) => void;
  invalidateFlowQueries: () => Promise<void>;
  isPanelOpen: (panelType: PanelType, agentId?: string) => boolean;
  updateAgentPanelStates: (agentId: string) => void;
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
  invalidateFlowQueries: () => Promise<void>;
  openPanel?: (panelType: PanelType, agentId?: string) => void;
}

export function FlowPanelProvider({
  children,
  flowId,
  api,
  invalidateFlowQueries,
  openPanel,
}: FlowPanelProviderProps) {
  
  // Panel visibility state tracking to trigger re-renders
  const [panelVisibilityTrigger, setPanelVisibilityTrigger] = useState(0);
  
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

  // Provide a default implementation for openPanel when it's not provided as a prop
  const defaultOpenPanel = useCallback((_panelType: PanelType, _agentId?: string) => {
    console.warn('openPanel was called but no implementation was provided');
  }, []);

  const contextValue: FlowPanelContextType = {
    flowId,
    api,
    openPanel: openPanel || defaultOpenPanel,
    closePanel,
    invalidateFlowQueries,
    isPanelOpen,
    updateAgentPanelStates,
    lastMonacoEditor,
    setLastMonacoEditor,
    insertVariableAtLastCursor,
  };

  return (
    <FlowPanelContext.Provider value={contextValue}>
      {children}
    </FlowPanelContext.Provider>
  );
}