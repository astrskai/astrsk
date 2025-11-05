import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Variable,
  VariableLibrary,
  VariableGroupLabel,
} from "@/shared/prompt/domain/variable";
import { SearchInput } from "@/shared/ui/forms";

export interface VariablesPanelProps {
  /**
   * Callback when a variable is clicked
   * @param variableText - The variable text to insert (e.g., "{{plot.name}}")
   */
  onVariableClick: (variableText: string) => void;

  /**
   * Optional filter function to exclude certain variables
   * @param variable - Variable to test
   * @returns true to include, false to exclude
   * @default undefined (show all variables)
   *
   * @example
   * // Exclude message-related variables
   * filterVariables={(v) =>
   *   !v.variable.includes("message") &&
   *   !v.variable.includes("history")
   * }
   */
  filterVariables?: (variable: Variable) => boolean;

  /**
   * Optional message to show when panel is inactive
   * If provided, panel content is hidden and this message is shown instead
   * @default undefined (always show panel content)
   */
  inactiveMessage?: string;

  /**
   * Whether the panel is currently active
   * If false and inactiveMessage is provided, shows the message instead of variables
   * @default true
   */
  isActive?: boolean;
}

/**
 * Variables Panel Component
 *
 * Displays a collapsible panel of variable groups that can be inserted into text fields.
 * Used in wizard steps (create-plot, create-character) for inserting template variables.
 *
 * @example
 * ```tsx
 * <VariablesPanel
 *   onVariableClick={insertVariable}
 *   filterVariables={(v) => !v.variable.includes("message")}
 * />
 * ```
 *
 * @example With inactive state
 * ```tsx
 * <VariablesPanel
 *   onVariableClick={insertVariable}
 *   isActive={!!activeTextarea}
 *   inactiveMessage="Click in a text field to insert variables"
 * />
 * ```
 */
export function VariablesPanel({
  onVariableClick,
  filterVariables,
  inactiveMessage,
  isActive = true,
}: VariablesPanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Group variables by their group property
  const groupedVariables = useMemo(() => {
    const libraryVariables = VariableLibrary.variableList;

    // Apply filter if provided
    let filteredVariables = filterVariables
      ? libraryVariables.filter(filterVariables)
      : libraryVariables;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredVariables = filteredVariables.filter(
        (variable) =>
          variable.variable.toLowerCase().includes(query) ||
          variable.description.toLowerCase().includes(query),
      );
    }

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
  }, [filterVariables, searchQuery]);

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

  return (
    <div className="border-border w-full rounded-lg border-2 bg-gray-900 md:w-95">
      <div className="flex max-h-[750px] flex-col">
        {/* Header - Fixed */}
        <div className="border-border flex-shrink-0 space-y-2 border-b p-4">
          <h3 className="text-text-secondary text-base font-medium">
            Variables
          </h3>
          {isActive && (
            <p className="text-text-secondary text-xs">
              Click a variable to insert it at the cursor position
            </p>
          )}
          {isActive && (
            <SearchInput
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
          {inactiveMessage && !isActive && (
            <p className="text-text-secondary mt-2 text-xs">
              {inactiveMessage}
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        {isActive && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col">
              {Object.entries(groupedVariables).map(([group, variables]) => (
                <div key={group} className="flex flex-col">
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group)}
                    className="border-border flex items-start justify-between border-b px-4 py-3 transition-colors hover:bg-gray-800"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="text-xs font-medium text-gray-200">
                        {VariableGroupLabel[
                          group as keyof typeof VariableGroupLabel
                        ]?.displayName || group}
                      </div>
                      <div className="text-text-secondary text-left text-xs">
                        {
                          VariableGroupLabel[
                            group as keyof typeof VariableGroupLabel
                          ]?.description
                        }
                      </div>
                    </div>
                    {collapsedGroups.has(group) ? (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-200" />
                    ) : (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-200" />
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
                            onVariableClick(`{{${variable.variable}}}`)
                          }
                          className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-left transition-colors hover:bg-gray-800"
                        >
                          <div className="space-x-1 text-xs font-medium text-gray-50">
                            <span className="text-gray-50">{`{{${variable.variable}}}`}</span>
                            <span className="text-gray-200">
                              {variable.dataType}
                            </span>
                          </div>
                          <div className="text-xs break-words text-gray-300">
                            {variable.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
