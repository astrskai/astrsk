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
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { Trash2, Plus, Maximize2, Minimize2, HelpCircle } from "lucide-react";

import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { ApiType } from "@/modules/agent/domain/agent";
import { PromptMessage } from "@/modules/agent/domain";

// Import queries and mutations
import { agentQueries } from "@/app/queries/agent/query-factory";
import { 
  useUpdateAgentApiType,
  useUpdateAgentPromptMessages,
  useUpdateAgentTextPrompt
} from "@/app/queries/agent/mutations/prompt-mutations-new";

// Import context
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { PromptPanelProps, PromptItem } from "./prompt-panel-types";
import { convertPromptMessagesToItems, convertItemsToPromptMessages } from "./prompt-panel-utils";

// Import reusable components
import { SortableItem } from "./sortable-item";
import { FormatSelectorAccordion } from "@/flow-multi/components/format-selector-accordion";

export function PromptPanel({ flowId, agentId }: PromptPanelProps) {
  // 1. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 2. Mutations for updating prompt
  const updateApiType = useUpdateAgentApiType(flowId, agentId || "");
  const updatePromptMessages = useUpdateAgentPromptMessages(flowId, agentId || "");
  const updateTextPrompt = useUpdateAgentTextPrompt(flowId, agentId || "");

  // 3. Query for agent prompt data only
  // Disable refetching while editing or cursor is active to prevent UI jumping
  const queryEnabled = !!agentId && !updatePromptMessages.isEditing && !updateTextPrompt.isEditing && 
                      !updatePromptMessages.hasCursor && !updateTextPrompt.hasCursor;
  
  const { 
    data: promptData, 
    isLoading, 
    error
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
        const parsedItems = promptData.promptMessages ? 
          convertPromptMessagesToItems(promptData.promptMessages) : [];
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
    // Don't sync while editing OR while cursor is active OR recently edited
    if (updatePromptMessages.isEditing || updateTextPrompt.isEditing || 
        updatePromptMessages.hasCursor || updateTextPrompt.hasCursor || 
        hasRecentlyEditedRef.current) {
      return;
    }
    
    if (promptData) {
      const mode = promptData.targetApiType === ApiType.Chat ? "chat" : "text";
      
      if (mode === "chat" && promptData.promptMessages) {
        const parsedItems = convertPromptMessagesToItems(promptData.promptMessages);
        
        // Force new array reference to trigger React re-render
        setItems([...parsedItems]);
        
        // Keep selected item if it still exists - use callback to get latest selectedItemId
        setSelectedItemId(prevSelectedId => {
          if (prevSelectedId && !parsedItems.find(item => item.id === prevSelectedId)) {
            return parsedItems[0]?.id || "";
          }
          return prevSelectedId;
        });
      } else if (mode === "text" && promptData.textPrompt !== undefined) {
        setEditorContent(promptData.textPrompt || "");
      }
    }
  }, [promptData?.promptMessages, promptData?.textPrompt, updatePromptMessages.isEditing, updateTextPrompt.isEditing, 
      updatePromptMessages.hasCursor, updateTextPrompt.hasCursor, showLoading]);

  // 7. Debounced save for chat messages
  const debouncedSaveMessages = useMemo(
    () => debounce(async (items: PromptItem[]) => {
      if (!agentId) return;
      
      // Convert items to the format expected by the agent
      const promptMessages = convertItemsToPromptMessages(items);
      updatePromptMessages.mutate(promptMessages);
    }, 300),
    [agentId, updatePromptMessages]
  );

  // 8. Debounced save for text prompt
  const debouncedSaveText = useMemo(
    () => debounce(async (text: string) => {
      if (!agentId) return;
      
      updateTextPrompt.mutate(text);
    }, 300),
    [agentId, updateTextPrompt]
  );

  // 9. DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      // Track editor and cursor position for variable insertion
      const position = editor.getPosition();
      if (position && agentId) {
        setLastMonacoEditor(agentId, `prompt-${agentId}-${flowId}`, editor, position);
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
        setLastMonacoEditor(agentId, `prompt-${agentId}-${flowId}`, editor, e.position);
      }
    });
  }, [agentId, flowId, setLastMonacoEditor, completionMode, updatePromptMessages, updateTextPrompt]);

  // 12. Handle completion mode change
  const handleCompletionModeChange = useCallback((mode: "chat" | "text") => {
    setCompletionMode(mode);
    
    // Save the API type to the agent
    const apiType = mode === "chat" ? ApiType.Chat : ApiType.Text;
    updateApiType.mutate(apiType);
    
    // Re-parse content for the new mode
    if (promptData) {
      if (mode === "chat") {
        const agentItems = promptData.promptMessages ? 
          convertPromptMessagesToItems(promptData.promptMessages) : [];
        setItems(agentItems);
        setSelectedItemId(agentItems[0]?.id || "");
      } else {
        setEditorContent(promptData.textPrompt || "");
      }
    }
  }, [promptData, updateApiType]);

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
      label: `History Message ${items.filter(item => item.type === 'history').length + 1}`,
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

  const updateItemRole = useCallback((itemId: string, newRole: "system" | "user" | "assistant") => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, role: newRole } : item
    );
    setItems(updatedItems);
    debouncedSaveMessages(updatedItems);
  }, [items, debouncedSaveMessages]);

  const deleteMessage = useCallback((itemId: string) => {
    if (items.length <= 1) return;
    
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    
    if (selectedItemId === itemId) {
      setSelectedItemId(updatedItems[0]?.id || "");
    }
    
    debouncedSaveMessages(updatedItems);
  }, [items, selectedItemId, debouncedSaveMessages]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      debouncedSaveText(value);
    }
  };

  // 14. Early returns for loading/error states
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Loading prompt panel...</span>
        </div>
      </div>
    );
  }

  if (error || !promptData) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Failed to load prompt data</span>
        </div>
      </div>
    );
  }

  const selectedItem = items.find(item => item.id === selectedItemId);

  // 15. Sync local message content with selected item
  useEffect(() => {
    if (selectedItem) {
      setLocalMessageContent(selectedItem.content || "");
    }
  }, [selectedItem?.id, selectedItem?.content]);

  // 16. Use ref to track items for saving without causing re-renders
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Handle completed save and clear loading state
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

  // Handle message selection - block if save in progress
  const handleMessageSelect = useCallback((messageId: string) => {
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
  }, [selectedItemId, isPromptMessagesPending]);

  // 17. Debounced save for message content - doesn't update state, only saves
  // TODO: This approach uses a ref to avoid re-renders during typing
  // Consider refactoring to use an uncontrolled Monaco editor for better performance
  const debouncedSaveMessageContent = useMemo(
    () => debounce((itemId: string, content: string) => {
      // Set a flag that we have pending changes that will save soon
      pendingSaveRef.current = true;
      
      // Set flag to prevent syncing for a while after editing
      hasRecentlyEditedRef.current = true;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        hasRecentlyEditedRef.current = false;
      }, 1000); // Wait 1 second after last edit before allowing sync
      
      // Use ref to get current items without causing re-render
      const updatedItems = itemsRef.current.map(item => 
        item.id === itemId ? { ...item, content } : item
      );
      itemsRef.current = updatedItems; // Update ref
      
      debouncedSaveMessages(updatedItems); // Save to database - this will trigger the mutation's isPending state
      
      // Don't call setItems here to avoid re-render
    }, 300),
    [debouncedSaveMessages]
  );

  // 17. Main render
  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background-surface-2">
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
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col justify-center items-center gap-8">
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-start text-text-body text-base font-semibold leading-relaxed">No Message</div>
                  <div className="w-44 text-center justify-start text-background-surface-5 text-xs font-normal">Guide how your agent responds, from tone to context</div>
                </div>
                <div className="flex flex-col justify-start items-center gap-2">
                  <Button
                    onClick={addNewMessage}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus className="min-w-4 min-h-4" />
                    Message
                  </Button>
                  <Button
                    onClick={addNewHistoryMessage}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus className="min-w-4 min-h-4" />
                    History message
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 h-full min-w-0">
              {/* Left panel - Sortable list */}
              <div className="flex flex-col gap-2 flex-1 min-w-[146px] max-w-[256px] overflow-hidden">
                <div className="self-stretch inline-flex justify-start items-start gap-2 flex-wrap content-start mb-2">
                  <button
                    onClick={addNewMessage}
                    className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-text-body" />
                    <div className="justify-center text-text-primary text-xs font-semibold leading-none">Message</div>
                  </button>
                  <button
                    onClick={addNewHistoryMessage}
                    className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-text-body" />
                    <div className="justify-center text-text-primary text-xs font-semibold leading-none">History message</div>
                  </button>
                </div>
                <ScrollAreaSimple className="flex-1">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  >
                    <SortableContext
                      items={items.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2 pr-2">
                        {items.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedItemId && !showLoading}
                            onClick={() => handleMessageSelect(item.id)}
                            onToggle={(checked) => {
                              const updatedItems = items.map(i => 
                                i.id === item.id ? { ...i, enabled: checked } : i
                              );
                              setItems(updatedItems);
                              debouncedSaveMessages(updatedItems);
                            }}
                            onRoleChange={(role) => updateItemRole(item.id, role)}
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
              <div className="w-px self-stretch bg-border-dark"></div>
              
              {/* Right panel - Details */}
              <div className="flex-1 min-w-0 overflow-hidden">
                {selectedItem && (
                  <div className="w-full h-full flex flex-col justify-start items-start gap-4 min-w-0 relative p-1">
                    {items.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => deleteMessage(selectedItem.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-sm hover:opacity-80 transition-opacity z-10"
                          >
                            <Trash2 className="min-w-3.5 min-h-4 text-text-subtle" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent variant="button">
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {/* Title header */}
                    <div className="self-stretch inline-flex justify-start items-center gap-2">
                      <div className="flex-1 flex justify-start items-center gap-4">
                        <div className="justify-start text-text-body text-xs font-medium">
                          {selectedItem.type === "history" ? "History message" : "Message"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Name and role fields */}
                    {selectedItem.type === "history" ? (
                      <div className="self-stretch inline-flex justify-start items-start gap-2">
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">Name</div>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <Input
                              value={selectedItem.label}
                              onChange={(e) => {
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, label: e.target.value } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                              placeholder="History message"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="self-stretch inline-flex justify-start items-start gap-2">
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">Name</div>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <Input
                              value={selectedItem.label}
                              onChange={(e) => {
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, label: e.target.value } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                              placeholder="Enter message name"
                            />
                          </div>
                        </div>
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">Role</div>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <Select 
                              value={selectedItem.role} 
                              onValueChange={(role) => updateItemRole(selectedItem.id, role as "system" | "user" | "assistant")}
                            >
                              <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="assistant">Assistant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* History-specific fields */}
                    {selectedItem.type === "history" && (
                      <div className="self-stretch flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <div className="self-stretch inline-flex justify-start items-start gap-1">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">History range</div>
                            <TooltipProvider>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-text-info cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent variant="button">
                                  <p className="max-w-xs text-xs">
                                    Choose how to index the message range:<br/>
                                    "From start" counts from the first message onward.<br />
                                    "From end" counts backward from the latest message.<br />
                                    Count starts from 0.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <button
                              onClick={() => {
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, countFromEnd: !i.countFromEnd } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer"
                            >
                              <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                                {selectedItem.countFromEnd !== false && (
                                  <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                                )}
                              </div>
                              <div className="justify-start text-text-primary text-[10px] font-medium leading-none">
                                Count from end (newest → oldest)
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, countFromEnd: false } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer mt-1"
                            >
                              <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                                {selectedItem.countFromEnd === false && (
                                  <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                                )}
                              </div>
                              <div className="justify-start text-text-primary text-[10px] font-medium leading-none">
                                Count from start (oldest → newest)
                              </div>
                            </button>
                          </div>
                        </div>
                        <div className="self-stretch inline-flex justify-start items-center gap-2">
                          <div className="justify-start text-text-subtle text-[10px] font-medium leading-none">Messages</div>
                          <div className="w-16 inline-flex flex-col justify-start items-start gap-2">
                            <Input
                              type="number"
                              value={selectedItem.start || 0}
                              onChange={(e) => {
                                const start = parseInt(e.target.value) || 0;
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, start } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal text-center"
                              min="0"
                            />
                          </div>
                          <div className="justify-start text-text-subtle text-[10px] font-medium leading-none">to</div>
                          <div className="w-16 inline-flex flex-col justify-start items-start gap-2">
                            <Input
                              type="number"
                              value={selectedItem.end || 8}
                              onChange={(e) => {
                                const end = parseInt(e.target.value) || 8;
                                const updatedItems = items.map(i =>
                                  i.id === selectedItem.id ? { ...i, end } : i
                                );
                                setItems(updatedItems);
                                debouncedSaveMessages(updatedItems);
                              }}
                              className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal text-center"
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Description field */}
                    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
                      <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">Description</div>
                      <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
                        <div className="self-stretch flex-1 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start overflow-hidden relative min-w-0">
                          <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
                          >
                            {isExpanded ? <Minimize2 className="w-4 h-4 text-text-subtle" /> : <Maximize2 className="w-4 h-4 text-text-subtle" />}
                          </button>
                          <div className="w-full h-full">
                            <Editor
                              key={selectedItem.id} // Force new editor instance for each message
                              value={localMessageContent}
                              onChange={(value) => {
                                const newValue = value || "";
                                setLocalMessageContent(newValue);
                                debouncedSaveMessageContent(selectedItem.id, newValue);
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
                <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
                  <div className="w-full h-full bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start overflow-hidden relative">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
                    >
                      <Minimize2 className="w-4 h-4 text-text-subtle" />
                    </button>
                    <div className="w-full h-full">
                      <Editor
                        key={selectedItem.id} // Force new editor instance for each message
                        value={localMessageContent}
                        onChange={(value) => {
                          const newValue = value || "";
                          setLocalMessageContent(newValue);
                          debouncedSaveMessageContent(selectedItem.id, newValue);
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
            <div className="w-full h-full">
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
              <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
                <div className="w-full h-full">
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