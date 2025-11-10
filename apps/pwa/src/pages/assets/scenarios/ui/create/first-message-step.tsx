import { useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/shared/ui/panels";

export interface FirstMessage {
  id: string;
  name: string;
  description: string;
}

interface ScenarioFirstMessagesStepProps {
  firstMessages: FirstMessage[];
  onFirstMessagesChange: (firstMessages: FirstMessage[]) => void;
}

// Constants
const DEFAULT_MESSAGE_NAME_PREFIX = "Message";
const DESCRIPTION_ROWS = 12;

/**
 * Scenario First Messages Step Component
 * Step 4 of the Create Scenario Card wizard
 *
 * Fields (all optional):
 * - Messages:
 *   - Message Name: Name for the message
 *   - Description: Initial message content (supports variable insertion)
 */
export function ScenarioFirstMessagesStep({
  firstMessages,
  onFirstMessagesChange,
}: ScenarioFirstMessagesStepProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const selectedMessage = firstMessages.find((s) => s.id === selectedMessageId);

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  const handleUpdateFirstMessage = useCallback(
    (id: string, updates: Partial<FirstMessage>) => {
      onFirstMessagesChange(
        firstMessages.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [firstMessages, onFirstMessagesChange],
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

      handleUpdateFirstMessage(selectedMessage.id, { description: newValue });

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [selectedMessage, handleUpdateFirstMessage],
  );

  const handleAddFirstMessage = () => {
    const newFirstMessage: FirstMessage = {
      id: crypto.randomUUID(),
      name: `${DEFAULT_MESSAGE_NAME_PREFIX} ${firstMessages.length + 1}`,
      description: "",
    };
    onFirstMessagesChange([...firstMessages, newFirstMessage]);
    setSelectedMessageId(newFirstMessage.id);
  };

  const handleDeleteFirstMessage = (id: string) => {
    const filtered = firstMessages.filter(
      (firstMessage) => firstMessage.id !== id,
    );
    onFirstMessagesChange(filtered);
    if (selectedMessageId === id) {
      setSelectedMessageId(filtered[0]?.id || "");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-base font-semibold md:text-[1.2rem]">
          Add First Messages
        </h2>
        <p className="text-text-secondary text-xs md:text-sm">
          Create the opening message that set the scene (optional).
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Scenarios List and Editor */}
        <div className="flex-1 rounded-lg bg-gray-900 p-2 md:p-4">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* Scenarios List */}
            <div className="flex flex-col gap-2 md:w-64">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm font-medium">
                  First message
                </span>
                <Button
                  onClick={handleAddFirstMessage}
                  size="sm"
                  variant="secondary"
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>

              <div className="border-dark-surface flex flex-col gap-1 rounded-lg border bg-gray-800 p-2">
                {firstMessages.length === 0 ? (
                  <div className="text-text-secondary py-8 text-center text-xs">
                    No first messages yet
                  </div>
                ) : (
                  firstMessages.map((firstMessage) => (
                    <div
                      key={firstMessage.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm transition-colors",
                        selectedMessageId === firstMessage.id
                          ? "text-text-primary bg-gray-700"
                          : "text-text-secondary hover:bg-gray-750",
                      )}
                      onClick={() => setSelectedMessageId(firstMessage.id)}
                    >
                      <span className="truncate">{firstMessage.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFirstMessage(firstMessage.id);
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

            {/* First Message Editor */}
            <div className="flex flex-1 flex-col gap-4">
              {selectedMessage ? (
                <>
                  {/* First Message Name */}
                  <Input
                    label="First Message Name"
                    type="text"
                    value={selectedMessage.name}
                    onChange={(e) =>
                      handleUpdateFirstMessage(selectedMessage.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter message name"
                  />

                  {/* First Message Description */}
                  <Textarea
                    ref={descriptionRef}
                    label="Description"
                    value={selectedMessage.description}
                    onChange={(e) =>
                      handleUpdateFirstMessage(selectedMessage.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter the first message, story setup, or opening message..."
                    rows={DESCRIPTION_ROWS}
                  />
                </>
              ) : (
                <div className="text-text-secondary border-dark-surface flex flex-1 items-center justify-center rounded-lg border py-12 text-sm">
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

        {/* Right: Variables Panel - Sticky on desktop */}
        <div className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <VariablesPanel
            onVariableClick={insertVariable}
            filterVariables={filterVariables}
            isActive={!!selectedMessage}
            inactiveMessage="Select a first message to insert variables"
          />
        </div>
      </div>
    </div>
  );
}
