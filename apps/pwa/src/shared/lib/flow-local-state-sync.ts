/**
 * Window-based local state synchronization for flow panels
 * 
 * This utility provides a mechanism to notify flow panels of local node/edge changes
 * when flow queries are disabled to prevent backend conflicts. It uses window events
 * to communicate between the operation processor and flow panels.
 */

import React from 'react';

export interface FlowLocalStateUpdate {
  flowId: string;
  nodes?: any[];
  edges?: any[];
  timestamp: number;
}

export interface FlowNodeUpdate {
  flowId: string;
  nodeId: string;
  nodeData: any;
  timestamp: number;
}

/**
 * Event names for window-based communication
 */
export const FLOW_LOCAL_STATE_EVENTS = {
  NODES_EDGES_UPDATE: 'flow:local:nodes-edges-update',
  NODE_UPDATE: 'flow:local:node-update',
} as const;

/**
 * Dispatch a local nodes/edges update event to notify flow panels
 */
export function notifyFlowNodesEdgesUpdate(flowId: string, nodes?: any[], edges?: any[]): void {
  if (typeof window === 'undefined') return;

  const updateData: FlowLocalStateUpdate = {
    flowId,
    nodes,
    edges,
    timestamp: Date.now(),
  };

  console.log('🔄 [FLOW-LOCAL-SYNC] Broadcasting nodes/edges update:', {
    flowId: flowId.slice(0, 8) + '...',
    nodeCount: nodes?.length || 0,
    edgeCount: edges?.length || 0,
    hasNodes: !!nodes,
    hasEdges: !!edges,
  });

  const event = new CustomEvent(FLOW_LOCAL_STATE_EVENTS.NODES_EDGES_UPDATE, {
    detail: updateData,
  });
  
  window.dispatchEvent(event);
}

/**
 * Dispatch a local node update event to notify flow panels
 */
export function notifyFlowNodeUpdate(flowId: string, nodeId: string, nodeData: any): void {
  if (typeof window === 'undefined') return;

  const updateData: FlowNodeUpdate = {
    flowId,
    nodeId,
    nodeData,
    timestamp: Date.now(),
  };

  console.log('🔄 [FLOW-LOCAL-SYNC] Broadcasting node update:', {
    flowId: flowId.slice(0, 8) + '...',
    nodeId: nodeId.slice(0, 8) + '...',
    nodeType: nodeData?.type,
  });

  const event = new CustomEvent(FLOW_LOCAL_STATE_EVENTS.NODE_UPDATE, {
    detail: updateData,
  });
  
  window.dispatchEvent(event);
}

/**
 * Hook to listen for local flow state updates in React components
 */
export function useFlowLocalStateSync(
  flowId: string,
  onNodesEdgesUpdate?: (nodes?: any[], edges?: any[]) => void,
  onNodeUpdate?: (nodeId: string, nodeData: any) => void
): void {
  if (typeof window === 'undefined') return;

  React.useEffect(() => {
    const handleNodesEdgesUpdate = (event: CustomEvent<FlowLocalStateUpdate>) => {
      const { flowId: eventFlowId, nodes, edges } = event.detail;
      
      // Only process events for this flow
      if (eventFlowId === flowId && onNodesEdgesUpdate) {
        console.log('📥 [FLOW-LOCAL-SYNC] Received nodes/edges update for flow:', {
          flowId: flowId.slice(0, 8) + '...',
          nodeCount: nodes?.length || 0,
          edgeCount: edges?.length || 0,
        });
        onNodesEdgesUpdate(nodes, edges);
      }
    };

    const handleNodeUpdate = (event: CustomEvent<FlowNodeUpdate>) => {
      const { flowId: eventFlowId, nodeId, nodeData } = event.detail;
      
      // Only process events for this flow
      if (eventFlowId === flowId && onNodeUpdate) {
        console.log('📥 [FLOW-LOCAL-SYNC] Received node update for flow:', {
          flowId: flowId.slice(0, 8) + '...',
          nodeId: nodeId.slice(0, 8) + '...',
          nodeType: nodeData?.type,
        });
        onNodeUpdate(nodeId, nodeData);
      }
    };

    // Add event listeners
    window.addEventListener(FLOW_LOCAL_STATE_EVENTS.NODES_EDGES_UPDATE, handleNodesEdgesUpdate as EventListener);
    window.addEventListener(FLOW_LOCAL_STATE_EVENTS.NODE_UPDATE, handleNodeUpdate as EventListener);

    // Cleanup listeners
    return () => {
      window.removeEventListener(FLOW_LOCAL_STATE_EVENTS.NODES_EDGES_UPDATE, handleNodesEdgesUpdate as EventListener);
      window.removeEventListener(FLOW_LOCAL_STATE_EVENTS.NODE_UPDATE, handleNodeUpdate as EventListener);
    };
  }, [flowId, onNodesEdgesUpdate, onNodeUpdate]);
}