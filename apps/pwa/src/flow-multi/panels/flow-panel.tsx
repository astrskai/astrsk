import { useState, useRef, useEffect, useCallback } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { PANEL_TYPES } from "@/flow-multi/components/panel-types";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { Node as FlowNode, Edge as FlowEdge, FlowViewport, Flow } from "@/modules/flow/domain/flow";
import { getNextAvailableColor } from "@/flow-multi/utils/agent-color-assignment";
import { invalidateAllAgentQueries } from "@/flow-multi/utils/invalidate-agent-queries";
import { cn } from "@/shared/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { BookOpen, Pencil, Check, X, Loader2, Shield, HelpCircle, Plus } from "lucide-react";
import { ButtonPill } from "@/components-v2/ui/button-pill";
import { toast } from "sonner";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { useLeftNavigationWidth } from "@/components-v2/left-navigation/hooks/use-left-navigation-width";
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

import { NodeSelectionMenu } from "@/flow-multi/components/node-selection-menu";
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
  const connectionStartRef = useRef<{ nodeId: string; handleType: string; startX: number; startY: number } | null>(null);
  const connectionMadeRef = useRef<boolean>(false);
  const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Node selection menu state
  const [showNodeSelection, setShowNodeSelection] = useState(false);
  const [nodeSelectionPosition, setNodeSelectionPosition] = useState({ x: 0, y: 0 });
  const pendingConnectionRef = useRef<{ sourceNodeId: string; position: { x: number; y: number } } | null>(null);
  const lastSyncedFlowIdRef = useRef<string | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const lastExternalDataHashRef = useRef<string | null>(null);
  const lastSavedDataHashRef = useRef<string | null>(null);

  // 3. Context hooks
  const { openPanel, closePanel, isPanelOpen, registerFlowActions } = useFlowPanelContext();
  const { isExpanded, isMobile } = useLeftNavigationWidth();
  const queryClient = useQueryClient();

  // 4. React Query hooks - using global queryClient settings
  const { data: flow } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
  });

  // Handle flow title editing
  const handleSaveTitle = useCallback(async () => {
    if (!flow || editedTitle === flow.props.name) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      // Use the update method to change the name
      const updatedFlowResult = flow.update({
        name: editedTitle
      });
      
      if (updatedFlowResult.isFailure) {
        console.error("Failed to update flow:", updatedFlowResult.getError());
        return;
      }

      const updatedFlow = updatedFlowResult.getValue();

      // Check if FlowService.saveFlow is initialized before using it
      if (!FlowService.saveFlow || typeof FlowService.saveFlow.execute !== 'function') {
        console.warn('⚠️ FlowService.saveFlow not initialized yet');
        return;
      }

      const savedFlowResult = await FlowService.saveFlow.execute(updatedFlow);
      if (savedFlowResult.isFailure) {
        console.error("Failed to save flow:", savedFlowResult.getError());
        return;
      }
      
      // Mark that we have external changes coming
      isLocalChangeRef.current = false; // Title change will come from external
      
      // Invalidate flow queries to update the name in left navigation
      await queryClient.invalidateQueries({
        queryKey: flowQueries.all(),
        exact: false
      });
      
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error saving flow title:", error);
      toast.error("Failed to update flow name");
    } finally {
      setIsSavingTitle(false);
    }
  }, [flow, editedTitle]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle("");
  }, []);

  // Handle double-click to close variables panel
  const handleCloseVariablesPanel = useCallback(() => {
    const panelId = `${PANEL_TYPES.VARIABLE}-standalone`;
    closePanel(panelId);
  }, [closePanel]);

  // Save flow when edges/nodes change
  const saveFlowChanges = useCallback(async (updatedNodes: CustomNodeType[], updatedEdges: CustomEdgeType[], isStructuralChange: boolean = false) => {
    if (!flow) return;

    try {
      const updatedFlow = flow.update({
        nodes: updatedNodes as any,
        edges: updatedEdges as any,
      });

      if (updatedFlow.isFailure) {
        return;
      }

      // Check if FlowService.saveFlow is initialized before using it
      if (!FlowService.saveFlow || typeof FlowService.saveFlow.execute !== 'function') {
        console.warn('⚠️ FlowService.saveFlow not initialized yet');
        return;
      }
      const savedFlowResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (savedFlowResult.isFailure) {
        return;
      }

      // After successful save, update our saved data hash
      const savedNodes = (savedFlowResult.getValue().props.nodes as CustomNodeType[]) || [];
      const savedEdges = (savedFlowResult.getValue().props.edges as CustomEdgeType[]) || [];
      lastSavedDataHashRef.current = createDataHash(savedNodes, savedEdges);
      
      // Check if our local changes match what we just saved
      const currentLocalHash = createDataHash(updatedNodes, updatedEdges);
      if (currentLocalHash === lastSavedDataHashRef.current) {
        // Local changes are now saved, reset the flag
        isLocalChangeRef.current = false;
      }
      
      // Only invalidate queries for structural changes (agent creation/deletion, connections)
      // Don't invalidate for simple position updates to avoid unnecessary re-renders
      // if (isStructuralChange) {
      //   // Invalidate the specific flow   queries to update agent nodes
      //   await queryClient.invalidateQueries({
      //     queryKey: flowQueries.detail(savedFlowResult.getValue().id).queryKey
      //   });
        
      //   // Also invalidate all flow queries to ensure everything is refreshed
      //   await queryClient.invalidateQueries({
      //     queryKey: flowQueries.all(),
      //     exact: false
      //   });
      // }
    } catch (error) {
      console.log(error);
    }
  }, [flow, queryClient]);

  // Save viewport state to flow
  const saveViewportState = useCallback(async (newViewport: Viewport) => {
    if (!flow) return;

    try {
      const flowViewport: FlowViewport = {
        x: newViewport.x,
        y: newViewport.y,
        zoom: newViewport.zoom
      };

      const updatedFlow = flow.update({
        viewport: flowViewport
      });

      if (updatedFlow.isFailure) {
        return;
      }

      // Check if FlowService.saveFlow is initialized before using it
      if (!FlowService.saveFlow || typeof FlowService.saveFlow.execute !== 'function') {
        console.warn('⚠️ FlowService.saveFlow not initialized yet');
        return;
      }
      const savedFlowResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (savedFlowResult.isFailure) {
        return;
      }

      // Update store with new viewport
    } catch (error) {
      console.error('Failed to save viewport:', error);
    }
  }, [flow]);

  // Handle viewport changes with debouncing
  const onViewportChange = useCallback((newViewport: Viewport) => {
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
  // Effect 1: Smart sync - only sync when there are actual external changes
  useEffect(() => {
    if (!flow) return;
    
    const flowIdStr = flow.id.toString();
    const isDifferentFlow = lastSyncedFlowIdRef.current !== flowIdStr;
    
    // Get external data
    const externalNodes = (flow.props.nodes as CustomNodeType[]) || [];
    const externalEdges = (flow.props.edges as CustomEdgeType[]) || [];
    const currentDataHash = createDataHash(externalNodes, externalEdges);
    
    // Check if external data actually changed (ignoring positions)
    if (!isDifferentFlow && currentDataHash === lastExternalDataHashRef.current) {
      return; // No structural changes, keep local state
    }
    
    if (isDifferentFlow) {
      // Switching flows - fresh load
      setNodes(externalNodes);
      setEdges(externalEdges);
      lastSyncedFlowIdRef.current = flowIdStr;
      isLocalChangeRef.current = false;
      // Initialize saved data hash for new flow
      lastSavedDataHashRef.current = currentDataHash;
    } else if (isLocalChangeRef.current && nodes.length > 0) {
      // We have local changes - check if they're already saved
      const currentLocalHash = createDataHash(nodes, edges);
      
      if (currentLocalHash === lastSavedDataHashRef.current) {
        // Local changes match saved state, we can safely sync
        isLocalChangeRef.current = false;
        setNodes(externalNodes);
        setEdges(externalEdges);
      } else {
        // We have unsaved local changes - preserve positions
        const localPositions = new Map(nodes.map(n => [n.id, n.position]));
        
        const mergedNodes = externalNodes.map(extNode => {
          const localPos = localPositions.get(extNode.id);
          return localPos ? { ...extNode, position: localPos } : extNode;
        });
        
        setNodes(mergedNodes);
        setEdges(externalEdges);
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
  }, [flow, nodes, setNodes, setEdges]);


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
    if (!flow) return;
    
    try {
      // Use the cloneAgent use case for cleaner implementation
      const clonedAgentResult = await AgentService.cloneAgent.execute(new UniqueEntityID(agentId));
      if (clonedAgentResult.isFailure) {
        throw new Error(clonedAgentResult.getError());
      }
      const clonedAgent = clonedAgentResult.getValue();
      
      // Update the cloned agent with a new color
      const nextColor = await getNextAvailableColor(flow);
      const updatedAgent = clonedAgent.update({ color: nextColor });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save the updated agent with new color
      const savedAgentResult = await AgentService.saveAgent.execute(clonedAgent);
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }
      const savedAgent = savedAgentResult.getValue();

      // Calculate position for copied agent node (below original)
      const currentNode = nodes.find(n => n.id === agentId);
      const newNodePosition = currentNode 
        ? { x: currentNode.position.x+100, y: currentNode.position.y + 200 }
        : { x: 400, y: 200 };

      // Create new agent node
      const newAgentNode: CustomNodeType = {
        id: savedAgent.id.toString(),
        type: "agent",
        position: newNodePosition,
        data: {
          agentId: savedAgent.id.toString(),
        },
      };

      // Update local state immediately
      const updatedNodes = [...nodes, newAgentNode];
      setNodes(updatedNodes);
      
      // Mark as local change
      isLocalChangeRef.current = true;
      
      // Save the flow changes
      setTimeout(() => {
        saveFlowChanges(updatedNodes, edges, true);
      }, 0);
      
      // Invalidate agent queries for color updates
      invalidateAllAgentQueries();
      
    } catch (error) {
      toast.error("Failed to copy agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, saveFlowChanges]);

  // Add node functions
  const addDataStoreNode = useCallback(async () => {
    if (!flow) return;

    // Calculate position for new node (center of viewport or offset from last node)
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode 
      ? { x: lastNode.position.x + 200, y: lastNode.position.y }
      : { x: 400, y: 300 };

    // Get next available color
    const nextColor = await getNextAvailableColor(flow);

    // Create new Data Store node
    const newNode: CustomNodeType = {
      id: `datastore-${Date.now()}`,
      type: "dataStore",
      position: newPosition,
      data: {
        label: "Data Store",
        color: nextColor,
      },
    };

    // Update nodes
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    // Mark as local change and save
    isLocalChangeRef.current = true;
    setTimeout(() => {
      saveFlowChanges(updatedNodes, edges, true);
    }, 0);

    toast.success("Data Store node added");
  }, [flow, nodes, edges, setNodes, saveFlowChanges]);

  const addIfNode = useCallback(async () => {
    if (!flow) return;

    // Calculate position for new node
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode 
      ? { x: lastNode.position.x + 200, y: lastNode.position.y }
      : { x: 400, y: 400 };

    // Get next available color
    const nextColor = await getNextAvailableColor(flow);

    // Create new If node
    const newNode: CustomNodeType = {
      id: `if-${Date.now()}`,
      type: "if",
      position: newPosition,
      data: {
        label: "If Condition",
        logicOperator: 'AND',
        conditions: [],
        color: nextColor
      },
    };

    // Update nodes
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    // Mark as local change and save
    isLocalChangeRef.current = true;
    setTimeout(() => {
      saveFlowChanges(updatedNodes, edges, true);
    }, 0);

    toast.success("If node added");
  }, [flow, nodes, edges, setNodes, saveFlowChanges]);

  const addAgentNode = useCallback(async () => {
    if (!flow) return;

    try {
      // Generate unique agent name using existing logic
      const generateUniqueAgentName = async (baseName: string = "New Agent"): Promise<string> => {
        const existingNames = new Set<string>();
        
        // Collect existing agent names from current flow
        if (flow?.agentIds) {
          for (const agentId of flow.agentIds) {
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
      const nextColor = await getNextAvailableColor(flow);
      
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

      // Calculate position for new agent
      const lastNode = nodes[nodes.length - 1];
      const newPosition = lastNode 
        ? { x: lastNode.position.x + 200, y: lastNode.position.y }
        : { x: 400, y: 200 };

      // Create new agent node
      const newAgentNode: CustomNodeType = {
        id: savedAgent.id.toString(),
        type: "agent",
        position: newPosition,
        data: {
          agentId: savedAgent.id.toString(),
        },
      };

      // Update nodes
      const updatedNodes = [...nodes, newAgentNode];
      setNodes(updatedNodes);
      
      // Mark as local change and save
      isLocalChangeRef.current = true;
      setTimeout(() => {
        saveFlowChanges(updatedNodes, edges, true);
      }, 0);

      // Invalidate agent queries for color updates
      invalidateAllAgentQueries();
      
      toast.success("Agent node added");
    } catch (error) {
      toast.error("Failed to create agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, saveFlowChanges]);

  // Delete agent handler
  const deleteAgent = useCallback(async (agentId: string) => {
    if (!flow) return;
    
    try {
      // Check if this is the only agent node in the flow
      const agentNodes = nodes.filter(n => n.type === 'agent');
      if (agentNodes.length <= 1) {
        toast.error("Cannot delete the last agent in the flow");
        return;
      }
      
      // Remove the agent node from nodes
      const updatedNodes = nodes.filter(n => n.id !== agentId);
      
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
      
      // Save the flow changes
      setTimeout(() => {
        saveFlowChanges(updatedNodes, updatedEdges, true);
      }, 0);
      
      // Invalidate flow queries
      // await queryClient.invalidateQueries({
      //   queryKey: flowQueries.detail(flow.id).queryKey
      // });
      
    } catch (error) {
      toast.error("Failed to delete agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges]);

  // Copy non-agent node handler
  const copyNode = useCallback(async (nodeId: string) => {
    if (!flow) return;
    
    try {
      // Find the node to copy
      const nodeToCopy = nodes.find(n => n.id === nodeId);
      if (!nodeToCopy) {
        toast.error("Node not found");
        return;
      }

      // Calculate position for copied node (below and to the right of original)
      const newPosition = {
        x: nodeToCopy.position.x + 100,
        y: nodeToCopy.position.y + 200
      };

      // Get next available color
      const nextColor = await getNextAvailableColor(flow);

      // Create new node with unique ID, copied data, and new color
      // Need to handle different node types appropriately
      let newNodeData: any = { ...nodeToCopy.data };
      
      // Only add color to nodes that support it (if and dataStore)
      if (nodeToCopy.type === 'if' || nodeToCopy.type === 'dataStore') {
        newNodeData.color = nextColor;
      }
      
      const newNode: CustomNodeType = {
        ...nodeToCopy,
        id: `${nodeToCopy.type}-${Date.now()}`,
        position: newPosition,
        data: newNodeData
      };

      // Update nodes
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      
      // Mark as local change and save
      isLocalChangeRef.current = true;
      setTimeout(() => {
        saveFlowChanges(updatedNodes, edges, true);
      }, 0);

      toast.success(`${nodeToCopy.type === 'if' ? 'If' : 'Data Store'} node copied`);
    } catch (error) {
      toast.error("Failed to copy node", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, saveFlowChanges]);

  // Delete non-agent node handler
  const deleteNode = useCallback((nodeId: string) => {
    if (!flow) return;
    
    try {
      // Find the node to delete
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      if (!nodeToDelete) {
        toast.error("Node not found");
        return;
      }

      // Don't allow deletion of start or end nodes
      if (nodeToDelete.type === 'start' || nodeToDelete.type === 'end') {
        toast.error(`Cannot delete ${nodeToDelete.type} node`);
        return;
      }

      // Remove the node from nodes
      const updatedNodes = nodes.filter(n => n.id !== nodeId);
      
      // Remove all edges connected to this node
      const updatedEdges = edges.filter(e => 
        e.source !== nodeId && e.target !== nodeId
      );
      
      // Update local state immediately
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      
      // Mark as local change
      isLocalChangeRef.current = true;
      
      // Save the flow changes
      setTimeout(() => {
        saveFlowChanges(updatedNodes, updatedEdges, true);
      }, 0);

      toast.success(`${nodeToDelete.type === 'if' ? 'If' : 'Data Store'} node deleted`);
    } catch (error) {
      toast.error("Failed to delete node", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges]);

  // Effect 3: Register flow panel methods for all nodes
  useEffect(() => {
    // Register methods so nodes can trigger operations
    (window as any).flowPanelCopyAgent = copyAgent;
    (window as any).flowPanelDeleteAgent = deleteAgent;
    (window as any).flowPanelCopyNode = copyNode;
    (window as any).flowPanelDeleteNode = deleteNode;
    
    return () => {
      delete (window as any).flowPanelCopyAgent;
      delete (window as any).flowPanelDeleteAgent;
      delete (window as any).flowPanelCopyNode;
      delete (window as any).flowPanelDeleteNode;
    };
  }, [copyAgent, deleteAgent, copyNode, deleteNode]);

  // Effect 4: Register flow actions with context for use in other panels
  useEffect(() => {
    registerFlowActions({
      addDataStoreNode,
      addIfNode,
    });
  }, [registerFlowActions, addDataStoreNode, addIfNode]);

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Mark that a connection was made
      connectionMadeRef.current = true;
      
      // Find the source and target nodes to determine their types
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      // Remove existing connections to implement automatic connection replacement
      const filteredEdges = filterExistingConnections(edges, sourceNode, targetNode, connection);
      
      // Add the new connection
      const updatedEdges = addEdge(connection, filteredEdges);
      
      setEdges(updatedEdges);
      isLocalChangeRef.current = true; // Mark as local change
      
      // Save the flow with the new connection (use setTimeout to ensure state is updated)
      setTimeout(() => {
        // Save and invalidate queries so agent nodes see the new connections
        saveFlowChanges(nodes, updatedEdges, true);
      }, 0);
    },
    [setEdges, edges, nodes, saveFlowChanges]
  );

  // Handle connection start
  const onConnectStart: OnConnectStart = useCallback((event, { nodeId, handleType }) => {
    const mouseEvent = event as MouseEvent;
    connectionStartRef.current = { 
      nodeId: nodeId || '', 
      handleType: handleType || '',
      startX: mouseEvent.clientX,
      startY: mouseEvent.clientY
    };
    connectionMadeRef.current = false; // Reset connection flag
  }, []);

  // Create node with specific type
  const handleNodeTypeSelection = useCallback(async (nodeType: "agent" | "dataStore" | "if") => {
    if (pendingConnectionRef.current && flow) {
      const result = await createNodeWithConnection(
        nodeType,
        pendingConnectionRef.current.sourceNodeId,
        pendingConnectionRef.current.position,
        flow,
        nodes,
        edges,
        filterExistingConnections
      );
      
      if (result) {
        setNodes(result.updatedNodes);
        setEdges(result.updatedEdges);
        isLocalChangeRef.current = true;
        
        setTimeout(() => {
          saveFlowChanges(result.updatedNodes, result.updatedEdges, true);
        }, 0);
        
        toast.success(`${nodeType === "agent" ? "Agent" : nodeType === "dataStore" ? "Data Store" : "If"} node created`);
      }
    }
    setShowNodeSelection(false);
    pendingConnectionRef.current = null;
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges, filterExistingConnections]);

  // Handle connection end - show menu for short drags
  const onConnectEnd: OnConnectEnd = useCallback((event) => {
    const connectionStart = connectionStartRef.current;
    
    // Only show menu when dragging from source handles
    if (connectionStart && connectionStart.handleType === 'source') {
      
      // Wait a moment for ReactFlow to process any connection that might have been made
      setTimeout(() => {
        // Check if a connection was actually made using our ref flag
        if (connectionMadeRef.current) {
          return; // Exit early, connection was made
        }
        
        // Get the mouse position from the event
        const mouseEvent = event as MouseEvent;
        const canvasRect = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
        
        if (canvasRect && flow) {
          // Calculate drag distance
          const dragDistance = Math.sqrt(
            Math.pow(mouseEvent.clientX - connectionStart.startX, 2) + 
            Math.pow(mouseEvent.clientY - connectionStart.startY, 2)
          );

          // Define short drag threshold (in pixels)
          const SHORT_DRAG_THRESHOLD = 50;

          // Show menu if it was a short drag (essentially a click on the handle)
          if (dragDistance <= SHORT_DRAG_THRESHOLD) {
            // Get source node
            const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
            if (!sourceNode) return;

            // Find the node element in the DOM
            const nodeElement = document.querySelector(`[data-id="${connectionStart.nodeId}"]`);
            if (!nodeElement) return;

            // Get the bounding rect of the node
            const nodeRect = nodeElement.getBoundingClientRect();
            const canvasRectAbs = canvasRect;
            
            // Position menu to the right of the node with small offset
            const menuOffset = 10; // Small offset from the node
            
            // Calculate menu position relative to the canvas
            const menuX = nodeRect.right - canvasRectAbs.left + menuOffset;
            const menuY = nodeRect.top + (nodeRect.height / 2) - canvasRectAbs.top;

            // Set menu position
            setNodeSelectionPosition({
              x: menuX,
              y: menuY
            });
            
            // Store pending connection info
            pendingConnectionRef.current = {
              sourceNodeId: connectionStart.nodeId,
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
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges]);

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
  const handleNodeDragStop = useCallback((_event: any, _node: any) => {
    isLocalChangeRef.current = true; // Mark that we have local changes
    
    // Save after a small delay to ensure ReactFlow has updated
    setTimeout(() => {
      // Pass false to not invalidate queries
      saveFlowChanges(nodes, edges, true);
    }, 200);
  }, [saveFlowChanges, nodes, edges]);

  // Handle edge changes to track dirty state
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    
    // Save the flow when edges change (e.g., deletion)
    // Use setTimeout to allow ReactFlow to update the state first
    setTimeout(() => {
      const currentEdges = edges.filter(edge => {
        // Check if edge is being removed
        const removeChange = changes.find((change: any) => 
          change.type === 'remove' && change.id === edge.id
        );
        return !removeChange;
      });
      // Save and invalidate queries for edge changes so agent nodes update
      isLocalChangeRef.current = true; // Mark as local change
      // Only invalidate if edges were actually removed (structural change)
      saveFlowChanges(nodes, currentEdges, true);
    }, 0);
  }, [onEdgesChange, edges, nodes, saveFlowChanges]);

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
                sessions.map((session) => (
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
      
      {/* Variables and Validation buttons - positioned below header */}
      <div className="flex justify-start items-start gap-2">
        <ButtonPill
            size="default"
            icon={<BookOpen />}
            active={isPanelOpen(PANEL_TYPES.VARIABLE)}
            onClick={() => openPanel(PANEL_TYPES.VARIABLE)}
            // onDoubleClick={handleCloseVariablesPanel}
            title="Open Variables Panel"
          >
            Variables
          </ButtonPill>
          <ButtonPill
            size="default"
            icon={<Shield />}
            active={isPanelOpen(PANEL_TYPES.VALIDATION)}
            onClick={() => openPanel(PANEL_TYPES.VALIDATION)}
            title="Open Validation Panel"
          >
            Validation
          </ButtonPill>
        <ButtonPill
          size="default"
          active={isPanelOpen(PANEL_TYPES.DATA_STORE_SCHEMA)}
          onClick={() => openPanel(PANEL_TYPES.DATA_STORE_SCHEMA)}
          title="Open Data Store Schema Panel"
        >
          Data Store Schema
        </ButtonPill>
        
        {/* Nodes dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <ButtonPill
                size="default"
                icon={<Plus />}
                title="Add Node"
              >
                Nodes
              </ButtonPill>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={addAgentNode}>
              <span>Agent node</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addDataStoreNode}>
              <span>Data store node</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addIfNode}>
              <span>If node</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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