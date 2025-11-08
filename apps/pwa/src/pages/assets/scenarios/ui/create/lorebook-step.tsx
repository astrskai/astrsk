import { useCallback, useRef, useState } from "react";
import { Variable } from "@/shared/prompt/domain/variable";
import {
  LorebookEditor,
  VariablesPanel,
  type LorebookEntry,
  type LorebookEditorRef,
} from "@/shared/ui/panels";

interface ScenarioLorebookStepProps {
  entries: LorebookEntry[];
  onEntriesChange: (entries: LorebookEntry[]) => void;
}

/**
 * Scenario Lorebook Step Component
 * Step 3 of the Create Scenario Card wizard
 *
 * Fields (all optional):
 * - Entries:
 *   - Entry Name: Name for the entry
 *   - Tags: Keywords that trigger this entry
 *   - Recall Range: Number of messages to scan
 *   - Description: Lore content (supports variable insertion)
 */
export function ScenarioLorebookStep({
  entries,
  onEntriesChange,
}: ScenarioLorebookStepProps) {
  const editorRef = useRef<LorebookEditorRef>(null);
  const [selectedEntry, setSelectedEntry] = useState<LorebookEntry | null>(
    null,
  );

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  // Insert variable at cursor position
  const insertVariable = useCallback((variableText: string) => {
    editorRef.current?.insertTextAtCursor(variableText);
  }, []);

  // Handle selected entry change
  const handleSelectedEntryChange = useCallback(
    (entry: LorebookEntry | null) => {
      setSelectedEntry(entry);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-base font-semibold md:text-[1.2rem]">
          Add lorebook
        </h2>
        <p className="text-text-secondary text-xs md:text-sm">
          Add additional lore and world-building details for your scenario
          (optional).
        </p>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left + Center: Entries List and Editor */}
        <LorebookEditor
          ref={editorRef}
          entries={entries}
          onEntriesChange={onEntriesChange}
          onSelectedEntryChange={handleSelectedEntryChange}
        />

        {/* Right: Variables Panel - Sticky on desktop */}
        <div className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <VariablesPanel
            onVariableClick={insertVariable}
            filterVariables={filterVariables}
            isActive={!!selectedEntry}
            inactiveMessage="Select an entry to insert variables"
          />
        </div>
      </div>
    </div>
  );
}
