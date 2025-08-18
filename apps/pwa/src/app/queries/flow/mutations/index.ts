/**
 * Flow Mutations Export
 * 
 * Central export point for all flow-related mutations
 * Organized by domain area for easy access
 */

// Core flow mutations
export * from '../mutations';

// Node mutations
export * from './node-mutations';

// Agent node mutations (handles both node and agent entity)
export * from './agent-node-mutations';

// Edge mutations  
export * from './edge-mutations';

// Data store mutations
export * from './data-store-mutations';

// If node mutations
export * from './if-node-mutations';