import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import {
  Trash2,
  Plus,
  HelpCircle,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";

import { CharacterCard, PlotCard } from "@/modules/card/domain";
import { Lorebook } from "@/modules/card/domain/lorebook";
import { Entry } from "@/modules/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain";
import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";

// Import the sortable component
import { SortableItem } from "@/components-v2/card/panels/card-panel/components/sortable-item";

// Import our abstraction
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError,
  CardPanelEmpty 
} from "@/components-v2/card/panels/hooks/use-card-panel";

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
  // 1. Use abstraction hook for card panel functionality
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<CharacterCard | PlotCard>({
    cardId,
  });
  
  // 2. UI state (expansion, errors, etc.)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // 3. Local form state (for immediate UI feedback)
  const [entries, setEntries] = useState<LorebookEntry[]>([]);
  
  // 4. Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 5. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card) {
      if ((card instanceof CharacterCard || card instanceof PlotCard) && card.props.lorebook) {
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
  }, [cardId, card, lastInitializedCardId]);

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

  // 6. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () => debounce((newEntries: LorebookEntry[]) => {
      if (!card || !(card instanceof CharacterCard || card instanceof PlotCard)) return;

      // Check for actual changes inline
      const currentLorebook = card.props.lorebook;
      
      // If one exists and the other doesn't, there are changes
      if (!currentLorebook && newEntries.length > 0) {
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
            const updateResult = card.update({
              lorebook: lorebookResult.getValue(),
            });
            
            if (updateResult.isSuccess) {
              saveCard(card);
            }
          }
        }
        return;
      }
      
      if (currentLorebook && newEntries.length === 0) {
        const updateResult = card.update({
          lorebook: undefined,
        });
        
        if (updateResult.isSuccess) {
          saveCard(card);
        }
        return;
      }
      
      // If both don't exist, no changes
      if (!currentLorebook && newEntries.length === 0) return;
      
      // Compare entry count
      if (currentLorebook && currentLorebook.entries.length !== newEntries.length) {
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
            const updateResult = card.update({
              lorebook: lorebookResult.getValue(),
            });
            
            if (updateResult.isSuccess) {
              saveCard(card);
            }
          }
        }
        return;
      }
      
      // Compare each entry
      if (currentLorebook) {
        const hasChanges = newEntries.some((entry) => {
          const domainEntry = currentLorebook.entries.find(e => e.id.toString() === entry.id);
          if (!domainEntry) return true;
          
          return (
            entry.name !== (domainEntry.name || "") ||
            entry.content !== (domainEntry.content || "") ||
            JSON.stringify(entry.keys) !== JSON.stringify(domainEntry.keys || []) ||
            entry.enabled !== (domainEntry.enabled !== false) ||
            entry.recallRange !== (domainEntry.recallRange || 2)
          );
        });

        if (hasChanges) {
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
              const updateResult = card.update({
                lorebook: lorebookResult.getValue(),
              });
              
              if (updateResult.isSuccess) {
                saveCard(card);
              }
            }
          }
        }
      }
    }, 300),
    [card, saveCard]
  );

  // Common Monaco editor mount handler
  const handleEditorMount = useCallback((editor: any) => {
    // Register editor for variable insertion
    const position = editor.getPosition();
    registerCardMonacoEditor(editor, position);

    // Track cursor changes
    editor.onDidChangeCursorPosition((e: any) => {
      registerCardMonacoEditor(editor, e.position);
    });

    // Track focus
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);
    });

    // Focus the editor when mounted (only for expanded views)
    if (editor.getDomNode()?.closest('.absolute.inset-0')) {
      editor.focus();
    }
  }, []);

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
    debouncedSave(newEntries);
  }, [entries, debouncedSave]);

  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      const newEntries = entries.filter((e) => e.id !== entryId);
      setEntries(newEntries);
      if (selectedEntryId === entryId) {
        setSelectedEntryId(newEntries.length > 0 ? newEntries[0].id : null);
      }
      debouncedSave(newEntries);
    },
    [entries, selectedEntryId, debouncedSave],
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = entries.findIndex((entry) => entry.id === active.id);
      const newIndex = entries.findIndex((entry) => entry.id === over.id);
      const newEntries = arrayMove(entries, oldIndex, newIndex);
      setEntries(newEntries);
      debouncedSave(newEntries);
    }
  }, [entries, debouncedSave]);

  // 8. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading lorebook..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  if (!(card instanceof CharacterCard || card instanceof PlotCard)) {
    return <CardPanelError message="Lorebook is only available for character and plot cards" />;
  }

  // 9. Render
  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-background-surface-2 relative"
    >

      <div className="flex-1 overflow-hidden p-2">
        {entries.length === 0 ? (
          <CardPanelEmpty
            title="No lorebook entry"
            description="Provide your agent with rich narrative memory"
            action={
              <Button onClick={handleAddEntry} variant="secondary" size="sm">
                <Plus className="min-w-4 min-h-4" />
                Create new lorebook entry
              </Button>
            }
          />
        ) : (
          <div className="flex gap-2 h-full min-w-0">
            {/* Left panel - Lorebook entries */}
            <div className="flex flex-col gap-2 flex-1 min-w-[146px] max-w-[256px] overflow-hidden">
              <div className="self-stretch pl-7 pr-2 inline-flex justify-start items-center gap-2 overflow-hidden">
                <button
                  onClick={handleAddEntry}
                  className="flex-1 h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-3 transition-colors overflow-hidden"
                >
                  <Plus className="w-4 h-4 text-text-body flex-shrink-0" />
                  <div className="justify-center text-text-primary text-xs font-semibold leading-none truncate">
                    Entry
                  </div>
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-8">
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
            <div className="w-px self-stretch bg-border-dark"></div>

            {/* Right panel - Entry details */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {selectedEntry ? (
                <div className="w-full h-full flex flex-col justify-start items-start gap-4 min-w-0 p-1">
                  {/* Title bar with trash can */}
                  <div className="self-stretch h-6 flex justify-end items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleDeleteEntry(selectedEntry.id)}
                          className="w-6 h-6 rounded-sm hover:opacity-80 transition-opacity"
                        >
                          <Trash2 className="min-w-3.5 min-h-4 text-text-subtle" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" variant="button">
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Lore book name field */}
                  <div className="self-stretch inline-flex flex-col justify-start items-start gap-2">
                    <div className="self-stretch inline-flex justify-start items-center gap-2">
                      <div className="justify-start text-text-body text-[10px] font-medium leading-none">
                        Lore book name
                      </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <Input
                        ref={nameInputRef}
                        value={selectedEntry.name}
                        onChange={(e) =>
                          handleUpdateEntry(selectedEntry.id, {
                            name: e.target.value,
                          })
                        }
                        className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Keywords field */}
                  <div className="self-stretch flex flex-col justify-start items-end gap-1">
                    <div className="self-stretch flex flex-col justify-center items-start gap-2">
                      <div className="justify-start text-text-body text-[10px] font-medium leading-none">
                        Keywords
                      </div>
                      <div className="self-stretch flex flex-col justify-start items-start gap-1">
                        <div className="self-stretch inline-flex justify-start items-center gap-1">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
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
                            className="flex-1 h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
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
                            className="h-8 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 cursor-pointer hover:bg-background-surface-3 transition-colors"
                          >
                            <div className="justify-center text-text-primary text-xs font-semibold leading-none">
                              Add
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="self-stretch inline-flex justify-start items-end gap-1 flex-wrap content-end">
                      {selectedEntry.keys.map((keyword, index) => (
                        <div
                          key={index}
                          className="px-2.5 py-1.5 bg-button-chips rounded-md flex justify-center items-center gap-2"
                        >
                          <div className="justify-start text-text-body text-xs font-normal">
                            {keyword}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="w-4 h-4 p-0.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                onClick={() => {
                                  const updatedKeys = selectedEntry.keys.filter(
                                    (_, i) => i !== index,
                                  );
                              handleUpdateEntry(selectedEntry.id, {
                                keys: updatedKeys,
                              });
                                }}
                              >
                                <X className="w-3 h-3 text-text-body" />
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
                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    <div className="self-stretch inline-flex justify-start items-center gap-2">
                      <div className="justify-start text-text-body text-[10px] font-medium leading-none">
                        Recall range
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-text-info cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs">
                            Set the scan depth to determine how many messages<br/>
                            are checked for triggers.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <Input
                        type="number"
                        value={selectedEntry.recallRange}
                        onChange={(e) =>
                          handleUpdateEntry(selectedEntry.id, {
                            recallRange: parseInt(e.target.value) || 0,
                          })
                        }
                        className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                        placeholder="Messages to apply"
                        min="0"
                        max="100"
                      />
                      <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
                        <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
                          Min 0 / Max 100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
                    <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">
                      Description
                    </div>
                    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
                      <div className="self-stretch flex-1 min-w-0">
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
                      <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
                        <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
                          {"{{session.entries}}"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
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
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full">
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