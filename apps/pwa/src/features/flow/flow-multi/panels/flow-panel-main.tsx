import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DockviewReact,
  DockviewApi,
  IDockviewPanelProps,
  DockviewReadyEvent,
} from "dockview";
import CustomDockviewTab from "@/widgets/dockview-default-tab";
import { PanelFocusAnimationWrapper } from "@/widgets/dockview-panel-focus-animation";
import { Flow } from "@/entities/flow/domain";
import { debounce } from "lodash-es";
import { cn } from "@/shared/lib";
import { FlowPanelProvider } from "@/features/flow/flow-multi/components/flow-panel-provider";
import {
  getPanelTitle,
  PanelType,
} from "@/features/flow/flow-multi/components/panel-types";
import {
  getAgentHexColor,
  getAgentState,
} from "@/features/flow/flow-multi/utils/node-color-assignment";
import { FlowPanel } from "./flow-panel";
import { PromptPanel } from "@/features/flow/flow-multi/panels/prompt/prompt-panel";
import { OutputPanel } from "@/features/flow/flow-multi/panels/output/output-panel";
import { ParameterPanel } from "@/features/flow/flow-multi/panels/parameter/parameter-panel";
import { PreviewPanel } from "@/features/flow/flow-multi/panels/preview/preview-panel";
import { VariablePanel } from "@/features/flow/flow-multi/panels/variable/variable-panel";
import { ResponseDesignPanel } from "@/features/flow/flow-multi/panels/response-design/response-design-panel";
import { ValidationPanel } from "@/features/flow/flow-multi/panels/validation/validation-panel";
import { DataStoreSchemaPanel } from "@/features/flow/flow-multi/panels/data-store-schema/data-store-schema-panel";
import { IfNodePanel } from "@/features/flow/flow-multi/panels/if-node/if-node-panel";
import { DataStorePanel } from "@/features/flow/flow-multi/panels/data-store/data-store-panel";
import { FlowVibePanel } from "@/features/flow/flow-multi/panels/vibe/vibe-panel";
import { FlowService } from "@/app/services/flow-service";
import { PanelStructure } from "@/entities/flow/domain";
import { Button, SvgIcon, Loading } from "@/shared/ui";
import { UniqueEntityID } from "@/shared/domain";
import { Agent } from "@/entities/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentKeys } from "@/app/queries/agent/query-factory";
import { flowQueries, flowKeys } from "@/app/queries/flow/query-factory";
import { useUpdatePanelLayout } from "@/app/queries/flow/mutations/panel-layout-mutations";
import "@/features/card/panels/card-panel-dockview.css";

// Watermark component with restore button
const Watermark = React.memo<{ onRestore?: () => void }>(({ onRestore }) => (
  <div className="text-text-subtle flex h-full flex-col items-center justify-center gap-4 opacity-30">
    <span className="text-2xl font-light">astrsk</span>
    {onRestore && (
      <Button
        onClick={onRestore}
        className="opacity-100"
        title="Restore panels - resets to flow panel only"
      >
        Restore Panels
      </Button>
    )}
  </div>
));

// Panel IDs
const FLOW_PANEL_ID = "flow-panel-main";

// Minimum width for non-flow panel groups
const MIN_GROUP_WIDTH = 384;

// Flow Panel Component (kept separate as requested)
const FlowPanelComponent = (props: IDockviewPanelProps) => {
  return <FlowPanel flowId={props.params.flowId} />;
};

// Panel component factory for sub-panels with focus animation - required agentId
const createFlowPanelComponent = (
  Component: React.FC<{ flowId: string; agentId: string }>,
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, agentId } = props.params;
    return (
      <PanelFocusAnimationWrapper
        api={props.api}
        containerApi={props.containerApi}
      >
        <Component flowId={flowId} agentId={agentId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for sub-panels with focus animation - optional agentId
const createFlowPanelComponentOptional = (
  Component: React.FC<{ flowId: string; agentId?: string }>,
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, agentId } = props.params;
    return (
      <PanelFocusAnimationWrapper
        api={props.api}
        containerApi={props.containerApi}
      >
        <Component flowId={flowId} agentId={agentId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for sub-panels without agentId
const createFlowPanelComponentStandalone = (
  Component: React.FC<{ flowId: string }>,
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId } = props.params;
    return (
      <PanelFocusAnimationWrapper
        api={props.api}
        containerApi={props.containerApi}
      >
        <Component flowId={flowId} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component factory for node-specific panels (Data Update, If Node)
const createNodePanelComponent = (
  Component: React.FC<{ flowId: string; nodeId: string }>,
): React.FC<IDockviewPanelProps> => {
  return React.memo((props: IDockviewPanelProps) => {
    const { flowId, nodeId } = props.params;
    return (
      <PanelFocusAnimationWrapper
        api={props.api}
        containerApi={props.containerApi}
      >
        <Component flowId={flowId} nodeId={nodeId || ""} />
      </PanelFocusAnimationWrapper>
    );
  });
};

// Panel component registry
const PromptPanelComponent = createFlowPanelComponent(PromptPanel);
const ParameterPanelComponent =
  createFlowPanelComponentOptional(ParameterPanel);
const StructuredOutputPanelComponent =
  createFlowPanelComponentOptional(OutputPanel);
const PreviewPanelComponent = createFlowPanelComponentOptional(PreviewPanel);
const VariablePanelComponent = createFlowPanelComponent(VariablePanel);
const ResponseDesignPanelComponent =
  createFlowPanelComponentStandalone(ResponseDesignPanel);
const ValidationPanelComponent =
  createFlowPanelComponentStandalone(ValidationPanel);
const DataStoreSchemaPanelComponent =
  createFlowPanelComponentStandalone(DataStoreSchemaPanel);
const IfNodePanelComponent = createNodePanelComponent(IfNodePanel);
const DataStorePanelComponent = createNodePanelComponent(DataStorePanel);
const FlowVibePanelComponent =
  createFlowPanelComponentStandalone(FlowVibePanel);

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
  dataStore: DataStorePanelComponent,
  vibe: FlowVibePanelComponent,
};

interface FlowPanelMainProps {
  flowId: string;
  className?: string;
}

export function FlowPanelMain({ flowId, className }: FlowPanelMainProps) {
  const queryClient = useQueryClient();

  // Fetch flow data when flowId changes
  const { data: flow, isLoading } = useQuery({
    ...flowQueries.detail(flowId),
    enabled: !!flowId,
  });

  // Note: Flow validation is handled by the router's beforeLoad guard
  // No need for additional validation here

  // Panel layout mutation
  const updatePanelLayoutMutation = useUpdatePanelLayout(flowId);

  const [dockviewApi, setDockviewApi] = useState<DockviewApi>();
  const isFlowSwitchingRef = useRef<boolean>(false);

  // Track agents for color updates
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());

  // Track the current flowId to prevent unnecessary recreations
  const flowIdRef = useRef<string | null>(null);
  const flowRef = useRef<Flow | null | undefined>(null);
  const agentsRef = useRef<Map<string, Agent>>(new Map());
  const prevFlowIdRef = useRef<string | null>(null);

  // Update refs when flow data changes
  // Update refs directly without useEffect to avoid re-renders
  flowIdRef.current = flowId;
  flowRef.current = flow;
  agentsRef.current = agents;

  // Invalidate all flow-related queries when flow ID changes
  useEffect(() => {
    if (flowId && flowId !== prevFlowIdRef.current) {
      // Clear previous flow's cached data to prevent UI state conflicts
      if (prevFlowIdRef.current) {
        queryClient.removeQueries({
          queryKey: flowKeys.detail(prevFlowIdRef.current),
        });
        queryClient.removeQueries({
          queryKey: flowKeys.panelLayout(prevFlowIdRef.current),
        });
        queryClient.removeQueries({
          queryKey: flowKeys.uiViewport(prevFlowIdRef.current),
        });
      }

      // Invalidate agents in both previous and current flows to force refetch
      // This ensures agent colors and properties are fresh for the flows being switched

      // Get agent IDs from previous flow and invalidate their queries
      if (prevFlowIdRef.current) {
        const previousFlow = queryClient.getQueryData(
          flowKeys.detail(prevFlowIdRef.current),
        ) as any;
        const previousAgentNodes =
          previousFlow?.props?.nodes?.filter(
            (node: any) => node.type === "agent",
          ) || [];
        previousAgentNodes.forEach((node: any) => {
          const agentId = node.data?.agentId || node.id;
          if (agentId) {
            queryClient.invalidateQueries({
              queryKey: agentKeys.detail(agentId),
            });
          }
        });
      }

      // Get agent IDs from current flow and invalidate their queries
      const currentFlow = queryClient.getQueryData(
        flowKeys.detail(flowId),
      ) as any;
      const currentAgentNodes =
        currentFlow?.props?.nodes?.filter(
          (node: any) => node.type === "agent",
        ) || [];
      currentAgentNodes.forEach((node: any) => {
        const agentId = node.data?.agentId || node.id;
        if (agentId) {
          queryClient.invalidateQueries({
            queryKey: agentKeys.detail(agentId),
          });
        }
      });

      prevFlowIdRef.current = flowId;
    }
  }, [flowId, queryClient]);

  // Track agent node IDs to detect actual changes
  const agentNodeIds = useMemo(() => {
    if (!flow || !flow.props?.nodes) return [];
    return flow.props.nodes
      .filter((node) => node.type === "agent")
      .map((node) => node.id)
      .sort()
      .join(",");
  }, [flow]);

  // Load agents when flow changes
  useEffect(() => {
    // Enhanced race condition protection
    if (
      !flowId ||
      !flow ||
      !flow.props?.nodes ||
      !Array.isArray(flow.props.nodes)
    ) {
      return;
    }

    // Ensure we're loading agents for the correct flow
    const currentFlowId = flow.id.toString();
    if (currentFlowId !== flowId) {
      return;
    }

    const loadAgents = async () => {
      const agentMap = new Map<string, Agent>();

      // Load all agents from nodes
      for (const node of flow.props.nodes) {
        if (node.type === "agent") {
          // For agent nodes, the node.id IS the agentId
          const agentId = node.id;
          const agentOrError = await AgentService.getAgent.execute(
            new UniqueEntityID(agentId),
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
  }, [agentNodeIds]); // Only reload when agent nodes actually change

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
  const createPanelStructure = (
    api: DockviewApi,
  ): PanelStructure & {
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

  // Function to save panel layout using mutation
  const savePanelLayout = useCallback(
    async (api: DockviewApi) => {
      const currentFlowId = flowIdRef.current;

      if (!currentFlowId || updatePanelLayoutMutation.isPending) return;

      const panelStructure = createPanelStructure(api);

      // Use mutation for optimistic update and proper error handling
      updatePanelLayoutMutation.mutate(panelStructure);
    },
    [updatePanelLayoutMutation],
  );

  // Function to save panel layout to a specific flow ID
  const savePanelLayoutToFlow = useCallback(
    async (api: DockviewApi, targetFlowId: string) => {
      if (!targetFlowId) return;

      const panelStructure = createPanelStructure(api);

      // Direct service call for saving to a different flow
      // This is used when switching flows to save the previous flow's layout
      try {
        const result = await FlowService.updatePanelLayout.execute({
          flowId: targetFlowId,
          panelStructure,
        });

        if (result.isFailure) {
          console.error(
            "Failed to save panel layout to flow:",
            result.getError(),
          );
        } else {
          // Invalidate the panel layout query for that flow
          queryClient.invalidateQueries({
            queryKey: flowKeys.panelLayout(targetFlowId),
          });
        }
      } catch (error) {
        console.error("Failed to save panel layout to flow:", error);
      }
    },
    [queryClient],
  );

  // Debounced save layout (reduced to 200ms for quicker saves)
  const debouncedSaveLayout = useMemo(
    () =>
      debounce((api: DockviewApi) => {
        savePanelLayout(api);
      }, 200),
    [savePanelLayout],
  );

  // Function to restore panel layout
  const restorePanelLayout = useCallback(
    (
      api: DockviewApi,
      panelStructure: PanelStructure & {
        serializedLayout?: any;
        panelMetadata?: Record<string, any>;
      },
    ) => {
      const currentFlowId = flowIdRef.current;

      if (!currentFlowId) return;

      try {
        if (
          panelStructure.version === 2 &&
          panelStructure.serializedLayout &&
          panelStructure.panelMetadata
        ) {
          // Check if the saved layout contains the flow panel
          const hasFlowPanel =
            panelStructure.panelMetadata[FLOW_PANEL_ID] ||
            Object.keys(panelStructure.panelMetadata).some(
              (id) => id === FLOW_PANEL_ID,
            );

          if (!hasFlowPanel) {
            // Add flow panel to metadata
            panelStructure.panelMetadata[FLOW_PANEL_ID] = {
              component: "flow",
              title: "Flow Editor",
              params: { flowId: currentFlowId, title: "Flow Editor" },
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
    },
    [],
  );

  // Helper function to create and lock flow panel
  const createFlowPanel = useCallback((api: DockviewApi, flowId: string) => {
    const flowPanel = api.addPanel({
      id: FLOW_PANEL_ID,
      component: "flow",
      tabComponent: "colored",
      title: "Flow Editor",
      params: { flowId, title: "Flow Editor" },
    });

    if (flowPanel?.group) {
      flowPanel.group.model.locked = true;
    }

    return flowPanel;
  }, []);

  // Function to restore only the flow panel (recovery mode)
  const restoreFlowPanelOnly = useCallback(() => {
    if (!dockviewApi || !flowId) {
      console.error("Cannot restore layout: dockviewApi or flowId missing");
      return;
    }

    console.log("Restoring flow panel only (recovery mode)");

    // Clear all existing panels
    const existingPanels = [...dockviewApi.panels];
    existingPanels.forEach((panel) => {
      if (panel && panel.group) {
        dockviewApi.removePanel(panel);
      }
    });

    // Create only the flow panel
    createFlowPanel(dockviewApi, flowId);

    // Save the clean layout
    setTimeout(() => {
      savePanelLayout(dockviewApi);
    }, 100);
  }, [dockviewApi, flowId, createFlowPanel, savePanelLayout]);

  // Panel operations
  const openPanel = useCallback(
    (panelType: PanelType, agentId?: string) => {
      console.log(
        `[openPanel] Called with panelType: ${panelType}, agentId: ${agentId}`,
      );

      const currentFlow = flowRef.current;
      console.log(
        `[openPanel] currentFlow exists: ${!!currentFlow}, dockviewApi exists: ${!!dockviewApi}`,
      );

      if (!dockviewApi || !currentFlow) {
        console.log(
          `[openPanel] Returning early - missing dockviewApi or currentFlow`,
        );
        return;
      }

      const panelId = agentId
        ? `${panelType}-${agentId}`
        : `${panelType}-standalone`;

      console.log(`[openPanel] Panel ID: ${panelId}`);

      // Check if panel already exists
      const existingPanel = dockviewApi.getPanel(panelId);
      if (existingPanel) {
        console.log(`[openPanel] Panel already exists, focusing it`);
        existingPanel.focus();
        return;
      }

      console.log(`[openPanel] Panel doesn't exist, creating new panel`);

      // Get agent name, color, and inactive state if applicable
      let agentColor: string | undefined;
      let title: string;
      let agentInactive: boolean | undefined;

      // Check if this is an agent panel
      if (
        panelType === "prompt" ||
        panelType === "parameter" ||
        panelType === "structuredOutput" ||
        panelType === "preview"
      ) {
        const agent = agentId ? agentsRef.current.get(agentId) : null;
        title = getPanelTitle(panelType, agent?.props.name);
        agentColor = agent ? getAgentHexColor(agent) : undefined;
        agentInactive =
          agent && currentFlow ? getAgentState(agent, currentFlow) : undefined;
      }
      // Check if this is an if-node or data-store-node panel
      else if (
        (panelType === "ifNode" ||
          panelType === "dataStore" ||
          panelType === "dataStoreSchema") &&
        agentId
      ) {
        console.log(
          `[openPanel] Creating ${panelType} panel for node: ${agentId}`,
        );

        // Get node from flow to get its name (color will be queried by tab component)
        const node = currentFlow.props.nodes.find((n) => n.id === agentId);
        console.log(
          `[openPanel] Found node: ${!!node}, node.id: ${node?.id}, node.type: ${node?.type}`,
        );

        const nodeData = node?.data as any;
        console.log(`[openPanel] Node data:`, nodeData);

        // Color will be queried by the tab component, so we don't set it here
        agentColor = undefined;

        // Get node name/label for title with appropriate fallback
        let nodeName: string;
        if (panelType === "dataStore" || panelType === "dataStoreSchema") {
          nodeName = nodeData?.label || "Data Update";
        } else if (panelType === "ifNode") {
          nodeName = nodeData?.label || "If Condition";
        } else {
          nodeName = nodeData?.label || nodeData?.name || "Unnamed";
        }
        console.log(`[openPanel] Node name for title: ${nodeName}`);
        title = getPanelTitle(panelType, nodeName);
        console.log(`[openPanel] Panel title: ${title}`);
      }
      // Default case
      else {
        title = getPanelTitle(panelType);
      }
      // Check if there are any panels besides the flow panel
      const panels = dockviewApi.panels;
      const hasOtherPanels = Object.values(panels).some(
        (panel) => panel.id !== FLOW_PANEL_ID,
      );

      // Check current groups
      const groups = dockviewApi.groups;

      let newPanel: ReturnType<DockviewApi["addPanel"]> | undefined;
      if (hasOtherPanels) {
        // Find a non-flow panel group to add to (default behavior: group with focused tab)
        const nonFlowGroup = groups.find(
          (g) => g.id !== "1" && !g.model?.locked,
        );
        if (nonFlowGroup && nonFlowGroup.panels.length > 0) {
          // Add to the first non-flow group
          newPanel = dockviewApi.addPanel({
            id: panelId,
            component: panelType,
            tabComponent: "colored",
            title,
            params: {
              flowId: flowId,
              title,
              ...(agentId && { agentId }),
              // For node panels, also pass nodeId
              ...(agentId &&
                (panelType === "ifNode" || panelType === "dataStore") && {
                  nodeId: agentId,
                }),
              // Pass panel type and flow info to tab for color querying
              panelType,
              ...(agentColor && { agentColor }),
              ...(agentInactive !== undefined && { agentInactive }),
            },
            position: {
              referenceGroup: nonFlowGroup,
            },
          });
        } else {
          // Fallback: open to the right of flow panel with 25% width
          const containerWidth = dockviewApi.width;
          const panelWidth =
            containerWidth > 0
              ? Math.floor(containerWidth * 0.25)
              : MIN_GROUP_WIDTH;

          newPanel = dockviewApi.addPanel({
            id: panelId,
            component: panelType,
            tabComponent: "colored",
            title,
            initialWidth: panelWidth,
            params: {
              flowId: flowId,
              title,
              ...(agentId && { agentId }),
              // For node panels, also pass nodeId
              ...(agentId &&
                (panelType === "ifNode" || panelType === "dataStore") && {
                  nodeId: agentId,
                }),
              // Pass panel type and flow info to tab for color querying
              panelType,
              ...(agentColor && { agentColor }),
              ...(agentInactive !== undefined && { agentInactive }),
            },
            position: {
              direction: "right",
              referencePanel: FLOW_PANEL_ID,
            },
          });
        }
      } else {
        // If only flow panel exists, open to the right of it with 25% width
        const containerWidth = dockviewApi.width;
        const panelWidth =
          containerWidth > 0
            ? Math.floor(containerWidth * 0.25)
            : MIN_GROUP_WIDTH;

        newPanel = dockviewApi.addPanel({
          id: panelId,
          component: panelType,
          tabComponent: "colored",
          title,
          initialWidth: panelWidth,
          params: {
            flowId: flowId,
            title,
            ...(agentId && { agentId }),
            // For node panels, also pass nodeId
            ...(agentId &&
              (panelType === "ifNode" ||
                panelType === "dataStore" ||
                panelType === "dataStoreSchema") && { nodeId: agentId }),
            // Pass panel type and flow info to tab for color querying
            panelType,
            ...(agentColor && { agentColor }),
          },
          position: {
            direction: "right",
            referencePanel: FLOW_PANEL_ID,
          },
        });
      }

      if (newPanel) {
        console.log(
          `[openPanel] Panel created successfully with ID: ${panelId}`,
        );
        console.log(`[openPanel] Panel component: ${panelType}`);
        console.log(`[openPanel] Panel params:`, newPanel.params);
        debouncedSaveLayout(dockviewApi);
      } else {
        console.log(`[openPanel] Failed to create panel!`);
      }
    },
    [dockviewApi, flowId, debouncedSaveLayout],
  ); // Removed agents dependency to prevent re-renders

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
      existingPanels.forEach((panel) => {
        // Check if panel and panel.group exist before removing
        if (panel && panel.group) {
          dockviewApi.removePanel(panel);
        }
      });

      // Reset flow switching flag
      isFlowSwitchingRef.current = false;

      // Update previous flow ID tracker
      prevFlowIdRef.current = currentFlowId;

      // Restore layout if available, otherwise add the main flow panel
      if (currentFlow.props.panelStructure) {
        try {
          restorePanelLayout(
            dockviewApi,
            currentFlow.props.panelStructure as any,
          );
        } catch (error) {
          console.error(
            "Failed to restore panel layout, ensuring flow panel exists:",
            error,
          );

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
        const hasFlowPanel = group.panels.some(
          (panel) => panel.id === FLOW_PANEL_ID,
        );

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
  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      setDockviewApi(api);

      // Track panel changes
      const handlePanelChange = () => {
        if (!isFlowSwitchingRef.current) {
          debouncedSaveLayout(api);
        }
      };

      const disposables = [
        api.onDidAddPanel((panel) => {
          handlePanelChange();
        }),
        api.onDidRemovePanel((panel) => {
          handlePanelChange();
        }),
        api.onDidLayoutChange(() => {
          handlePanelChange();
        }),
      ];

      return () => {
        disposables.forEach((d) => d.dispose());
      };
    },
    [debouncedSaveLayout],
  );

  // Create watermark component with restore functionality - MUST be before any conditional returns
  const WatermarkWithRestore = useCallback(
    () => <Watermark onRestore={restoreFlowPanelOnly} />,
    [restoreFlowPanelOnly],
  );

  // Show loading state while fetching flow data
  if (isLoading) {
    return <Loading />;
  }

  // Show empty state when no flow
  if (!flow) {
    return (
      <div
        className={cn(
          "bg-background-surface-0 flex h-full w-full flex-col items-center justify-center gap-4 py-36",
          className,
        )}
      >
        <div className="flex w-full grow flex-col items-center justify-center gap-[58px] text-[#757575]">
          <SvgIcon name="astrsk_symbol_fit" width={88} height={93} />
          <SvgIcon name="astrsk_logo_full" width={231} height={48} />
        </div>
        <div className="flex items-center gap-2 text-[#BFBFBF]">
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
      openPanel={openPanel}
    >
      <div
        className={cn("relative h-full w-full", className)}
        style={{ height: "calc(100% - var(--topbar-height))" }}
      >
        <DockviewReact
          className={cn("dockview-theme-abyss", "h-full w-full")}
          onReady={(event) => {
            // Fix for tab overflow causing parent container scroll
            event.api.onDidLayoutChange(() => {
              const container = document.querySelector(
                ".dv-dockview",
              ) as HTMLElement;
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
          watermarkComponent={WatermarkWithRestore}
          floatingGroupBounds="boundedWithinViewport"
          disableFloatingGroups={true}
        />
      </div>
    </FlowPanelProvider>
  );
}
