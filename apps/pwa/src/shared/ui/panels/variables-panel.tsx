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
    <div className="bg-background-surface-1 border-border w-full rounded-2xl border-2 md:w-80">
      <div className="flex max-h-[500px] flex-col">
        {/* Header - Fixed */}
        <div className="border-border flex-shrink-0 border-b p-4">
          <h3 className="text-text-primary mb-3 text-sm font-medium">
            Variables
          </h3>
          {isActive && (
            <SearchInput
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />
          )}
          {inactiveMessage && !isActive && (
            <p className="text-text-secondary mt-2 text-xs">
              {inactiveMessage}
            </p>
          )}
          {isActive && (
            <p className="text-text-secondary text-xs">
              Click a variable to insert it at the cursor position
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
                            onVariableClick(`{{${variable.variable}}}`)
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
