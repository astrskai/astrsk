import { useState, useRef, useCallback, useMemo } from "react";
import { Textarea } from "@/shared/ui/forms";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import {
  Variable,
  VariableLibrary,
  VariableGroup,
  VariableGroupLabel,
} from "@/shared/prompt/domain/variable";

interface CharacterInfoStepProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  exampleDialogue: string;
  onExampleDialogueChange: (exampleDialogue: string) => void;
}

/**
 * Character Info Step Component
 * Step 2 of the Create Character Card wizard
 *
 * Fields:
 * - Description (Required): Character personality and traits
 * - Example Dialogue (Optional): Sample conversations
 */
export function CharacterInfoStep({
  description,
  onDescriptionChange,
  exampleDialogue,
  onExampleDialogueChange,
}: CharacterInfoStepProps) {
  const [isExampleDialogueOpen, setIsExampleDialogueOpen] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState<
    "description" | "dialogue" | null
  >(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dialogueRef = useRef<HTMLTextAreaElement>(null);

  // Group variables by their group property
  const groupedVariables = useMemo(() => {
    const libraryVariables = VariableLibrary.variableList;

    // Filter message-related variables
    const filteredVariables = libraryVariables.filter(
      (variable: Variable) =>
        !variable.variable.includes("message") &&
        !variable.variable.includes("history") &&
        !variable.dataType.toLowerCase().includes("message"),
    );

    // Group by variable.group
    const groups = filteredVariables.reduce(
      (acc, variable) => {
        const group = variable.group;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(variable);
        return acc;
      },
      {} as Record<string, Variable[]>,
    );

    return groups;
  }, []);

  // Toggle group collapse/expand
  const toggleGroupCollapse = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  }, []);

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
          2. Character Info
        </h2>
        <p className="text-text-secondary text-sm">
          Enter the personality and description for your character.
        </p>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Text Fields */}
        <div className="bg-background-surface-1 border-border flex-1 rounded-2xl border-2 p-4 md:p-6">
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
              rows={6}
            />
            <p className="text-text-secondary text-right text-xs">
              {`{{char.description}}`}
            </p>

            {/* Example Dialogue - Collapsible */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsExampleDialogueOpen(!isExampleDialogueOpen)}
                className="text-text-primary hover:text-text-secondary flex w-full items-center gap-2 text-sm font-medium transition-colors"
              >
                {isExampleDialogueOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Example Dialogue (Optional)
              </button>

              {isExampleDialogueOpen && (
                <div className="mt-2">
                  <Textarea
                    ref={dialogueRef}
                    value={exampleDialogue}
                    onChange={(e) => onExampleDialogueChange(e.target.value)}
                    onFocus={() => setActiveTextarea("dialogue")}
                    placeholder="Enter example conversations to define how your character speaks..."
                    rows={8}
                  />
                  <p className="text-text-secondary text-right text-xs">
                    {`{{char.example_dialog}}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variables Panel */}
        <div className="bg-background-surface-1 border-border w-full rounded-2xl border-2 md:w-80">
          <div className="flex max-h-[500px] flex-col">
            {/* Header - Fixed */}
            <div className="border-border flex-shrink-0 border-b p-4">
              <h3 className="text-text-primary text-sm font-medium">
                Variables
              </h3>
              {!activeTextarea && (
                <p className="text-text-secondary mt-2 text-xs">
                  Click in a text field to insert variables
                </p>
              )}
            </div>

            {/* Scrollable Content */}
            {activeTextarea && (
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col">
                  {Object.entries(groupedVariables).map(
                    ([group, variables]) => (
                      <div key={group} className="flex flex-col">
                        {/* Group Header */}
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group)}
                          className="border-border hover:bg-background-surface-3 flex items-center justify-between border-b px-4 py-3 transition-colors"
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <div className="text-text-primary text-xs font-medium">
                              {VariableGroupLabel[
                                group as keyof typeof VariableGroupLabel
                              ]?.displayName || group}
                            </div>
                            <div className="text-text-secondary text-xs">
                              {
                                VariableGroupLabel[
                                  group as keyof typeof VariableGroupLabel
                                ]?.description
                              }
                            </div>
                          </div>
                          {collapsedGroups.has(group) ? (
                            <ChevronDown className="text-text-secondary h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronUp className="text-text-secondary h-4 w-4 flex-shrink-0" />
                          )}
                        </button>

                        {/* Group Variables */}
                        {!collapsedGroups.has(group) && (
                          <div className="flex flex-col gap-2 p-4">
                            {variables.map((variable: Variable) => (
                              <button
                                key={variable.variable}
                                type="button"
                                onClick={() =>
                                  insertVariable(`{{${variable.variable}}}`)
                                }
                                className="bg-background-surface-2 hover:bg-background-surface-3 border-border flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors"
                              >
                                <div className="text-text-primary text-xs font-medium">
                                  {`{{${variable.variable}}}`}
                                </div>
                                <div className="text-text-secondary text-xs">
                                  {variable.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
