import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

import { Trash2, Plus, HelpCircle, X } from "lucide-react";
import {
  Button,
  Editor,
  Input,
  ScrollAreaSimple,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";

import { CharacterCard, PlotCard } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";

// Import queries and mutations
import { cardQueries, useUpdateCardLorebook } from "@/app/queries/card";

// Import the sortable component
import { SortableItem } from "@/features/card/panels/card-panel/components/sortable-item";

// Import our abstraction
import {
  CardPanelProps,
  CardPanelLoading,
  CardPanelError,
  CardPanelEmpty,
} from "@/features/card/panels/hooks/use-card-panel";

interface LorebookPanelProps extends CardPanelProps {}

interface LorebookEntry {
  id: string;
  name: string;
  content: string;
  keys: string[];
  enabled: boolean;
  recallRange: number;
}

export function LorebookPanel({ cardId }: LorebookPanelProps) {
  // 1. Mutation for updating lorebook
  const updateLorebook = useUpdateCardLorebook(cardId);

  // 2. Query for card data - disable refetching while editing but allow after mutation completes
  const { data: card, isLoading } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: !!cardId && !updateLorebook.isPending, // Use isPending instead of isEditing
  });

  // 3. UI state (expansion, errors, etc.)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // 4. Local form state (for immediate UI feedback)
  const [entries, setEntries] = useState<LorebookEntry[]>([]);
  const [localContent, setLocalContent] = useState("");

  // 5. Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastInitializedCardId = useRef<string | null>(null);
  const lastAddTimeRef = useRef<number>(0);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 6. Initialize and sync data (cross-tab synchronization)
  useEffect(() => {
    // Initialize when card changes
    if (cardId && cardId !== lastInitializedCardId.current && card) {
      if (
        (card instanceof CharacterCard || card instanceof PlotCard) &&
        card.props.lorebook
      ) {
        const lorebookEntries = card.props.lorebook.entries.map((entry) => ({
          id: entry.id.toString(),
          name: entry.name || "",
          content: entry.content || "",
          keys: entry.keys || [],
          enabled: entry.enabled,
          recallRange: entry.recallRange || 2,
        }));
        setEntries(lorebookEntries);
        if (lorebookEntries.length > 0 && !selectedEntryId) {
          setSelectedEntryId(lorebookEntries[0].id);
        }
      } else {
        // No lorebook, start with empty entries
        setEntries([]);
        setSelectedEntryId(null);
      }
      lastInitializedCardId.current = cardId;
    }
    // Sync when card changes externally (cross-tab sync) - but not during mutation
    else if (card && !updateLorebook.isPending && !updateLorebook.hasCursor) {
      if (
        (card instanceof CharacterCard || card instanceof PlotCard) &&
        card.props.lorebook
      ) {
        const newEntries = card.props.lorebook.entries.map((entry) => ({
          id: entry.id.toString(),
          name: entry.name || "",
          content: entry.content || "",
          keys: entry.keys || [],
          enabled: entry.enabled,
          recallRange: entry.recallRange || 2,
        }));

        // Select result caching handles object stability
        setEntries(newEntries);
        // Keep selected entry if it still exists
        if (
          selectedEntryId &&
          !newEntries.find((e) => e.id === selectedEntryId)
        ) {
          setSelectedEntryId(newEntries[0]?.id || null);
        }
      } else if (entries.length > 0) {
        // Card no longer has lorebook, clear entries
        setEntries([]);
        setSelectedEntryId(null);
      }
    }
  }, [cardId, card, updateLorebook.isPending, updateLorebook.hasCursor]);

  // Focus on name input when selected entry changes
  useEffect(() => {
    if (selectedEntryId && nameInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
    }
  }, [selectedEntryId]);

  // 6. Helper function to convert entries to lorebook and save using mutation
  const saveLorebook = useCallback(
    (newEntries: LorebookEntry[]) => {
      if (!card || !(card instanceof CharacterCard || card instanceof PlotCard))
        return;

      // Check for actual changes inline
      const currentLorebook = card.props.lorebook;

      // If no entries, pass undefined to clear lorebook
      if (newEntries.length === 0) {
        if (currentLorebook) {
          updateLorebook.mutate(undefined);
        }
        return;
      }

      // Convert entries to domain objects
      const entryResults = newEntries.map((entry) =>
        Entry.create({
          id: new UniqueEntityID(entry.id),
          name: entry.name,
          content: entry.content,
          keys: entry.keys,
          enabled: entry.enabled,
          recallRange: entry.recallRange,
        }),
      );

      const invalidEntry = entryResults.find((result) => result.isFailure);
      if (!invalidEntry) {
        const lorebookResult = Lorebook.create({
          entries: entryResults.map((result) => result.getValue()),
        });

        if (lorebookResult.isSuccess) {
          updateLorebook.mutate(lorebookResult.getValue());
        }
      }
    },
    [card, updateLorebook],
  );

  // 7. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () =>
      debounce((newEntries: LorebookEntry[]) => {
        saveLorebook(newEntries);
      }, 300),
    [saveLorebook],
  );

  // Common Monaco editor mount handler with cursor tracking
  const handleEditorMount = useCallback(
    (editor: any) => {
      // Register editor for variable insertion
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);

      // Track focus - mark cursor as active
      editor.onDidFocusEditorWidget(() => {
        const position = editor.getPosition();
        registerCardMonacoEditor(editor, position);
        updateLorebook.setCursorActive(true);
      });

      // Track blur - mark cursor as inactive
      editor.onDidBlurEditorWidget(() => {
        updateLorebook.setCursorActive(false);
      });

      // Track cursor changes
      editor.onDidChangeCursorPosition((e: any) => {
        registerCardMonacoEditor(editor, e.position);
      });

      // Focus the editor when mounted (only for expanded views)
      if (editor.getDomNode()?.closest(".absolute.inset-0")) {
        editor.focus();
      }
    },
    [updateLorebook],
  );

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  // 7. Change handlers that pass current values
  const handleAddEntry = useCallback(() => {
    const newEntry: LorebookEntry = {
      id: new UniqueEntityID().toString(),
      name: `Entry ${entries.length + 1}`,
      content: "",
      keys: [],
      enabled: true,
      recallRange: 2,
    };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setSelectedEntryId(newEntry.id);
    // Save immediately for user-initiated actions like adding entries
    saveLorebook(newEntries);
  }, [entries, saveLorebook]);

  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      const newEntries = entries.filter((e) => e.id !== entryId);
      setEntries(newEntries);
      if (selectedEntryId === entryId) {
        setSelectedEntryId(newEntries.length > 0 ? newEntries[0].id : null);
      }
      // Save immediately for user-initiated actions like deleting entries
      saveLorebook(newEntries);
    },
    [entries, selectedEntryId, saveLorebook],
  );

  const handleUpdateEntry = useCallback(
    (entryId: string, updates: Partial<LorebookEntry>) => {
      const newEntries = entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry,
      );
      setEntries(newEntries);
      debouncedSave(newEntries);
    },
    [entries, debouncedSave],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = entries.findIndex((entry) => entry.id === active.id);
        const newIndex = entries.findIndex((entry) => entry.id === over.id);
        const newEntries = arrayMove(entries, oldIndex, newIndex);
        setEntries(newEntries);
        // Save immediately for user-initiated actions like reordering
        saveLorebook(newEntries);
      }
    },
    [entries, saveLorebook],
  );

  // 8. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading lorebook..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  if (!(card instanceof CharacterCard || card instanceof PlotCard)) {
    return (
      <CardPanelError message="Lorebook is only available for character and plot cards" />
    );
  }

  // 9. Render
  return (
    <div
      ref={containerRef}
      className="bg-background-surface-2 relative flex h-full flex-col"
    >
      <div className="flex-1 overflow-hidden p-2">
        {entries.length === 0 ? (
          <CardPanelEmpty
            title="No lorebook entry"
            description="Provide your agent with rich narrative memory"
            action={
              <Button onClick={handleAddEntry} variant="secondary" size="sm">
                <Plus className="min-h-4 min-w-4" />
                Create new lorebook entry
              </Button>
            }
          />
        ) : (
          <div className="flex h-full min-w-0 gap-2">
            {/* Left panel - Lorebook entries */}
            <div className="flex max-w-[256px] min-w-[146px] flex-1 flex-col gap-2 overflow-hidden">
              <div className="inline-flex items-center justify-start gap-2 self-stretch overflow-hidden pr-2 pl-7">
                <button
                  onClick={handleAddEntry}
                  className="bg-background-surface-4 outline-border-light hover:bg-background-surface-3 flex h-7 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
                >
                  <Plus className="text-text-body h-4 w-4 flex-shrink-0" />
                  <div className="text-text-primary justify-center truncate text-xs leading-none font-semibold">
                    Entry
                  </div>
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-text-subtle text-xs">
                    No entries yet. Click "Entry" to add your first lorebook
                    entry.
                  </div>
                </div>
              ) : (
                <ScrollAreaSimple className="flex-1">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[
                      restrictToVerticalAxis,
                      restrictToParentElement,
                    ]}
                  >
                    <SortableContext
                      items={entries.map((entry) => entry.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2 pr-2">
                        {entries.map((entry) => (
                          <SortableItem
                            key={entry.id}
                            item={entry}
                            isSelected={entry.id === selectedEntryId}
                            onClick={() => setSelectedEntryId(entry.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollAreaSimple>
              )}
            </div>

            {/* Divider */}
            <div className="bg-border-dark w-px self-stretch"></div>

            {/* Right panel - Entry details */}
            <div className="min-w-0 flex-1 overflow-hidden">
              {selectedEntry ? (
                <div className="flex h-full w-full min-w-0 flex-col items-start justify-start gap-4 p-1">
                  {/* Title bar with trash can */}
                  <div className="flex h-6 items-center justify-end self-stretch">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleDeleteEntry(selectedEntry.id)}
                          className="h-6 w-6 rounded-sm transition-opacity hover:opacity-80"
                        >
                          <Trash2 className="text-text-subtle min-h-4 min-w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" variant="button">
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Lore book name field */}
                  <div className="inline-flex flex-col items-start justify-start gap-2 self-stretch">
                    <div className="inline-flex items-center justify-start gap-2 self-stretch">
                      <div className="text-text-body justify-start text-[10px] leading-none font-medium">
                        Lore book name
                      </div>
                    </div>
                    <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                      <Input
                        ref={nameInputRef}
                        value={selectedEntry.name}
                        onChange={(e) =>
                          handleUpdateEntry(selectedEntry.id, {
                            name: e.target.value,
                          })
                        }
                        onFocus={() => updateLorebook.setCursorActive(true)}
                        onBlur={() => updateLorebook.setCursorActive(false)}
                        className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Keywords field */}
                  <div className="flex flex-col items-end justify-start gap-1 self-stretch">
                    <div className="flex flex-col items-start justify-center gap-2 self-stretch">
                      <div className="text-text-body justify-start text-[10px] leading-none font-medium">
                        Keywords
                      </div>
                      <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                        <div className="inline-flex items-center justify-start gap-1 self-stretch">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onFocus={() => updateLorebook.setCursorActive(true)}
                            onBlur={() => updateLorebook.setCursorActive(false)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newKeyword.trim()) {
                                const updatedKeys = [
                                  ...selectedEntry.keys,
                                  newKeyword.trim(),
                                ];
                                handleUpdateEntry(selectedEntry.id, {
                                  keys: updatedKeys,
                                });
                                setNewKeyword("");
                              }
                            }}
                            placeholder="Add a search keyword"
                            className="bg-background-surface-0 outline-border-normal text-text-primary h-8 flex-1 rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
                          />
                          <button
                            onClick={() => {
                              if (newKeyword.trim()) {
                                const updatedKeys = [
                                  ...selectedEntry.keys,
                                  newKeyword.trim(),
                                ];
                                handleUpdateEntry(selectedEntry.id, {
                                  keys: updatedKeys,
                                });
                                setNewKeyword("");
                              }
                            }}
                            className="bg-background-surface-4 outline-border-light hover:bg-background-surface-3 flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
                          >
                            <div className="text-text-primary justify-center text-xs leading-none font-semibold">
                              Add
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex flex-wrap content-end items-end justify-start gap-1 self-stretch">
                      {(Array.isArray(selectedEntry.keys)
                        ? selectedEntry.keys
                        : []
                      ).map((keyword, index) => (
                        <div
                          key={index}
                          className="bg-button-chips flex items-center justify-center gap-2 rounded-md px-2.5 py-1.5"
                        >
                          <div className="text-text-body justify-start text-xs font-normal">
                            {keyword}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="flex h-4 w-4 cursor-pointer items-center justify-center p-0.5 opacity-50 transition-opacity hover:opacity-100"
                                onClick={() => {
                                  const updatedKeys = selectedEntry.keys.filter(
                                    (_, i) => i !== index,
                                  );
                                  handleUpdateEntry(selectedEntry.id, {
                                    keys: updatedKeys,
                                  });
                                }}
                              >
                                <X className="text-text-body h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent variant="button">
                              <p>Remove</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recall range field */}
                  <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                    <div className="inline-flex items-center justify-start gap-2 self-stretch">
                      <div className="text-text-body justify-start text-[10px] leading-none font-medium">
                        Recall range
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="text-text-info h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs">
                            Set the scan depth to determine how many messages
                            <br />
                            are checked for triggers.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                      <Input
                        type="number"
                        value={selectedEntry.recallRange}
                        onChange={(e) =>
                          handleUpdateEntry(selectedEntry.id, {
                            recallRange: parseInt(e.target.value) || 0,
                          })
                        }
                        onFocus={() => updateLorebook.setCursorActive(true)}
                        onBlur={() => updateLorebook.setCursorActive(false)}
                        className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
                        placeholder="Messages to apply"
                        min="0"
                        max="100"
                      />
                      <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
                        <div className="text-text-info flex-1 justify-start text-[10px] leading-none font-medium">
                          Min 0 / Max 100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2 self-stretch overflow-hidden">
                    <div className="text-text-body justify-start self-stretch text-[10px] leading-none font-medium">
                      Description
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-1 self-stretch overflow-hidden">
                      <div className="min-w-0 flex-1 self-stretch">
                        <Editor
                          value={selectedEntry.content}
                          onChange={(value) =>
                            handleUpdateEntry(selectedEntry.id, {
                              content: value || "",
                            })
                          }
                          language="markdown"
                          expandable={true}
                          isExpanded={isDescriptionExpanded}
                          onExpandToggle={setIsDescriptionExpanded}
                          onMount={handleEditorMount}
                          containerClassName="h-full"
                        />
                      </div>
                      <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
                        <div className="text-text-info flex-1 justify-start text-[10px] leading-none font-medium">
                          {"{{session.entries}}"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-text-subtle text-xs">
                    Select an entry to edit its details
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Editor View */}
      {isDescriptionExpanded && selectedEntry && (
        <div className="bg-background-surface-2 absolute inset-0 z-20 p-4">
          <div className="h-full w-full">
            <Editor
              value={selectedEntry.content}
              onChange={(value) =>
                handleUpdateEntry(selectedEntry.id, { content: value || "" })
              }
              language="markdown"
              expandable={true}
              isExpanded={isDescriptionExpanded}
              onExpandToggle={setIsDescriptionExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
