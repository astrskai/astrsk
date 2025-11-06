import { useCallback } from "react";
import { Variable } from "@/shared/prompt/domain/variable";
import {
  LorebookEditor,
  VariablesPanel,
  type LorebookEntry,
} from "@/shared/ui/panels";

interface PlotLorebookStepProps {
  entries: LorebookEntry[];
  onEntriesChange: (entries: LorebookEntry[]) => void;
}

/**
 * Plot Lorebook Step Component
 * Step 3 of the Create Plot Card wizard
 *
 * Fields (all optional):
 * - Entries:
 *   - Entry Name: Name for the entry
 *   - Tags: Keywords that trigger this entry
 *   - Recall Range: Number of messages to scan
 *   - Description: Lore content (supports variable insertion)
 */
export function PlotLorebookStep({
  entries,
  onEntriesChange,
}: PlotLorebookStepProps) {
  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  // Insert variable - handled by VariablesPanel
  const insertVariable = useCallback((variableText: string) => {
    // Variables panel integration can be added here if needed
    console.log("Variable clicked:", variableText);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Plot Lorebook
        </h2>
        <p className="text-text-secondary text-sm">
          Add additional lore and world-building details for your plot
          (optional).
        </p>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left + Center: Entries List and Editor */}
        <LorebookEditor entries={entries} onEntriesChange={onEntriesChange} />

        {/* Right: Variables Panel */}
        <VariablesPanel
          onVariableClick={insertVariable}
          filterVariables={filterVariables}
          isActive={!!entries.find((e) => e.id)}
          inactiveMessage="Select an entry to insert variables"
        />
      </div>
    </div>
  );
}
