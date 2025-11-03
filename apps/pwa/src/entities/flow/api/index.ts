/**
 * Flow Query Utilities
 * 
 * Organized utilities for managing flow queries, mutations, and cache updates.
 */

// Re-export everything for convenient imports
export * from "./query-factory";
export * from "./optimistic-updates";
export * from "./mutations";

// Also export grouped namespaces for cleaner imports
export * as optimisticUpdates from "./optimistic-updates";
export * as mutations from "./mutations";