import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/shared/ui/forms";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/shared/ui/panels";

interface ScenarioDescriptionStepProps {
  description: string;
  onDescriptionChange: (description: string) => void;
}

/**
 * Scenario Description Step Component
 * Step 2 of the Create Scenario Card wizard
 *
 * Fields:
 * - Description (Required): Scenario setting, themes, and story elements
 */
export function ScenarioDescriptionStep({
  description,
  onDescriptionChange,
}: ScenarioDescriptionStepProps) {
  const [activeTextarea, setActiveTextarea] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  // Insert variable at cursor position
  const insertVariable = useCallback(
    (variableText: string) => {
      const textarea = descriptionRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        description.substring(0, start) +
        variableText +
        description.substring(end);

      onDescriptionChange(newValue);

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [description, onDescriptionChange],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Add Your Scenario Description*
        </h2>
        <p className="text-text-secondary text-sm">
          Describe your scenario's setting, themes, and story elements.
        </p>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Text Fields */}
        <div className="border-border flex flex-1 flex-col rounded-lg border-2 bg-gray-900 p-2 md:p-4">
          <div className="flex flex-col gap-1">
            {/* Scenario Description */}
            <Textarea
              ref={descriptionRef}
              label="Scenario Description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onFocus={() => setActiveTextarea(true)}
              placeholder="Describe your scenario's setting, themes, and story elements..."
              required
              autoResize
              className="min-h-[300px]"
            />
            <p className="text-right text-xs text-gray-300">
              {`{{scenario.description}}`}
            </p>
          </div>
        </div>

        {/* Variables Panel - Sticky on desktop */}
        <div className="md:sticky md:top-4 md:self-start">
          <VariablesPanel
            onVariableClick={insertVariable}
            filterVariables={filterVariables}
            isActive={activeTextarea}
            inactiveMessage="Click in the text field to insert variables"
          />
        </div>
      </div>
    </div>
  );
}
