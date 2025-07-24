import { useCallback, useState, useEffect, useMemo } from "react";
import { Target, Check } from "lucide-react";
import { toast } from "sonner";

import { Variable, VariableLibrary } from "@/shared/prompt/domain/variable";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { SearchInput } from "@/components-v2/search-input";

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

  // Filter variables based on search query
  const filteredVariables = useMemo(() => {
    if (!searchQuery) return availableVariables;

    const query = searchQuery.toLowerCase();
    return availableVariables.filter(
      (variable) =>
        variable.variable.toLowerCase().includes(query) ||
        variable.description.toLowerCase().includes(query) ||
        (variable.template && variable.template.toLowerCase().includes(query)),
    );
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
        toast.success(`Inserted: ${variableTemplate}`, {
          duration: 2000,
        });
      } else {
        // Show warning if no Monaco editor has been focused
        toast.warning("Please click in an editor field first", {
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

  return (
    <div
      className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4 overflow-hidden"
      onClick={handlePanelInteraction}
    >
      <SearchInput
        placeholder="Search variables"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full flex-shrink-0"
      />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 pr-2">
          {filteredVariables.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-text-subtle text-xs">
                {searchQuery
                  ? "No variables found matching your search"
                  : "No variables available"}
              </div>
            </div>
          ) : (
            filteredVariables.map((variable) => (
              <button
                key={variable.variable}
                className={`w-full p-2 rounded-lg outline outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start gap-1 transition-all duration-200 text-left relative ${
                  clickedVariable === variable.variable
                    ? "bg-background-surface-3"
                    : hasEditor
                      ? "bg-background-surface-3 hover:bg-background-surface-4 cursor-pointer"
                      : "bg-background-surface-3 opacity-50 cursor-not-allowed"
                }`}
                onClick={(e) => handleVariableClick(variable, e)}
                onMouseDown={handleMouseDown}
                disabled={!hasEditor}
                tabIndex={-1}
              >
                {clickedVariable === variable.variable && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500" />
                )}
                <div className="w-full flex flex-col justify-start items-start gap-1">
                  <div className="flex justify-start items-center gap-2 w-full">
                    <div className="text-text-primary text-xs font-normal">
                      {`{{${variable.variable}}}`}
                    </div>
                    <div className="text-text-body text-xs font-normal">
                      {variable.dataType}
                    </div>
                    {hasEditor &&
                      (clickedVariable === variable.variable ? (
                        <Check className="h-3 w-3 ml-auto text-green-500 transition-opacity" />
                      ) : (
                        <Target className="h-3 w-3 ml-auto text-primary opacity-0 hover:opacity-100 transition-opacity" />
                      ))}
                  </div>
                  <div className="text-text-subtle text-xs font-medium leading-none text-left">
                    {variable.description}
                  </div>
                  {variable.template && (
                    <div className="self-stretch justify-start">
                      <span className="text-text-body text-[10px] font-medium leading-none">
                        {" "}
                      </span>
                      <span className="text-text-primary text-[10px] font-medium leading-none whitespace-pre-wrap">
                        {variable.template}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}