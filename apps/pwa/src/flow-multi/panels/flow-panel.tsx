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
import { BookOpen, Pencil, Check, X, Loader2, Shield, HelpCircle } from "lucide-react";
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
  targetNode: CustomNodeType | undefined,
  connection: { source?: string | null; target?: string | null }
): CustomEdgeType[] {
  let filteredEdges = [...edges];
  
  // Remove existing outgoing connections based on source node type
  if ((sourceNode?.type === 'start' || sourceNode?.type === 'agent') && connection.source) {
    filteredEdges = filteredEdges.filter(edge => edge.source !== connection.source);
  }
  
  // Remove existing incoming connections based on target node type  
  if ((targetNode?.type === 'agent' || targetNode?.type === 'end') && connection.target) {
    filteredEdges = filteredEdges.filter(edge => edge.target !== connection.target);
  }
  
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
  const connectionStartRef = useRef<{ nodeId: string; handleType: string } | null>(null);
  const connectionMadeRef = useRef<boolean>(false);
  const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedFlowIdRef = useRef<string | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const lastExternalDataHashRef = useRef<string | null>(null);
  const lastSavedDataHashRef = useRef<string | null>(null);

  // 3. Context hooks
  const { openPanel, closePanel, isPanelOpen } = useFlowPanelContext();
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
      if (isStructuralChange) {
        // Invalidate the specific flow queries to update agent nodes
        await queryClient.invalidateQueries({
          queryKey: flowQueries.detail(savedFlowResult.getValue().id).queryKey
        });
        
        // Also invalidate all flow queries to ensure everything is refreshed
        await queryClient.invalidateQueries({
          queryKey: flowQueries.all(),
          exact: false
        });
      }
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
      await queryClient.invalidateQueries({
        queryKey: flowQueries.detail(flow.id).queryKey
      });
      
    } catch (error) {
      toast.error("Failed to delete agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [flow, nodes, edges, setNodes, setEdges, saveFlowChanges]);

  // Effect 3: Register flow panel methods for agent nodes
  useEffect(() => {
    // Register methods so agent nodes can trigger operations
    (window as any).flowPanelCopyAgent = copyAgent;
    (window as any).flowPanelDeleteAgent = deleteAgent;
    
    return () => {
      delete (window as any).flowPanelCopyAgent;
      delete (window as any).flowPanelDeleteAgent;
    };
  }, [copyAgent, deleteAgent]);

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
  const onConnectStart: OnConnectStart = useCallback((_event, { nodeId, handleType }) => {
    connectionStartRef.current = { nodeId: nodeId || '', handleType: handleType || '' };
    connectionMadeRef.current = false; // Reset connection flag
  }, []);

  // Handle connection end - create agent if no connection was made from source handle
  const onConnectEnd: OnConnectEnd = useCallback(async (event) => {
    const connectionStart = connectionStartRef.current;
    
    // Only create new agents when dragging from source handles, not target/input handles
    if (connectionStart && connectionStart.handleType === 'source') {
      
      // Wait a moment for ReactFlow to process any connection that might have been made
      setTimeout(async () => {
        // Check if a connection was actually made using our ref flag
        if (connectionMadeRef.current) {
          return; // Exit early, don't create agent
        }
        
        // Get the mouse position from the event
        const mouseEvent = event as MouseEvent;
        const canvasRect = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
        
        if (canvasRect && flow) {
          // Convert screen coordinates to flow coordinates
          const flowX = mouseEvent.clientX - canvasRect.left;
          const flowY = mouseEvent.clientY - canvasRect.top;
          
          try {
            // Generate unique agent name
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

            // Create a new agent with unique name and color
            const uniqueName = await generateUniqueAgentName();
            const nextColor = await getNextAvailableColor(flow);
            const newAgent = Agent.create({
              name: uniqueName,
              targetApiType: ApiType.Chat,
              color: nextColor,
            }).getValue();

            // Save the new agent
            if (!AgentService.saveAgent || typeof AgentService.saveAgent.execute !== 'function') {
              console.warn('⚠️ AgentService.saveAgent not initialized yet');
              throw new Error('AgentService not initialized');
            }
            const savedAgentResult = await AgentService.saveAgent.execute(newAgent);
            if (savedAgentResult.isFailure) {
              throw new Error(savedAgentResult.getError());
            }
            const savedAgent = savedAgentResult.getValue();

            const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
            const sourceNodePosition = sourceNode?.position || { x: flowX, y: flowY };

            // Position the new node to the right and slightly below the source node
            const newNodePosition = {
              x: sourceNodePosition.x + 400, // 400px to the right
              y: sourceNodePosition.y + 50,  // 50px down
            };

            // Create new agent node
            const newAgentNode: CustomNodeType = {
              id: savedAgent.id.toString(),
              type: "agent",
              position: newNodePosition,
              data: {
                agentId: savedAgent.id.toString(),
              },
            };

            // Create edge connecting source agent to new agent
            const newEdge: CustomEdgeType = {
              id: `${connectionStart.nodeId}-${savedAgent.id}`,
              source: connectionStart.nodeId,
              target: savedAgent.id.toString(),
            };

            // Remove existing connections from source node (same logic as onConnect)
            const filteredEdges = filterExistingConnections(
              edges,
              sourceNode,
              undefined, // No target node in this case
              { source: connectionStart.nodeId }
            );

            // Update local state immediately
            const updatedNodes = [...nodes, newAgentNode];
            const updatedEdges = [...filteredEdges, newEdge];
            
            setNodes(updatedNodes);
            setEdges(updatedEdges);
            
            // Mark as local change
            isLocalChangeRef.current = true;
            
            // Save using the standard saveFlowChanges pattern
            setTimeout(() => {
              // Pass true for isSelectFlow since we're adding a new agent (structural change)
              saveFlowChanges(updatedNodes, updatedEdges, true);
            }, 0);
            
            // Invalidate agent queries for color updates
            invalidateAllAgentQueries();
          } catch (error) {
            console.error("Error creating agent:", error);
            toast.error("Failed to create new agent");
          }
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
        </div>
      </Card>
    </div>
  );
}

// Main export
export function FlowPanel({ flowId }: FlowPanelProps) {
  return <FlowPanelInner flowId={flowId} />;
}