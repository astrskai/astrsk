// This file exposes test functions to the global window object
import { testSupermemory } from "./test-memory";
import { runMemoryPerformanceTest } from "./test-memory-performance";

// Expose functions globally when this module is imported
if (typeof window !== "undefined") {
  (window as any).testSupermemory = testSupermemory;
  (window as any).runMemoryPerformanceTest = runMemoryPerformanceTest;

  console.log("✅ Supermemory test functions loaded!");
  console.log("Available functions:");
  console.log("  - testSupermemory() : Basic connectivity test");
  console.log("  - runMemoryPerformanceTest() : Full 100-message performance test");
}

export { testSupermemory, runMemoryPerformanceTest };
