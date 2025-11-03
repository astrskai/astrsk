/**
 * Flow Mutations Export
 *
 * Central export point for all flow-related mutations
 * Organized by domain area for easy access
 */

// Core flow mutations - export specific mutations from flow-mutations
export { useUpdateResponseTemplate } from "./flow-mutations";

// Data store mutations
export * from "./data-store-mutations";
// export * from './data-store-node-mutations'; // Commented out - legacy mutations deprecated

// If node mutations
export * from "./if-node-mutations";

// Batch mutations for nodes and edges
export * from "./nodes-edges-mutations";

// Flow-level mutations
export * from "./flow-mutations";

// Node positions mutations
export * from "./nodes-positions-mutations";

// Composite node mutations - single source of truth
export * from "./composite-node-mutations";

// Panel layout mutations
export * from "./panel-layout-mutations";
