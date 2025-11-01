import { useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
import { Variable } from "@/shared/prompt/domain/variable";
import { VariablesPanel } from "@/shared/ui/panels";

export interface LorebookEntry {
  id: string;
  name: string;
  tags: string[];
  recallRange: number;
  description: string;
}

interface PlotLorebookStepProps {
  entries: LorebookEntry[];
  onEntriesChange: (entries: LorebookEntry[]) => void;
}

// Constants
const DEFAULT_RECALL_RANGE = 10;
const MIN_RECALL_RANGE = 0;
const MAX_RECALL_RANGE = 100;
const DEFAULT_ENTRY_NAME_PREFIX = "Entry";
const DESCRIPTION_ROWS = 8;

/**
 * Plot Lorebook Step Component
 * Step 3 of the Create Plot Card wizard
 *
 * Fields (all optional):
 * - Entries:
 *   - Entry Name: Name for the entry
 *   - Tags: Keywords that trigger this entry
 *   - Recall Range: Number of messages to scan
 *   - Description: Lore content (supports variable insertion)
 */
export function PlotLorebookStep({
  entries,
  onEntriesChange,
}: PlotLorebookStepProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  // Filter out message-related variables
  const filterVariables = useCallback(
    (variable: Variable) =>
      !variable.variable.includes("message") &&
      !variable.variable.includes("history") &&
      !variable.dataType.toLowerCase().includes("message"),
    [],
  );

  const handleAddEntry = () => {
    const newEntry: LorebookEntry = {
      id: crypto.randomUUID(),
      name: `${DEFAULT_ENTRY_NAME_PREFIX} ${entries.length + 1}`,
      tags: [],
      recallRange: DEFAULT_RECALL_RANGE,
      description: "",
    };
    onEntriesChange([...entries, newEntry]);
    setSelectedEntryId(newEntry.id);
  };

  const handleDeleteEntry = (id: string) => {
    const filtered = entries.filter((e) => e.id !== id);
    onEntriesChange(filtered);
    if (selectedEntryId === id) {
      setSelectedEntryId(filtered[0]?.id || null);
    }
  };

  const handleUpdateEntry = useCallback(
    (id: string, updates: Partial<LorebookEntry>) => {
      onEntriesChange(
        entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [entries, onEntriesChange],
  );

  // Insert variable at cursor position in description
  const insertVariable = useCallback(
    (variableText: string) => {
      if (!selectedEntry) return;

      const textarea = descriptionRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentDescription = selectedEntry.description;
      const newValue =
        currentDescription.substring(0, start) +
        variableText +
        currentDescription.substring(end);

      handleUpdateEntry(selectedEntry.id, { description: newValue });

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [selectedEntry, handleUpdateEntry],
  );

  const handleAddTag = () => {
    if (!selectedEntry || !newTag.trim()) return;

    const trimmedTag = newTag.trim();
    if (selectedEntry.tags.includes(trimmedTag)) {
      setNewTag("");
      return;
    }

    handleUpdateEntry(selectedEntry.id, {
      tags: [...selectedEntry.tags, trimmedTag],
    });
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedEntry) return;
    handleUpdateEntry(selectedEntry.id, {
      tags: selectedEntry.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Plot Lorebook
        </h2>
        <p className="text-text-secondary text-sm">
          Add additional lore and world-building details for your plot
          (optional).
        </p>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left + Center: Entries List and Editor */}
        <div className="bg-background-surface-1 border-border flex-1 rounded-2xl border-2 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* Left: Entries List */}
            <div className="flex flex-col gap-2 md:w-64">
              <div className="flex items-center justify-between">
                <span className="text-text-primary text-sm font-medium">
                  Entries
                </span>
                <Button
                  onClick={handleAddEntry}
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>

              <div className="bg-background-surface-2 border-border flex flex-col gap-1 rounded-lg border p-2">
                {entries.length === 0 ? (
                  <div className="text-text-placeholder py-8 text-center text-xs">
                    No entries yet
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm transition-colors",
                        selectedEntryId === entry.id
                          ? "bg-background-surface-4 text-text-primary"
                          : "text-text-secondary hover:bg-background-surface-3",
                      )}
                      onClick={() => setSelectedEntryId(entry.id)}
                    >
                      <span className="truncate">{entry.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
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

            {/* Center: Entry Editor */}
            <div className="flex flex-1 flex-col gap-4">
              {selectedEntry ? (
                <>
                  {/* Entry Name */}
                  <Input
                    label="Entry Name"
                    type="text"
                    value={selectedEntry.name}
                    onChange={(e) =>
                      handleUpdateEntry(selectedEntry.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Entry name..."
                  />

                  {/* Tags */}
                  <div className="flex flex-col gap-2">
                    <label className="text-text-primary text-sm font-medium">
                      Tags
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddTag}
                        size="md"
                        variant="secondary"
                        className="h-10"
                      >
                        Add
                      </Button>
                    </div>
                    {selectedEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.tags.map((tag) => (
                          <div
                            key={tag}
                            className="bg-background-surface-3 text-text-primary flex items-center gap-1 rounded px-2 py-1 text-xs"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-status-destructive-light transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recall Range */}
                  <Input
                    label="Recall Range"
                    type="number"
                    value={selectedEntry.recallRange}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const clampedValue = Math.max(
                        MIN_RECALL_RANGE,
                        Math.min(MAX_RECALL_RANGE, value),
                      );
                      handleUpdateEntry(selectedEntry.id, {
                        recallRange: clampedValue,
                      });
                    }}
                    placeholder="Messages to scan"
                    min={MIN_RECALL_RANGE}
                    max={MAX_RECALL_RANGE}
                    helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
                    helperText={`Min ${MIN_RECALL_RANGE} / Max ${MAX_RECALL_RANGE}`}
                  />

                  {/* Description */}
                  <Textarea
                    ref={descriptionRef}
                    label="Description"
                    value={selectedEntry.description}
                    onChange={(e) =>
                      handleUpdateEntry(selectedEntry.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter lore content..."
                    rows={DESCRIPTION_ROWS}
                  />
                </>
              ) : (
                <div className="text-text-placeholder border-border flex flex-1 items-center justify-center rounded-lg border py-12 text-sm">
                  Select an entry to edit or add a new one
                </div>
              )}
            </div>
          </div>

          <p className="text-text-secondary mt-4 text-xs">
            All fields are optional. Lorebook entries are triggered when tags
            match in conversations.
          </p>
        </div>

        {/* Right: Variables Panel */}
        <VariablesPanel
          onVariableClick={insertVariable}
          filterVariables={filterVariables}
          isActive={!!selectedEntry}
          inactiveMessage="Select an entry to insert variables"
        />
      </div>
    </div>
  );
}
