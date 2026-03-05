import { create } from "zustand";

/**
 * Memory Test Store
 * Tracks auto-generation phase and validation results for compression memory testing
 */

// Planted fact for later testing
export interface PlantedFact {
  turnNumber: number;
  turnId: string;
  fact: string; // The specific fact to test (e.g., "12 times")
  fullMessage: string; // Full user message containing the fact
  context: string; // Agent response context
}

// Validation test result
export interface ValidationTest {
  testNumber: number;
  factTurnNumber: number;
  fact: string;
  question: string;

  // BM25 retrieval results
  retrievedAnchors: string[];

  // Response validation
  response: string;
  responseContainsFact: boolean;

  // Metrics
  turnDistance: number; // How far back we asked (currentTurn - factTurn)
  passed: boolean;
}

// Test phase
export type TestPhase = "idle" | "generating" | "ready" | "validating" | "complete" | "stopped";

interface MemoryTestState {
  // Test state
  phase: TestPhase;
  sessionId: string | null;
  shouldStop: boolean; // Signal to stop generation/validation

  // Generation phase
  totalTurns: number;
  currentTurn: number;
  plantedFacts: PlantedFact[];

  // Validation phase
  validationTests: ValidationTest[];
  currentValidationIndex: number;

  // Summary
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    avgTurnDistance: number;
  };

  // Actions
  startGeneration: (sessionId: string, totalTurns: number) => void;
  incrementTurn: () => void;
  plantFact: (fact: PlantedFact) => void;
  finishGeneration: () => void;

  startValidation: () => void;
  recordValidation: (test: ValidationTest) => void;
  finishValidation: () => void;

  stopTest: () => void;
  reset: () => void;
}

const initialSummary = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  accuracy: 0,
  avgTurnDistance: 0,
};

export const useMemoryTestStore = create<MemoryTestState>((set, get) => ({
  // Initial state
  phase: "idle",
  sessionId: null,
  shouldStop: false,
  totalTurns: 0,
  currentTurn: 0,
  plantedFacts: [],
  validationTests: [],
  currentValidationIndex: 0,
  summary: initialSummary,

  // Start generation phase
  startGeneration: (sessionId: string, totalTurns: number) => {
    set({
      phase: "generating",
      sessionId,
      totalTurns,
      currentTurn: 0,
      plantedFacts: [],
      validationTests: [],
      currentValidationIndex: 0,
      summary: initialSummary,
      shouldStop: false, // Reset stop flag when starting new test
    });
    console.log(`[MemoryTest] Starting generation: ${totalTurns} turns`);
  },

  // Increment turn counter
  incrementTurn: () => {
    set((state) => ({
      currentTurn: state.currentTurn + 1,
    }));
  },

  // Plant a fact for later testing
  plantFact: (fact: PlantedFact) => {
    set((state) => ({
      plantedFacts: [...state.plantedFacts, fact],
    }));
    console.log(`[MemoryTest] Planted fact at turn ${fact.turnNumber}: "${fact.fact}"`);
  },

  // Finish generation phase
  finishGeneration: () => {
    const { plantedFacts } = get();
    set({ phase: "ready" });
    console.log(`[MemoryTest] Generation complete. ${plantedFacts.length} facts planted.`);
  },

  // Start validation phase
  startValidation: () => {
    set({
      phase: "validating",
      currentValidationIndex: 0,
      validationTests: [],
      shouldStop: false, // Reset stop flag when starting validation
    });
    console.log(`[MemoryTest] Starting validation phase`);
  },

  // Record validation result
  recordValidation: (test: ValidationTest) => {
    set((state) => {
      const newTests = [...state.validationTests, test];
      const passed = newTests.filter(t => t.passed).length;
      const totalTests = newTests.length;
      const avgDistance = newTests.reduce((sum, t) => sum + t.turnDistance, 0) / totalTests;

      return {
        validationTests: newTests,
        currentValidationIndex: state.currentValidationIndex + 1,
        summary: {
          totalTests,
          passed,
          failed: totalTests - passed,
          accuracy: (passed / totalTests) * 100,
          avgTurnDistance: avgDistance,
        },
      };
    });

    console.log(`[MemoryTest] Validation ${test.testNumber}: ${test.passed ? "✅ PASS" : "❌ FAIL"}`);
  },

  // Finish validation phase
  finishValidation: () => {
    const { summary } = get();
    set({ phase: "complete" });
    console.log(`[MemoryTest] Validation complete. Accuracy: ${summary.accuracy.toFixed(1)}%`);
  },

  // Stop test (can be called during generation or validation)
  stopTest: () => {
    set({ shouldStop: true, phase: "stopped" });
    console.log(`[MemoryTest] Test stopped by user`);
  },

  // Reset test
  reset: () => {
    set({
      phase: "idle",
      sessionId: null,
      shouldStop: false,
      totalTurns: 0,
      currentTurn: 0,
      plantedFacts: [],
      validationTests: [],
      currentValidationIndex: 0,
      summary: initialSummary,
    });
    console.log(`[MemoryTest] Reset`);
  },
}));
