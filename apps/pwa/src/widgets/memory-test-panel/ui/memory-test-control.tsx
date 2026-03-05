import { useState } from "react";
import { Play, Check, AlertCircle, StopCircle, Download } from "lucide-react";
import { useMemoryTestStore } from "@/shared/stores/memory-test-store";
import { memoryTestService } from "@/app/services/memory-test-service";

interface MemoryTestControlProps {
  sessionId: string;
}

export function MemoryTestControl({ sessionId }: MemoryTestControlProps) {
  const phase = useMemoryTestStore((state) => state.phase);
  const currentTurn = useMemoryTestStore((state) => state.currentTurn);
  const totalTurns = useMemoryTestStore((state) => state.totalTurns);
  const plantedFacts = useMemoryTestStore((state) => state.plantedFacts);
  const currentValidationIndex = useMemoryTestStore((state) => state.currentValidationIndex);
  const summary = useMemoryTestStore((state) => state.summary);
  const stopTest = useMemoryTestStore((state) => state.stopTest);
  const reset = useMemoryTestStore((state) => state.reset);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportReport = () => {
    memoryTestService.exportResults(sessionId);
  };

  const handleStartGeneration = async () => {
    setIsRunning(true);
    setError(null);

    try {
      await memoryTestService.runAutoGeneration(sessionId, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      console.error("[MemoryTestControl] Generation error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartValidation = async () => {
    setIsRunning(true);
    setError(null);

    try {
      await memoryTestService.runBatchValidation(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      console.error("[MemoryTestControl] Validation error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    stopTest();
    setIsRunning(false);
  };

  const handleReset = () => {
    reset();
    setError(null);
  };

  return (
    <div className="bg-surface border-border-subtle flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-fg-default text-lg font-semibold">Memory Recall Test</h3>
        {phase !== "idle" && (
          <button
            onClick={handleReset}
            className="text-fg-muted hover:text-fg-default text-sm transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="bg-surface-error border-border-error text-fg-error flex items-center gap-2 rounded border p-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Idle state */}
      {phase === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-sm">
            Test compression memory recall by auto-generating 100 turns with planted facts,
            then validating if the system can recall them correctly.
          </p>
          <button
            onClick={handleStartGeneration}
            disabled={isRunning}
            className="bg-brand-primary text-brand-primary-fg hover:bg-brand-primary-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start Test (100 turns)
          </button>
        </div>
      )}

      {/* Generating phase */}
      {phase === "generating" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-fg-default text-sm font-medium">Generating turns...</span>
            <span className="text-fg-muted text-sm">
              {currentTurn} / {totalTurns}
            </span>
          </div>
          <div className="bg-surface-raised h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${(currentTurn / totalTurns) * 100}%` }}
            />
          </div>
          <p className="text-fg-muted text-xs">
            Planted {plantedFacts.length} facts so far...
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleStop}
              className="bg-surface-error text-fg-error hover:bg-surface-error-hover flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
            >
              <StopCircle className="h-4 w-4" />
              Stop Generation
            </button>
            <button
              onClick={handleExportReport}
              disabled={plantedFacts.length === 0}
              className="bg-surface-raised text-fg-default hover:bg-surface-raised-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
              title="Save partial report"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Ready for validation */}
      {phase === "ready" && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface-success border-border-success text-fg-success flex items-center gap-2 rounded border p-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>Generated {totalTurns} turns with {plantedFacts.length} planted facts</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStartValidation}
              disabled={isRunning}
              className="bg-brand-primary text-brand-primary-fg hover:bg-brand-primary-hover flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              Start Validation ({plantedFacts.length} tests)
            </button>
            <button
              onClick={handleExportReport}
              className="bg-surface-raised text-fg-default hover:bg-surface-raised-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
              title="Save generation report"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validating phase */}
      {phase === "validating" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-fg-default text-sm font-medium">Validating recall...</span>
            <span className="text-fg-muted text-sm">
              {currentValidationIndex} / {plantedFacts.length}
            </span>
          </div>
          <div className="bg-surface-raised h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${(currentValidationIndex / plantedFacts.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-success">✓ {summary.passed} passed</span>
            <span className="text-fg-error">✗ {summary.failed} failed</span>
            <span className="text-fg-muted">{summary.accuracy.toFixed(1)}% accuracy</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStop}
              className="bg-surface-error text-fg-error hover:bg-surface-error-hover flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
            >
              <StopCircle className="h-4 w-4" />
              Stop Validation
            </button>
            <button
              onClick={handleExportReport}
              disabled={summary.totalTests === 0}
              className="bg-surface-raised text-fg-default hover:bg-surface-raised-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
              title="Save partial report"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stopped phase */}
      {phase === "stopped" && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface-raised border-border-subtle text-fg-muted flex items-center gap-2 rounded border p-3 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Test stopped by user</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="bg-surface-raised rounded p-2">
              <div className="text-fg-default font-semibold">{currentTurn}</div>
              <div className="text-fg-muted text-xs">Turns Generated</div>
            </div>
            <div className="bg-surface-raised rounded p-2">
              <div className="text-fg-default font-semibold">{plantedFacts.length}</div>
              <div className="text-fg-muted text-xs">Facts Planted</div>
            </div>
          </div>
          {summary.totalTests > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-surface-raised rounded p-2">
                <div className="text-fg-default font-semibold">{summary.totalTests}</div>
                <div className="text-fg-muted text-xs">Tests Run</div>
              </div>
              <div className="bg-surface-raised rounded p-2">
                <div className="text-fg-success font-semibold">{summary.passed}</div>
                <div className="text-fg-muted text-xs">Passed</div>
              </div>
              <div className="bg-surface-raised rounded p-2">
                <div className="text-fg-error font-semibold">{summary.failed}</div>
                <div className="text-fg-muted text-xs">Failed</div>
              </div>
            </div>
          )}
          <button
            onClick={handleExportReport}
            disabled={plantedFacts.length === 0 && summary.totalTests === 0}
            className="bg-brand-primary text-brand-primary-fg hover:bg-brand-primary-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Partial Report
          </button>
          {summary.totalTests > 0 && (
            <p className="text-fg-muted text-xs">
              Partial accuracy: {summary.accuracy.toFixed(1)}% ({summary.totalTests} tests completed)
            </p>
          )}
        </div>
      )}

      {/* Complete phase */}
      {phase === "complete" && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface-success border-border-success rounded border p-4">
            <div className="text-fg-default mb-2 text-center text-2xl font-bold">
              {summary.accuracy.toFixed(1)}%
            </div>
            <div className="text-fg-muted text-center text-sm">Overall Accuracy</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-surface-raised rounded p-2">
              <div className="text-fg-default font-semibold">{summary.totalTests}</div>
              <div className="text-fg-muted text-xs">Total Tests</div>
            </div>
            <div className="bg-surface-raised rounded p-2">
              <div className="text-fg-success font-semibold">{summary.passed}</div>
              <div className="text-fg-muted text-xs">Passed</div>
            </div>
            <div className="bg-surface-raised rounded p-2">
              <div className="text-fg-error font-semibold">{summary.failed}</div>
              <div className="text-fg-muted text-xs">Failed</div>
            </div>
          </div>

          <div className="bg-surface-raised rounded p-3 text-center">
            <div className="text-fg-default text-sm font-medium">
              Avg Turn Distance: {summary.avgTurnDistance.toFixed(1)} turns
            </div>
          </div>

          <button
            onClick={handleExportReport}
            className="bg-brand-primary text-brand-primary-fg hover:bg-brand-primary-hover flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Complete Report
          </button>

          <p className="text-fg-muted text-xs">
            Scroll down to see detailed test results
          </p>
        </div>
      )}
    </div>
  );
}
