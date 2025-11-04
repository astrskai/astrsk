import { useState, useRef, useEffect, useCallback } from "react";
import { PANEL_TYPES } from "@/features/flow/ui/panel-types";
import {
  closeNodePanels,
  getNodeDisplayName,
} from "@/features/flow/utils/panel-utils";
import {
  filterExistingConnections,
  createDataHash,
} from "@/features/flow/utils/flow-helpers";
import {
  calculateViewportCenter,
  generateNodeId,
  generateUniqueNodeName,
  getExistingNodeNames,
  getNodeBaseName,
} from "@/features/flow/utils/node-helpers";
import { getNextAvailableColor } from "@/features/flow/utils/node-color-assignment";
import {
  Node as FlowNode,
  Edge as FlowEdge,
  FlowViewport,
  Flow,
} from "@/entities/flow/domain/flow";
import { Session } from "@/entities/session/domain/session";
import { NodeType } from "@/entities/flow/model/node-types";
import { ensureNodesSafety } from "@/features/flow/utils/ensure-node-safety";
import {
  ensureEdgeSelectable,
  ensureEdgesSelectable,
} from "@/features/flow/utils/ensure-edge-selectable";
import { invalidateSingleFlowQueries } from "@/features/flow/utils/invalidate-flow-queries";
import { useFlowLocalStateSync } from "@/shared/lib/flow-local-state-sync";
import { cn } from "@/shared/lib";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flowQueries, flowKeys } from "@/entities/flow/api/query-factory";
import { useUpdateNodesPositions } from "@/entities/flow/api/mutations/nodes-positions-mutations";
import {
  useUpdateFlowName,
  useUpdateFlowViewport,
} from "@/entities/flow/api/mutations/flow-mutations";
import { useUpdateNodesAndEdges } from "@/entities/flow/api/mutations/nodes-edges-mutations";
import {
  useCreateAgentNode,
  useDeleteAgentNode,
  useCloneAgentNode,
  useCreateDataStoreNode,
  useDeleteDataStoreNode,
  useCloneDataStoreNode,
  useCreateIfNode,
  useDeleteIfNode,
  useCloneIfNode,
} from "@/entities/flow/api/mutations/composite-node-mutations";
import {
  BookOpen,
  Pencil,
  Check,
  X,
  Loader2,
  SearchCheck,
  HelpCircle,
} from "lucide-react";
import { ButtonPill, Card } from "@/shared/ui";
import { toast } from "sonner";
import { useFlowPanelContext } from "@/features/flow/ui/flow-panel-provider";
// import { useCollapsibleSidebarWidth } from "@/widgets/collapsible-sidebar/hooks/use-collapsible-sidebar-width";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui";

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
  NodeSelectionMenu,
  NodeSelectionMenuItems,
} from "@/features/flow/ui/node-selection-menu";
import {
  edgeTypes,
  type CustomEdgeType,
} from "@/features/flow/edges/index";
import {
  nodeTypes,
  type CustomNodeType,
} from "@/features/flow/nodes/index";
import { CustomReactFlowControls } from "@/features/flow/ui/custom-controls";
import { useAgentStore } from "@/shared/stores/agent-store";
import { sessionQueries } from "@/entities/session/api";

interface FlowPanelProps {
  flowId: string;
}

const proOptions = { hideAttribution: true };

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
  const connectionStartRef = useRef<{
    nodeId: string;
    handleType: string;
    handleId?: string;
    startX: number;
    startY: number;
  } | null>(null);
  const connectionMadeRef = useRef<boolean>(false);
  const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });

  // Node selection menu state
  const [showNodeSelection, setShowNodeSelection] = useState(false);
  const [nodeSelectionPosition, setNodeSelectionPosition] = useState({
    x: 0,
    y: 0,
  });
  const pendingConnectionRef = useRef<{
    sourceNodeId: string;
    sourceHandleId?: string;
    position: { x: number; y: number };
  } | null>(null);
  const lastSyncedFlowIdRef = useRef<string | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const lastExternalDataHashRef = useRef<string | null>(null);
  const lastSavedDataHashRef = useRef<string | null>(null);
  const nodesRef = useRef<CustomNodeType[]>([]);
  const edgesRef = useRef<CustomEdgeType[]>([]);
  const skipNextSyncRef = useRef<boolean>(false);

  // 3. Context hooks
  const { openPanel, closePanel, isPanelOpen } = useFlowPanelContext();
  // const { isExpanded, isMobile } = useCollapsibleSidebarWidth();
  const queryClient = useQueryClient();

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

  // Agent mutations
  const createAgentNode = useCreateAgentNode(flowId);
  const deleteAgentNode = useDeleteAgentNode(flowId);
  const cloneAgentNode = useCloneAgentNode(flowId);

  // DataStore mutations
  const createDataStoreNode = useCreateDataStoreNode(flowId);
  const deleteDataStoreNode = useDeleteDataStoreNode(flowId);
  const cloneDataStoreNode = useCloneDataStoreNode(flowId);

  // Initialize the IfNode mutation hooks
  const createIfNode = useCreateIfNode(flowId);
  const deleteIfNode = useDeleteIfNode(flowId);
  const cloneIfNode = useCloneIfNode(flowId);

  // 6. Window-based local state sync for preview operations
  useFlowLocalStateSync(
    flowId,
    // Handle nodes/edges update from operations (preview)
    useCallback(
      (localNodes?: CustomNodeType[], localEdges?: CustomEdgeType[]) => {
        // Apply the local changes to the flow panel immediately
        if (localNodes) {
          setNodes(localNodes);

          // Mark as local change so the sync logic doesn't overwrite these changes
          isLocalChangeRef.current = true;
        }

        if (localEdges) {
          // Ensure all edges have the required 'type' field for ReactFlow
          const edgesWithType = localEdges.map((edge: any) => ({
            ...edge,
            type: edge.type || "default",
          }));

          setEdges(edgesWithType);
        }
      },
      [setNodes, setEdges],
    ),
    // Handle individual node updates (if needed)
    useCallback(
      (nodeId: string, nodeData: any) => {
        // Update the specific node in the local state
        setNodes((currentNodes) => {
          const updatedNodes = currentNodes.map((node) =>
            node.id === nodeId ? { ...node, ...nodeData } : node,
          );

          // Mark as local change
          isLocalChangeRef.current = true;

          return updatedNodes;
        });
      },
      [setNodes],
    ),
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
      },
    });
  }, [editedTitle, updateFlowNameMutation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle("");
  }, []);

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
  const saveFlowChanges = useCallback(
    async (
      providedNodes?: CustomNodeType[],
      providedEdges?: CustomEdgeType[],
      isStructuralChange: boolean = false,
      invalidateAgents: boolean = false,
    ) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) {
        return;
      }

      // Get the latest data from React Query cache to include ALL granular updates
      const cachedFlow = queryClient.getQueryData<Flow>(
        flowKeys.detail(flowId),
      );

      // Use nodes and edges from the enhanced flow query (no separate cache needed)
      const cachedNodes = (cachedFlow?.props?.nodes ||
        nodesRef.current ||
        []) as CustomNodeType[];
      const cachedEdges = (cachedFlow?.props?.edges ||
        edgesRef.current ||
        []) as CustomEdgeType[];

      let updatedNodes: CustomNodeType[];

      if (providedNodes) {
        // Specific nodes provided - use them as-is since they represent the current state
        // The caller has already included all necessary nodes
        updatedNodes = providedNodes;
      } else {
        // No nodes provided - use cache data or refs as fallback
        updatedNodes =
          cachedNodes.length > 0 ? cachedNodes : nodesRef.current || [];
      }

      // For edges, use provided or cached or refs as fallback
      const updatedEdges =
        providedEdges ||
        (cachedEdges.length > 0 ? cachedEdges : edgesRef.current || []);

      // This line is now handled above

      try {
        // Filter out invalid edges before saving
        const nodeIds = new Set(updatedNodes.map((n) => n.id));
        const validEdges = updatedEdges.filter((edge) => {
          return (
            edge.source &&
            edge.target &&
            nodeIds.has(edge.source) &&
            nodeIds.has(edge.target)
          );
        });

        updateNodesAndEdges.mutate(
          {
            nodes: updatedNodes as FlowNode[],
            edges: validEdges as FlowEdge[],
            invalidateAgents,
          },
          {
            onSuccess: ({ nodes: savedNodes, edges: savedEdges }) => {
              // After successful save, update our saved data hash
              lastSavedDataHashRef.current = createDataHash(
                savedNodes as CustomNodeType[],
                savedEdges as CustomEdgeType[],
              );

              // Skip the next sync since we just saved and the flow object will update
              skipNextSyncRef.current = true;

              // Check if our local changes match what we just saved
              const currentLocalHash = createDataHash(
                updatedNodes,
                updatedEdges,
              );
              if (currentLocalHash === lastSavedDataHashRef.current) {
                // Local changes are now saved, reset the flag
                isLocalChangeRef.current = false;
              }
            },
            onError: (error) => {
              toast.error("Failed to save flow changes");
            },
          },
        );
      } catch (error) {
        console.log(error);
      }
    },
    [updateNodesAndEdges, queryClient, flowId],
  );

  // Save viewport state to flow
  const saveViewportState = useCallback(
    async (newViewport: Viewport) => {
      // Use granular mutation for viewport update
      const flowViewport: FlowViewport = {
        x: newViewport.x,
        y: newViewport.y,
        zoom: newViewport.zoom,
      };

      updateFlowViewportMutation.mutate(flowViewport);
    },
    [updateFlowViewportMutation],
  );

  // Handle viewport changes with debouncing
  const onViewportChange = useCallback(
    (newViewport: Viewport) => {
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
    },
    [saveViewportState],
  );

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
        setSyncTrigger((prev) => prev + 1);
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
    const externalNodes = ensureNodesSafety(
      (flow.props.nodes as CustomNodeType[]) || [],
    );

    // Debug: Check for data store nodes and their fields
    const dataStoreNodes = externalNodes.filter((n) => n.type === "dataStore");

    // Filter out invalid edges (edges with both source and target must exist in nodes)
    const rawExternalEdges = (flow.props.edges as CustomEdgeType[]) || [];
    const nodeIds = new Set(externalNodes.map((n) => n.id));

    const externalEdges = ensureEdgesSelectable(
      rawExternalEdges
        .filter((edge) => {
          // Edge must have valid source and target that exist in nodes
          const isValid =
            edge.source &&
            edge.target &&
            nodeIds.has(edge.source) &&
            nodeIds.has(edge.target);

          if (!isValid && edge.source && edge.target) {
            console.warn(
              `Filtering out orphaned edge: ${edge.source} -> ${edge.target}`,
            );
          }

          return isValid;
        })
        .map((edge) => ({
          ...edge,
          type: edge.type || "default", // Ensure all edges have the required 'type' field for ReactFlow
        })),
    );
    const currentDataHash = createDataHash(externalNodes, externalEdges);

    // Check if external data actually changed (ignoring positions)
    if (
      !isDifferentFlow &&
      currentDataHash === lastExternalDataHashRef.current
    ) {
      return; // No structural changes, keep local state
    }

    if (isDifferentFlow) {
      // Switching flows - fresh load
      console.log(
        "[FLOW-SYNC] Setting nodes for different flow:",
        externalNodes.length,
      );
      setNodes(externalNodes);
      setEdges(externalEdges);
      lastSyncedFlowIdRef.current = flowIdStr;
      isLocalChangeRef.current = false;
      // Initialize saved data hash for new flow
      lastSavedDataHashRef.current = currentDataHash;
    } else if (isLocalChangeRef.current && nodesRef.current.length > 0) {
      // We have local changes - check if they're already saved
      const currentLocalHash = createDataHash(
        nodesRef.current,
        edgesRef.current,
      );

      if (currentLocalHash === lastSavedDataHashRef.current) {
        // Local changes match saved state, we can safely sync
        console.log(
          "[FLOW-SYNC] Local changes saved, syncing external nodes:",
          externalNodes.length,
        );
        isLocalChangeRef.current = false;
        setNodes(externalNodes);
        setEdges(externalEdges);
      } else {
        // We have unsaved local changes - merge carefully
        // IMPORTANT: Always use server data for node content but preserve local positions
        const localPositions = new Map(
          nodesRef.current.map((n) => [n.id, n.position]),
        );

        const mergedNodes = externalNodes.map((extNode) => {
          const localPos = localPositions.get(extNode.id);
          // Use server data (includes granular updates) but keep local position
          return localPos ? { ...extNode, position: localPos } : extNode;
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
          window.dispatchEvent(new Event("resize"));
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

  // Unified addNode function for all node types
  const addNode = useCallback(
    async (
      nodeType: "agent" | "dataStore" | "if",
      position?: { x: number; y: number },
    ) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return null;

      try {
        // Pre-compute all values that will be used in both onMutate and mutationFn
        const nodeId = generateNodeId();

        // Use provided position or calculate viewport center
        const nodePosition =
          position ||
          calculateViewportCenter(currentViewportRef.current, containerRef);

        // Get existing names using the helper function (properly typed)
        // If flow is not loaded yet, use empty set
        const existingNames = flow
          ? await getExistingNodeNames(nodeType, flow)
          : new Set<string>();

        // Generate unique name using helper
        const baseName = getNodeBaseName(nodeType);
        const nodeName = await generateUniqueNodeName(baseName, existingNames);

        // Get next available color for the node
        const nodeColor = await getNextAvailableColor(
          flow || { props: { nodes: [] }, id: flowId },
        );

        let result: any;

        // Create node with all pre-computed values
        switch (nodeType) {
          case "agent":
            result = await createAgentNode.mutateAsync({
              nodeId,
              position: nodePosition,
              nodeName,
              nodeColor,
            });
            break;
          case "dataStore":
            result = await createDataStoreNode.mutateAsync({
              nodeId,
              position: nodePosition,
              nodeName,
              nodeColor,
            });
            break;
          case "if":
            result = await createIfNode.mutateAsync({
              nodeId,
              position: nodePosition,
              nodeName,
              nodeColor,
            });
            break;
        }

        // Only proceed if mutation succeeded
        if (!result || !result.node) {
          throw new Error("Failed to create node");
        }

        // The mutation returns the new node
        const newNode = result.node as CustomNodeType;

        // Update local state only after successful mutation
        // This ensures flow-panel state stays in sync with React Query cache
        setNodes((prevNodes) => {
          const updatedNodes = [...prevNodes, newNode];

          // Mark as local change and save with the updated nodes directly
          isLocalChangeRef.current = true;
          setTimeout(() => {
            // Pass updatedNodes directly to ensure we save what we just set
            saveFlowChanges(updatedNodes, undefined);
          }, 0);

          return updatedNodes;
        });

        // Return the new node so callers can use it (e.g., for edge creation)
        return newNode;
      } catch (error) {
        // Mutation already handles error toasts
        // Error already handled by mutation
        return null;
      }
    },
    [
      createAgentNode,
      createDataStoreNode,
      createIfNode,
      flow,
      flowId,
      setNodes,
      saveFlowChanges,
    ],
  );

  // Unified copy node handler for all node types
  const copyNode = useCallback(
    async (nodeId: string) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return;

      try {
        // Find the node to copy
        const nodeToCopy = (currentFlow.props.nodes as CustomNodeType[]).find(
          (n) => n.id === nodeId,
        );
        if (!nodeToCopy) {
          toast.error("Node not found");
          return;
        }

        // Don't allow copying start or end nodes
        if (nodeToCopy.type === "start" || nodeToCopy.type === "end") {
          toast.error(`Cannot copy ${nodeToCopy.type} node`);
          return;
        }

        // Pre-compute all values for the clone
        const newNodeId = generateNodeId();

        // Calculate position for copied node (below and to the right of original)
        const newPosition = {
          x: nodeToCopy.position.x + 100,
          y: nodeToCopy.position.y + 200,
        };

        // Determine node type for name generation
        const nodeTypeForName =
          nodeToCopy.type === NodeType.AGENT
            ? "agent"
            : nodeToCopy.type === NodeType.DATA_STORE
              ? "dataStore"
              : nodeToCopy.type === NodeType.IF
                ? "if"
                : null;

        if (!nodeTypeForName) {
          toast.error(`Cannot copy node type: ${nodeToCopy.type}`);
          return;
        }

        // Get existing names and generate unique name
        const existingNames = flow
          ? await getExistingNodeNames(nodeTypeForName, flow)
          : new Set<string>();
        const baseName = getNodeBaseName(nodeTypeForName);
        const nodeName = await generateUniqueNodeName(baseName, existingNames);

        // Get next available color
        const nodeColor = await getNextAvailableColor(
          flow || { props: { nodes: [] }, id: flowId },
        );

        // Handle copying based on node type using unified mutations
        const nodeType = nodeToCopy.type as string;
        let result: any;

        switch (nodeType) {
          case NodeType.AGENT:
            // For agent nodes, use agentId from data
            result = await cloneAgentNode.mutateAsync({
              copyNodeId: nodeId,
              nodeId: newNodeId,
              position: newPosition,
              nodeName,
              nodeColor,
            });
            break;

          case NodeType.DATA_STORE:
            result = await cloneDataStoreNode.mutateAsync({
              copyNodeId: nodeId,
              nodeId: newNodeId,
              position: newPosition,
              nodeName,
              nodeColor,
            });
            break;

          case NodeType.IF:
            result = await cloneIfNode.mutateAsync({
              copyNodeId: nodeId,
              nodeId: newNodeId,
              position: newPosition,
              nodeName,
              nodeColor,
            });
            break;

          default:
            toast.error(`Cannot copy node type: ${nodeType}`);
            return;
        }

        if (!result?.node) {
          toast.error("Failed to copy node");
          return;
        }

        // Use current flow ref which has the most up-to-date data
        const currentNodes =
          (currentFlow.props.nodes as CustomNodeType[]) || [];

        const updatedNodes = [...currentNodes, result.node];
        setNodes(updatedNodes);

        // Mark as local change and save
        isLocalChangeRef.current = true;
        setTimeout(() => {
          // Pass updatedNodes explicitly, edges will come from refs
          saveFlowChanges(updatedNodes, undefined, true);
        }, 0);

        // Get node display name for success message
        const nodeDisplayName = getNodeDisplayName(nodeType);
        toast.success(`${nodeDisplayName} copied successfully`);
      } catch (error) {
        toast.error("Failed to copy node", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [
      flow,
      flowId,
      setNodes,
      saveFlowChanges,
      cloneAgentNode,
      cloneDataStoreNode,
      cloneIfNode,
    ],
  );

  // Unified delete node handler for all node types
  const deleteNode = useCallback(
    async (nodeId: string) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return;

      try {
        // Find the node to delete
        const nodeToDelete = (currentFlow.props.nodes as CustomNodeType[]).find(
          (n) => n.id === nodeId,
        );
        if (!nodeToDelete) {
          toast.error("Node not found");
          return;
        }

        // Don't allow deletion of start or end nodes
        if (nodeToDelete.type === "start" || nodeToDelete.type === "end") {
          toast.error(`Cannot delete ${nodeToDelete.type} node`);
          return;
        }

        // Remove the node from current flow nodes
        const updatedNodes = (
          currentFlow.props.nodes as CustomNodeType[]
        ).filter((n) => n.id !== nodeId);

        // Remove all edges connected to this node
        const updatedEdges = edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );

        // Update local state immediately
        setNodes(updatedNodes);
        setEdges(updatedEdges);

        // Mark as local change
        isLocalChangeRef.current = true;

        // Delete the node from database based on type using unified mutations
        const nodeType = nodeToDelete.type as string;

        switch (nodeType) {
          case NodeType.AGENT:
            // For agent nodes, use agentId from data or nodeId
            await deleteAgentNode.mutateAsync({
              nodeId: nodeId,
            });
            // Close all panels associated with this agent
            closeNodePanels(nodeId, nodeType, closePanel);
            break;

          case NodeType.DATA_STORE:
            // For data store nodes, use dataStoreNodeId from data or nodeId
            await deleteDataStoreNode.mutateAsync({
              nodeId: nodeId,
            });
            // Close all panels associated with this data store node
            closeNodePanels(nodeId, nodeType, closePanel);
            break;

          case NodeType.IF:
            // For if nodes, use ifNodeId from data or nodeId
            await deleteIfNode.mutateAsync({
              nodeId: nodeId,
            });
            // Close all panels associated with this if node
            closeNodePanels(nodeId, nodeType, closePanel);
            break;

          default:
            toast.error(`Cannot delete node type: ${nodeType}`);
            return;
        }

        // Ensure flow consumers update after structural delete
        await invalidateSingleFlowQueries(flowId);

        // Save the flow changes - pass both explicitly as they're newly calculated
        setTimeout(() => {
          saveFlowChanges(updatedNodes, updatedEdges);
        }, 0);

        // Get node display name for success message
        const nodeDisplayName = getNodeDisplayName(nodeType);
        toast.success(`${nodeDisplayName} deleted successfully`);
      } catch (error) {
        toast.error("Failed to delete node", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [
      edges,
      setNodes,
      setEdges,
      closePanel,
      saveFlowChanges,
      deleteAgentNode,
      deleteDataStoreNode,
      deleteIfNode,
      flowId,
    ],
  );

  // Handle click on node handle to show node creation menu
  const handleHandleClick = useCallback(
    (nodeId: string, handleType: string, handleId?: string) => {
      // Only handle source handles
      if (handleType !== "source") return;

      const currentFlow = flowRef.current;
      if (!currentFlow) return { x: 0, y: 0 };

      if (!currentFlow.props?.nodes) {
        console.error(
          "❌ [DEBUG] currentFlow.props.nodes is undefined!",
          currentFlow,
        );
        return { x: 0, y: 0 };
      }

      const sourceNode = (currentFlow.props.nodes as CustomNodeType[]).find(
        (n) => n.id === nodeId,
      );
      if (!sourceNode) return;

      // Find the node element in the DOM
      const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
      if (!nodeElement) return;

      // Get the bounding rect of the node
      const nodeRect = nodeElement.getBoundingClientRect();
      const canvasRect = document
        .querySelector(".react-flow")
        ?.getBoundingClientRect();

      if (!canvasRect) return;

      // Calculate position for menu (to the right of the node)
      const menuOffset = 28;
      const menuX = nodeRect.right - canvasRect.left + menuOffset;
      const menuY = nodeRect.top + nodeRect.height / 2 - canvasRect.top;

      // Set menu position
      setNodeSelectionPosition({
        x: menuX,
        y: menuY,
      });

      // Store pending connection info
      pendingConnectionRef.current = {
        sourceNodeId: nodeId,
        sourceHandleId: handleId, // Store the handle ID for if-node true/false handles
        position: {
          x: sourceNode.position.x + 400,
          y: sourceNode.position.y,
        },
      };

      // Show the node selection menu
      setShowNodeSelection(true);
    },
    [],
  );

  // Method to update node data directly with validation
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      // Validate the new data before applying
      if (!newData || typeof newData !== "object") {
        console.error("[updateNodeData] Invalid data provided:", newData);
        toast.error("Cannot update node: Invalid data");
        return;
      }

      // Check for dangerous updates that could corrupt the node
      const dangerousKeys = ["id", "type", "position"];
      const hasDangerousKeys = Object.keys(newData).some((key) =>
        dangerousKeys.includes(key),
      );
      if (hasDangerousKeys) {
        console.error(
          "[updateNodeData] Attempted to update protected fields:",
          Object.keys(newData),
        );
        toast.error("Cannot update protected node fields");
        return;
      }

      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.map((node) => {
          if (node.id !== nodeId) return node;

          // Create the updated node
          return {
            ...node,
            data: { ...node.data, ...newData },
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
    },
    [setNodes, saveFlowChanges],
  );

  // Effect 3: Register flow panel methods for all nodes - use ref to avoid re-renders
  const methodsRef = useRef<{
    copyNode: typeof copyNode;
    deleteNode: typeof deleteNode;
    handleHandleClick: typeof handleHandleClick;
    updateNodeData: typeof updateNodeData;
    addNode: typeof addNode;
  }>();

  methodsRef.current = {
    copyNode,
    deleteNode,
    handleHandleClick,
    updateNodeData,
    addNode,
  };

  useEffect(() => {
    // Register methods so nodes can trigger operations
    (window as any).flowPanelCopyNode = (nodeId: string) =>
      methodsRef.current?.copyNode(nodeId);
    (window as any).flowPanelDeleteNode = (nodeId: string) =>
      methodsRef.current?.deleteNode(nodeId);
    (window as any).flowPanelHandleClick = (
      nodeId: string,
      handleType: string,
      handleId?: string,
    ) => methodsRef.current?.handleHandleClick(nodeId, handleType, handleId);
    (window as any).flowPanelUpdateNodeData = (nodeId: string, newData: any) =>
      methodsRef.current?.updateNodeData(nodeId, newData);
    (window as any).flowPanelAddNode = (
      nodeType: "agent" | "dataStore" | "if",
    ) => methodsRef.current?.addNode(nodeType);

    // Add method to get node from React Flow (for when flow data is stale)
    (window as any).flowPanelGetNode = (nodeId: string) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return undefined;
      return (currentFlow.props.nodes as CustomNodeType[]).find(
        (n) => n.id === nodeId,
      );
    };

    return () => {
      delete (window as any).flowPanelCopyNode;
      delete (window as any).flowPanelDeleteNode;
      delete (window as any).flowPanelHandleClick;
      delete (window as any).flowPanelUpdateNodeData;
      delete (window as any).flowPanelAddNode;
      delete (window as any).flowPanelGetNode;
    };
  }, [nodes]); // Update when nodes change

  // Effect 4: Register flow actions - removed, using window methods instead

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Mark that a connection was made
      connectionMadeRef.current = true;

      // Find the source and target nodes to determine their types
      const currentFlow = flowRef.current;
      if (!currentFlow) return;
      const currentNodes = currentFlow.props.nodes as CustomNodeType[];
      const sourceNode = currentNodes.find((n) => n.id === connection.source);
      const targetNode = currentNodes.find((n) => n.id === connection.target);

      // Remove existing connections to implement automatic connection replacement
      const filteredEdges = filterExistingConnections(
        edges,
        sourceNode,
        targetNode,
        connection,
      );

      // Add the new connection with label for if-node edges
      let updatedEdges = addEdge(connection, filteredEdges);

      // Make the newly added edge selectable
      updatedEdges = updatedEdges.map((edge) =>
        edge.source === connection.source && edge.target === connection.target
          ? ensureEdgeSelectable(edge)
          : edge,
      );

      // Add label for if-node edges
      if (sourceNode?.type === "if" && connection.sourceHandle) {
        const edgeIndex = updatedEdges.findIndex(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle,
        );
        if (edgeIndex >= 0) {
          updatedEdges[edgeIndex] = {
            ...updatedEdges[edgeIndex],
            label: connection.sourceHandle === "true" ? "True" : "False",
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
    [setEdges, edges, nodes, saveFlowChanges],
  );

  // Handle connection start
  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId, handleType, handleId }) => {
      const mouseEvent = event as MouseEvent;

      // Try to get the handle ID from the DOM if not provided
      let actualHandleId = handleId;
      if (!actualHandleId && mouseEvent.target) {
        const handleElement = (mouseEvent.target as HTMLElement).closest(
          ".react-flow__handle",
        );
        if (handleElement) {
          actualHandleId =
            handleElement.getAttribute("data-handleid") ||
            handleElement.getAttribute("data-id") ||
            handleElement.id;
        }
      }

      connectionStartRef.current = {
        nodeId: nodeId || "",
        handleType: handleType || "",
        handleId: actualHandleId || undefined,
        startX: mouseEvent.clientX,
        startY: mouseEvent.clientY,
      };
      connectionMadeRef.current = false; // Reset connection flag
    },
    [],
  );

  // Helper function to create edge from pending connection
  const createEdgeFromPending = useCallback(
    (
      sourceNodeId: string,
      sourceHandleId: string | undefined,
      targetNodeId: string,
      sourceNode?: CustomNodeType,
    ) => {
      const edgeLabel =
        sourceNode?.type === "if" && sourceHandleId
          ? sourceHandleId === "true"
            ? "True"
            : "False"
          : undefined;

      return ensureEdgeSelectable({
        id: sourceHandleId
          ? `${sourceNodeId}-${sourceHandleId}-${targetNodeId}`
          : `${sourceNodeId}-${targetNodeId}`,
        source: sourceNodeId,
        sourceHandle: sourceHandleId,
        target: targetNodeId,
        type: undefined,
        label: edgeLabel,
      } as CustomEdgeType);
    },
    [],
  );

  // Create node with specific type
  const handleNodeTypeSelection = useCallback(
    async (nodeType: "agent" | "dataStore" | "if") => {
      const currentFlow = flowRef.current;
      if (pendingConnectionRef.current && currentFlow) {
        const sourceNodeId = pendingConnectionRef.current.sourceNodeId;
        const sourceHandleId = pendingConnectionRef.current.sourceHandleId;
        const pendingPosition = pendingConnectionRef.current.position;

        // Find source node to calculate position
        const sourceNode = nodes.find((n) => n.id === sourceNodeId);
        const sourceNodePosition = sourceNode?.position || pendingPosition;

        // Position the new node to the right and slightly below the source node
        const newNodePosition = {
          x: sourceNodePosition.x + 400,
          y: sourceNodePosition.y + 50,
        };

        try {
          // Use the unified addNode function with specific position
          const newNode = await addNode(nodeType, newNodePosition);

          if (newNode) {
            // Create edge connecting source to new node
            const newEdge = createEdgeFromPending(
              sourceNodeId,
              sourceHandleId,
              newNode.id,
              sourceNode,
            );

            setEdges((prevEdges) => {
              // Remove existing connections from same source handle
              const filteredEdges = filterExistingConnections(
                prevEdges,
                sourceNode,
                undefined,
                {
                  source: sourceNodeId,
                  sourceHandle: sourceHandleId,
                },
              );
              const updatedEdges = [...filteredEdges, newEdge];

              // Save changes with updated edges
              isLocalChangeRef.current = true;
              setTimeout(() => {
                // Get the latest nodes from ref after addNode has updated them
                const latestNodes =
                  (flowRef.current?.props.nodes as CustomNodeType[]) || nodes;
                saveFlowChanges(latestNodes, updatedEdges);
              }, 0);

              return updatedEdges;
            });

            toast.success(
              `${nodeType === "agent" ? "Agent" : nodeType === "dataStore" ? "Data Update" : "If"} node created with connection`,
            );
          }
        } catch (error) {
          console.error(`Failed to create ${nodeType} node:`, error);
          toast.error(`Failed to create ${nodeType} node`);
        }
      }
      setShowNodeSelection(false);
      pendingConnectionRef.current = null;
    },
    [
      nodes,
      setEdges,
      saveFlowChanges,
      filterExistingConnections,
      addNode,
      createEdgeFromPending,
    ],
  );

  // Handle connection end - show menu for short drags or handle clicks
  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const connectionStart = connectionStartRef.current;
      const mouseEvent = event as MouseEvent;

      // If connectionStart is null, it means onConnectStart was never called (pure click without drag)
      // In this case, we need to detect if we clicked on a handle
      if (!connectionStart) {
        // Check if the click target is a handle (source type)
        const target = mouseEvent.target as HTMLElement;
        const handleElement = target.closest(".react-flow__handle-right");

        if (handleElement) {
          // Get the node ID from the handle's parent node
          const nodeElement = handleElement.closest("[data-id]") as HTMLElement;
          if (nodeElement) {
            const nodeId = nodeElement.getAttribute("data-id");
            const currentFlow = flowRef.current;
            if (!currentFlow) return;
            const sourceNode = (
              currentFlow.props.nodes as CustomNodeType[]
            ).find((n) => n.id === nodeId);

            if (sourceNode && flowRef.current) {
              // This was a click on a source handle without drag
              const canvasRect = (event.target as HTMLElement)
                .closest(".react-flow")
                ?.getBoundingClientRect();
              if (canvasRect) {
                const nodeRect = nodeElement.getBoundingClientRect();

                // Position menu to the right of the node with small offset
                const menuOffset = 28;
                const menuX = nodeRect.right - canvasRect.left + menuOffset;
                const menuY =
                  nodeRect.top + nodeRect.height / 2 - canvasRect.top;

                // Set menu position
                setNodeSelectionPosition({
                  x: menuX,
                  y: menuY,
                });

                // Store pending connection info
                pendingConnectionRef.current = {
                  sourceNodeId: nodeId!,
                  sourceHandleId: undefined,
                  position: {
                    x: sourceNode.position.x + 400,
                    y: sourceNode.position.y,
                  },
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
      if (connectionStart.handleType === "source") {
        // Wait a moment for ReactFlow to process any connection that might have been made
        setTimeout(() => {
          // Check if a connection was actually made using our ref flag
          if (connectionMadeRef.current) {
            return; // Exit early, connection was made
          }

          // Get the mouse position from the event
          const canvasRect = (event.target as HTMLElement)
            .closest(".react-flow")
            ?.getBoundingClientRect();

          if (canvasRect && flowRef.current) {
            // Calculate drag distance
            const dragDistance = Math.sqrt(
              Math.pow(mouseEvent.clientX - connectionStart.startX, 2) +
                Math.pow(mouseEvent.clientY - connectionStart.startY, 2),
            );

            // Define threshold for showing menu
            const SHORT_DRAG_THRESHOLD = 50;

            // Show menu if it was a click (no drag) or short drag on the handle
            // A click is when you press and release without moving (distance ~0)
            if (dragDistance <= SHORT_DRAG_THRESHOLD) {
              // Get source node
              const currentFlow = flowRef.current;
              if (!currentFlow) return;
              const sourceNode = (
                currentFlow.props.nodes as CustomNodeType[]
              ).find((n) => n.id === connectionStart.nodeId);
              if (!sourceNode) return;

              // Find the node element in the DOM
              const nodeElement = document.querySelector(
                `[data-id="${connectionStart.nodeId}"]`,
              );
              if (!nodeElement) return;

              // Get the bounding rect of the node
              const nodeRect = nodeElement.getBoundingClientRect();
              const canvasRectAbs = canvasRect;

              // Position menu to the right of the node with 16px gap
              const menuOffset = 28; // 16px gap from the node

              // Calculate menu position relative to the canvas
              const menuX = nodeRect.right - canvasRectAbs.left + menuOffset;
              const menuY =
                nodeRect.top + nodeRect.height / 2 - canvasRectAbs.top;

              // Set menu position
              setNodeSelectionPosition({
                x: menuX,
                y: menuY,
              });

              // Store pending connection info (including handle ID from drag start)
              pendingConnectionRef.current = {
                sourceNodeId: connectionStart.nodeId,
                sourceHandleId: connectionStart.handleId, // Use the handle ID captured at drag start
                position: {
                  x: sourceNode.position.x + 400, // Position new node further right
                  y: sourceNode.position.y,
                },
              };

              setShowNodeSelection(true);
            }
            // If drag was too long, it was an intentional connection attempt, do nothing
          }
        }, 100); // End setTimeout
      }

      // Reset connection start state
      connectionStartRef.current = null;
    },
    [nodes, edges, setNodes, setEdges, saveFlowChanges],
  );

  // Track if we're currently dragging
  const isDraggingRef = useRef(false);

  // Handle node changes to track dirty state
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);

      // Check for drag start/end
      const dragStartChanges = changes.filter(
        (c: any) => c.type === "position" && c.dragging === true,
      );
      const dragEndChanges = changes.filter(
        (c: any) => c.type === "position" && c.dragging === false,
      );

      if (dragStartChanges.length > 0 && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }

      if (dragEndChanges.length > 0 && isDraggingRef.current) {
        isDraggingRef.current = false;
      }

      // Check if any nodes were removed (agent deletion)
      const hasRemovals = changes.some(
        (change: any) => change.type === "remove",
      );
      if (hasRemovals) {
        // Handle node removal if needed
      }
    },
    [onNodesChange],
  );

  // Handle node drag stop to save final positions
  const handleNodeDragStop = useCallback(
    (_event: any, draggedNode: any, draggedNodes: any[]) => {
      // Get all dragged nodes (could be multiple if selection was dragged)
      const nodesToUpdate =
        draggedNodes && draggedNodes.length > 0 ? draggedNodes : [draggedNode];

      // Create position updates for all dragged nodes
      const positionUpdates = nodesToUpdate.map((node) => ({
        nodeId: node.id,
        position: node.position,
      }));

      // Use the position-only mutation to avoid overwriting other node data
      updateNodesPositions.mutate(positionUpdates, {
        onSuccess: () => {
          // Skip the next sync since we just updated positions
          skipNextSyncRef.current = true;
        },
      });
    },
    [updateNodesPositions],
  );

  // Handle edge changes to track dirty state
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);

      // Check if any edges were removed
      const hasRemovals = changes.some(
        (change: any) => change.type === "remove",
      );

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
    },
    [onEdgesChange, saveFlowChanges],
  );

  // Preview session
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    ...sessionQueries.list({}), // SearchSessionsQuery doesn't have flowId
    enabled: !!flow,
  });
  const previewSessionId = useAgentStore.use.previewSessionId();
  const setPreviewSessionId = useAgentStore.use.setPreviewSessionId();
  const handleSessionChange = useCallback(
    (sessionId: string) => {
      if (sessionId === "none") {
        setPreviewSessionId(null);
      } else {
        setPreviewSessionId(sessionId);
      }
    },
    [setPreviewSessionId],
  );

  if (!flow) {
    return (
      <div className="text-text-subtle bg-background-surface-2 h-full w-full p-4">
        Flow not found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {/* Header section with flow name */}
      <div className="absolute top-4 right-4 left-[72px] z-10 flex flex-col gap-4">
        {/* Flow header - conditional left margin */}
        <div
          className={cn(
            "bg-background-surface-3 inline-flex items-center justify-start gap-2 rounded-lg px-4 py-2 transition-all duration-200",
            // {
            //   "ml-0": isMobile || isExpanded, // Normal left margin when mobile or navigation expanded
            //   "ml-12": !isMobile && !isExpanded, // Larger left margin when navigation collapsed
            // },
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
            <div className="text-text-body text-xs font-normal whitespace-nowrap">
              Flow name
            </div>
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
                  className="text-text-primary max-w-full min-w-[80px] bg-transparent text-xs font-semibold outline-none"
                  style={{
                    width: `${Math.max(editedTitle.length * 6 + 16, 80)}px`,
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Check className="text-status-success h-3 w-3" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <div className="text-text-primary truncate text-xs font-semibold">
                  {flow.props.name || "Untitled Flow"}
                </div>
                <button
                  onClick={() => {
                    setEditedTitle(flow.props.name || "");
                    setIsEditingTitle(true);
                  }}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Pencil className="text-text-subtle hover:text-text-primary h-3 w-3 transition-colors" />
                </button>
              </>
            )}
          </div>

          {/* Select preview session */}
          <div className="flex flex-row items-center gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <HelpCircle className="text-text-info min-h-4 min-w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent variant="button" side="bottom">
                  <p className="max-w-xs text-xs">
                    Select a session to see how its data appears within the
                    flow. This feature applies to Preview and Variable tabs.
                    Data will be based on the last message of the session.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select
              value={previewSessionId || "none"}
              onValueChange={handleSessionChange}
            >
              <SelectTrigger className="bg-background-surface-0 outline-border-normal min-h-8 w-[242px] rounded-md px-4 py-2 outline-1 outline-offset-[-1px]">
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
                    .filter((session: Session) =>
                      session.flowId?.equals(flow.id),
                    )
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
        <div className="flex w-full items-start justify-between gap-2">
          {/* Left side buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Agent button - creates agent node directly */}
            <ButtonPill
              size="default"
              onClick={() => addNode("agent")}
              className="w-32"
            >
              Agent (node)
            </ButtonPill>

            {/* Data dropdown - Schema panel or Create data store node */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="min-w-[96px]">
                  <ButtonPill size="default" className="w-full">
                    Data
                  </ButtonPill>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={16}
                className="!w-[92px] !min-w-[92px] overflow-hidden rounded-lg p-0"
              >
                <button
                  onClick={() => openPanel(PANEL_TYPES.DATA_STORE_SCHEMA)}
                  className="bg-background-surface-4 border-border-normal hover:bg-background-surface-5 inline-flex h-[31px] w-[92px] items-center justify-center border-b transition-colors"
                >
                  <div className="text-text-primary text-center text-xs font-normal whitespace-nowrap">
                    Schema
                  </div>
                </button>
                <NodeSelectionMenuItems
                  onSelectNodeType={(type) => {
                    if (type === "dataStore") {
                      addNode("dataStore");
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
                  <ButtonPill size="default" className="w-full">
                    Conditional
                  </ButtonPill>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={16}
                className="!w-[92px] !min-w-[92px] overflow-hidden rounded-lg p-0"
              >
                <NodeSelectionMenuItems
                  onSelectNodeType={(type) => {
                    if (type === "if") {
                      addNode("if");
                    }
                  }}
                  variant="dropdown"
                  showOnlyIf={true}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonPill
              size="default"
              icon={<BookOpen />}
              active={isPanelOpen(PANEL_TYPES.VARIABLE)}
              onClick={() => openPanel(PANEL_TYPES.VARIABLE)}
            >
              Variables
            </ButtonPill>
            <ButtonPill
              size="default"
              icon={<SearchCheck />}
              active={isPanelOpen(PANEL_TYPES.VALIDATION)}
              onClick={() => openPanel(PANEL_TYPES.VALIDATION)}
              className="h-8 w-28"
            >
              Validation
            </ButtonPill>
            {/*<ButtonPill
              size="default"
              variant="gradient"
              icon={<SvgIcon name="ai_assistant" />}
              active={isPanelOpen(PANEL_TYPES.VIBE)}
              onClick={handleVibeCodingToggle}
              className="w-32 h-8"
            >
              AI assistant
            </ButtonPill>*/}
          </div>
        </div>
      </div>

      {/* Main flow canvas */}
      <Card className="h-full w-full overflow-hidden rounded-none border-0">
        <div className="relative h-full w-full" style={{ minHeight: "200px" }}>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
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
                defaultViewport={
                  flow?.props.viewport
                    ? {
                        x: flow.props.viewport.x,
                        y: flow.props.viewport.y,
                        zoom: flow.props.viewport.zoom,
                      }
                    : { x: 0, y: 0, zoom: 1 }
                }
                fitView={!flow?.props.viewport}
                fitViewOptions={{
                  padding: 0.2,
                  duration: 0,
                  minZoom: 0.5,
                  maxZoom: 1.5,
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
