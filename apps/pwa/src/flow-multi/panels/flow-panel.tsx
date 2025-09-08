import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { PANEL_TYPES } from "@/flow-multi/components/panel-types";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { Node as FlowNode, Edge as FlowEdge, FlowViewport, Flow } from "@/modules/flow/domain/flow";
import { Session } from "@/modules/session/domain/session";
import { NodeType } from "@/flow-multi/types/node-types";
import { getNextAvailableColor } from "@/flow-multi/utils/node-color-assignment";
import { ensureNodeSafety, ensureNodesSafety } from "@/flow-multi/utils/ensure-node-safety";
import { ensureEdgeSelectable, ensureEdgesSelectable } from "@/flow-multi/utils/ensure-edge-selectable";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";
import { invalidateAllAgentQueries } from "@/flow-multi/utils/invalidate-agent-queries";
import { useFlowLocalStateSync } from "@/utils/flow-local-state-sync";
import { cn } from "@/shared/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flowQueries, flowKeys } from "@/app/queries/flow/query-factory";
import { useUpdateNodesPositions } from "@/app/queries/flow/mutations/nodes-positions-mutations";
import { useUpdateFlowName, useUpdateFlowViewport } from "@/app/queries/flow/mutations/flow-mutations";
import { useUpdateNodesAndEdges } from "@/app/queries/flow/mutations/nodes-edges-mutations";
import { BookOpen, Pencil, Check, X, Loader2, SearchCheck, HelpCircle, Plus, Code } from "lucide-react";
import { ButtonPill } from "@/components-v2/ui/button-pill";
import { toast } from "sonner";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { useLeftNavigationWidth } from "@/components-v2/left-navigation/hooks/use-left-navigation-width";
import { useRightSidebarState } from "@/components-v2/top-bar";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Card } from "@/components-v2/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components-v2/ui/dropdown-menu";
import { Button } from "@/components-v2/ui/button";

// Import ReactFlow components
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NodeSelectionMenu, NodeSelectionMenuItems } from "@/flow-multi/components/node-selection-menu";
import { createNodeWithConnection } from "./flow-panel-connection-handlers";
import {
  edgeTypes,
  type CustomEdgeType,
} from "@/flow-multi/edges/index";
import {
  nodeTypes,
  type CustomNodeType,
} from "@/flow-multi/nodes/index";
import { CustomReactFlowControls } from "@/flow-multi/components/custom-controls";
import { useAgentStore } from "@/app/stores/agent-store";
import { sessionQueries } from "@/app/queries/session-queries";

interface FlowPanelProps {
  flowId: string;
}

const proOptions = { hideAttribution: true };


// Helper function to filter existing connections
function filterExistingConnections(
  edges: CustomEdgeType[],
  sourceNode: CustomNodeType | undefined,
  targetNode: CustomNodeType | undefined, // Kept for backwards compatibility but not used
  connection: { source?: string | null; target?: string | null; sourceHandle?: string | null }
): CustomEdgeType[] {
  let filteredEdges = [...edges];
  
  // Remove existing outgoing connections based on source node type
  // Output handles can only connect to one node (applies to all node types with source handles)
  if (connection.source && sourceNode) {
    // For all node types, remove existing edges from the same source handle
    // This ensures each output can only connect to one input
    filteredEdges = filteredEdges.filter(edge => {
      // For If nodes with multiple source handles, check both source and sourceHandle
      if (sourceNode.type === 'if' && edge.source === connection.source) {
        // Only remove if it's from the same handle (true/false)
        return edge.sourceHandle !== connection.sourceHandle;
      }
      // For other nodes, remove any edge from the same source
      return edge.source !== connection.source;
    });
  }
  
  // Input handles can now accept multiple connections - no filtering needed for targets
  // Previously removed: filtering for agent and end node targets
  
  return filteredEdges;
}

// Helper to create a hash of flow data for comparison
function createDataHash(nodes: any[], edges: any[]) {
  // Create a hash that ignores position changes
  const nodeHash = nodes.map(n => `${n.id}:${n.type}:${JSON.stringify(n.data)}`).sort().join('|');
  const edgeHash = edges.map(e => `${e.id}:${e.source}:${e.target}`).sort().join('|');
  return `${nodeHash}::${edgeHash}`;
};

// Main flow panel component
function FlowPanelInner({ flowId }: FlowPanelProps) {
  // 1. State hooks
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeType>([]);

  // 2. Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const connectionStartRef = useRef<{ nodeId: string; handleType: string; handleId?: string; startX: number; startY: number } | null>(null);
  const connectionMadeRef = useRef<boolean>(false);
  const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  
  // Node selection menu state
  const [showNodeSelection, setShowNodeSelection] = useState(false);
  const [nodeSelectionPosition, setNodeSelectionPosition] = useState({ x: 0, y: 0 });
  const pendingConnectionRef = useRef<{ sourceNodeId: string; sourceHandleId?: string; position: { x: number; y: number } } | null>(null);
  const lastSyncedFlowIdRef = useRef<string | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const lastExternalDataHashRef = useRef<string | null>(null);
  const lastSavedDataHashRef = useRef<string | null>(null);
  const nodesRef = useRef<CustomNodeType[]>([]);
  const edgesRef = useRef<CustomEdgeType[]>([]);
  const skipNextSyncRef = useRef<boolean>(false);

  // 3. Context hooks
  const { openPanel, closePanel, isPanelOpen, registerFlowActions } = useFlowPanelContext();
  const { isExpanded, isMobile } = useLeftNavigationWidth();
  const rightSidebar = useRightSidebarState();
  const queryClient = useQueryClient();

  // Vibe Coding handler
  const handleVibeCodingToggle = () => {
    if (rightSidebar) {
      rightSidebar.setIsOpen(!rightSidebar.isOpen);
    }
  };

  // 4. React Query hooks - using global queryClient settings
  const { data: flow } = useQuery({
    ...flowQueries.detail(flowId),
    enabled: !!flowId,
  });

  // 5. Granular mutations for optimized updates
  const updateNodesPositions = useUpdateNodesPositions(flowId);
  const updateFlowNameMutation = useUpdateFlowName(flowId);
  const updateFlowViewportMutation = useUpdateFlowViewport(flowId);
  const updateNodesAndEdges = useUpdateNodesAndEdges(flowId);

  // 6. Window-based local state sync for preview operations
  useFlowLocalStateSync(
    flowId,
    // Handle nodes/edges update from operations (preview)
    useCallback((localNodes?: any[], localEdges?: any[]) => {
      console.log('🔄 [FLOW-PANEL] Received local nodes/edges update from operation:', {
        nodeCount: localNodes?.length || 0,
        edgeCount: localEdges?.length || 0,
        hasNodes: !!localNodes,
        hasEdges: !!localEdges,
      });

      // Apply the local changes to the flow panel immediately
      if (localNodes) {
        console.log('🔄 [FLOW-PANEL] Updating nodes:', localNodes.map(n => ({ id: n.id.slice(0, 8) + '...', type: n.type })));
        setNodes(localNodes);
        
        // Mark as local change so the sync logic doesn't overwrite these changes
        isLocalChangeRef.current = true;
      }
      
      if (localEdges) {
        console.log('🔄 [FLOW-PANEL] Updating edges:', localEdges.map(e => ({ source: e.source?.slice(0, 8) + '...', target: e.target?.slice(0, 8) + '...' })));
        
        // Ensure all edges have the required 'type' field for ReactFlow
        const edgesWithType = localEdges.map((edge: any) => ({
          ...edge,
          type: edge.type || 'default'
        }));
        
        setEdges(edgesWithType);
      }
    }, [setNodes, setEdges]),
    // Handle individual node updates (if needed)
    useCallback((nodeId: string, nodeData: any) => {
      console.log('🔄 [FLOW-PANEL] Received individual node update:', { 
        nodeId: nodeId.slice(0, 8) + '...', 
        nodeType: nodeData?.type 
      });

      // Update the specific node in the local state
      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.map(node => 
          node.id === nodeId ? { ...node, ...nodeData } : node
        );
        
        // Mark as local change
        isLocalChangeRef.current = true;
        
        return updatedNodes;
      });
    }, [setNodes])
  );

  // Handle flow title editing with granular mutation
  const handleSaveTitle = useCallback(async () => {
    const currentFlow = flowRef.current;
    if (!currentFlow || editedTitle === currentFlow.props.name) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    
    // Use granular mutation for name update
    updateFlowNameMutation.mutate(editedTitle, {
      onSuccess: () => {
        setIsEditingTitle(false);
        toast.success("Flow name updated");
      },
      onError: (error) => {
        console.error("Error saving flow title:", error);
        toast.error("Failed to update flow name");
      },
      onSettled: () => {
        setIsSavingTitle(false);
      }
    });
  }, [editedTitle, updateFlowNameMutation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle("");
  }, []);

  // Handle double-click to close variables panel
  const handleCloseVariablesPanel = useCallback(() => {
    const panelId = `${PANEL_TYPES.VARIABLE}-standalone`;
    closePanel(panelId);
  }, [closePanel]);

  // Use ref to always have the latest flow
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);
  
  // Update refs for nodes and edges to avoid stale closures
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Save flow when edges/nodes change using granular mutation
  // IMPORTANT: This function merges React Query cache data with local changes
  const saveFlowChanges = useCallback(async (providedNodes?: CustomNodeType[], providedEdges?: CustomEdgeType[], isStructuralChange: boolean = false, invalidateAgents: boolean = false) => {

    
    const currentFlow = flowRef.current;
    if (!currentFlow) {
      return;
    }

    // Get the latest data from React Query cache to include ALL granular updates
    const cachedFlow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
    
    // Use nodes and edges from the enhanced flow query (no separate cache needed)
    let cachedNodes = (cachedFlow?.props?.nodes || nodesRef.current || []) as CustomNodeType[];
    let cachedEdges = (cachedFlow?.props?.edges || edgesRef.current || []) as CustomEdgeType[];
    
    
    let updatedNodes: CustomNodeType[];
    let updatedEdges: CustomEdgeType[];
    
    if (providedNodes) {
      // Specific nodes provided - use them as-is since they represent the current state
      // The caller has already included all necessary nodes
      updatedNodes = providedNodes;
    } else {
      // No nodes provided - use cache data or refs as fallback
      updatedNodes = cachedNodes.length > 0 ? cachedNodes : (nodesRef.current || []);
    }
    
    // For edges, use provided or cached or refs as fallback
    updatedEdges = providedEdges || (cachedEdges.length > 0 ? cachedEdges : (edgesRef.current || []));
    
    // This line is now handled above

    try {
      // Filter out invalid edges before saving
      const nodeIds = new Set(updatedNodes.map(n => n.id));
      const validEdges = updatedEdges.filter(edge => {
        return edge.source && edge.target && 
               nodeIds.has(edge.source) && nodeIds.has(edge.target);
      });
      
      updateNodesAndEdges.mutate(
        { 
          nodes: updatedNodes as FlowNode[], 
          edges: validEdges as FlowEdge[],
          invalidateAgents
        },
        {
          onSuccess: ({ nodes: savedNodes, edges: savedEdges }) => {

            // After successful save, update our saved data hash
            lastSavedDataHashRef.current = createDataHash(savedNodes as CustomNodeType[], savedEdges as CustomEdgeType[]);
            
            // Skip the next sync since we just saved and the flow object will update
            skipNextSyncRef.current = true;
            
            // Check if our local changes match what we just saved
            const currentLocalHash = createDataHash(updatedNodes, updatedEdges);
            if (currentLocalHash === lastSavedDataHashRef.current) {
              // Local changes are now saved, reset the flag
              isLocalChangeRef.current = false;
            }
          },
          onError: (error) => {
            toast.error('Failed to save flow changes');
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  }, [updateNodesAndEdges, queryClient, flowId]);

  // Save viewport state to flow
  const saveViewportState = useCallback(async (newViewport: Viewport) => {
    // Use granular mutation for viewport update
    const flowViewport: FlowViewport = {
      x: newViewport.x,
      y: newViewport.y,
      zoom: newViewport.zoom
    };
    
    updateFlowViewportMutation.mutate(flowViewport, {
      onError: (error) => {
        console.error('Failed to save viewport:', error);
      }
    });
  }, [updateFlowViewportMutation]);

  // Handle viewport changes with debouncing
  const onViewportChange = useCallback((newViewport: Viewport) => {
    // Store current viewport for node positioning
    currentViewportRef.current = newViewport;
    
    // Clear existing timeout
    if (viewportSaveTimeoutRef.current) {
      clearTimeout(viewportSaveTimeoutRef.current);
    }
    
    // Debounce viewport saves to avoid excessive database writes
    viewportSaveTimeoutRef.current = setTimeout(() => {
      saveViewportState(newViewport);
    }, 1000); // Save after 1 second of no viewport changes
  }, [saveViewportState]);


  // 6. All useEffects grouped here
  // Keep refs updated with current nodes and edges - do this directly, no useEffect needed
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Track when flow data changes and trigger sync
  const [syncTrigger, setSyncTrigger] = useState(0);
  
  // Monitor flow changes and trigger sync when needed
  useEffect(() => {
    if (!flow) return;
    
    const externalNodes = (flow.props.nodes as CustomNodeType[]) || [];
    const externalEdges = (flow.props.edges as CustomEdgeType[]) || [];
    const newHash = createDataHash(externalNodes, externalEdges);
    
    // Only trigger sync if data actually changed
    if (newHash !== lastExternalDataHashRef.current) {
      // Check if this is from our own save (nodes/edges mutation)
      // If it is, we can skip since we already have the data locally
      if (skipNextSyncRef.current) {
        skipNextSyncRef.current = false; // Reset the flag
        lastExternalDataHashRef.current = newHash;
      } else {
        // This is from an external update (like if-node mutation), we should sync
        setSyncTrigger(prev => prev + 1);
        lastExternalDataHashRef.current = newHash;
      }
    }
  }, [flow]); // Added back flow dependency to detect flow changes

  // Effect 1: Smart sync - only sync when there are actual external changes
  useEffect(() => {
    if (!flow) return;
    
    const flowIdStr = flow.id.toString();
    const isDifferentFlow = lastSyncedFlowIdRef.current !== flowIdStr;
    
    // Get external data and ensure nodes are safe from keyboard deletion
    const externalNodes = ensureNodesSafety((flow.props.nodes as CustomNodeType[]) || []);
    
    // Debug: Check for data store nodes and their fields
    const dataStoreNodes = externalNodes.filter(n => n.type === 'dataStore');

    // Filter out invalid edges (edges with both source and target must exist in nodes)
    const rawExternalEdges = (flow.props.edges as CustomEdgeType[]) || [];
    const nodeIds = new Set(externalNodes.map(n => n.id));
    
    const externalEdges = ensureEdgesSelectable(
      rawExternalEdges
        .filter(edge => {
          // Edge must have valid source and target that exist in nodes
          const isValid = edge.source && edge.target && 
                         nodeIds.has(edge.source) && nodeIds.has(edge.target);
          
          if (!isValid && edge.source && edge.target) {
            console.warn(`Filtering out orphaned edge: ${edge.source} -> ${edge.target}`);
          }
          
          return isValid;
        })
        .map(edge => ({
          ...edge,
          type: edge.type || 'default' // Ensure all edges have the required 'type' field for ReactFlow
        }))
    );
    const currentDataHash = createDataHash(externalNodes, externalEdges);
    
    // Check if external data actually changed (ignoring positions)
    if (!isDifferentFlow && currentDataHash === lastExternalDataHashRef.current) {
      return; // No structural changes, keep local state
    }
    
    if (isDifferentFlow) {
      // Switching flows - fresh load
      console.log('[FLOW-SYNC] Setting nodes for different flow:', externalNodes.length);
      setNodes(externalNodes);
      setEdges(externalEdges);
      lastSyncedFlowIdRef.current = flowIdStr;
      isLocalChangeRef.current = false;
      // Initialize saved data hash for new flow
      lastSavedDataHashRef.current = currentDataHash;
    } else if (isLocalChangeRef.current && nodesRef.current.length > 0) {
      // We have local changes - check if they're already saved
      const currentLocalHash = createDataHash(nodesRef.current, edgesRef.current);
      
      if (currentLocalHash === lastSavedDataHashRef.current) {
        // Local changes match saved state, we can safely sync
        console.log('[FLOW-SYNC] Local changes saved, syncing external nodes:', externalNodes.length);
        isLocalChangeRef.current = false;
        setNodes(externalNodes);
        setEdges(externalEdges);
      } else {
        // We have unsaved local changes - merge carefully
        // IMPORTANT: Always use server data for node content but preserve local positions
        const localPositions = new Map(nodesRef.current.map(n => [n.id, n.position]));
        
        const mergedNodes = externalNodes.map(extNode => {
          const localPos = localPositions.get(extNode.id);
          // Use server data (includes granular updates) but keep local position
          return localPos ? { ...extNode, position: localPos } : extNode;
        });
        
        console.log('[FLOW-SYNC] Merging nodes with local positions:', {
          externalCount: externalNodes.length,
          mergedCount: mergedNodes.length,
          dataStoreNodes: mergedNodes.filter(n => n.type === 'dataStore').map(n => ({
            id: n.id,
            fieldCount: (n.data as any)?.dataStoreFields?.length || 0
          }))
        });
        
        setNodes(mergedNodes);
        setEdges(externalEdges);
        // Update refs with the merged data so they have latest content
        nodesRef.current = mergedNodes;
        edgesRef.current = externalEdges;
      }
    } else {
      // No local changes - just sync
      setNodes(externalNodes);
      setEdges(externalEdges);
      // Update saved hash when syncing from external
      if (!isLocalChangeRef.current) {
        lastSavedDataHashRef.current = currentDataHash;
      }
    }
    
    lastExternalDataHashRef.current = currentDataHash;
  }, [flowId, syncTrigger]); // Added flowId and syncTrigger dependencies


  // Effect 2: Container ready check
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      setIsReady(true);
    });
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          // Dispatch resize event for ReactFlow
          window.dispatchEvent(new Event('resize'));
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      setIsReady(false);
    };
  }, []);

  // Copy agent handler
  const copyAgent = useCallback(async (agentId: string) => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;
    
    try {
      // First check if the agent exists
      const agentCheckResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentCheckResult.isFailure) {
        toast.error("Cannot copy agent", {
          description: "This agent no longer exists. It may have been deleted."
        });
        return;
      }
      
      // Use the cloneAgent use case for cleaner implementation
      const clonedAgentResult = await AgentService.cloneAgent.execute(new UniqueEntityID(agentId));
      if (clonedAgentResult.isFailure) {
        throw new Error(clonedAgentResult.getError());
      }
      const clonedAgent = clonedAgentResult.getValue();
      
      // Update the cloned agent with a new color
      const nextColor = await getNextAvailableColor(currentFlow);
      const updatedAgentResult = clonedAgent.update({ color: nextColor });
      if (updatedAgentResult.isFailure) {
        throw new Error(updatedAgentResult.getError());
      }
      const updatedAgent = updatedAgentResult.getValue();
      
      // Save the updated agent with new color
      const savedAgentResult = await AgentService.saveAgent.execute(updatedAgent);
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }
      const savedAgent = savedAgentResult.getValue();

      // Calculate position for copied agent node (below original)
      const currentNode = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === agentId);
      const newNodePosition = currentNode 
        ? { x: currentNode.position.x+100, y: currentNode.position.y + 200 }
        : { x: 400, y: 200 };

      // Create new agent node
      const newAgentNode: CustomNodeType = ensureNodeSafety({
        id: savedAgent.id.toString(),
        type: "agent",
        position: newNodePosition,
        data: {
          agentId: savedAgent.id.toString(),
        },
      });

      // Use current flow ref which has the most up-to-date data
      const currentNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
      
      
      const updatedNodes = [...currentNodes, newAgentNode];
      setNodes(updatedNodes);
      
      // Mark as local change
      isLocalChangeRef.current = true;
      
      // Save the flow changes - pass updatedNodes explicitly, let edges come from refs
      // Set invalidateAgents to true when adding new agents
      setTimeout(() => {
        saveFlowChanges(updatedNodes, undefined, true, true);
      }, 0);
      
      // Invalidate agent queries for color updates
      invalidateAllAgentQueries();
      
      toast.success("Agent copied successfully");
      
    } catch (error) {
      toast.error("Failed to copy agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [nodes, edges, setNodes, saveFlowChanges, queryClient, flowId]);

  // Add node functions
  const addDataStoreNode = useCallback(async () => {
    const currentFlow = flowRef.current;
    if (!currentFlow) {
      return;
    }

    // Calculate position at viewport center
    // Node dimensions (approximate): width 320px, height 140px
    const nodeWidth = 320;
    const nodeHeight = 140;
    
    // Get the actual React Flow container dimensions
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const viewport = currentViewportRef.current;
    const viewportCenter = {
      x: ((-viewport.x + containerWidth / 2) / viewport.zoom) - (nodeWidth / 2),
      y: ((-viewport.y + containerHeight / 2) / viewport.zoom) - (nodeHeight / 2)
    };
    
    const newPosition = viewportCenter;

    // Use UniqueEntityID for node IDs instead of custom string patterns
    const nodeId = new UniqueEntityID().toString();
    
    // Get next available color
    const nextColor = await getNextAvailableColor(currentFlow);

    const createResult = await DataStoreNodeService.createDataStoreNode.execute({
      flowId: flowId,
      nodeId: nodeId,
      name: "New Data Update",
      color: nextColor,
      dataStoreFields: [],
    });

    if (createResult.isFailure) {
      toast.error(`Failed to create data store node: ${createResult.getError()}`);
      return;
    }

    // 2. Create flow node with only flowId (nodeId comes from node.id)
    const newNode: CustomNodeType = ensureNodeSafety({
      id: nodeId,
      type: NodeType.DATA_STORE,  // Use enum instead of string
      position: newPosition,
      data: {
        flowId: flowId,  // Query key for TanStack Query (nodeId = node.id)
      },
    });

    // Use current flow ref which has the most up-to-date data
    let currentNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
    let currentEdges = (currentFlow.props.edges as CustomEdgeType[]) || [];
    
    const updatedNodes = [...currentNodes, newNode];
    
    try {
      setNodes(updatedNodes);
    } catch (error) {
      return; // Exit early if setNodes fails
    }

    // Mark as local change and save
    isLocalChangeRef.current = true;
    setTimeout(() => {
      try {
        // Pass updatedNodes explicitly, edges will come from refs
        saveFlowChanges(updatedNodes, undefined, true);
      } catch (error) {
        console.error('❌ [DEBUG] saveFlowChanges failed:', error);
      }
    }, 0);

    // Invalidate data store node queries to ensure vibe panel sees the new node
    const { dataStoreNodeKeys } = await import("@/app/queries/data-store-node/query-factory");
    await queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.detail(flowId, nodeId) });

    toast.success("Data Update node added");
  }, [setNodes, saveFlowChanges, queryClient, flowId]);

  const addIfNode = useCallback(async () => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;

    // Calculate position at viewport center
    // Node dimensions (approximate): width 320px, height 140px
    const nodeWidth = 320;
    const nodeHeight = 140;
    
    // Get the actual React Flow container dimensions
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const viewport = currentViewportRef.current;
    const viewportCenter = {
      x: ((-viewport.x + containerWidth / 2) / viewport.zoom) - (nodeWidth / 2),
      y: ((-viewport.y + containerHeight / 2) / viewport.zoom) - (nodeHeight / 2)
    };
    
    const newPosition = viewportCenter;

    // Use UniqueEntityID for node IDs instead of custom string patterns
    const nodeId = new UniqueEntityID().toString();
    
    // Get next available color
    const nextColor = await getNextAvailableColor(currentFlow);
    
    // 1. Create separate node data entry first
    console.log('🔄 [ADD-IF-NODE] Creating if-node in database:', {
      flowId,
      nodeId,
      name: "New If",
      color: nextColor
    });
    
    const createResult = await IfNodeService.createIfNode.execute({
      flowId: flowId,
      nodeId: nodeId,
      name: "New If",
      logicOperator: 'AND',
      conditions: [],
      color: nextColor,
    });

    if (createResult.isFailure) {
      console.error('❌ [ADD-IF-NODE] If-node creation failed:', createResult.getError());
      toast.error(`Failed to create if node: ${createResult.getError()}`);
      return;
    }
    
    console.log('✅ [ADD-IF-NODE] If-node created successfully in database');

    // 2. Create flow node with only flowId (nodeId comes from node.id)
    const newNode: CustomNodeType = ensureNodeSafety({
      id: nodeId,
      type: NodeType.IF,          // Use enum instead of string
      position: newPosition,
      data: {
        flowId: flowId,  // Query key for TanStack Query (nodeId = node.id)
      },
    });
    

    // Use current flow ref which has the most up-to-date data
    let currentNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
    let currentEdges = (currentFlow.props.edges as CustomEdgeType[]) || [];
    
    const updatedNodes = [...currentNodes, newNode];
    setNodes(updatedNodes);

    // Mark as local change and save
    isLocalChangeRef.current = true;
    setTimeout(() => {
      // Pass updatedNodes explicitly, edges will come from refs
      saveFlowChanges(updatedNodes, undefined, true);
    }, 0);

    // Invalidate if node queries to ensure vibe panel sees the new node
    const { ifNodeKeys } = await import("@/app/queries/if-node/query-factory");
    await queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });

    toast.success("If node added");
  }, [setNodes, saveFlowChanges, queryClient, flowId]);

  const addAgentNode = useCallback(async () => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;

    try {
      // Generate unique agent name using existing logic
      const generateUniqueAgentName = async (baseName: string = "New Agent"): Promise<string> => {
        const existingNames = new Set<string>();
        
        // Collect existing agent names from current flow
        if (currentFlow?.agentIds) {
          for (const agentId of currentFlow.agentIds) {
            const agentOrError = await AgentService.getAgent.execute(agentId);
            if (agentOrError.isFailure) {
              throw new Error(agentOrError.getError());
            }
            const agent = agentOrError.getValue();
            if (agent.props.name) {
              existingNames.add(agent.props.name);
            }
          }
        }
        
        // If base name is available, use it
        if (!existingNames.has(baseName)) {
          return baseName;
        }
        
        // Otherwise, find the next available number
        let counter = 1;
        let candidateName: string;
        do {
          candidateName = `${baseName} ${counter}`;
          counter++;
        } while (existingNames.has(candidateName));
        
        return candidateName;
      };

      // Create a new agent with unique name and color (using same pattern as drag-to-create)
      const uniqueName = await generateUniqueAgentName();
      const nextColor = await getNextAvailableColor(currentFlow);
      
      const newAgent = Agent.create({
        name: uniqueName,
        targetApiType: ApiType.Chat,
        color: nextColor,
      }).getValue();

      // Save the new agent
      const savedAgentResult = await AgentService.saveAgent.execute(newAgent);
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }
      const savedAgent = savedAgentResult.getValue();

      // Calculate position at viewport center
      // Node dimensions (approximate): width 320px, height 140px
      const nodeWidth = 320;
      const nodeHeight = 140;
      
      // Get the actual React Flow container dimensions
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      
      const viewport = currentViewportRef.current;
      const viewportCenter = {
        x: ((-viewport.x + containerWidth / 2) / viewport.zoom) - (nodeWidth / 2),
        y: ((-viewport.y + containerHeight / 2) / viewport.zoom) - (nodeHeight / 2)
      };
      
      const newPosition = viewportCenter;

      // Create new agent node
      const newAgentNode: CustomNodeType = ensureNodeSafety({
        id: savedAgent.id.toString(),
        type: "agent",
        position: newPosition,
        data: {
          agentId: savedAgent.id.toString(),
        },
      });

      // Use current flow ref which has the most up-to-date data
      const currentNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
      
      
      const updatedNodes = [...currentNodes, newAgentNode];
      setNodes(updatedNodes);

      // Mark as local change and save
      isLocalChangeRef.current = true;
      setTimeout(() => {
        // Pass updatedNodes explicitly, edges will come from refs
        saveFlowChanges(updatedNodes, undefined);
      }, 0);

      // Invalidate agent queries for color updates
      invalidateAllAgentQueries();
      
      toast.success("Agent node added");
    } catch (error) {
      toast.error("Failed to create agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [nodes, edges, setNodes, saveFlowChanges, queryClient, flowId]);

  // Delete agent handler
  const deleteAgent = useCallback(async (agentId: string) => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;
    
    try {
      // Check if this is the only agent node in the flow
      const agentNodes = (currentFlow.props.nodes as CustomNodeType[]).filter(n => n.type === 'agent');
      if (agentNodes.length <= 1) {
        toast.error("Cannot delete the last agent in the flow");
        return;
      }
      
      // Remove the agent node from current flow nodes
      const updatedNodes = (currentFlow.props.nodes as CustomNodeType[]).filter(n => n.id !== agentId);
      
      // Remove all edges connected to this agent
      const updatedEdges = edges.filter(e => 
        e.source !== agentId && e.target !== agentId
      );
      
      // Update local state immediately
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      
      // Mark as local change
      isLocalChangeRef.current = true;
      
      // Delete the agent from database
      const deleteResult = await AgentService.deleteAgent.execute(new UniqueEntityID(agentId));
      if (deleteResult.isFailure) {
        console.error("Failed to delete agent from database:", deleteResult.getError());
      }
      
      // Save the flow changes - pass both explicitly as they're newly calculated
      setTimeout(() => {
        saveFlowChanges(updatedNodes, updatedEdges);
      }, 0);

      // Close all panels associated with this agent
      const agentPanelTypes = ['prompt', 'parameter', 'structuredOutput', 'preview'];
      agentPanelTypes.forEach(panelType => {
        const panelId = `${panelType}-${agentId}`;
        closePanel(panelId);
      });

      // Invalidate flow and agent queries
      invalidateSingleFlowQueries(currentFlow.id);
      invalidateAllAgentQueries();
      
    } catch (error) {
      toast.error("Failed to delete agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [nodes, edges, setNodes, setEdges, saveFlowChanges]);

  // Copy non-agent node handler
  const copyNode = useCallback(async (nodeId: string) => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;
    
    try {
      // Find the node to copy
      const nodeToCopy = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === nodeId);
      if (!nodeToCopy) {
        toast.error("Node not found");
        return;
      }

      // Calculate position for copied node (below and to the right of original)
      const newPosition = {
        x: nodeToCopy.position.x + 100,
        y: nodeToCopy.position.y + 200
      };

      // Use UniqueEntityID for copied node IDs
      const newNodeId = new UniqueEntityID().toString();
      
      // Get next available color
      const nextColor = await getNextAvailableColor(currentFlow);

      // Handle copying based on node type
      const nodeType = nodeToCopy.type as string;
      let copyResult: any = null;
      
      if (nodeType === NodeType.DATA_STORE) {
        // For data store nodes, copy the separate data entry
        const originalData = nodeToCopy.data as any;
        copyResult = await DataStoreNodeService.createDataStoreNode.execute({
          flowId: flowId,
          nodeId: newNodeId,
          name: originalData.name ? `${originalData.name} (Copy)` : "Data Update (Copy)",
          color: nextColor,
          dataStoreFields: originalData.dataStoreFields || [],
        });
      } else if (nodeType === NodeType.IF) {
        // For if nodes, copy the separate data entry
        const originalData = nodeToCopy.data as any;
        copyResult = await IfNodeService.createIfNode.execute({
          flowId: flowId,
          nodeId: newNodeId,
          name: originalData.name ? `${originalData.name} (Copy)` : "If (Copy)",
          logicOperator: originalData.logicOperator || 'AND',
          conditions: originalData.conditions || [],
          color: nextColor,
        });
      }

      if (copyResult && copyResult.isFailure) {
        toast.error(`Failed to copy node: ${copyResult.getError()}`);
        return;
      }

      // Create new flow node
      const newNode: CustomNodeType = ensureNodeSafety({
        ...nodeToCopy,
        id: newNodeId,
        position: newPosition,
        data: nodeType === NodeType.DATA_STORE || nodeType === NodeType.IF
          ? { flowId: flowId }  // Use new data structure for supported nodes
          : { ...nodeToCopy.data }, // Keep original data for other node types
      } as any); // Type assertion needed for transition period

      // Use current flow ref which has the most up-to-date data
      const currentNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
      
      
      const updatedNodes = [...currentNodes, newNode];
      setNodes(updatedNodes);
      
      // Mark as local change and save
      isLocalChangeRef.current = true;
      setTimeout(() => {
        // Pass updatedNodes explicitly, edges will come from refs
        saveFlowChanges(updatedNodes, undefined, true);
      }, 0);

      toast.success(`${nodeType === 'if' ? 'If' : 'Data Update'} node copied`);
    } catch (error) {
      toast.error("Failed to copy node", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [nodes, edges, setNodes, saveFlowChanges, queryClient, flowId]);

  // Delete non-agent node handler
  const deleteNode = useCallback(async (nodeId: string) => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;
    
    try {
      // Find the node to delete
      const nodeToDelete = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === nodeId);
      if (!nodeToDelete) {
        toast.error("Node not found");
        return;
      }

      // Don't allow deletion of start or end nodes
      if (nodeToDelete.type === 'start' || nodeToDelete.type === 'end') {
        toast.error(`Cannot delete ${nodeToDelete.type} node`);
        return;
      }

      // Remove the node from current flow nodes
      const updatedNodes = (currentFlow.props.nodes as CustomNodeType[]).filter(n => n.id !== nodeId);
      
      // Remove all edges connected to this node
      const updatedEdges = edges.filter(e => 
        e.source !== nodeId && e.target !== nodeId
      );
      
      // Update local state immediately
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      
      // Mark as local change
      isLocalChangeRef.current = true;
      
      // Delete the node from database based on type
      if (nodeToDelete.type === NodeType.DATA_STORE) {
        const deleteResult = await DataStoreNodeService.deleteDataStoreNode.execute({
          nodeId: nodeId
        });
        if (deleteResult.isFailure) {
          console.error("Failed to delete data store node from database:", deleteResult.getError());
        }
        // Invalidate data store node queries
        const { dataStoreNodeKeys } = await import("@/app/queries/data-store-node/query-factory");
        await queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.detail(flowId, nodeId) });
      } else if (nodeToDelete.type === NodeType.IF) {
        const deleteResult = await IfNodeService.deleteIfNode.execute({
          nodeId: nodeId
        });
        if (deleteResult.isFailure) {
          console.error("Failed to delete if node from database:", deleteResult.getError());
        }
        // Invalidate if node queries
        const { ifNodeKeys } = await import("@/app/queries/if-node/query-factory");
        await queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
      }
      // Ensure flow consumers update after structural delete
      await invalidateSingleFlowQueries(flowId);
      
      // Save the flow changes - pass both explicitly as they're newly calculated
      setTimeout(() => {
        saveFlowChanges(updatedNodes, updatedEdges);
      }, 0);

      toast.success(`${nodeToDelete.type === 'if' ? 'If' : 'Data Update'} node deleted`);
    } catch (error) {
      toast.error("Failed to delete node", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [nodes, edges, setNodes, setEdges, saveFlowChanges, queryClient, flowId]);

  // Handle click on node handle to show node creation menu
  const handleHandleClick = useCallback((nodeId: string, handleType: string, handleId?: string) => {
    // Only handle source handles
    if (handleType !== 'source') return;
    
    const currentFlow = flowRef.current;
    if (!currentFlow) return { x: 0, y: 0 };
    
    if (!currentFlow.props?.nodes) {
      console.error('❌ [DEBUG] currentFlow.props.nodes is undefined!', currentFlow);
      return { x: 0, y: 0 };
    }
    
    const sourceNode = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === nodeId);
    if (!sourceNode) return;

    // Find the node element in the DOM
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return;

    // Get the bounding rect of the node
    const nodeRect = nodeElement.getBoundingClientRect();
    const canvasRect = document.querySelector('.react-flow')?.getBoundingClientRect();
    
    if (!canvasRect) return;
    
    // Calculate position for menu (to the right of the node)
    const menuOffset = 28;
    const menuX = nodeRect.right - canvasRect.left + menuOffset;
    const menuY = nodeRect.top + (nodeRect.height / 2) - canvasRect.top;
    
    // Set menu position
    setNodeSelectionPosition({
      x: menuX,
      y: menuY
    });

    // Store pending connection info
    pendingConnectionRef.current = {
      sourceNodeId: nodeId,
      sourceHandleId: handleId, // Store the handle ID for if-node true/false handles
      position: {
        x: sourceNode.position.x + 400,
        y: sourceNode.position.y
      }
    };

    // Show the node selection menu
    setShowNodeSelection(true);
  }, [nodes]);

  // Method to update node data directly with validation
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    // Validate the new data before applying
    if (!newData || typeof newData !== 'object') {
      console.error('[updateNodeData] Invalid data provided:', newData);
      toast.error('Cannot update node: Invalid data');
      return;
    }
    
    // Check for dangerous updates that could corrupt the node
    const dangerousKeys = ['id', 'type', 'position'];
    const hasDangerousKeys = Object.keys(newData).some(key => dangerousKeys.includes(key));
    if (hasDangerousKeys) {
      console.error('[updateNodeData] Attempted to update protected fields:', Object.keys(newData));
      toast.error('Cannot update protected node fields');
      return;
    }
    
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map(node => {
        if (node.id !== nodeId) return node;
        
        // Create the updated node
        return { 
          ...node, 
          data: { ...node.data, ...newData } 
        };
      });
      
      // Mark as local change and save after state update
      isLocalChangeRef.current = true;
      setTimeout(() => {
        // Pass updatedNodes explicitly, edges from ref is already current
        saveFlowChanges(updatedNodes, edgesRef.current, true);
      }, 0);
      
      return updatedNodes;
    });
  }, [setNodes, saveFlowChanges]);

  // Effect 3: Register flow panel methods for all nodes - use ref to avoid re-renders
  const methodsRef = useRef<{
    copyAgent: typeof copyAgent;
    deleteAgent: typeof deleteAgent;
    copyNode: typeof copyNode;
    deleteNode: typeof deleteNode;
    handleHandleClick: typeof handleHandleClick;
    updateNodeData: typeof updateNodeData;
  }>();
  
  methodsRef.current = {
    copyAgent,
    deleteAgent,
    copyNode,
    deleteNode,
    handleHandleClick,
    updateNodeData
  };
  
  useEffect(() => {
    // Register methods so nodes can trigger operations
    (window as any).flowPanelCopyAgent = (agentId: string) => methodsRef.current?.copyAgent(agentId);
    (window as any).flowPanelDeleteAgent = (agentId: string) => methodsRef.current?.deleteAgent(agentId);
    (window as any).flowPanelCopyNode = (nodeId: string) => methodsRef.current?.copyNode(nodeId);
    (window as any).flowPanelDeleteNode = (nodeId: string) => methodsRef.current?.deleteNode(nodeId);
    (window as any).flowPanelHandleClick = (nodeId: string, handleType: string, handleId?: string) => 
      methodsRef.current?.handleHandleClick(nodeId, handleType, handleId);
    (window as any).flowPanelUpdateNodeData = (nodeId: string, newData: any) =>
      methodsRef.current?.updateNodeData(nodeId, newData);
    
    // Add method to get node from React Flow (for when flow data is stale)
    (window as any).flowPanelGetNode = (nodeId: string) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return undefined;
      return (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === nodeId);
    };
    
    return () => {
      delete (window as any).flowPanelCopyAgent;
      delete (window as any).flowPanelDeleteAgent;
      delete (window as any).flowPanelCopyNode;
      delete (window as any).flowPanelDeleteNode;
      delete (window as any).flowPanelHandleClick;
      delete (window as any).flowPanelUpdateNodeData;
      delete (window as any).flowPanelGetNode;
    };
  }, [nodes]); // Update when nodes change

  // Effect 4: Register flow actions with context for use in other panels
  useEffect(() => {
    registerFlowActions({
      addDataStoreNode,
      addIfNode,
    });
  }, [registerFlowActions]); // Removed addDataStoreNode and addIfNode - they cause infinite loop

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Mark that a connection was made
      connectionMadeRef.current = true;
      
      // Find the source and target nodes to determine their types
      const currentFlow = flowRef.current;
      if (!currentFlow) return;
      const currentNodes = currentFlow.props.nodes as CustomNodeType[];
      const sourceNode = currentNodes.find(n => n.id === connection.source);
      const targetNode = currentNodes.find(n => n.id === connection.target);
      
      // Remove existing connections to implement automatic connection replacement
      const filteredEdges = filterExistingConnections(edges, sourceNode, targetNode, connection);
      
      // Add the new connection with label for if-node edges
      let updatedEdges = addEdge(connection, filteredEdges);
      
      // Make the newly added edge selectable
      updatedEdges = updatedEdges.map(edge => 
        edge.source === connection.source && edge.target === connection.target
          ? ensureEdgeSelectable(edge)
          : edge
      );
      
      // Add label for if-node edges
      if (sourceNode?.type === 'if' && connection.sourceHandle) {
        const edgeIndex = updatedEdges.findIndex(e => 
          e.source === connection.source && 
          e.target === connection.target && 
          e.sourceHandle === connection.sourceHandle
        );
        if (edgeIndex >= 0) {
          updatedEdges[edgeIndex] = {
            ...updatedEdges[edgeIndex],
            label: connection.sourceHandle === 'true' ? 'True' : 'False'
          };
        }
      }
      
      setEdges(updatedEdges);
      isLocalChangeRef.current = true; // Mark as local change
      
      // Save the flow with the new connection (use setTimeout to ensure state is updated)
      setTimeout(() => {
        // Pass updatedEdges explicitly, nodes will come from refs for freshness
        saveFlowChanges(undefined, updatedEdges, true);
      }, 0);
    },
    [setEdges, edges, nodes, saveFlowChanges]
  );

  // Handle connection start
  const onConnectStart: OnConnectStart = useCallback((event, { nodeId, handleType, handleId }) => {
    const mouseEvent = event as MouseEvent;
    
    // Try to get the handle ID from the DOM if not provided
    let actualHandleId = handleId;
    if (!actualHandleId && mouseEvent.target) {
      const handleElement = (mouseEvent.target as HTMLElement).closest('.react-flow__handle');
      if (handleElement) {
        actualHandleId = handleElement.getAttribute('data-handleid') || 
                        handleElement.getAttribute('data-id') ||
                        handleElement.id;
      }
    }
    
    connectionStartRef.current = { 
      nodeId: nodeId || '', 
      handleType: handleType || '',
      handleId: actualHandleId || undefined,
      startX: mouseEvent.clientX,
      startY: mouseEvent.clientY
    };
    connectionMadeRef.current = false; // Reset connection flag
  }, []);

  // Create node with specific type
  const handleNodeTypeSelection = useCallback(async (nodeType: "agent" | "dataStore" | "if") => {
    const currentFlow = flowRef.current;
    if (pendingConnectionRef.current && currentFlow) {
      // Use current flow ref which has the most up-to-date data
      const latestNodes = (currentFlow.props.nodes as CustomNodeType[]) || [];
      const latestEdges = (currentFlow.props.edges as CustomEdgeType[]) || [];
      
      
      const result = await createNodeWithConnection(
        nodeType,
        pendingConnectionRef.current.sourceNodeId,
        pendingConnectionRef.current.sourceHandleId,
        pendingConnectionRef.current.position,
        currentFlow,
        latestNodes,
        latestEdges,
        filterExistingConnections
      );
      
      if (result) {
        setNodes(result.updatedNodes);
        setEdges(result.updatedEdges);
        isLocalChangeRef.current = true;
        
        setTimeout(() => {
          // Pass both explicitly as they're the result of the operation
          saveFlowChanges(result.updatedNodes, result.updatedEdges, true);
        }, 0);
        
        toast.success(`${nodeType === "agent" ? "Agent" : nodeType === "dataStore" ? "Data Update" : "If"} node created`);
      }
    }
    setShowNodeSelection(false);
    pendingConnectionRef.current = null;
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges, filterExistingConnections, queryClient, flowId]);

  // Handle connection end - show menu for short drags or handle clicks
  const onConnectEnd: OnConnectEnd = useCallback((event) => {
    const connectionStart = connectionStartRef.current;
    const mouseEvent = event as MouseEvent;
    
    // If connectionStart is null, it means onConnectStart was never called (pure click without drag)
    // In this case, we need to detect if we clicked on a handle
    if (!connectionStart) {
      // Check if the click target is a handle (source type)
      const target = mouseEvent.target as HTMLElement;
      const handleElement = target.closest('.react-flow__handle-right');
      
      if (handleElement) {
        // Get the node ID from the handle's parent node
        const nodeElement = handleElement.closest('[data-id]') as HTMLElement;
        if (nodeElement) {
          const nodeId = nodeElement.getAttribute('data-id');
          const currentFlow = flowRef.current;
          if (!currentFlow) return;
          const sourceNode = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === nodeId);
          
          if (sourceNode && flowRef.current) {
            // This was a click on a source handle without drag
            const canvasRect = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
            if (canvasRect) {
              const nodeRect = nodeElement.getBoundingClientRect();
              
              // Position menu to the right of the node with small offset
              const menuOffset = 28;
              const menuX = nodeRect.right - canvasRect.left + menuOffset;
              const menuY = nodeRect.top + (nodeRect.height / 2) - canvasRect.top;
              
              // Set menu position
              setNodeSelectionPosition({
                x: menuX,
                y: menuY
              });
              
              // Store pending connection info
              pendingConnectionRef.current = {
                sourceNodeId: nodeId!,
                sourceHandleId: undefined,
                position: {
                  x: sourceNode.position.x + 400,
                  y: sourceNode.position.y
                }
              };
              
              setShowNodeSelection(true);
            }
          }
        }
      }
      
      // Reset and return early
      connectionStartRef.current = null;
      return;
    }
    
    // Original logic for when drag was initiated (onConnectStart was called)
    // Only show menu when dragging from source handles
    if (connectionStart.handleType === 'source') {
      
      // Wait a moment for ReactFlow to process any connection that might have been made
      setTimeout(() => {
        // Check if a connection was actually made using our ref flag
        if (connectionMadeRef.current) {
          return; // Exit early, connection was made
        }
        
        // Get the mouse position from the event
        const canvasRect = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
        
        if (canvasRect && flowRef.current) {
          // Calculate drag distance
          const dragDistance = Math.sqrt(
            Math.pow(mouseEvent.clientX - connectionStart.startX, 2) + 
            Math.pow(mouseEvent.clientY - connectionStart.startY, 2)
          );

          // Define threshold for showing menu
          const SHORT_DRAG_THRESHOLD = 50;

          // Show menu if it was a click (no drag) or short drag on the handle
          // A click is when you press and release without moving (distance ~0)
          if (dragDistance <= SHORT_DRAG_THRESHOLD) {
            // Get source node
            const currentFlow = flowRef.current;
            if (!currentFlow) return;
            const sourceNode = (currentFlow.props.nodes as CustomNodeType[]).find(n => n.id === connectionStart.nodeId);
            if (!sourceNode) return;

            // Find the node element in the DOM
            const nodeElement = document.querySelector(`[data-id="${connectionStart.nodeId}"]`);
            if (!nodeElement) return;

            // Get the bounding rect of the node
            const nodeRect = nodeElement.getBoundingClientRect();
            const canvasRectAbs = canvasRect;
            
            // Position menu to the right of the node with 16px gap
            const menuOffset = 28; // 16px gap from the node
            
            // Calculate menu position relative to the canvas
            const menuX = nodeRect.right - canvasRectAbs.left + menuOffset;
            const menuY = nodeRect.top + (nodeRect.height / 2) - canvasRectAbs.top;

            // Set menu position
            setNodeSelectionPosition({
              x: menuX,
              y: menuY
            });
            
            // Store pending connection info (including handle ID from drag start)
            pendingConnectionRef.current = {
              sourceNodeId: connectionStart.nodeId,
              sourceHandleId: connectionStart.handleId, // Use the handle ID captured at drag start
              position: {
                x: sourceNode.position.x + 400, // Position new node further right
                y: sourceNode.position.y
              }
            };
            
            setShowNodeSelection(true);
          }
          // If drag was too long, it was an intentional connection attempt, do nothing
        }
      }, 100); // End setTimeout
    }
    
    // Reset connection start state
    connectionStartRef.current = null;
  }, [nodes, edges, setNodes, setEdges, saveFlowChanges]);

  // Track if we're currently dragging
  const isDraggingRef = useRef(false);

  // Handle node changes to track dirty state
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    // Check for drag start/end
    const dragStartChanges = changes.filter((c: any) => c.type === 'position' && c.dragging === true);
    const dragEndChanges = changes.filter((c: any) => c.type === 'position' && c.dragging === false);
    
    if (dragStartChanges.length > 0 && !isDraggingRef.current) {
      isDraggingRef.current = true;
    }
    
    if (dragEndChanges.length > 0 && isDraggingRef.current) {
      isDraggingRef.current = false;
    }
    
    // Check if any nodes were removed (agent deletion)
    const hasRemovals = changes.some((change: any) => change.type === 'remove');
    if (hasRemovals) {
      // Handle node removal if needed
    }
  }, [onNodesChange]);

  // Handle node drag stop to save final positions
  const handleNodeDragStop = useCallback((_event: any, draggedNode: any, draggedNodes: any[]) => {
    // Get all dragged nodes (could be multiple if selection was dragged)
    const nodesToUpdate = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [draggedNode];
    
    // Create position updates for all dragged nodes
    const positionUpdates = nodesToUpdate.map(node => ({
      nodeId: node.id,
      position: node.position
    }));
    
    // Use the position-only mutation to avoid overwriting other node data
    updateNodesPositions.mutate(positionUpdates, {
      onSuccess: () => {
        // Skip the next sync since we just updated positions
        skipNextSyncRef.current = true;
      }
    });
  }, [updateNodesPositions]);

  // Handle edge changes to track dirty state
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    
    // Check if any edges were removed
    const hasRemovals = changes.some((change: any) => change.type === 'remove');
    
    if (hasRemovals) {
      // Save the flow when edges are deleted
      // Use setTimeout to allow ReactFlow to update the state first
      setTimeout(() => {
        // Get the latest edges from the ref which will be updated by onEdgesChange
        const currentEdges = edgesRef.current;
        const currentNodes = nodesRef.current;
        
        // Mark as local change
        isLocalChangeRef.current = true;
        
        // Use refs data which is already current
        saveFlowChanges(currentNodes, currentEdges, true);
      }, 0);
    }
  }, [onEdgesChange, saveFlowChanges]);

  // Preview session
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    ...sessionQueries.list({}), // SearchSessionsQuery doesn't have flowId
    enabled: !!flow,
  });
  const previewSessionId = useAgentStore.use.previewSessionId();
  const setPreviewSessionId = useAgentStore.use.setPreviewSessionId();
  const handleSessionChange = useCallback((sessionId: string) => {
    if (sessionId === "none") {
      setPreviewSessionId(null);
    } else {
      setPreviewSessionId(sessionId);
    }
  }, [setPreviewSessionId]);


  if (!flow) {
    return (
      <div className="h-full w-full p-4 text-text-subtle bg-background-surface-2">
        Flow not found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {/* Header section with flow name */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-4">
        {/* Flow header - conditional left margin */}
        <div className={cn(
          "px-4 py-2 bg-background-surface-3 rounded-lg inline-flex justify-start items-center gap-2 transition-all duration-200",
          {
            "ml-0": isMobile || isExpanded,  // Normal left margin when mobile or navigation expanded
            "ml-12": !isMobile && !isExpanded  // Larger left margin when navigation collapsed
          }
        )}>
          <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
            <div className="text-text-body text-xs font-normal whitespace-nowrap">Flow name</div>
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="text-text-primary text-xs font-semibold bg-transparent outline-none min-w-[80px] max-w-full"
                  style={{ width: `${Math.max(editedTitle.length * 6 + 16, 80)}px` }}
                  autoFocus
                />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
              >
                <Check className="w-3 h-3 text-status-success" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <div className="text-text-primary text-xs font-semibold truncate">
                {flow.props.name || 'Untitled Flow'}
              </div>
              <button
                onClick={() => {
                  setEditedTitle(flow.props.name || "");
                  setIsEditingTitle(true);
                }}
                className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
              >
                <Pencil className="w-3 h-3 text-text-subtle hover:text-text-primary transition-colors" />
              </button>
            </>
          )}
        </div>

        {/* Select preview session */}
        <div className="flex flex-row gap-2 items-center">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-text-info cursor-help" />
              </TooltipTrigger>
              <TooltipContent variant="button" side="bottom">
                <p className="max-w-xs text-xs">
                  Select a session to see how its data appears within the flow. This feature applies to Preview and Variable tabs. Data will be based on the last message of the session.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Select
            value={previewSessionId || "none"}
            onValueChange={handleSessionChange}
          >
            <SelectTrigger className="w-[242px] min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {isLoadingSessions ? (
                <SelectItem value="loading" disabled>
                  Loading sessions...
                </SelectItem>
              ) : (
                sessions
                  .filter((session: Session) => session.flowId?.equals(flow.id))
                  .map((session: Session) => (
                    <SelectItem
                      key={session.id.toString()}
                      value={session.id.toString()}
                    >
                      {session.props.title ||
                        `Session ${session.id.toString().slice(0, 8)}`}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Flow panel buttons - new layout */}
      <div className="w-full flex justify-between items-start gap-2">
        {/* Left side buttons */}
        <div className="flex gap-2">
          {/* Agent button - creates agent node directly */}
          <ButtonPill
            size="default"
            onClick={addAgentNode}
            className="min-w-[96px]"
          >
            Agent (node)
          </ButtonPill>
          
          {/* Data dropdown - Schema panel or Create data store node */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="min-w-[96px]">
                <ButtonPill
                  size="default"
                  className="w-full"
                >
                  Data
                </ButtonPill>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={16} className="!min-w-[92px] !w-[92px] p-0 rounded-lg overflow-hidden">
              <button
                onClick={() => openPanel(PANEL_TYPES.DATA_STORE_SCHEMA)}
                className="w-[92px] h-[31px] bg-background-surface-4 border-b border-border-normal inline-flex justify-center items-center hover:bg-background-surface-5 transition-colors"
              >
                <div className="text-center text-text-primary text-xs font-normal whitespace-nowrap">
                  Schema
                </div>
              </button>
              <NodeSelectionMenuItems
                onSelectNodeType={(type) => {
                  if (type === "dataStore") {
                    addDataStoreNode();
                  }
                }}
                variant="dropdown"
                showOnlyDataStore={true}
                customDataStoreLabel="Update (node)"
              />
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Conditional dropdown - only If node option */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="min-w-[96px]">
                <ButtonPill
                  size="default"
                  className="w-full"
                >
                  Conditional
                </ButtonPill>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={16} className="!min-w-[92px] !w-[92px] p-0 rounded-lg overflow-hidden">
              <NodeSelectionMenuItems
                onSelectNodeType={(type) => {
                  if (type === "if") {
                    addIfNode();
                  }
                }}
                variant="dropdown"
                showOnlyIf={true}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Right side buttons */}
        <div className="flex gap-2">
          <ButtonPill
            size="default"
            icon={<BookOpen />}
            active={isPanelOpen(PANEL_TYPES.VARIABLE)}
            onClick={() => openPanel(PANEL_TYPES.VARIABLE)}
            className="min-w-[96px]"
          >
            Variables
          </ButtonPill>
          <ButtonPill
            size="default"
            icon={<SearchCheck />}
            active={isPanelOpen(PANEL_TYPES.VALIDATION)}
            onClick={() => openPanel(PANEL_TYPES.VALIDATION)}
            className="min-w-[96px]"
          >
            Validation
          </ButtonPill>
          <ButtonPill
            size="default"
            variant="gradient"
            icon={<SvgIcon name="ai_assistant"/>}
            active={rightSidebar?.isOpen}
            onClick={handleVibeCodingToggle}
            className="min-w-[96px]"
          >
            AI assistant
          </ButtonPill>
        </div>
      </div>
    </div>
    
    {/* Main flow canvas */}
    <Card className="h-full w-full overflow-hidden rounded-none border-0">
        <div className="w-full h-full relative" style={{ minHeight: '200px' }}>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {isReady && (
            <ReactFlowProvider>
              <ReactFlow<CustomNodeType, CustomEdgeType>
                  proOptions={proOptions}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onConnect={onConnect}
                  onConnectStart={onConnectStart}
                  onConnectEnd={onConnectEnd}
                  onNodeDragStop={handleNodeDragStop}
                  onViewportChange={onViewportChange}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  deleteKeyCode={["Backspace", "Delete"]}
                  elementsSelectable={true}
                  selectNodesOnDrag={false}
                  defaultViewport={flow?.props.viewport ? {
                    x: flow.props.viewport.x,
                    y: flow.props.viewport.y,
                    zoom: flow.props.viewport.zoom
                  } : { x: 0, y: 0, zoom: 1 }}
                  fitView={!flow?.props.viewport}
                  fitViewOptions={{
                    padding: 0.2,
                    duration: 0,
                    minZoom: 0.5,
                    maxZoom: 1.5
                  }}
                  minZoom={0.1}
                  maxZoom={2}
                  attributionPosition="bottom-left"
                >
                <Background bgColor="#1B1B1B" color="#64748B" />
                <CustomReactFlowControls />
              </ReactFlow>
            </ReactFlowProvider>
          )}
          {showNodeSelection && (
            <NodeSelectionMenu
              position={nodeSelectionPosition}
              onSelectNodeType={handleNodeTypeSelection}
              onClose={() => {
                setShowNodeSelection(false);
                pendingConnectionRef.current = null;
              }}
              className="w-32"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

// Main export
export function FlowPanel({ flowId }: FlowPanelProps) {
  return <FlowPanelInner flowId={flowId} />;
}