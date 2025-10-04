// Main exports for the simple memory module
export { memoryClient, isMemoryClientConfigured } from "../shared/client";
export { testSupermemory } from "./test-memory";
export { runMemoryPerformanceTest } from "./test-memory-performance";
export { memoryService } from "./memory-service";

// Domain exports (will be added as they are created)
// export * from './domain/memory-entry';
// export * from './domain/memory-metadata';
// export * from './domain/turn-pair';
// export * from './domain/memory-context';
// export * from './domain/memory-formatter';

// Use case exports (will be added as they are created)
// export * from './usecases/store-turn-memory';
// export * from './usecases/retrieve-agent-memories';
// export * from './usecases/batch-store-memories';

// Repository exports (will be added as they are created)
// export * from './repos/memory-storage-repo';
// export * from './repos/memory-retrieval-repo';
