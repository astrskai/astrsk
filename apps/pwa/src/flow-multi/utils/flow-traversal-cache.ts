// Cache for flow traversal results to optimize performance
// This addresses the issue of multiple components calling traverseFlow repeatedly

import { Flow } from "@/modules/flow/domain/flow";
import { FlowTraversalResult, traverseFlow } from "@/flow-multi/utils/flow-traversal";

interface CacheEntry {
  flowId: string;
  nodesHash: string;
  edgesHash: string;
  result: FlowTraversalResult;
  timestamp: number;
}

class FlowTraversalCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxAge = 1000; // Cache for 1 second
  
  // Generate a hash from nodes and edges to detect changes
  private generateHash(flow: Flow): { nodesHash: string; edgesHash: string } {
    const nodes = flow.props.nodes;
    const edges = flow.props.edges;
    
    // Create a simple hash based on node IDs, types, and edge connections
    const nodesHash = nodes
      .map(n => `${n.id}:${n.type}`)
      .sort()
      .join(',');
    
    const edgesHash = edges
      .map(e => `${e.source}:${e.sourceHandle || ''}->${e.target}:${e.targetHandle || ''}`)
      .sort()
      .join(',');
    
    return { nodesHash, edgesHash };
  }
  
  // Get cached result or compute new one
  getCachedTraversal(flow: Flow): FlowTraversalResult {
    const flowId = flow.id.toString();
    const { nodesHash, edgesHash } = this.generateHash(flow);
    const now = Date.now();
    
    // Check if we have a cached entry
    const cached = this.cache.get(flowId);
    
    if (cached) {
      // Check if cache is still valid (not expired and flow hasn't changed)
      if (
        cached.nodesHash === nodesHash &&
        cached.edgesHash === edgesHash &&
        now - cached.timestamp < this.maxAge
      ) {
        return cached.result;
      }
    }
    
    // Compute new traversal result
    const result = traverseFlow(flow);
    
    // Cache the result
    this.cache.set(flowId, {
      flowId,
      nodesHash,
      edgesHash,
      result,
      timestamp: now
    });
    
    // Clean up old entries to prevent memory leaks
    this.cleanupOldEntries();
    
    return result;
  }
  
  // Clear cache for a specific flow
  clearFlow(flowId: string): void {
    this.cache.delete(flowId);
  }
  
  // Clear entire cache
  clearAll(): void {
    this.cache.clear();
  }
  
  // Remove entries older than maxAge
  private cleanupOldEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge * 2) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const flowTraversalCache = new FlowTraversalCache();

// Cached traversal function
export function traverseFlowCached(flow: Flow): FlowTraversalResult {
  return flowTraversalCache.getCachedTraversal(flow);
}