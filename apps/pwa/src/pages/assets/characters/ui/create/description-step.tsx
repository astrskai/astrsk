import { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/shared/ui/forms";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/shared/ui/panels";

interface CharacterDescriptionStepProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  exampleDialogue: string;
  onExampleDialogueChange: (exampleDialogue: string) => void;
}

/**
 * Character Description Step Component
 * Step 2 of the Create Character Card wizard
 *
 * Fields:
 * - Description (Required): Character personality and traits
 * - Example Dialogue (Optional): Sample conversations
 */
export function CharacterDescriptionStep({
  description,
  onDescriptionChange,
  exampleDialogue,
  onExampleDialogueChange,
}: CharacterDescriptionStepProps) {
  const [activeTextarea, setActiveTextarea] = useState<
    "description" | "dialogue" | null
  >(null);

  const [isExampleDialogueOpen, setIsExampleDialogueOpen] =
    useState<boolean>(false);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dialogueRef = useRef<HTMLTextAreaElement>(null);

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
      const textarea =
        activeTextarea === "description"
          ? descriptionRef.current
          : dialogueRef.current;
      const onChange =
        activeTextarea === "description"
          ? onDescriptionChange
          : onExampleDialogueChange;
      const currentValue =
        activeTextarea === "description" ? description : exampleDialogue;

      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        currentValue.substring(0, start) +
        variableText +
        currentValue.substring(end);

      onChange(newValue);

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [
      activeTextarea,
      description,
      exampleDialogue,
      onDescriptionChange,
      onExampleDialogueChange,
    ],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Add Your Character Description*
        </h2>
        <p className="text-text-secondary text-sm">
          Describe your character's personality, traits, and background.
        </p>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Text Fields */}
        <div className="border-border flex flex-1 flex-col rounded-lg border-2 bg-gray-900 p-2 md:p-4">
          <div className="flex flex-col gap-1">
            {/* Character Description */}
            <Textarea
              ref={descriptionRef}
              label="Character Description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onFocus={() => setActiveTextarea("description")}
              placeholder="Describe your character's personality, traits, and background..."
              required
              autoResize
              className="min-h-[300px]"
            />
            <p className="text-right text-xs text-gray-300">
              {`{{char.description}}`}
            </p>

            {/* Example Dialogue - Collapsible */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsExampleDialogueOpen(!isExampleDialogueOpen)}
                className="text-text-secondary hover:text-text-secondary flex w-full items-center justify-between text-sm font-medium transition-colors"
              >
                <span>Example Dialogue (Optional)</span>
                {isExampleDialogueOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isExampleDialogueOpen && (
                <div className="mt-2">
                  <Textarea
                    ref={dialogueRef}
                    value={exampleDialogue}
                    onChange={(e) => onExampleDialogueChange(e.target.value)}
                    onFocus={() => setActiveTextarea("dialogue")}
                    placeholder="Enter example conversations to define how your character speaks..."
                    autoResize
                    className="min-h-[300px]"
                  />
                  <p className="text-right text-xs text-gray-300">
                    {`{{char.example_dialog}}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variables Panel - Sticky on desktop */}
        <div className="md:sticky md:top-4 md:self-start">
          <VariablesPanel
            onVariableClick={insertVariable}
            filterVariables={filterVariables}
            isActive={!!activeTextarea}
            inactiveMessage="Click in a text field to insert variables"
          />
        </div>
      </div>
    </div>
  );
}
