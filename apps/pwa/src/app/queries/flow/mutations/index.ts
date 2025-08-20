/**
 * Flow Mutations Export
 * 
 * Central export point for all flow-related mutations
 * Organized by domain area for easy access
 */

// Core flow mutations
export * from '../mutations';

// Data store mutations
export * from './data-store-mutations';
// export * from './data-store-node-mutations'; // Commented out - legacy mutations deprecated

// If node mutations
export * from './if-node-mutations';

// Batch mutations for nodes and edges
export * from './nodes-edges-mutations';

// Flow-level mutations
export * from './flow-mutations';

// Panel layout mutations
export * from './panel-layout-mutations';

// Node positions mutations
export * from './nodes-positions-mutations';