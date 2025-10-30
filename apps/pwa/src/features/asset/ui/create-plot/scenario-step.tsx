import { useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/features/asset/ui/panels";

export interface Scenario {
  id: string;
  name: string;
  description: string;
}

interface PlotScenarioStepProps {
  scenarios: Scenario[];
  onScenariosChange: (scenarios: Scenario[]) => void;
}

// Constants
const DEFAULT_MESSAGE_NAME_PREFIX = "Message";
const DESCRIPTION_ROWS = 12;

/**
 * Plot Message Step Component
 * Step 4 of the Create Plot Card wizard
 *
 * Fields (all optional):
 * - Messages:
 *   - Message Name: Name for the message
 *   - Description: Initial message content (supports variable insertion)
 */
export function PlotScenarioStep({
  scenarios,
  onScenariosChange,
}: PlotScenarioStepProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const selectedMessage = scenarios.find((s) => s.id === selectedMessageId);

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  const handleUpdateScenario = useCallback(
    (id: string, updates: Partial<Scenario>) => {
      onScenariosChange(
        scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [scenarios, onScenariosChange],
  );

  // Insert variable at cursor position in description
  const insertVariable = useCallback(
    (variableText: string) => {
      if (!selectedMessage) return;

      const textarea = descriptionRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentDescription = selectedMessage.description;
      const newValue =
        currentDescription.substring(0, start) +
        variableText +
        currentDescription.substring(end);

      handleUpdateScenario(selectedMessage.id, { description: newValue });

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [selectedMessage, handleUpdateScenario],
  );

  const handleAddScenario = () => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name: `${DEFAULT_MESSAGE_NAME_PREFIX} ${scenarios.length + 1}`,
      description: "",
    };
    onScenariosChange([...scenarios, newScenario]);
    setSelectedMessageId(newScenario.id);
  };

  const handleDeleteScenario = (id: string) => {
    const filtered = scenarios.filter((s) => s.id !== id);
    onScenariosChange(filtered);
    if (selectedMessageId === id) {
      setSelectedMessageId(filtered[0]?.id || null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Plot Scenario
        </h2>
        <p className="text-text-secondary text-sm">
          Define first messages and story setups for your plot (optional).
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Scenarios List and Editor */}
        <div className="bg-background-surface-1 border-border flex-1 rounded-2xl border-2 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* Scenarios List */}
            <div className="flex flex-col gap-2 md:w-64">
              <div className="flex items-center justify-between">
                <span className="text-text-primary text-sm font-medium">
                  First message
                </span>
                <Button
                  onClick={handleAddScenario}
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>

              <div className="bg-background-surface-2 border-border flex flex-col gap-1 rounded-lg border p-2">
                {scenarios.length === 0 ? (
                  <div className="text-text-placeholder py-8 text-center text-xs">
                    No first messages yet
                  </div>
                ) : (
                  scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm transition-colors",
                        selectedMessageId === scenario.id
                          ? "bg-background-surface-4 text-text-primary"
                          : "text-text-secondary hover:bg-background-surface-3",
                      )}
                      onClick={() => setSelectedMessageId(scenario.id)}
                    >
                      <span className="truncate">{scenario.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScenario(scenario.id);
                        }}
                        className="hover:text-status-destructive-light shrink-0 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Scenario Editor */}
            <div className="flex flex-1 flex-col gap-4">
              {selectedMessage ? (
                <>
                  {/* Scenario Name */}
                  <Input
                    label="First Message Name"
                    type="text"
                    value={selectedMessage.name}
                    onChange={(e) =>
                      handleUpdateScenario(selectedMessage.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter message name"
                  />

                  {/* Description */}
                  <Textarea
                    ref={descriptionRef}
                    label="Description"
                    value={selectedMessage.description}
                    onChange={(e) =>
                      handleUpdateScenario(selectedMessage.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter the first message, story setup, or opening message..."
                    rows={DESCRIPTION_ROWS}
                  />
                </>
              ) : (
                <div className="text-text-placeholder border-border flex flex-1 items-center justify-center rounded-lg border py-12 text-sm">
                  Select a message to edit or add a new one
                </div>
              )}
            </div>
          </div>

          <p className="text-text-secondary mt-4 text-xs">
            All fields are optional. You can define multiple messages for
            different story paths.
          </p>
        </div>

        {/* Right: Variables Panel */}
        <VariablesPanel
          onVariableClick={insertVariable}
          filterVariables={filterVariables}
          isActive={!!selectedMessage}
          inactiveMessage="Select a scenario to insert variables"
        />
      </div>
    </div>
  );
}
