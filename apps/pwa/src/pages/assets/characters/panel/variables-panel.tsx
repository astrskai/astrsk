import { useCallback, useState, useEffect, useMemo } from "react";
import { Target, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toastSuccess, toastWarning } from "@/shared/ui/toast";

import {
  Variable,
  VariableLibrary,
  VariableGroupLabel,
} from "@/shared/prompt/domain/variable";
import { ScrollArea, SearchInput } from "@/shared/ui";

interface VariablesPanelProps {
  cardId: string; // Required by the panel system but not used
}

interface MonacoEditorState {
  editor: any;
  position: any;
}

// Store for tracking last Monaco editor cursor position
let lastMonacoEditor: MonacoEditorState | null = null;
const editorChangeListeners: Set<() => void> = new Set();

// Function to register Monaco editor instances
export function registerCardMonacoEditor(editor: any, position: any) {
  lastMonacoEditor = { editor, position };
  // Notify all listeners that editor state changed
  editorChangeListeners.forEach((listener) => listener());
}

export function VariablesPanel({ cardId }: VariablesPanelProps) {
  // cardId is passed by the panel system but not used in this component
  const [searchQuery, setSearchQuery] = useState("");
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [clickedVariable, setClickedVariable] = useState<string | null>(null);
  const [hasEditor, setHasEditor] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Load variables from library
  useEffect(() => {
    const libraryVariables = VariableLibrary.variableList;
    // Filter out message-related variables, keep only core template variables
    const filteredLibraryVariables = libraryVariables.filter(
      (variable: Variable) =>
        !variable.variable.includes("message") &&
        !variable.variable.includes("history") &&
        !variable.dataType.toLowerCase().includes("message"),
    );
    setAvailableVariables(filteredLibraryVariables);
  }, []);

  // Listen for editor registration changes
  useEffect(() => {
    const checkEditor = () => {
      setHasEditor(!!lastMonacoEditor?.editor);
    };

    // Check initial state
    checkEditor();

    // Add listener
    editorChangeListeners.add(checkEditor);

    // Cleanup
    return () => {
      editorChangeListeners.delete(checkEditor);
    };
  }, []);

  // Group variables by their group property
  const groupedVariables = useMemo(() => {
    const groups = availableVariables.reduce(
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

    // Filter by search query if exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      Object.keys(groups).forEach((groupKey) => {
        groups[groupKey] = groups[groupKey].filter(
          (variable) =>
            variable.variable.toLowerCase().includes(query) ||
            variable.description.toLowerCase().includes(query) ||
            (variable.template &&
              variable.template.toLowerCase().includes(query)),
        );
        // Remove empty groups after filtering
        if (groups[groupKey].length === 0) {
          delete groups[groupKey];
        }
      });
    }

    return groups;
  }, [availableVariables, searchQuery]);

  // Insert variable at last cursor position
  const insertVariableAtLastCursor = useCallback((variableValue: string) => {
    if (
      lastMonacoEditor &&
      lastMonacoEditor.editor &&
      lastMonacoEditor.position
    ) {
      try {
        const { editor, position } = lastMonacoEditor;

        // Execute the edit
        editor.executeEdits("variable-insert", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: variableValue,
          },
        ]);

        // Update cursor position
        const newPosition = {
          lineNumber: position.lineNumber,
          column: position.column + variableValue.length,
        };
        editor.setPosition(newPosition);
        editor.focus();

        // Update stored position
        lastMonacoEditor.position = newPosition;
      } catch (error) {
        console.error("Failed to insert variable:", error);
      }
    }
  }, []);

  // Handle variable click for insertion
  const handleVariableClick = useCallback(
    (variable: Variable, event: React.MouseEvent) => {
      // Stop event from bubbling
      event.stopPropagation();
      event.preventDefault();

      // Use template if it exists, otherwise use the variable format
      const variableTemplate = `{{${variable.variable}}}`;

      // Show visual feedback
      setClickedVariable(variable.variable);

      // Try to insert at last Monaco cursor position
      if (
        lastMonacoEditor &&
        lastMonacoEditor.editor &&
        lastMonacoEditor.position
      ) {
        insertVariableAtLastCursor(variableTemplate);

        // Show toast notification
        toastSuccess(`Inserted: ${variableTemplate}`, {
          duration: 2000,
        });
      } else {
        // Show warning if no Monaco editor has been focused
        toastWarning("Please click in an editor field first", {
          duration: 2000,
        });
      }

      // Clear visual feedback after a short delay
      setTimeout(() => {
        setClickedVariable(null);
      }, 1000);
    },
    [insertVariableAtLastCursor],
  );

  // Prevent focus steal on mouse down
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Prevent panel activation on any interaction
  const handlePanelInteraction = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  // Handle group collapse/expand
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

  return (
    <div
      className="bg-background-surface-2 flex h-full w-full flex-col gap-4 overflow-hidden p-4"
      onClick={handlePanelInteraction}
    >
      <SearchInput
        placeholder="Search variables"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full flex-shrink-0"
      />

      <ScrollArea className="flex-1">
        <div className="flex flex-col pr-2">
          {Object.keys(groupedVariables).length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-text-subtle text-xs">
                {searchQuery
                  ? "No variables found matching your search"
                  : "No variables available"}
              </div>
            </div>
          ) : (
            Object.entries(groupedVariables).map(([group, variables]) => (
              <div key={group} className="flex flex-col">
                {/* Group Header */}
                <div className="bg-[#272727] py-2.5">
                  <div className="flex w-full flex-row items-center justify-start gap-4">
                    <div className="flex grow basis-0 flex-row items-start justify-start gap-2 text-left text-xs">
                      <div className="font-medium text-nowrap text-[#bfbfbf]">
                        {VariableGroupLabel[
                          group as keyof typeof VariableGroupLabel
                        ]?.displayName || group}
                      </div>
                      <div className="min-h-px min-w-px grow basis-0 font-normal text-[#696969]">
                        {VariableGroupLabel[
                          group as keyof typeof VariableGroupLabel
                        ]?.description || "Variables in this group"}
                      </div>
                    </div>
                    <button
                      className="flex items-center justify-center"
                      onClick={() => toggleGroupCollapse(group)}
                    >
                      {collapsedGroups.has(group) ? (
                        <ChevronDown className="min-h-6 min-w-6 text-[#bfbfbf]" />
                      ) : (
                        <ChevronUp className="min-h-6 min-w-6 text-[#bfbfbf]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Group Variables */}
                {!collapsedGroups.has(group) && (
                  <div className="bg-[#272727] pb-0">
                    <div className="flex flex-col gap-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.variable}
                          className={`relative flex w-full flex-col items-start justify-start gap-1 rounded-lg border border-[#525252] bg-[#313131] p-2 text-left transition-all duration-200 ${
                            clickedVariable === variable.variable
                              ? "bg-[#313131]"
                              : hasEditor
                                ? "cursor-pointer bg-[#313131] hover:bg-[#414141]"
                                : "cursor-not-allowed bg-[#313131] opacity-50"
                          }`}
                          onClick={(e) => handleVariableClick(variable, e)}
                          onMouseDown={handleMouseDown}
                          disabled={!hasEditor}
                          tabIndex={-1}
                        >
                          {clickedVariable === variable.variable && (
                            <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-green-500" />
                          )}
                          <div className="flex w-full flex-col items-start justify-start gap-1">
                            <div className="flex w-full items-center justify-start gap-2 text-xs text-nowrap">
                              <div className="font-medium text-[#f1f1f1]">
                                {`{{${variable.variable}}}`}
                              </div>
                              <div className="font-normal text-[#bfbfbf]">
                                {variable.dataType}
                              </div>
                              {hasEditor &&
                                (clickedVariable === variable.variable ? (
                                  <Check className="ml-auto min-h-3 min-w-3 text-green-500 transition-opacity" />
                                ) : (
                                  <Target className="text-primary ml-auto min-h-3 min-w-3 opacity-0 transition-opacity hover:opacity-100" />
                                ))}
                            </div>
                            <div className="text-left text-xs leading-normal font-normal text-[#9d9d9d]">
                              {variable.description}
                            </div>
                            {variable.template && (
                              <div className="text-[10px] leading-4 font-medium whitespace-pre-wrap text-[#bfbfbf]">
                                <span className="text-[#f1f1f1]">
                                  {variable.template}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
