import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import { toast } from "sonner";
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
import { Button, Editor, Input, ScrollAreaSimple } from "@/shared/ui";
import type { editor } from "monaco-editor";
import { Trash2, Plus, Maximize2, Minimize2, HelpCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { ApiType } from "@/entities/agent/domain/agent";
import { PromptMessage } from "@/entities/agent/domain";

// Import queries and mutations
import { agentQueries } from "@/entities/agent/api/query-factory";
import {
  useUpdateAgentApiType,
  useUpdateAgentPromptMessages,
  useUpdateAgentTextPrompt,
} from "@/entities/agent/api/mutations/prompt-mutations-new";

// Import context
import { useFlowPanelContext } from "@/features/flow/ui/flow-panel-provider";
import { PromptPanelProps, PromptItem } from "./prompt-panel-types";
import {
  convertPromptMessagesToItems,
  convertItemsToPromptMessages,
} from "./prompt-panel-utils";

// Import reusable components
import { SortableItem } from "./sortable-item";
import { FormatSelectorAccordion } from "@/features/flow/ui/format-selector-accordion";

export function PromptPanel({ flowId, agentId }: PromptPanelProps) {
  // 1. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 2. Mutations for updating prompt
  const updateApiType = useUpdateAgentApiType(flowId, agentId || "");
  const updatePromptMessages = useUpdateAgentPromptMessages(
    flowId,
    agentId || "",
  );
  const updateTextPrompt = useUpdateAgentTextPrompt(flowId, agentId || "");

  // 3. Query for agent prompt data
  // With select result caching implemented, we can simplify query enabling
  const queryEnabled =
    !!agentId &&
    !updatePromptMessages.isEditing &&
    !updateTextPrompt.isEditing &&
    !updatePromptMessages.hasCursor &&
    !updateTextPrompt.hasCursor;

  const {
    data: promptData,
    isLoading,
    error,
  } = useQuery({
    ...agentQueries.prompt(agentId),
    enabled: queryEnabled,
  });

  // 4. Local UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [localAccordionOpen, setLocalAccordionOpen] = useState(true);
  const [completionMode, setCompletionMode] = useState<"chat" | "text">("chat");
  const [editorContent, setEditorContent] = useState("");
  const [items, setItems] = useState<PromptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [localMessageContent, setLocalMessageContent] = useState<string>("");

  // Track blocking user from switching during save
  const [showLoading, setShowLoading] = useState(false);
  const pendingSaveRef = useRef<boolean>(false);
  const isPromptMessagesPending = updatePromptMessages.isPending;

  const containerRef = useRef<HTMLDivElement>(null);
  const lastInitializedAgentId = useRef<string | null>(null);

  // 5. Initialize state when agent changes
  useEffect(() => {
    if (agentId && agentId !== lastInitializedAgentId.current && promptData) {
      // Set completion mode based on agent's API type
      const mode = promptData.targetApiType === ApiType.Chat ? "chat" : "text";
      setCompletionMode(mode);

      if (mode === "chat") {
        // Parse agent's prompt messages into items
        const parsedItems = promptData.promptMessages
          ? convertPromptMessagesToItems(promptData.promptMessages)
          : [];
        setItems(parsedItems);
        setSelectedItemId(parsedItems[0]?.id || "");
      } else {
        // Load text prompt
        setEditorContent(promptData.textPrompt || "");
      }

      lastInitializedAgentId.current = agentId;
    }
  }, [agentId, promptData]);

  // 6. Track if we've recently edited to prevent sync issues
  const hasRecentlyEditedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // 7. Sync state when prompt data changes (for cross-tab sync)
  useEffect(() => {
    // Don't sync while editing or cursor is active to prevent conflicts
    if (
      updatePromptMessages.isEditing ||
      updateTextPrompt.isEditing ||
      updatePromptMessages.hasCursor ||
      updateTextPrompt.hasCursor ||
      hasRecentlyEditedRef.current
    ) {
      return;
    }

    if (promptData) {
      const mode = promptData.targetApiType === ApiType.Chat ? "chat" : "text";

      if (mode === "chat" && promptData.promptMessages) {
        const parsedItems = convertPromptMessagesToItems(
          promptData.promptMessages,
        );
        setItems(parsedItems);

        // Keep selected item if it still exists - use callback to get latest selectedItemId
        setSelectedItemId((prevSelectedId) => {
          if (
            prevSelectedId &&
            !parsedItems.find((item) => item.id === prevSelectedId)
          ) {
            return parsedItems[0]?.id || "";
          }
          return prevSelectedId;
        });
      } else if (mode === "text" && promptData.textPrompt !== undefined) {
        setEditorContent(promptData.textPrompt || "");
      }
    }
  }, [
    promptData,
    updatePromptMessages.isEditing,
    updateTextPrompt.isEditing,
    updatePromptMessages.hasCursor,
    updateTextPrompt.hasCursor,
  ]);
  // 7. Debounced save for chat messages - only recreate when target changes
  const debouncedSaveMessages = useMemo(
    () =>
      debounce(async (items: PromptItem[]) => {
        if (!agentId) return;

        // Convert items to the format expected by the agent
        const promptMessages = convertItemsToPromptMessages(items);
        updatePromptMessages.mutate(promptMessages);
      }, 300),
    [agentId, updatePromptMessages],
  );

  // 8. Debounced save for text prompt - only recreate when target changes
  const debouncedSaveText = useMemo(
    () =>
      debounce(async (text: string) => {
        if (!agentId) return;

        updateTextPrompt.mutate(text);
      }, 300),
    [agentId, updateTextPrompt],
  );

  // 9. DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 10. Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Auto-save the reordered items
        debouncedSaveMessages(reorderedItems);

        return reorderedItems;
      });
    }
  };

  // 11. Editor mount handlers for variable insertion tracking
  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editor.onDidFocusEditorWidget(() => {
        // Track editor and cursor position for variable insertion
        const position = editor.getPosition();
        if (position && agentId) {
          setLastMonacoEditor(
            agentId,
            `prompt-${agentId}-${flowId}`,
            editor,
            position,
          );
        }
        // Mark cursor as active when editor is focused
        if (completionMode === "chat") {
          updatePromptMessages.setCursorActive(true);
        } else {
          updateTextPrompt.setCursorActive(true);
        }
      });

      editor.onDidBlurEditorWidget(() => {
        // Clear editor tracking when focus lost
        setLastMonacoEditor(null, null, null, null);
        // Mark cursor as inactive when editor loses focus
        if (completionMode === "chat") {
          updatePromptMessages.setCursorActive(false);
        } else {
          updateTextPrompt.setCursorActive(false);
        }
      });

      // Update position on cursor change
      editor.onDidChangeCursorPosition((e) => {
        if (agentId) {
          setLastMonacoEditor(
            agentId,
            `prompt-${agentId}-${flowId}`,
            editor,
            e.position,
          );
        }
      });
    },
    [
      agentId,
      flowId,
      setLastMonacoEditor,
      completionMode,
      updatePromptMessages,
      updateTextPrompt,
    ],
  );

  // 12. Handle completion mode change
  const handleCompletionModeChange = useCallback(
    (mode: "chat" | "text") => {
      setCompletionMode(mode);

      // Save the API type to the agent
      const apiType = mode === "chat" ? ApiType.Chat : ApiType.Text;
      updateApiType.mutate(apiType);

      // Re-parse content for the new mode
      if (promptData) {
        if (mode === "chat") {
          const agentItems = promptData.promptMessages
            ? convertPromptMessagesToItems(promptData.promptMessages)
            : [];
          setItems(agentItems);
          setSelectedItemId(agentItems[0]?.id || "");
        } else {
          setEditorContent(promptData.textPrompt || "");
        }
      }
    },
    [promptData, updateApiType],
  );

  // 13. Message management functions
  const addNewMessage = useCallback(() => {
    const newId = `message-${Date.now()}`;
    const newMessage: PromptItem = {
      id: newId,
      label: `Message ${items.length + 1}`,
      enabled: true,
      content: "",
      role: "system",
      type: "regular",
    };

    const updatedItems = [...items, newMessage];
    setItems(updatedItems);
    setSelectedItemId(newId);
    debouncedSaveMessages(updatedItems);
  }, [items, debouncedSaveMessages]);

  const addNewHistoryMessage = useCallback(() => {
    const newId = `history-${Date.now()}`;
    const newHistoryMessage: PromptItem = {
      id: newId,
      label: `History Message ${items.filter((item) => item.type === "history").length + 1}`,
      enabled: true,
      content: "",
      role: "assistant",
      type: "history",
      start: 0,
      end: 8,
      countFromEnd: true,
    };

    const updatedItems = [...items, newHistoryMessage];
    setItems(updatedItems);
    setSelectedItemId(newId);
    debouncedSaveMessages(updatedItems);
  }, [items, debouncedSaveMessages]);

  const updateItemRole = useCallback(
    (itemId: string, newRole: "system" | "user" | "assistant") => {
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, role: newRole } : item,
      );
      setItems(updatedItems);
      debouncedSaveMessages(updatedItems);
    },
    [items, debouncedSaveMessages],
  );

  const deleteMessage = useCallback(
    (itemId: string) => {
      if (items.length <= 1) return;

      const updatedItems = items.filter((item) => item.id !== itemId);
      setItems(updatedItems);

      if (selectedItemId === itemId) {
        setSelectedItemId(updatedItems[0]?.id || "");
      }

      debouncedSaveMessages(updatedItems);
    },
    [items, selectedItemId, debouncedSaveMessages],
  );

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      debouncedSaveText(value);
    }
  };

  // 14. Get selected item (moved before early returns to avoid hooks rule violation)
  const selectedItem = items.find((item) => item.id === selectedItemId);

  // 15. Sync local message content with selected item (moved before early returns)
  useEffect(() => {
    if (selectedItem) {
      setLocalMessageContent(selectedItem.content || "");
    }
  }, [selectedItem?.id, selectedItem?.content]);

  // 16. Use ref to track items for saving without causing re-renders (moved before early returns)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Handle completed save and clear loading state (moved before early returns)
  useEffect(() => {
    // When mutation starts, clear the pending save ref
    if (isPromptMessagesPending && pendingSaveRef.current) {
      pendingSaveRef.current = false;
    }

    // When mutation completes, clear editing flags to allow sync
    if (!isPromptMessagesPending) {
      hasRecentlyEditedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Hide loading if it was showing
      if (showLoading) {
        setShowLoading(false);
      }
    }
  }, [isPromptMessagesPending, showLoading]);

  // Handle message selection - block if save in progress (moved before early returns)
  const handleMessageSelect = useCallback(
    (messageId: string) => {
      // If trying to switch to the same message, do nothing
      if (messageId === selectedItemId) {
        return;
      }

      // If a save is currently in progress, block the switch
      if (isPromptMessagesPending) {
        setShowLoading(true);
        toast.info("Saving changes before switching message...", {
          duration: 2000,
        });
        return;
      }

      // If we have pending unsaved changes (debounce timer), trigger save and block switch
      if (pendingSaveRef.current) {
        setShowLoading(true);
        toast.info("Saving changes before switching message...", {
          duration: 2000,
        });
        return;
      }

      // No pending saves, switch immediately
      setSelectedItemId(messageId);
    },
    [selectedItemId, isPromptMessagesPending],
  );

  // Debounced save for message content (moved before early returns)
  const debouncedSaveMessageContent = useMemo(
    () =>
      debounce((itemId: string, content: string) => {
        // Set a flag that we have pending changes that will save soon
        pendingSaveRef.current = true;

        // Set flag to prevent syncing for a while after editing
        hasRecentlyEditedRef.current = true;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          hasRecentlyEditedRef.current = false;
        }, 1000); // Wait 1 second after last edit before allowing sync

        // Use ref to get current items without causing re-render
        const updatedItems = itemsRef.current.map((item) =>
          item.id === itemId ? { ...item, content } : item,
        );
        itemsRef.current = updatedItems; // Update ref

        debouncedSaveMessages(updatedItems); // Save to database - this will trigger the mutation's isPending state

        // Don't call setItems here to avoid re-render
      }, 300),
    [debouncedSaveMessages],
  );

  // Early returns for loading/error states - only show when truly loading, not during editing
  if (isLoading && !promptData) {
    return (
      <div className="bg-surface-raised flex h-full items-center justify-center">
        <div className="text-fg-subtle flex items-center gap-2">
          <span>Loading prompt panel...</span>
        </div>
      </div>
    );
  }

  if (error && !promptData) {
    return (
      <div className="bg-surface-raised flex h-full items-center justify-center">
        <div className="text-fg-subtle flex items-center gap-2">
          <span>Failed to load prompt data</span>
        </div>
      </div>
    );
  }

  // If we don't have data and we're not loading (likely no agentId), show nothing
  if (!promptData) {
    return null;
  }

  // Main render
  return (
    <div
      ref={containerRef}
      className="bg-surface-raised flex h-full flex-col"
    >
      <FormatSelectorAccordion
        value={completionMode === "chat" ? ApiType.Chat : ApiType.Text}
        onChange={(apiType) => {
          const mode = apiType === ApiType.Chat ? "chat" : "text";
          handleCompletionModeChange(mode);
        }}
        isOpen={localAccordionOpen}
        onOpenChange={setLocalAccordionOpen}
        isStandalone={false}
        className="w-full"
      />

      <div className="flex-1 overflow-hidden p-2">
        {completionMode === "chat" ? (
          !selectedItem && items.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center justify-start gap-2">
                  <div className="text-fg-muted justify-start text-center text-base leading-relaxed font-semibold">
                    No Message
                  </div>
                  <div className="text-background-surface-5 w-44 justify-start text-center text-xs font-normal">
                    Guide how your agent responds, from tone to context
                  </div>
                </div>
                <div className="flex flex-col items-center justify-start gap-2">
                  <Button onClick={addNewMessage} variant="secondary" size="sm">
                    <Plus className="min-h-4 min-w-4" />
                    Message
                  </Button>
                  <Button
                    onClick={addNewHistoryMessage}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus className="min-h-4 min-w-4" />
                    History message
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-w-0 gap-2">
              {/* Left panel - Sortable list */}
              <div className="flex max-w-[256px] min-w-[146px] flex-1 flex-col gap-2 overflow-hidden">
                <div className="mb-2 inline-flex flex-wrap content-start items-start justify-start gap-2 self-stretch">
                  <button
                    onClick={addNewMessage}
                    className="bg-hover outline-border-subtle hover:bg-active flex h-7 items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
                  >
                    <Plus className="text-fg-muted h-4 w-4" />
                    <div className="text-fg-default justify-center text-xs leading-none font-semibold">
                      Message
                    </div>
                  </button>
                  <button
                    onClick={addNewHistoryMessage}
                    className="bg-hover outline-border-subtle hover:bg-active flex h-7 items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
                  >
                    <Plus className="text-fg-muted h-4 w-4" />
                    <div className="text-fg-default justify-center text-xs leading-none font-semibold">
                      History message
                    </div>
                  </button>
                </div>
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
                      items={items.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2 pr-2">
                        {items.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            isSelected={
                              item.id === selectedItemId && !showLoading
                            }
                            onClick={() => handleMessageSelect(item.id)}
                            onToggle={(checked) => {
                              const updatedItems = items.map((i) =>
                                i.id === item.id
                                  ? { ...i, enabled: checked }
                                  : i,
                              );
                              setItems(updatedItems);
                              debouncedSaveMessages(updatedItems);
                            }}
                            onRoleChange={(role) =>
                              updateItemRole(item.id, role)
                            }
                            onDelete={() => deleteMessage(item.id)}
                            canDelete={items.length > 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollAreaSimple>
              </div>

              {/* Divider */}
              <div className="bg-border-dark w-px self-stretch"></div>

              {/* Right panel - Details */}
              <div className="@container min-w-0 flex-1 overflow-hidden">
                {selectedItem && (
                  <div className="relative flex h-full w-full min-w-0 flex-col items-start justify-start gap-4 p-1">
                    {items.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => deleteMessage(selectedItem.id)}
                            className="absolute top-1 right-1 z-10 h-6 w-6 rounded-sm transition-opacity hover:opacity-80"
                          >
                            <Trash2 className="text-fg-subtle min-h-4 min-w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent variant="button">
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Title header */}
                    <div className="inline-flex items-center justify-start gap-2 self-stretch">
                      <div className="flex flex-1 items-center justify-start gap-4">
                        <div className="text-fg-muted justify-start text-xs font-medium">
                          {selectedItem.type === "history"
                            ? "History message"
                            : "Message"}
                        </div>
                      </div>
                    </div>

                    {selectedItem.type === "history" && (
                      <div className="flex flex-col gap-4 @md:flex-row">
                        <div className="inline-flex items-start justify-start gap-2 self-stretch">
                          <div className="inline-flex flex-1 flex-col items-start justify-start gap-2">
                            <div className="inline-flex items-center justify-start gap-2 self-stretch">
                              <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                                Name
                              </div>
                            </div>
                            <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                              <Input
                                value={selectedItem.label}
                                onChange={(e) => {
                                  const updatedItems = items.map((i) =>
                                    i.id === selectedItem.id
                                      ? { ...i, label: e.target.value }
                                      : i,
                                  );
                                  setItems(updatedItems);
                                  debouncedSaveMessages(updatedItems);
                                }}
                                onFocus={() =>
                                  updatePromptMessages.setCursorActive(true)
                                }
                                onBlur={() =>
                                  updatePromptMessages.setCursorActive(false)
                                }
                                className="bg-canvas outline-border-muted text-fg-default h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px] @md:min-w-[200px]"
                                placeholder="History message"
                              />
                            </div>
                          </div>
                        </div>

                        {/* History-specific fields */}
                        <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                          <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                            <div className="inline-flex items-start justify-start gap-1 self-stretch">
                              <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                                History range
                              </div>
                              <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="text-fg-subtle h-4 w-4 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent variant="button">
                                    <p className="max-w-xs text-xs">
                                      Choose how to index the message range:
                                      <br />
                                      "From start" counts from the first message
                                      onward.
                                      <br />
                                      "From end" counts backward from the latest
                                      message.
                                      <br />
                                      Count starts from 0.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                              <button
                                onClick={() => {
                                  const updatedItems = items.map((i) =>
                                    i.id === selectedItem.id
                                      ? { ...i, countFromEnd: !i.countFromEnd }
                                      : i,
                                  );
                                  setItems(updatedItems);
                                  debouncedSaveMessages(updatedItems);
                                }}
                                className="inline-flex cursor-pointer items-center justify-start gap-2 self-stretch"
                              >
                                <div className="bg-active flex h-3 w-3 items-center justify-center gap-2 rounded-md p-0.5">
                                  {selectedItem.countFromEnd !== false && (
                                    <div className="bg-text-primary h-1.5 w-1.5 rounded-full"></div>
                                  )}
                                </div>
                                <div className="text-fg-default justify-start text-[10px] leading-none font-medium">
                                  Count from end (newest → oldest)
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  const updatedItems = items.map((i) =>
                                    i.id === selectedItem.id
                                      ? { ...i, countFromEnd: false }
                                      : i,
                                  );
                                  setItems(updatedItems);
                                  debouncedSaveMessages(updatedItems);
                                }}
                                className="mt-1 inline-flex cursor-pointer items-center justify-start gap-2 self-stretch"
                              >
                                <div className="bg-active flex h-3 w-3 items-center justify-center gap-2 rounded-md p-0.5">
                                  {selectedItem.countFromEnd === false && (
                                    <div className="bg-text-primary h-1.5 w-1.5 rounded-full"></div>
                                  )}
                                </div>
                                <div className="text-fg-default justify-start text-[10px] leading-none font-medium">
                                  Count from start (oldest → newest)
                                </div>
                              </button>
                            </div>
                          </div>
                          <div className="inline-flex items-center justify-start gap-2 self-stretch">
                            <div className="text-fg-subtle justify-start text-[10px] leading-none font-medium">
                              Messages
                            </div>
                            <div className="inline-flex w-16 flex-col items-start justify-start gap-2">
                              <Input
                                type="number"
                                value={selectedItem.start || 0}
                                onChange={(e) => {
                                  const start = parseInt(e.target.value) || 0;
                                  const updatedItems = items.map((i) =>
                                    i.id === selectedItem.id
                                      ? { ...i, start }
                                      : i,
                                  );
                                  setItems(updatedItems);
                                  debouncedSaveMessages(updatedItems);
                                }}
                                onFocus={() =>
                                  updatePromptMessages.setCursorActive(true)
                                }
                                onBlur={() =>
                                  updatePromptMessages.setCursorActive(false)
                                }
                                className="bg-canvas outline-border-muted text-fg-default min-h-8 self-stretch rounded-md px-4 py-2 text-center text-xs font-normal outline-1 outline-offset-[-1px]"
                                min="0"
                              />
                            </div>
                            <div className="text-fg-subtle justify-start text-[10px] leading-none font-medium">
                              to
                            </div>
                            <div className="inline-flex w-16 flex-col items-start justify-start gap-2">
                              <Input
                                type="number"
                                value={selectedItem.end || 8}
                                onChange={(e) => {
                                  const end = parseInt(e.target.value) || 8;
                                  const updatedItems = items.map((i) =>
                                    i.id === selectedItem.id
                                      ? { ...i, end }
                                      : i,
                                  );
                                  setItems(updatedItems);
                                  debouncedSaveMessages(updatedItems);
                                }}
                                onFocus={() =>
                                  updatePromptMessages.setCursorActive(true)
                                }
                                onBlur={() =>
                                  updatePromptMessages.setCursorActive(false)
                                }
                                className="bg-canvas outline-border-muted text-fg-default min-h-8 self-stretch rounded-md px-4 py-2 text-center text-xs font-normal outline-1 outline-offset-[-1px]"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Name and role fields */}
                    {selectedItem.type !== "history" && (
                      <div className="inline-flex items-start justify-start gap-2 self-stretch">
                        <div className="inline-flex flex-1 flex-col items-start justify-start gap-2">
                          <div className="inline-flex items-center justify-start gap-2 self-stretch">
                            <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                              Name
                            </div>
                          </div>
                          <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                            <Input
                              value={selectedItem.label}
                              onChange={(e) => {
                                const updatedItems = items.map((i) =>
                                  i.id === selectedItem.id
                                    ? { ...i, label: e.target.value }
                                    : i,
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              onFocus={() =>
                                updatePromptMessages.setCursorActive(true)
                              }
                              onBlur={() =>
                                updatePromptMessages.setCursorActive(false)
                              }
                              className="bg-canvas outline-border-muted text-fg-default h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
                              placeholder="Enter message name"
                            />
                          </div>
                        </div>
                        <div className="inline-flex flex-1 flex-col items-start justify-start gap-2">
                          <div className="inline-flex items-center justify-start gap-2 self-stretch">
                            <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                              Role
                            </div>
                          </div>
                          <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                            <Select
                              value={selectedItem.role}
                              onValueChange={(role) =>
                                updateItemRole(
                                  selectedItem.id,
                                  role as "system" | "user" | "assistant",
                                )
                              }
                            >
                              <SelectTrigger className="bg-canvas outline-border-muted text-fg-default h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="assistant">
                                  Assistant
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description field */}
                    <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2 self-stretch overflow-hidden">
                      <div className="text-fg-muted justify-start self-stretch text-[10px] leading-none font-medium">
                        Description
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-1 self-stretch overflow-hidden">
                        <div className="bg-canvas outline-border-muted relative flex min-w-0 flex-1 flex-col items-start justify-start self-stretch overflow-hidden rounded-md outline-1 outline-offset-[-1px]">
                          <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="hover:bg-surface absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-sm transition-colors"
                          >
                            {isExpanded ? (
                              <Minimize2 className="text-fg-subtle h-4 w-4" />
                            ) : (
                              <Maximize2 className="text-fg-subtle h-4 w-4" />
                            )}
                          </button>
                          <div className="h-full w-full">
                            <Editor
                              key={selectedItem.id} // Force new editor instance for each message
                              value={localMessageContent}
                              onChange={(value) => {
                                const newValue = value || "";
                                setLocalMessageContent(newValue);
                                debouncedSaveMessageContent(
                                  selectedItem.id,
                                  newValue,
                                );
                              }}
                              language="markdown"
                              onMount={handleEditorMount}
                              containerClassName="h-full"
                              clearUndoOnValueChange={true}
                              isLoading={showLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Editor View */}
              {isExpanded && selectedItem && (
                <div className="bg-surface-raised absolute inset-0 z-20 p-4">
                  <div className="bg-canvas outline-border-muted relative flex h-full w-full flex-col items-start justify-start overflow-hidden rounded-md outline-1 outline-offset-[-1px]">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="hover:bg-surface absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-sm transition-colors"
                    >
                      <Minimize2 className="text-fg-subtle h-4 w-4" />
                    </button>
                    <div className="h-full w-full">
                      <Editor
                        key={selectedItem.id} // Force new editor instance for each message
                        value={localMessageContent}
                        onChange={(value) => {
                          const newValue = value || "";
                          setLocalMessageContent(newValue);
                          debouncedSaveMessageContent(
                            selectedItem.id,
                            newValue,
                          );
                        }}
                        language="markdown"
                        onMount={handleEditorMount}
                        containerClassName="h-full"
                        clearUndoOnValueChange={true}
                        isLoading={showLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          // Text mode
          <>
            <div className="h-full w-full">
              <Editor
                value={editorContent}
                onChange={handleEditorChange}
                language="markdown"
                expandable={true}
                isExpanded={isExpanded}
                onExpandToggle={setIsExpanded}
                onMount={handleEditorMount}
                containerClassName="h-full"
              />
            </div>

            {/* Expanded Editor View for text mode */}
            {isExpanded && (
              <div className="bg-surface-raised absolute inset-0 z-20 p-4">
                <div className="h-full w-full">
                  <Editor
                    value={editorContent}
                    onChange={handleEditorChange}
                    language="markdown"
                    expandable={true}
                    isExpanded={isExpanded}
                    onExpandToggle={setIsExpanded}
                    onMount={handleEditorMount}
                    containerClassName="h-full"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
