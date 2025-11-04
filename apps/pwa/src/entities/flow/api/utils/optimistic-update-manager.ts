/**
 * Optimistic Update Manager for Flow
 * 
 * Centralized system to track and coordinate all granular updates
 * to ensure consistency across optimistic updates.
 */

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { flowKeys } from "../query-factory";

interface PendingUpdate {
  id: string;
  type: 'node' | 'edge' | 'metadata' | 'schema' | 'viewport';
  target: string; // nodeId, edgeId, etc.
  field: string; // what field is being updated
  value: any;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}

class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, PendingUpdate>();
  private updateVersion = 0;

  /**
   * Register a granular update before applying optimistic update
   */
  registerUpdate(flowId: string, update: Omit<PendingUpdate, 'id' | 'timestamp' | 'status'>): string {
    const updateId = `${flowId}-${update.type}-${update.target}-${Date.now()}`;
    const pendingUpdate: PendingUpdate = {
      id: updateId,
      ...update,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.pendingUpdates.set(updateId, pendingUpdate);
    this.updateVersion++;
    
    return updateId;
  }

  /**
   * Apply optimistic update with awareness of all pending updates
   */
  applyOptimisticUpdate(
    queryClient: QueryClient,
    flowId: string,
    update: Omit<PendingUpdate, 'id' | 'timestamp' | 'status'>
  ): string {
    const updateId = this.registerUpdate(flowId, update);
    
    // Check for conflicts with other pending updates
    const conflicts = this.checkConflicts(flowId, update);
    if (conflicts.length > 0) {
      console.warn('Potential conflicts detected:', conflicts);
    }

    // Apply the optimistic update based on type
    switch (update.type) {
      case 'node':
        this.updateNode(queryClient, flowId, update.target, update.field, update.value);
        break;
      case 'edge':
        this.updateEdge(queryClient, flowId, update.target, update.field, update.value);
        break;
      case 'metadata':
        this.updateMetadata(queryClient, flowId, update.field, update.value);
        break;
      case 'schema':
        this.updateSchema(queryClient, flowId, update.field, update.value);
        break;
      case 'viewport':
        this.updateViewport(queryClient, flowId, update.value);
        break;
    }

    return updateId;
  }

  /**
   * Check for conflicting pending updates
   */
  private checkConflicts(flowId: string, update: Omit<PendingUpdate, 'id' | 'timestamp' | 'status'>): PendingUpdate[] {
    const conflicts: PendingUpdate[] = [];
    
    this.pendingUpdates.forEach((pending) => {
      // Skip if different flow
      if (!pending.id.startsWith(flowId)) return;
      
      // Skip if already completed
      if (pending.status !== 'pending') return;
      
      // Check for conflicts
      if (pending.type === update.type && pending.target === update.target) {
        if (pending.field === update.field) {
          conflicts.push(pending);
        }
      }
    });
    
    return conflicts;
  }

  /**
   * Update node data optimistically
   */
  private updateNode(
    queryClient: QueryClient,
    flowId: string,
    nodeId: string,
    field: string,
    value: any
  ) {
    // Update specific node query
    queryClient.setQueryData(flowKeys.node(flowId, nodeId), (old: any) => {
      if (!old) return old;
      
      // Deep update for nested fields (e.g., 'data.conditions')
      const fieldPath = field.split('.');
      if (fieldPath.length === 1) {
        return { ...old, [field]: value };
      }
      
      // Handle nested updates
      let updated = { ...old };
      let current = updated;
      for (let i = 0; i < fieldPath.length - 1; i++) {
        current[fieldPath[i]] = { ...current[fieldPath[i]] };
        current = current[fieldPath[i]];
      }
      current[fieldPath[fieldPath.length - 1]] = value;
      
      return updated;
    });

    // Update nodes array
    queryClient.setQueryData(flowKeys.nodes(flowId), (old: any) => {
      if (!old || !Array.isArray(old)) return old;
      
      return old.map(node => {
        if (node.id !== nodeId) return node;
        
        // Apply same update logic
        const fieldPath = field.split('.');
        if (fieldPath.length === 1) {
          return { ...node, [field]: value };
        }
        
        let updated = { ...node };
        let current = updated;
        for (let i = 0; i < fieldPath.length - 1; i++) {
          current[fieldPath[i]] = { ...current[fieldPath[i]] };
          current = current[fieldPath[i]];
        }
        current[fieldPath[fieldPath.length - 1]] = value;
        
        return updated;
      });
    });

    // Optionally update flow detail (only if necessary for UI)
    const flowDetail = queryClient.getQueryData(flowKeys.detail(flowId)) as any;
    if (flowDetail && this.shouldUpdateFlowDetail(field)) {
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        
        const nodeIndex = old.props.nodes.findIndex((n: any) => n.id === nodeId);
        if (nodeIndex === -1) return old;
        
        const updatedNodes = [...old.props.nodes];
        const fieldPath = field.split('.');
        
        if (fieldPath.length === 1) {
          updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], [field]: value };
        } else {
          let updated = { ...updatedNodes[nodeIndex] };
          let current = updated;
          for (let i = 0; i < fieldPath.length - 1; i++) {
            current[fieldPath[i]] = { ...current[fieldPath[i]] };
            current = current[fieldPath[i]];
          }
          current[fieldPath[fieldPath.length - 1]] = value;
          updatedNodes[nodeIndex] = updated;
        }
        
        return {
          ...old,
          props: {
            ...old.props,
            nodes: updatedNodes
          }
        };
      });
    }
  }

  /**
   * Update edge data optimistically
   */
  private updateEdge(
    queryClient: QueryClient,
    flowId: string,
    edgeId: string,
    field: string,
    value: any
  ) {
    // Similar to updateNode but for edges
    queryClient.setQueryData(flowKeys.edge(flowId, edgeId), (old: any) => {
      if (!old) return old;
      return { ...old, [field]: value };
    });

    queryClient.setQueryData(flowKeys.edges(flowId), (old: any) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map(edge => 
        edge.id === edgeId ? { ...edge, [field]: value } : edge
      );
    });
  }

  /**
   * Update flow metadata optimistically
   */
  private updateMetadata(
    queryClient: QueryClient,
    flowId: string,
    field: string,
    value: any
  ) {
    queryClient.setQueryData(flowKeys.metadata(flowId), (old: any) => {
      if (!old) return old;
      return { ...old, [field]: value };
    });

    // Also update flow detail
    queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        props: {
          ...old.props,
          [field]: value
        }
      };
    });
  }

  /**
   * Update schema optimistically
   */
  private updateSchema(
    queryClient: QueryClient,
    flowId: string,
    field: string,
    value: any
  ) {
    queryClient.setQueryData(flowKeys.dataStoreSchema(flowId), (old: any) => {
      if (!old) return old;
      return { ...old, [field]: value };
    });
  }

  /**
   * Update viewport optimistically
   */
  private updateViewport(
    queryClient: QueryClient,
    flowId: string,
    value: any
  ) {
    queryClient.setQueryData(flowKeys.uiViewport(flowId), () => value);
  }

  /**
   * Determine if flow detail should be updated for a field
   */
  private shouldUpdateFlowDetail(field: string): boolean {
    // Only update flow detail for fields that affect UI rendering
    const uiFields = ['position', 'data', 'label', 'color'];
    return uiFields.some(f => field.startsWith(f));
  }

  /**
   * Mark update as successful
   */
  markSuccess(updateId: string) {
    const update = this.pendingUpdates.get(updateId);
    if (update) {
      update.status = 'success';
      // Clean up old successful updates after 5 seconds
      setTimeout(() => {
        this.pendingUpdates.delete(updateId);
      }, 5000);
    }
  }

  /**
   * Mark update as failed and rollback
   */
  markFailed(updateId: string, queryClient: QueryClient, previousData: any) {
    const update = this.pendingUpdates.get(updateId);
    if (update) {
      update.status = 'failed';
      // Rollback logic would go here
      this.pendingUpdates.delete(updateId);
    }
  }

  /**
   * Get all pending updates for a flow
   */
  getPendingUpdates(flowId: string): PendingUpdate[] {
    const updates: PendingUpdate[] = [];
    this.pendingUpdates.forEach((update) => {
      if (update.id.startsWith(flowId) && update.status === 'pending') {
        updates.push(update);
      }
    });
    return updates;
  }

  /**
   * Check if it's safe to do a full flow update
   */
  canSafelyUpdateFlow(flowId: string): boolean {
    const pending = this.getPendingUpdates(flowId);
    return pending.length === 0;
  }

  /**
   * Get update version (increments with each update)
   */
  getVersion(): number {
    return this.updateVersion;
  }
}

// Singleton instance
export const optimisticUpdateManager = new OptimisticUpdateManager();

/**
 * Hook to use the optimistic update manager
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const applyUpdate = (
    flowId: string,
    update: Omit<PendingUpdate, 'id' | 'timestamp' | 'status'>
  ) => {
    return optimisticUpdateManager.applyOptimisticUpdate(queryClient, flowId, update);
  };

  const checkConflicts = (flowId: string) => {
    return optimisticUpdateManager.getPendingUpdates(flowId);
  };

  const canUpdateFlow = (flowId: string) => {
    return optimisticUpdateManager.canSafelyUpdateFlow(flowId);
  };

  return {
    applyUpdate,
    checkConflicts,
    canUpdateFlow,
    markSuccess: optimisticUpdateManager.markSuccess.bind(optimisticUpdateManager),
    markFailed: optimisticUpdateManager.markFailed.bind(optimisticUpdateManager),
  };
}