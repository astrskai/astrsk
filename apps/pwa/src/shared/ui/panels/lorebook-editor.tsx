import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { X, Plus } from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";

export interface LorebookEntry {
  id: string;
  name: string;
  tags: string[];
  recallRange: number;
  description: string;
}

export interface LorebookEditorProps {
  entries: LorebookEntry[];
  onEntriesChange: (entries: LorebookEntry[]) => void;
  onSelectedEntryChange?: (entry: LorebookEntry | null) => void;
}

export interface LorebookEditorRef {
  /**
   * Insert text at cursor position in the currently selected entry's description field
   * @param text - Text to insert
   * @returns true if insertion was successful, false if no entry is selected
   */
  insertTextAtCursor: (text: string) => boolean;
  /**
   * Get the currently selected entry
   * @returns Selected entry or null if none selected
   */
  getSelectedEntry: () => LorebookEntry | null;
}

// Constants
const DEFAULT_RECALL_RANGE = 10;
const MIN_RECALL_RANGE = 0;
const MAX_RECALL_RANGE = 100;
const DEFAULT_ENTRY_NAME_PREFIX = "Entry";
const DESCRIPTION_ROWS = 8;

/**
 * Lorebook Editor Component
 *
 * Reusable lorebook management UI with entries list and editor.
 * Variables panel should be composed separately by the parent.
 * Use ref to insert variables at cursor position.
 *
 * @example
 * ```tsx
 * const editorRef = useRef<LorebookEditorRef>(null);
 *
 * const insertVariable = (variableText: string) => {
 *   editorRef.current?.insertTextAtCursor(variableText);
 * };
 *
 * return (
 *   <div className="flex flex-col gap-6 lg:flex-row">
 *     <LorebookEditor
 *       ref={editorRef}
 *       entries={entries}
 *       onEntriesChange={setEntries}
 *     />
 *     <VariablesPanel onVariableClick={insertVariable} />
 *   </div>
 * );
 * ```
 */
export const LorebookEditor = forwardRef<
  LorebookEditorRef,
  LorebookEditorProps
>(function LorebookEditor(
  { entries, onEntriesChange, onSelectedEntryChange },
  ref,
) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState<string>("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  // Notify parent when selected entry changes
  useEffect(() => {
    onSelectedEntryChange?.(selectedEntry || null);
  }, [selectedEntry, onSelectedEntryChange]);

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

  // Expose ref methods for parent component
  useImperativeHandle(
    ref,
    () => ({
      insertTextAtCursor: (text: string) => {
        if (!selectedEntry) return false;

        const textarea = descriptionRef.current;
        if (!textarea) return false;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentDescription = selectedEntry.description;
        const newValue =
          currentDescription.substring(0, start) +
          text +
          currentDescription.substring(end);

        handleUpdateEntry(selectedEntry.id, { description: newValue });

        // Set cursor position after the inserted text
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + text.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);

        return true;
      },
      getSelectedEntry: () => selectedEntry || null,
    }),
    [selectedEntry, handleUpdateEntry],
  );

  return (
    <div className="flex-1 rounded-lg bg-gray-900 p-2 md:p-4">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Left: Entries List */}
        <div className="flex flex-col gap-2 md:w-64">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm font-medium">
              Lorebook Entries
            </span>
            <Button
              onClick={handleAddEntry}
              size="sm"
              variant="secondary"
              icon={<Plus size={16} />}
            >
              Add
            </Button>
          </div>

          <div className="bg-dark-surface flex flex-col gap-1 rounded-lg p-2">
            {entries.length === 0 ? (
              <div className="text-text-secondary py-8 text-center text-sm">
                No entries yet
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm transition-colors",
                    selectedEntryId === entry.id
                      ? "text-text-primary bg-gray-800"
                      : "text-text-secondary hover:bg-gray-800/80",
                  )}
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <span className="truncate">{entry.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(entry.id);
                    }}
                    aria-label={`Delete ${entry.name}`}
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
                label="Lorebook Name"
                type="text"
                value={selectedEntry.name}
                onChange={(e) =>
                  handleUpdateEntry(selectedEntry.id, {
                    name: e.target.value,
                  })
                }
                placeholder="e.g. The World of Elariah"
              />

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">
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
                  <Button onClick={handleAddTag} size="md" variant="secondary">
                    Add
                  </Button>
                </div>
                {selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs text-gray-200"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove tag ${tag}`}
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
            <div className="text-text-secondary border-border flex flex-1 items-center justify-center rounded-lg border py-12 text-sm">
              Select an entry to edit or add a new one
            </div>
          )}
        </div>
      </div>

      <p className="text-text-secondary mt-4 text-xs">
        All fields are optional. Lorebook entries are triggered when tags match
        in conversations.
      </p>
    </div>
  );
});
