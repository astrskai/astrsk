import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DockviewReact,
  DockviewApi,
  IDockviewPanelProps,
  DockviewReadyEvent,
} from "dockview";
import CustomDockviewTab from "@/components-v2/dockview-default-tab";
import { PanelFocusAnimationWrapper } from "@/components-v2/dockview-panel-focus-animation";
// import "dockview/dist/styles/dockview.css";
import { Flow } from "@/modules/flow/domain";
import { debounce } from "lodash-es";
import { cn } from "@/shared/utils";
import { FlowPanelProvider } from "@/flow-multi/components/flow-panel-provider";
import { getPanelTitle, PanelType } from "@/flow-multi/components/panel-types";
import { getAgentHexColor, getAgentState } from "@/flow-multi/utils/agent-color-assignment";
import { FlowPanel } from "./flow-panel";
import { PromptPanel } from "@/flow-multi/panels/prompt/prompt-panel";
import { OutputPanel } from "@/flow-multi/panels/output/output-panel";
import { ParameterPanel } from "@/flow-multi/panels/parameter/parameter-panel";
import { PreviewPanel } from "@/flow-multi/panels/preview/preview-panel";
import { VariablePanel } from "@/flow-multi/panels/variable/variable-panel";
import { ResponseDesignPanel } from "@/flow-multi/panels/response-design/response-design-panel";
import { ValidationPanel } from "@/flow-multi/panels/validation/validation-panel";
import { DataStoreSchemaPanel } from "@/flow-multi/panels/data-store-schema/data-store-schema-panel";
import { IfNodePanel } from "@/flow-multi/panels/if-node/if-node-panel";
import { FlowService } from "@/app/services/flow-service";
import { PanelStructure } from "@/modules/flow/domain";
import { SvgIcon } from "@/components-v2/svg-icon";
import { UniqueEntityID } from "@/shared/domain";
import { Agent } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";

// Watermark component
const Watermark = React.memo(() => (
  <div className="flex items-center justify-center h-full text-text-subtle opacity-30">
    <span className="text-2xl font-light">astrsk</span>
  </div>
));


// Panel IDs
const FLOW_PANEL_ID = "flow-panel-main";

// Minimum width for non-flow panel groups
const MIN_GROUP_WIDTH = 384;

// Flow Panel Component (kept separate as requested)
const FlowPanelComponent = (props: IDockviewPanelProps) => {
  return (
      <FlowPanel flowId={props.params.flowId} />
  );
};

// Panel component factory for sub-panels with focus animation - required agentId
const createFlowPanelComponent = (
  Component: React.FC<{ flowId: string; agentId: string }>
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, agentId } = props.params;
    return (
      <PanelFocusAnimationWrapper api={props.api} containerApi={props.containerApi}>
        <Component flowId={flowId} agentId={agentId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for sub-panels with focus animation - optional agentId
const createFlowPanelComponentOptional = (
  Component: React.FC<{ flowId: string; agentId?: string }>
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, agentId } = props.params;
    return (
      <PanelFocusAnimationWrapper api={props.api} containerApi={props.containerApi}>
        <Component flowId={flowId} agentId={agentId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for sub-panels without agentId
const createFlowPanelComponentStandalone = (
  Component: React.FC<{ flowId: string }>
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId } = props.params;
    return (
      <PanelFocusAnimationWrapper api={props.api} containerApi={props.containerApi}>
        <Component flowId={flowId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for node-specific panels (Data Store, If Node)
const createNodePanelComponent = (
  Component: React.FC<{ flowId: string; nodeId: string }>
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, nodeId } = props.params;
    return (
      <PanelFocusAnimationWrapper api={props.api} containerApi={props.containerApi}>
        <Component flowId={flowId} nodeId={nodeId || ''} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component registry
const PromptPanelComponent = createFlowPanelComponent(PromptPanel);
const ParameterPanelComponent = createFlowPanelComponentOptional(ParameterPanel);
const StructuredOutputPanelComponent = createFlowPanelComponentOptional(OutputPanel);
const PreviewPanelComponent = createFlowPanelComponentOptional(PreviewPanel);
const VariablePanelComponent = createFlowPanelComponent(VariablePanel);
const ResponseDesignPanelComponent = createFlowPanelComponentStandalone(ResponseDesignPanel);
const ValidationPanelComponent = createFlowPanelComponentStandalone(ValidationPanel);
const DataStoreSchemaPanelComponent = createNodePanelComponent(DataStoreSchemaPanel);
const IfNodePanelComponent = createNodePanelComponent(IfNodePanel);

// Panel Components - must be defined outside component to avoid re-creation
const components = {
  flow: FlowPanelComponent,
  prompt: PromptPanelComponent,
  parameter: ParameterPanelComponent,
  structuredOutput: StructuredOutputPanelComponent,
  preview: PreviewPanelComponent,
  variable: VariablePanelComponent,
  responseDesign: ResponseDesignPanelComponent,
  validation: ValidationPanelComponent,
  dataStoreSchema: DataStoreSchemaPanelComponent,
  ifNode: IfNodePanelComponent,
};

interface FlowPanelMainProps {
  flowId: string | null;
  className?: string;
}

export function FlowPanelMain({ flowId, className }: FlowPanelMainProps) {
  // Fetch flow data when flowId changes
  const { data: flow } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
    enabled: !!flowId,
  });

  const [dockviewApi, setDockviewApi] = useState<DockviewApi>();
  const savePanelLayoutRef = useRef<boolean>(false);
  const isFlowSwitchingRef = useRef<boolean>(false);
  
  // Track agents for color updates
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  
  // Track the current flowId to prevent unnecessary recreations
  const flowIdRef = useRef<string | null>(null);
  const flowRef = useRef<Flow | null | undefined>(null);
  const agentsRef = useRef<Map<string, Agent>>(new Map());
  const prevFlowIdRef = useRef<string | null>(null);
  
  // Update refs when flow data changes
  useEffect(() => {
    flowIdRef.current = flowId;
    flowRef.current = flow;
  }, [flowId, flow]);
  
  // Update agents ref when agents change
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Load agents when flow changes
  useEffect(() => {
    if (!flow) return;

    const loadAgents = async () => {
      const agentMap = new Map<string, Agent>();
      
      // Load all agents from nodes
      for (const node of flow.props.nodes) {
        if (node.type === 'agent') {
          // For agent nodes, the node.id IS the agentId
          const agentId = node.id;
          const agentOrError = await AgentService.getAgent.execute(
            new UniqueEntityID(agentId)
          );
          if (agentOrError.isSuccess) {
            const agent = agentOrError.getValue();
            agentMap.set(agentId, agent);
          }
        }
      }
      
      setAgents(agentMap);
    };

    loadAgents();
  }, [flowId, flow?.props.nodes]);



  // Helper function to create panel metadata
  const createPanelMetadata = (api: DockviewApi): Record<string, any> => {
    const panelMetadata: Record<string, any> = {};
    api.panels.forEach((panel) => {
      const componentType = panel.id.split("-")[0];
      panelMetadata[panel.id] = {
        component: componentType,
        title: panel.title || panel.id,
        params: panel.params || {},
      };
    });
    return panelMetadata;
  };

  // Helper function to create panel structure
  const createPanelStructure = (api: DockviewApi): PanelStructure & {
    serializedLayout?: any;
    panelMetadata?: Record<string, any>;
  } => {
    const serializedLayout = api.toJSON();
    const panelMetadata = createPanelMetadata(api);
    
    return {
      panels: [],
      activePanel: api.activePanel?.id,
      version: 2,
      serializedLayout,
      panelMetadata,
    };
  };

  // Function to save panel layout
  const savePanelLayout = useCallback(async (api: DockviewApi) => {
    const currentFlowId = flowIdRef.current;
    const currentFlow = flowRef.current;
    
    if (!currentFlowId || !currentFlow || savePanelLayoutRef.current) return;

    savePanelLayoutRef.current = true;
    try {
      const panelStructure = createPanelStructure(api);
      const updatedFlow = currentFlow.update({ panelStructure });
      
      if (updatedFlow.isSuccess) {
        if (FlowService.saveFlow && typeof FlowService.saveFlow.execute === "function") {
          await FlowService.saveFlow.execute(updatedFlow.getValue());
          // Note: We don't invalidate flow queries for layout changes since 
          // panel layout doesn't affect the core flow data that other components display.
          // This prevents unnecessary flickering during panel operations.
        }
      }
    } catch (error) {
      console.error("Failed to save panel layout:", error);
    } finally {
      savePanelLayoutRef.current = false;
    }
  }, []); // Empty dependency array since we use refs

  // Function to save panel layout to a specific flow ID
  const savePanelLayoutToFlow = useCallback(async (api: DockviewApi, targetFlowId: string) => {
    if (savePanelLayoutRef.current) return;

    savePanelLayoutRef.current = true;
    try {
      // Get the target flow
      const targetFlowResult = await FlowService.getFlow.execute(new UniqueEntityID(targetFlowId));
      if (targetFlowResult.isFailure) {
        console.error('Failed to get target flow:', targetFlowResult.getError());
        return;
      }
      const targetFlow = targetFlowResult.getValue();

      const panelStructure = createPanelStructure(api);
      const updatedFlow = targetFlow.update({ panelStructure });
      
      if (updatedFlow.isSuccess) {
        if (FlowService.saveFlow && typeof FlowService.saveFlow.execute === "function") {
          await FlowService.saveFlow.execute(updatedFlow.getValue());
          
          // Invalidate the flow query to ensure fresh data on next read
          await invalidateSingleFlowQueries(new UniqueEntityID(targetFlowId));
        }
      }
    } catch (error) {
      console.error("Failed to save panel layout to flow:", error);
    } finally {
      savePanelLayoutRef.current = false;
    }
  }, []);

  // Debounced save layout (reduced to 200ms for quicker saves)
  const debouncedSaveLayout = useMemo(
    () => debounce((api: DockviewApi) => {
      savePanelLayout(api);
    }, 200),
    [savePanelLayout]
  );

  // Function to restore panel layout
  const restorePanelLayout = useCallback((api: DockviewApi, panelStructure: PanelStructure & {
    serializedLayout?: any;
    panelMetadata?: Record<string, any>;
  }) => {
    const currentFlowId = flowIdRef.current;
    
    if (!currentFlowId) return;

    try {
      if (panelStructure.version === 2 && panelStructure.serializedLayout && panelStructure.panelMetadata) {
        // Check if the saved layout contains the flow panel
        const hasFlowPanel = panelStructure.panelMetadata[FLOW_PANEL_ID] || 
          Object.keys(panelStructure.panelMetadata).some(id => id === FLOW_PANEL_ID);
        
        if (!hasFlowPanel) {
          // Add flow panel to metadata
          panelStructure.panelMetadata[FLOW_PANEL_ID] = {
            component: "flow",
            title: "Flow Editor",
            params: { flowId: currentFlowId, title: "Flow Editor" }
          };
        }

        // Restore layout directly from serialized data
        try {
          // Let dockview handle the complete restoration
          api.fromJSON(panelStructure.serializedLayout);
          
          // Ensure flow panel group is still locked after layout restoration
          const restoredFlowPanel = api.getPanel(FLOW_PANEL_ID);
          if (restoredFlowPanel) {
            const group = restoredFlowPanel.group;
            if (group) {
              group.model.locked = true;
            }
          }
          
        } catch (error) {
          console.error("Failed to restore layout from JSON:", error);
          throw error; // Re-throw to trigger fallback in parent
        }
      }
    } catch (error) {
      console.error("Failed to restore panel layout:", error);
      throw error; // Re-throw to trigger fallback in parent
    }
  }, []);

  // Helper function to create and lock flow panel
  const createFlowPanel = useCallback((api: DockviewApi, flowId: string) => {
    const flowPanel = api.addPanel({
      id: FLOW_PANEL_ID,
      component: "flow",
      tabComponent: 'colored',
      title: "Flow Editor",
      params: { flowId, title: "Flow Editor" },
    });

    if (flowPanel?.group) {
      flowPanel.group.model.locked = true;
    }

    return flowPanel;
  }, []);

  // Panel operations
  const openPanel = useCallback((panelType: PanelType, agentId?: string) => {
    if (!dockviewApi || !flow) return;

    const panelId = agentId ? `${panelType}-${agentId}` : `${panelType}-standalone`;
    
    // Check if panel already exists
    const existingPanel = dockviewApi.getPanel(panelId);
    if (existingPanel) {
      existingPanel.focus();
      return;
    }

    // Get agent name, color, and inactive state if applicable
    const agent = agentId ? agents.get(agentId) : null;
    const title = getPanelTitle(panelType, agent?.props.name);
    const agentColor = agent ? getAgentHexColor(agent) : undefined;
    const agentInactive = agent && flow ? getAgentState(agent, flow) : undefined;
    // Check if there are any panels besides the flow panel
    const panels = dockviewApi.panels;
    const hasOtherPanels = Object.values(panels).some((panel) => panel.id !== FLOW_PANEL_ID);
    
    // Check current groups
    const groups = dockviewApi.groups;

    let newPanel: ReturnType<DockviewApi['addPanel']> | undefined;
    if (hasOtherPanels) {
      // Find a non-flow panel group to add to (default behavior: group with focused tab)
      const nonFlowGroup = groups.find((g) => g.id !== '1' && !g.model?.locked);
      if (nonFlowGroup && nonFlowGroup.panels.length > 0) {
        // Add to the first non-flow group
        newPanel = dockviewApi.addPanel({
          id: panelId,
          component: panelType,
          tabComponent: 'colored',
          title,
          params: { 
            flowId, 
            title,
            ...(agentId && { agentId }),
            ...(agentColor && { agentColor }),
            ...(agentInactive !== undefined && { agentInactive })
          },
          position: {
            referenceGroup: nonFlowGroup,
          },
        });
      } else {
        // Fallback: open to the right of flow panel with 25% width
        const containerWidth = dockviewApi.width;
        const panelWidth = containerWidth > 0 ? Math.floor(containerWidth * 0.25) : MIN_GROUP_WIDTH;
        
        newPanel = dockviewApi.addPanel({
          id: panelId,
          component: panelType,
          tabComponent: 'colored',
          title,
          initialWidth: panelWidth,
          params: { 
            flowId, 
            title,
            ...(agentId && { agentId }),
            ...(agentColor && { agentColor }),
            ...(agentInactive !== undefined && { agentInactive })
          },
          position: {
            direction: 'right',
            referencePanel: FLOW_PANEL_ID,
          },
        });
      }
    } else {
      // If only flow panel exists, open to the right of it with 25% width
      const containerWidth = dockviewApi.width;
      const panelWidth = containerWidth > 0 ? Math.floor(containerWidth * 0.25) : MIN_GROUP_WIDTH;
      
      newPanel = dockviewApi.addPanel({
        id: panelId,
        component: panelType,
        tabComponent: 'colored',
        title,
        initialWidth: panelWidth,
        params: { 
          flowId, 
          title,
          ...(agentId && { agentId }),
          ...(agentColor && { agentColor })
        },
        position: {
          direction: 'right',
          referencePanel: FLOW_PANEL_ID,
        },
      });
    }

    if (newPanel) {
      debouncedSaveLayout(dockviewApi);
    }
  }, [dockviewApi, flowId, agents, debouncedSaveLayout]);

  // Initialize dockview when flowId changes (not flow object)
  useEffect(() => {
    const initializeDockview = async () => {
      const currentFlowId = flowIdRef.current;
      const currentFlow = flowRef.current;
      const previousFlowId = prevFlowIdRef.current;
      
      
      if (!dockviewApi || !currentFlowId || !currentFlow) return;

      // If we're switching flows, immediately save any pending layout changes
      if (previousFlowId && previousFlowId !== currentFlowId) {
        // Cancel any pending debounced saves and save immediately with current API state
        debouncedSaveLayout.cancel();
        
        // Save the current layout before clearing panels (using current API state)
        const currentPanelCount = Object.keys(dockviewApi.panels).length;
        
        if (currentPanelCount > 0) {
          // Save layout directly to the previous flow without changing refs
          await savePanelLayoutToFlow(dockviewApi, previousFlowId);
        }
      }

      // Clear all existing panels when switching flows (including initial load)
      // Each flow has its own unique panel layout, so we always start fresh
      
      // Set flow switching flag to prevent saving empty layouts
      isFlowSwitchingRef.current = true;
      
      const existingPanels = [...dockviewApi.panels]; // Create copy since removePanel modifies the array
      existingPanels.forEach(panel => {
        dockviewApi.removePanel(panel);
      });
      
      // Reset flow switching flag
      isFlowSwitchingRef.current = false;

      // Update previous flow ID tracker
      prevFlowIdRef.current = currentFlowId;

      // Restore layout if available, otherwise add the main flow panel
      if (currentFlow.props.panelStructure) {
        try {
          restorePanelLayout(dockviewApi, currentFlow.props.panelStructure as any);
        } catch (error) {
          console.error("Failed to restore panel layout, ensuring flow panel exists:", error);
          
          // If layout restoration fails, ensure flow panel still exists
          if (!dockviewApi.getPanel(FLOW_PANEL_ID)) {
            createFlowPanel(dockviewApi, currentFlowId);
          }
        }
      } else {
        // No saved layout, add the main flow panel
        createFlowPanel(dockviewApi, currentFlowId);
      }

      // Focus flow panel
      const finalFlowPanel = dockviewApi.getPanel(FLOW_PANEL_ID);
      if (finalFlowPanel) {
        finalFlowPanel.focus();
      }
    };

    initializeDockview();
  }, [dockviewApi, flowId, restorePanelLayout]);

  // Cleanup: flush any pending saves when component unmounts or flowId changes
  useEffect(() => {
    return () => {
      if (debouncedSaveLayout) {
        debouncedSaveLayout.flush();
      }
    };
  }, [debouncedSaveLayout, flowId]);

  // Set minimum width constraints for non-flow panel groups
  useEffect(() => {
    if (!dockviewApi) return;

    const setGroupConstraints = () => {
      dockviewApi.groups.forEach((group) => {
        // Check if this group contains the flow panel
        const hasFlowPanel = group.panels.some(panel => panel.id === FLOW_PANEL_ID);
        
        if (!hasFlowPanel && group.api.setConstraints) {
          // Set minimum width for non-flow panel groups (agent panels)
          group.api.setConstraints({
            minimumWidth: MIN_GROUP_WIDTH,
          });
        }
      });
    };

    // Set constraints for existing groups
    setGroupConstraints();

    // Listen for new groups being added
    const disposable = dockviewApi.onDidAddGroup(() => setGroupConstraints());

    return () => disposable.dispose();
  }, [dockviewApi]);

  // Handle API ready
  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    setDockviewApi(api);

    // Track panel changes
    const handlePanelChange = () => {
      if (!isFlowSwitchingRef.current) {
        debouncedSaveLayout(api);
      }
    };

    const disposables = [
      api.onDidAddPanel(handlePanelChange),
      api.onDidRemovePanel(handlePanelChange),
      api.onDidLayoutChange(handlePanelChange),
    ];

    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [debouncedSaveLayout]);

  // Show empty state when no flow
  if (!flow) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 py-36 w-full h-full bg-background-surface-0", className)}>
        <div className="flex flex-col gap-[58px] grow items-center justify-center w-full text-[#757575]">
          <SvgIcon name="astrsk_symbol_fit" width={88} height={93} />
          <SvgIcon name="astrsk_logo_full" width={231} height={48} />
        </div>
        <div className="flex gap-2 items-center text-[#BFBFBF]">
          <SvgIcon name="lock_solid" size={20} />
          <div className="text-[16px] select-none">
            <span>Your flows are stored locally — </span>
            <span className="font-semibold">only on your device</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FlowPanelProvider
      flowId={flowId || ""}
      api={dockviewApi || null}
      invalidateFlowQueries={async () => {
        // Only invalidate when explicitly needed (e.g., agent updates, not layout changes)
        if (flowId) {
          await invalidateSingleFlowQueries(new UniqueEntityID(flowId));
        }
      }}
      openPanel={openPanel}
    >
      <div className={cn("h-full w-full relative", className)} style={{ height: "calc(100% - 40px)" }}>
        <DockviewReact
          className={cn(
            "dockview-theme-abyss",
            "h-full w-full"
          )}
          onReady={(event) => {
            // Fix for tab overflow causing parent container scroll
            event.api.onDidLayoutChange(() => {
              const container = document.querySelector('.dv-dockview') as HTMLElement;
              if (container) {
                setTimeout(() => {
                  let parent = container.parentElement;
                  while (parent && parent !== document.body) {
                    if (parent.scrollTop > 0) {
                      parent.scrollTop = 0;
                    }
                    parent = parent.parentElement;
                  }
                }, 0);
              }
            });
            
            onReady(event);
          }}
          components={components}
          tabComponents={{ colored: CustomDockviewTab }}
          watermarkComponent={Watermark}
          floatingGroupBounds="boundedWithinViewport"
          disableFloatingGroups={true}
        />
      </div>
    </FlowPanelProvider>
  );
}