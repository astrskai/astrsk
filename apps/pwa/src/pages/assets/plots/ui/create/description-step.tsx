import { useRef, useCallback } from "react";
import { Textarea } from "@/shared/ui/forms";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/shared/ui/panels";

interface PlotDescriptionStepProps {
  description: string;
  onDescriptionChange: (description: string) => void;
}

const DESCRIPTION_PLACEHOLDER =
  "Describe your plot's setting, themes, and story elements...";
const DESCRIPTION_VARIABLE = "{{plot.description}}";
const DESCRIPTION_ROWS = 8;

/**
 * Plot Description Step Component
 * Step 2 of the Create Plot Card wizard
 *
 * Fields:
 * - Description (Required): Plot setting, themes, and story elements
 */
export function PlotDescriptionStep({
  description,
  onDescriptionChange,
}: PlotDescriptionStepProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Plot Description
        </h2>
        <p className="text-text-secondary text-sm">
          Enter the description and details for your plot.
        </p>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Text Field */}
        <div className="bg-background-surface-1 border-border flex-1 rounded-2xl border-2 p-4 md:p-6">
          <div className="flex flex-col gap-1">
            {/* Plot Description */}
            <Textarea
              ref={descriptionRef}
              label="Plot Description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={DESCRIPTION_PLACEHOLDER}
              required
              rows={DESCRIPTION_ROWS}
            />
            <p className="text-text-secondary text-right text-xs">
              {DESCRIPTION_VARIABLE}
            </p>
          </div>
        </div>

        {/* Variables Panel */}
        <VariablesPanel
          onVariableClick={insertVariable}
          filterVariables={filterVariables}
        />
      </div>
    </div>
  );
}
