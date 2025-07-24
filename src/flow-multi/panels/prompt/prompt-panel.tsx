import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { debounce } from "lodash-es";
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
import { ApiType } from "@/modules/agent/domain";

// Import from new compact architecture
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { PromptPanelProps, PromptItem } from "./prompt-panel-types";
import { convertPromptMessagesToItems, convertItemsToPromptMessages } from "./prompt-panel-utils";

// Import reusable components from original (these can be reused as-is)
import { SortableItem } from "./sortable-item";
import { FormatSelectorAccordion } from "@/flow-multi/components/format-selector-accordion";

export function PromptPanel({ flowId, agentId }: PromptPanelProps) {
  // 1. Use the new flow panel hook
  const { 
    agent, 
    isLoading, 
    updateAgent,
    lastInitializedAgentId 
  } = useFlowPanel({ flowId, agentId });

  // 3. Local UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [localAccordionOpen, setLocalAccordionOpen] = useState(true);
  const [completionMode, setCompletionMode] = useState<"chat" | "text">("chat");
  const [editorContent, setEditorContent] = useState("");
  const [items, setItems] = useState<PromptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 4. Initialize state when agent changes
  useEffect(() => {
    if (agentId && agentId !== lastInitializedAgentId.current && agent) {
      // Set completion mode based on agent's API type
      const mode = agent.props.targetApiType === ApiType.Chat ? "chat" : "text";
      setCompletionMode(mode);

      if (mode === "chat") {
        // Parse agent's prompt messages into items
        const parsedItems = agent.props.promptMessages ? 
          convertPromptMessagesToItems(agent.props.promptMessages) : [];
        setItems(parsedItems);
        setSelectedItemId(parsedItems[0]?.id || "");
      } else {
        // Load text prompt
        setEditorContent(agent.props.textPrompt || "");
      }
      
      lastInitializedAgentId.current = agentId;
    }
  }, [agentId, agent]);


  // 6. Debounced save for chat messages
  const debouncedSaveToAgent = useMemo(
    () => debounce(async (items: PromptItem[]) => {
      if (!agent || !agentId) return;
      
      // Convert items to the format expected by the agent
      const promptMessages = convertItemsToPromptMessages(items);
      
      await updateAgent(agentId, { promptMessages });
    }, 300),
    [agent, agentId, updateAgent]
  );

  // 7. Debounced save for text prompt
  const debouncedSaveText = useMemo(
    () => debounce(async (text: string) => {
      if (!agent || !agentId) return;
      await updateAgent(agentId, { textPrompt: text });
    }, 300),
    [agent, agentId, updateAgent]
  );

  // 8. Save API type when completion mode changes
  const saveApiType = useCallback(async (apiType: ApiType) => {
    if (!agent || !agentId) return;
    await updateAgent(agentId, { targetApiType: apiType });
  }, [agent, agentId, updateAgent]);

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
        debouncedSaveToAgent(reorderedItems);
        
        return reorderedItems;
      });
    }
  };

  // Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 11. Editor mount handlers for variable insertion tracking (no redundancy)
  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      // Track editor and cursor position for variable insertion
      const position = editor.getPosition();
      if (position) {
        setLastMonacoEditor(agentId, `prompt-${agentId}-${flowId}`, editor, position);
      }
    });
    
    editor.onDidBlurEditorWidget(() => {
      // Clear editor tracking when focus lost
      setLastMonacoEditor(null, null, null, null);
    });
    
    // Update position on cursor change
    editor.onDidChangeCursorPosition((e) => {
      setLastMonacoEditor(agentId, `prompt-${agentId}-${flowId}`, editor, e.position);
    });
  }, [agentId, flowId, setLastMonacoEditor]);

  // 12. Handle completion mode change
  const handleCompletionModeChange = useCallback((mode: "chat" | "text") => {
    setCompletionMode(mode);
    
    // Save the API type to the agent
    const apiType = mode === "chat" ? ApiType.Chat : ApiType.Text;
    saveApiType(apiType);
    
    // Re-parse content for the new mode
    if (agent) {
      if (mode === "chat") {
        const agentItems = agent.props.promptMessages ? 
          convertPromptMessagesToItems(agent.props.promptMessages) : [];
        setItems(agentItems);
        setSelectedItemId(agentItems[0]?.id || "");
      } else {
        setEditorContent(agent.props.textPrompt || "");
      }
    }
  }, [agent, saveApiType]);

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
    debouncedSaveToAgent(updatedItems);
  }, [items, debouncedSaveToAgent]);

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
    debouncedSaveToAgent(updatedItems);
  }, [items, debouncedSaveToAgent]);

  const updateItemRole = useCallback((itemId: string, newRole: "system" | "user" | "assistant") => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, role: newRole } : item
    );
    setItems(updatedItems);
    debouncedSaveToAgent(updatedItems);
  }, [items, debouncedSaveToAgent]);

  const deleteMessage = useCallback((itemId: string) => {
    if (items.length <= 1) return;
    
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    
    if (selectedItemId === itemId) {
      setSelectedItemId(updatedItems[0]?.id || "");
    }
    
    debouncedSaveToAgent(updatedItems);
  }, [items, selectedItemId, debouncedSaveToAgent]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      debouncedSaveText(value);
    }
  };

  // 14. Early returns for loading/error states
  if (isLoading) {
    return <FlowPanelLoading message="Loading prompt panel..." />;
  }

  if (!agent) {
    return <FlowPanelError message="Agent not found" />;
  }

  const selectedItem = items.find(item => item.id === selectedItemId);

  // 15. Main render
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
                            isSelected={item.id === selectedItemId}
                            onClick={() => setSelectedItemId(item.id)}
                            onToggle={(checked) => {
                              const updatedItems = items.map(i => 
                                i.id === item.id ? { ...i, enabled: checked } : i
                              );
                              setItems(updatedItems);
                              debouncedSaveToAgent(updatedItems);
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
                      <button
                        onClick={() => deleteMessage(selectedItem.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-sm hover:opacity-80 transition-opacity z-10"
                      >
                        <Trash2 className="min-w-3.5 min-h-4 text-text-subtle" />
                      </button>
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
                                debouncedSaveToAgent(updatedItems);
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
                                debouncedSaveToAgent(updatedItems);
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
                                debouncedSaveToAgent(updatedItems);
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
                                debouncedSaveToAgent(updatedItems);
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
                                debouncedSaveToAgent(updatedItems);
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
                                debouncedSaveToAgent(updatedItems);
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
                              value={selectedItem.content}
                              onChange={(value) => {
                                const updatedItems = items.map(item => 
                                  item.id === selectedItemId 
                                    ? { ...item, content: value || "" }
                                    : item
                                );
                                setItems(updatedItems);
                                debouncedSaveToAgent(updatedItems);
                              }}
                              language="markdown"
                              onMount={handleEditorMount}
                              containerClassName="h-full"
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
                        value={selectedItem.content}
                        onChange={(value) => {
                          const updatedItems = items.map(item => 
                            item.id === selectedItemId 
                              ? { ...item, content: value || "" }
                              : item
                          );
                          setItems(updatedItems);
                          debouncedSaveToAgent(updatedItems);
                        }}
                        language="markdown"
                        onMount={handleEditorMount}
                        containerClassName="h-full"
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