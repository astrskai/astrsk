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

import { Trash2, Plus, HelpCircle } from "lucide-react";
import {
  Button,
  Editor,
  Input,
  ScrollAreaSimple,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";

import { PlotCard, ScenarioCard } from "@/entities/card/domain";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";

// Import queries and mutations
import { cardQueries, useUpdateCardScenarios } from "@/entities/card/api";

// Import the sortable component
import { SortableItem } from "./sortable-item";

// Import our abstraction
import {
  CardPanelProps,
  CardPanelLoading,
  CardPanelError,
  CardPanelEmpty,
} from "@/features/card/panels/hooks/use-card-panel";

interface FirstMessage {
  id: string;
  name: string;
  description: string;
}

export function FirstMessagesPanel({ cardId }: CardPanelProps) {
  // 1. Mutation for updating first messages
  const updateFirstMessages = useUpdateCardScenarios(cardId);

  // 2. Query for card data - disable refetching while mutation is pending
  const { data: card, isLoading } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: !!cardId && !updateFirstMessages.isPending,
  });

  // 3. UI state (expansion, errors, etc.)
  const [selectedFirstMessageId, setSelectedFirstMessageId] = useState<
    string | null
  >(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // 4. Local form state (for immediate UI feedback)
  const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([]);

  // 5. Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastInitializedCardId = useRef<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 5. Initialize and sync data (cross-tab synchronization)
  useEffect(() => {
    // Initialize when card changes
    if (
      cardId &&
      cardId !== lastInitializedCardId.current &&
      card &&
      (card instanceof PlotCard || card instanceof ScenarioCard)
    ) {
      // PlotCard uses 'scenarios', ScenarioCard uses 'firstMessages'
      let messagesData: { name: string; description: string }[] | undefined;
      if (card instanceof PlotCard) {
        messagesData = card.props.scenarios;
      } else if (card instanceof ScenarioCard) {
        messagesData = card.props.firstMessages;
      }

      const firstMessageList =
        messagesData?.map((message, index) => ({
          id: `first-message-${index}`,
          name: message.name || "",
          description: message.description || "",
        })) || [];
      setFirstMessages(firstMessageList);
      if (firstMessageList.length > 0 && !selectedFirstMessageId) {
        setSelectedFirstMessageId(firstMessageList[0].id);
      }
      lastInitializedCardId.current = cardId;
    }
    // Sync when card changes externally (cross-tab sync) - but not during mutation
    else if (
      card &&
      (card instanceof PlotCard || card instanceof ScenarioCard) &&
      !updateFirstMessages.isPending &&
      !updateFirstMessages.hasCursor
    ) {
      // PlotCard uses 'scenarios', ScenarioCard uses 'firstMessages'
      let messagesData: { name: string; description: string }[] | undefined;
      if (card instanceof PlotCard) {
        messagesData = card.props.scenarios;
      } else if (card instanceof ScenarioCard) {
        messagesData = card.props.firstMessages;
      }

      const newFirstMessages =
        messagesData?.map((message, index) => ({
          id: `first-message-${index}`,
          name: message.name || "",
          description: message.description || "",
        })) || [];

      // Select result caching handles object stability
      setFirstMessages(newFirstMessages);
      // Keep selected first message if it still exists
      if (
        selectedFirstMessageId &&
        !newFirstMessages.find(
          (message) => message.id === selectedFirstMessageId,
        )
      ) {
        setSelectedFirstMessageId(newFirstMessages[0]?.id || null);
      }
    }
  }, [
    cardId,
    card,
    updateFirstMessages.isPending,
    updateFirstMessages.hasCursor,
    selectedFirstMessageId,
  ]);

  // Focus on name input when selected first message changes
  useEffect(() => {
    if (selectedFirstMessageId && nameInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
    }
  }, [selectedFirstMessageId]);

  // 6. Helper function to save first messages using mutation
  const saveFirstMessages = useCallback(
    (newFirstMessages: FirstMessage[]) => {
      if (
        !card ||
        !(card instanceof PlotCard || card instanceof ScenarioCard)
      )
        return;

      // Check for actual changes inline
      // PlotCard uses 'scenarios', ScenarioCard uses 'firstMessages'
      let currentFirstMessages: { name: string; description: string }[] = [];
      if (card instanceof PlotCard) {
        currentFirstMessages = card.props.scenarios || [];
      } else if (card instanceof ScenarioCard) {
        currentFirstMessages = card.props.firstMessages || [];
      }

      // Convert first messages to domain objects
      const firstMessagesData = newFirstMessages.map((message) => ({
        name: message.name,
        description: message.description,
      }));

      // Check if first messages count differs or content differs
      const hasChanges =
        newFirstMessages.length !== currentFirstMessages.length ||
        newFirstMessages.some((message, index) => {
          const currentMessage = currentFirstMessages[index];
          if (!currentMessage) return true;
          return (
            message.name !== (currentMessage.name || "") ||
            message.description !== (currentMessage.description || "")
          );
        });

      if (hasChanges) {
        updateFirstMessages.mutate(firstMessagesData);
      }
    },
    [card, updateFirstMessages],
  );

  // 7. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () =>
      debounce((newFirstMessages: FirstMessage[]) => {
        saveFirstMessages(newFirstMessages);
      }, 300),
    [saveFirstMessages],
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
        updateFirstMessages.setCursorActive(true);
      });

      // Track blur - mark cursor as inactive
      editor.onDidBlurEditorWidget(() => {
        updateFirstMessages.setCursorActive(false);
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
    [updateFirstMessages],
  );

  const selectedFirstMessage = firstMessages.find(
    (message) => message.id === selectedFirstMessageId,
  );

  // 8. Change handlers that pass current values
  const handleAddFirstMessage = useCallback(() => {
    const newFirstMessage: FirstMessage = {
      id: `first-message-${Date.now()}`,
      name: `First Message ${firstMessages.length + 1}`,
      description: "",
    };
    const newFirstMessages = [...firstMessages, newFirstMessage];
    setFirstMessages(newFirstMessages);
    setSelectedFirstMessageId(newFirstMessage.id);
    // Save immediately for user-initiated actions like adding first messages
    saveFirstMessages(newFirstMessages);
  }, [firstMessages, saveFirstMessages]);

  const handleDeleteFirstMessage = useCallback(
    (firstMessageId: string) => {
      const newFirstMessages = firstMessages.filter(
        (message) => message.id !== firstMessageId,
      );
      setFirstMessages(newFirstMessages);
      if (selectedFirstMessageId === firstMessageId) {
        setSelectedFirstMessageId(
          newFirstMessages.length > 0 ? newFirstMessages[0].id : null,
        );
      }
      // Save immediately for user-initiated actions like deleting first messages
      saveFirstMessages(newFirstMessages);
    },
    [firstMessages, selectedFirstMessageId, saveFirstMessages],
  );

  const handleUpdateFirstMessage = useCallback(
    (firstMessageId: string, updates: Partial<FirstMessage>) => {
      const newFirstMessages = firstMessages.map((message) =>
        message.id === firstMessageId ? { ...message, ...updates } : message,
      );
      setFirstMessages(newFirstMessages);
      debouncedSave(newFirstMessages);
    },
    [firstMessages, debouncedSave],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = firstMessages.findIndex(
          (message) => message.id === active.id,
        );
        const newIndex = firstMessages.findIndex(
          (message) => message.id === over.id,
        );
        const newFirstMessages = arrayMove(firstMessages, oldIndex, newIndex);
        setFirstMessages(newFirstMessages);
        // Save immediately for user-initiated actions like reordering
        saveFirstMessages(newFirstMessages);
      }
    },
    [firstMessages, saveFirstMessages],
  );

  // 9. Early returns
  if (isLoading) {
    return <CardPanelLoading message="Loading first messages..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  if (!(card instanceof PlotCard || card instanceof ScenarioCard)) {
    return (
      <CardPanelError message="First messages are only available for scenario cards" />
    );
  }

  // 10. Render
  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="bg-background-surface-2 relative flex h-full flex-col"
      >
        <div className="flex-1 overflow-hidden p-2">
          {!selectedFirstMessage && firstMessages.length === 0 ? (
            <CardPanelEmpty
              title="No First Message"
              description="First messages set the opening scene for your session"
              action={
                <Button
                  onClick={handleAddFirstMessage}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="min-h-4 min-w-4" />
                  Create new first message
                </Button>
              }
            />
          ) : (
            <div className="flex h-full min-w-0 gap-2">
              {/* Left panel - First Message list */}
              <div className="flex max-w-[256px] min-w-[146px] flex-1 flex-col gap-2 overflow-hidden">
                <div className="inline-flex items-center justify-start gap-2 self-stretch overflow-hidden pr-2 pl-7">
                  <button
                    onClick={handleAddFirstMessage}
                    className="bg-background-surface-4 outline-border-light hover:bg-background-surface-3 flex h-7 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
                  >
                    <Plus className="text-text-body max-h-4 max-w-4 flex-shrink-0" />
                    <div className="text-text-primary justify-center truncate text-xs leading-none font-semibold">
                      First Message
                    </div>
                  </button>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="text-text-info max-h-[16px] max-w-[16px] flex-shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>
                        The first messages in this list are <br />
                        available for selection as
                        <br /> session opening messages.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {firstMessages.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-text-subtle text-xs">
                      No first messages yet. Click "First Message" to add your
                      first message.
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
                        items={firstMessages.map((message) => message.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-2 pr-2">
                          {firstMessages.map((message) => (
                            <SortableItem
                              key={message.id}
                              item={message}
                              isSelected={message.id === selectedFirstMessageId}
                              onClick={() =>
                                setSelectedFirstMessageId(message.id)
                              }
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

              {/* Right panel - First Message details */}
              <div className="min-w-0 flex-1 overflow-hidden">
                {selectedFirstMessage ? (
                  <div className="relative flex h-full w-full min-w-0 flex-col items-start justify-start gap-4 p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            handleDeleteFirstMessage(selectedFirstMessage.id)
                          }
                          className="absolute top-1 right-1 z-10 h-6 w-6 rounded-sm transition-opacity hover:opacity-80"
                        >
                          <Trash2 className="text-text-subtle min-h-4 min-w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" variant="button">
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* First Message name field */}
                    <div className="mt-8 flex flex-col items-start justify-start gap-2 self-stretch">
                      <div className="inline-flex items-center justify-start gap-2 self-stretch">
                        <div className="text-text-body justify-start text-[10px] leading-none font-medium">
                          First Message name
                        </div>
                      </div>
                      <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                        <Input
                          ref={nameInputRef}
                          value={selectedFirstMessage.name}
                          onChange={(e) =>
                            handleUpdateFirstMessage(selectedFirstMessage.id, {
                              name: e.target.value,
                            })
                          }
                          onFocus={() =>
                            updateFirstMessages.setCursorActive(true)
                          }
                          onBlur={() =>
                            updateFirstMessages.setCursorActive(false)
                          }
                          className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
                          placeholder=""
                        />
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
                            value={selectedFirstMessage.description}
                            onChange={(value) =>
                              handleUpdateFirstMessage(
                                selectedFirstMessage.id,
                                {
                                  description: value || "",
                                },
                              )
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
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-text-subtle text-xs">
                      Select a first message to edit its details
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expanded Editor View */}
        {isDescriptionExpanded && selectedFirstMessage && (
          <div className="bg-background-surface-2 absolute inset-0 z-20 p-4">
            <div className="h-full w-full">
              <Editor
                value={selectedFirstMessage.description}
                onChange={(value) =>
                  handleUpdateFirstMessage(selectedFirstMessage.id, {
                    description: value || "",
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
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
