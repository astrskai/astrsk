import { CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useState } from "react";
import { useMemoryTestStore, type ValidationTest } from "@/shared/stores/memory-test-store";
import { memoryTestService } from "@/app/services/memory-test-service";

export function MemoryTestResults() {
  const validationTests = useMemoryTestStore((state) => state.validationTests);
  const sessionId = useMemoryTestStore((state) => state.sessionId);
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "passed" | "failed">("all");

  const toggleTest = (testNumber: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testNumber)) {
        next.delete(testNumber);
      } else {
        next.add(testNumber);
      }
      return next;
    });
  };

  const filteredTests = validationTests.filter((test) => {
    if (filterMode === "all") return true;
    if (filterMode === "passed") return test.passed;
    if (filterMode === "failed") return !test.passed;
    return true;
  });

  const handleExport = () => {
    if (sessionId) {
      memoryTestService.exportResults(sessionId);
    }
  };

  if (validationTests.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border-border-subtle flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-fg-default text-lg font-semibold">Validation Results</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-brand-primary text-brand-primary-fg hover:bg-brand-primary-hover flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              filterMode === "all"
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-surface-raised text-fg-muted hover:bg-surface-raised-hover"
            }`}
          >
            All ({validationTests.length})
          </button>
          <button
            onClick={() => setFilterMode("passed")}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              filterMode === "passed"
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-surface-raised text-fg-muted hover:bg-surface-raised-hover"
            }`}
          >
            Passed ({validationTests.filter((t) => t.passed).length})
          </button>
          <button
            onClick={() => setFilterMode("failed")}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              filterMode === "failed"
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-surface-raised text-fg-muted hover:bg-surface-raised-hover"
            }`}
          >
            Failed ({validationTests.filter((t) => !t.passed).length})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredTests.map((test) => (
          <TestResultItem
            key={test.testNumber}
            test={test}
            isExpanded={expandedTests.has(test.testNumber)}
            onToggle={() => toggleTest(test.testNumber)}
          />
        ))}
      </div>
    </div>
  );
}

interface TestResultItemProps {
  test: ValidationTest;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestResultItem({ test, isExpanded, onToggle }: TestResultItemProps) {
  return (
    <div
      className={`border-border-subtle rounded border transition-colors ${
        test.passed ? "bg-surface-success/10" : "bg-surface-error/10"
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-surface-raised/50"
      >
        <div className="flex items-center gap-3">
          {test.passed ? (
            <CheckCircle className="text-fg-success h-5 w-5 flex-shrink-0" />
          ) : (
            <XCircle className="text-fg-error h-5 w-5 flex-shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="text-fg-default text-sm font-medium">
              Test #{test.testNumber} - {test.passed ? "PASSED" : "FAILED"}
            </span>
            <span className="text-fg-muted text-xs">
              Fact: "{test.fact}" (Turn {test.factTurnNumber}, distance: {test.turnDistance})
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-fg-muted h-4 w-4" />
        ) : (
          <ChevronDown className="text-fg-muted h-4 w-4" />
        )}
      </button>

      {/* Details - Expandable */}
      {isExpanded && (
        <div className="border-border-subtle flex flex-col gap-3 border-t p-3">
          {/* Question */}
          <div>
            <div className="text-fg-muted mb-1 text-xs font-medium">Question Asked:</div>
            <div className="bg-surface-raised rounded p-2 text-sm">{test.question}</div>
          </div>

          {/* Retrieved Anchors */}
          <div>
            <div className="text-fg-muted mb-1 text-xs font-medium">
              Retrieved Anchors ({test.retrievedAnchors.length}):
            </div>
            {test.retrievedAnchors.length > 0 ? (
              <div className="bg-surface-raised flex flex-wrap gap-1 rounded p-2">
                {test.retrievedAnchors.map((anchor, idx) => (
                  <span
                    key={idx}
                    className="bg-brand-primary/10 text-brand-primary rounded px-2 py-1 text-xs"
                  >
                    {anchor}
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-surface-raised text-fg-muted rounded p-2 text-xs italic">
                No anchors retrieved
              </div>
            )}
          </div>

          {/* Response */}
          <div>
            <div className="text-fg-muted mb-1 text-xs font-medium">Agent Response:</div>
            <div className="bg-surface-raised rounded p-2 text-sm">{test.response}</div>
          </div>

          {/* Validation Status */}
          <div>
            <div className="text-fg-muted mb-1 text-xs font-medium">Validation:</div>
            <div
              className={`rounded p-2 text-sm ${
                test.responseContainsFact
                  ? "bg-surface-success text-fg-success"
                  : "bg-surface-error text-fg-error"
              }`}
            >
              {test.responseContainsFact
                ? `✓ Response contains fact: "${test.fact}"`
                : `✗ Response does NOT contain fact: "${test.fact}"`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
