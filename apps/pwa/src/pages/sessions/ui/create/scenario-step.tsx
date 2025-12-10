import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  MessageSquare,
  BookOpen,
  Globe,
  Check,
} from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { AccordionBase } from "@/shared/ui";
import { toastWarning, toastError } from "@/shared/ui/toast";
import { cn, logger } from "@/shared/lib";
import { useTypingEffect } from "@/shared/hooks/use-typing-effect";
import {
  generateScenarioResponse,
  type ScenarioBuilderMessage,
} from "@/app/services/system-agents";
import { ChatPanel, CHAT_AGENTS, type ChatMessage } from "./chat-panel";
import { StepHeader } from "./step-header";
import { MobileTabNav, type MobileTab } from "./mobile-tab-nav";
import type { SessionStep } from "./session-stepper";

// Animation for newly added items - highlight effect that fades out
const NEW_ITEM_ANIMATION = "animate-new-item-highlight";

// Re-export ChatMessage for backwards compatibility
export type { ChatMessage };

// Character info for scenario context
export interface CharacterContext {
  name: string;
  description: string; // Limited to 500 chars
}

// Minimum characters required for scenario description
const MIN_SCENARIO_LENGTH = 400;

// Initial welcome message content
const WELCOME_MESSAGE_CONTENT =
  "Hi! I'm here to help you build your scenario. Tell me about the world, setting, or story you'd like to create, and I'll help you craft the background, first messages, and lorebook entries.";

interface ScenarioStepProps {
  // Current step for tagging chat messages
  currentStep: SessionStep;
  // Scenario data
  background: string;
  onBackgroundChange: (background: string) => void;
  firstMessages: FirstMessage[];
  onFirstMessagesChange: (messages: FirstMessage[]) => void;
  lorebook: LorebookEntry[];
  onLorebookChange: (entries: LorebookEntry[]) => void;
  // Chat messages (lifted to parent for persistence across step navigation)
  chatMessages: ChatMessage[];
  onChatMessagesChange: (messages: ChatMessage[]) => void;
  // Character context for AI generation
  playerCharacter?: CharacterContext;
  aiCharacters?: CharacterContext[];
  // Generation state (lifted to parent to disable navigation)
  isGenerating: boolean;
  onIsGeneratingChange: (isGenerating: boolean) => void;
  // Mobile tab state (controlled by parent for navigation)
  mobileTab: "chat" | "builder";
  onMobileTabChange: (tab: "chat" | "builder") => void;
}

export interface FirstMessage {
  id: string;
  title: string;
  content: string;
  expanded: boolean;
}

export interface LorebookEntry {
  id: string;
  title: string;
  keys: string;
  desc: string;
  range: number;
  expanded: boolean;
}

/**
 * Accordion Item Title with actions (delete, copy)
 */
const AccordionItemTitle = ({
  name,
  onDelete,
  onCopy,
}: {
  name: string;
  onDelete?: (e: MouseEvent | KeyboardEvent) => void;
  onCopy?: (e: MouseEvent | KeyboardEvent) => void;
}) => {
  const handleDelete = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    onDelete?.(e);
  };

  const handleCopy = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    onCopy?.(e);
  };

  const handleCopyKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onCopy?.(e);
    }
  };

  const handleDeleteKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(e);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="max-w-[200px] truncate sm:max-w-sm md:max-w-full">
        {name || "Untitled"}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {onCopy && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            onKeyDown={handleCopyKeyDown}
            className="cursor-pointer text-neutral-500 hover:text-neutral-400"
            aria-label="Copy item"
          >
            <Copy className="h-4 w-4" />
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

/**
 * Scenario Step
 * Second step in new session stepper for creating/editing scenario context
 */
export function ScenarioStep({
  currentStep,
  background,
  onBackgroundChange,
  firstMessages,
  onFirstMessagesChange,
  lorebook,
  onLorebookChange,
  chatMessages,
  onChatMessagesChange,
  playerCharacter,
  aiCharacters,
  isGenerating,
  onIsGeneratingChange,
  mobileTab,
  onMobileTabChange,
}: ScenarioStepProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track newly added items for animation (IDs that were just added by AI)
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Track when background was just updated by AI for animation
  const [isBackgroundAnimating, setIsBackgroundAnimating] = useState(false);

  // Track initial typing indicator state (before text streaming starts)
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);

  // Welcome message typing effect
  const {
    displayText: welcomeDisplayText,
    isTyping: isWelcomeTyping,
    startTyping: startWelcomeTyping,
  } = useTypingEffect({
    onComplete: () => {
      // Update to final message when typing completes
      onChatMessagesChange([
        {
          id: "welcome",
          role: "assistant",
          content: WELCOME_MESSAGE_CONTENT,
        },
      ]);
    },
  });

  // Background typing effect (faster for long scenario descriptions)
  const {
    displayText: backgroundDisplayText,
    isTyping: isBackgroundTyping,
    startTyping: startBackgroundTyping,
  } = useTypingEffect({
    speed: 8, // Faster base speed
    minSpeed: 2, // Very fast minimum for long text
    maxSpeed: 10,
    speedThreshold: 100, // Start speeding up earlier
  });

  // Track the final background text (for when typing completes)
  const [pendingBackground, setPendingBackground] = useState<string | null>(null);

  // Update actual background when typing completes
  useEffect(() => {
    if (!isBackgroundTyping && pendingBackground !== null) {
      onBackgroundChange(pendingBackground);
      setPendingBackground(null);
    }
  }, [isBackgroundTyping, pendingBackground, onBackgroundChange]);

  // Add initial welcome message with typing indicator then streaming text effect
  useEffect(() => {
    if (chatMessages.length === 0) {
      setIsTypingIndicator(true);

      // After typing indicator, start streaming the text
      const typingTimer = setTimeout(() => {
        setIsTypingIndicator(false);

        // Add empty message that will be updated with streaming text
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          role: "assistant",
          content: "",
        };
        onChatMessagesChange([welcomeMessage]);

        // Start typing effect
        startWelcomeTyping(WELCOME_MESSAGE_CONTENT);
      }, 1500); // Show typing indicator for 1.5 seconds

      return () => clearTimeout(typingTimer);
    }
  }, []); // Only run on mount

  // Compute messages with streaming text applied
  const displayMessages = useMemo(() => {
    // Welcome message typing
    if (isWelcomeTyping && chatMessages.length > 0 && chatMessages[0]?.id === "welcome") {
      return [{ ...chatMessages[0], content: welcomeDisplayText }];
    }
    return chatMessages;
  }, [chatMessages, isWelcomeTyping, welcomeDisplayText]);

  // Clear animation flags after animation completes
  useEffect(() => {
    if (newlyAddedIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyAddedIds(new Set());
      }, 1200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [newlyAddedIds]);

  // Clear background animation flag after animation completes
  useEffect(() => {
    if (isBackgroundAnimating) {
      const timer = setTimeout(() => {
        setIsBackgroundAnimating(false);
      }, 800); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isBackgroundAnimating]);

  // Track which accordions are open
  const openFirstMessages = firstMessages
    .filter((msg) => msg.expanded)
    .map((msg) => msg.id);
  const openLorebook = lorebook
    .filter((entry) => entry.expanded)
    .map((entry) => entry.id);

  // --- First Message Handlers ---
  const addMessage = () => {
    const newId = crypto.randomUUID();
    onFirstMessagesChange([
      ...firstMessages,
      { id: newId, title: "", content: "", expanded: true },
    ]);
  };

  const updateMessage = (
    id: string,
    field: keyof FirstMessage,
    value: string | boolean,
  ) => {
    onFirstMessagesChange(
      firstMessages.map((msg) =>
        msg.id === id ? { ...msg, [field]: value } : msg,
      ),
    );
  };

  const deleteMessage = (id: string) => {
    if (firstMessages.length > 0) {
      onFirstMessagesChange(firstMessages.filter((msg) => msg.id !== id));
    }
  };

  const handleFirstMessagesAccordionChange = (value: string | string[]) => {
    const openIds = Array.isArray(value) ? value : value ? [value] : [];
    onFirstMessagesChange(
      firstMessages.map((msg) => ({
        ...msg,
        expanded: openIds.includes(msg.id),
      })),
    );
  };

  // --- Lorebook Handlers ---
  const addLorebook = () => {
    const newId = crypto.randomUUID();
    onLorebookChange([
      ...lorebook,
      {
        id: newId,
        title: "",
        keys: "",
        desc: "",
        range: 2,
        expanded: true,
      },
    ]);
  };

  const updateLorebook = (
    id: string,
    field: keyof LorebookEntry,
    value: string | number | boolean,
  ) => {
    onLorebookChange(
      lorebook.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const deleteLorebook = (id: string) => {
    onLorebookChange(lorebook.filter((entry) => entry.id !== id));
  };

  const handleLorebookAccordionChange = (value: string | string[]) => {
    const openIds = Array.isArray(value) ? value : value ? [value] : [];
    onLorebookChange(
      lorebook.map((entry) => ({
        ...entry,
        expanded: openIds.includes(entry.id),
      })),
    );
  };

  // --- AI Generation with Tool Calling ---
  const generateScenario = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toastWarning("Please enter a prompt to generate a scenario");
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: aiPrompt,
      step: currentStep,
    };
    const updatedMessages = [...chatMessages, userMessage];
    onChatMessagesChange(updatedMessages);
    setAiPrompt("");
    onIsGeneratingChange(true);

    try {
      // Convert chat messages to scenario builder format
      const scenarioMessages: ScenarioBuilderMessage[] = updatedMessages.map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        }),
      );

      // Current scenario data for the agent to work with
      const currentScenario = {
        background,
        firstMessages: firstMessages.map((msg) => ({
          id: msg.id,
          title: msg.title,
          content: msg.content,
        })),
        lorebook: lorebook.map((entry) => ({
          id: entry.id,
          title: entry.title,
          keys: entry.keys,
          desc: entry.desc,
          range: entry.range,
        })),
        // Include character context for AI generation
        playerCharacter: playerCharacter
          ? {
              name: playerCharacter.name,
              description: playerCharacter.description,
            }
          : undefined,
        aiCharacters: aiCharacters?.map((char) => ({
          name: char.name,
          description: char.description,
        })),
      };

      // Track IDs for animation and current state for incremental updates
      const newIds: string[] = [];
      let currentFirstMessages = [...firstMessages];
      let currentLorebook = [...lorebook];

      // Callbacks update UI immediately as each tool executes
      const callbacks = {
        onSetBackground: (bg: string) => {
          setIsBackgroundAnimating(true);
          setPendingBackground(bg);
          startBackgroundTyping(bg);
        },
        onEditBackground: (bg: string) => {
          setIsBackgroundAnimating(true);
          setPendingBackground(bg);
          startBackgroundTyping(bg);
        },
        onAddFirstMessage: (message: {
          id: string;
          title: string;
          content: string;
        }) => {
          newIds.push(message.id);
          setNewlyAddedIds((prev) => new Set([...prev, message.id]));
          currentFirstMessages = [
            ...currentFirstMessages,
            { ...message, expanded: true },
          ];
          onFirstMessagesChange(currentFirstMessages);
        },
        onUpdateFirstMessage: (
          id: string,
          updates: { title?: string; content?: string },
        ) => {
          setNewlyAddedIds((prev) => new Set([...prev, id]));
          currentFirstMessages = currentFirstMessages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg,
          );
          onFirstMessagesChange(currentFirstMessages);
        },
        onAddLorebookEntry: (entry: {
          id: string;
          title: string;
          keys: string;
          desc: string;
          range: number;
        }) => {
          newIds.push(entry.id);
          setNewlyAddedIds((prev) => new Set([...prev, entry.id]));
          currentLorebook = [...currentLorebook, { ...entry, expanded: true }];
          onLorebookChange(currentLorebook);
        },
        onUpdateLorebookEntry: (
          id: string,
          updates: {
            title?: string;
            keys?: string;
            desc?: string;
            range?: number;
          },
        ) => {
          setNewlyAddedIds((prev) => new Set([...prev, id]));
          currentLorebook = currentLorebook.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry,
          );
          onLorebookChange(currentLorebook);
        },
      };

      // Generate AI response with tool calling (streaming)
      const responseStream = generateScenarioResponse({
        messages: scenarioMessages,
        currentScenario,
        callbacks,
        abortSignal: abortControllerRef.current.signal,
      });

      // Create AI response message that will be updated as stream arrives
      const aiResponseId = crypto.randomUUID();
      const aiResponse: ChatMessage = {
        id: aiResponseId,
        role: "assistant",
        content: "",
        step: currentStep,
      };

      // Add initial empty message
      let currentMessages = [...updatedMessages, aiResponse];
      onChatMessagesChange(currentMessages);

      let finalResult: { text: string; toolResults: unknown[] } | null = null;

      // Stream text updates
      for await (const chunk of responseStream) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Update the AI message with accumulated text
        currentMessages = currentMessages.map((msg) =>
          msg.id === aiResponseId
            ? { ...msg, content: chunk.text || "I've made the changes to your scenario." }
            : msg
        );
        onChatMessagesChange(currentMessages);

        finalResult = chunk;
      }

      // If tools were executed, switch to builder tab on mobile for better UX
      if (finalResult && finalResult.toolResults && finalResult.toolResults.length > 0) {
        onMobileTabChange("builder");
      }

      logger.info("[ScenarioStep] AI response generated", {
        toolResults: finalResult?.toolResults?.length || 0,
      });
    } catch (error) {
      // Check if this was an abort - don't show error for user-initiated abort
      if ((error as Error).name === "AbortError" || abortControllerRef.current?.signal.aborted) {
        return;
      }

      logger.error("[ScenarioStep] Error generating scenario", error);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? `Sorry, I encountered an error: ${error.message}`
            : "Sorry, I encountered an error while generating the scenario. Please check your model settings.",
        step: currentStep,
      };
      onChatMessagesChange([...updatedMessages, errorMessage]);

      toastError("Failed to generate scenario", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      onIsGeneratingChange(false);
    }
  }, [
    aiPrompt,
    chatMessages,
    background,
    firstMessages,
    lorebook,
    onBackgroundChange,
    onFirstMessagesChange,
    onLorebookChange,
    onChatMessagesChange,
    playerCharacter,
    aiCharacters,
    onIsGeneratingChange,
    onMobileTabChange,
    currentStep,
  ]);

  // Build accordion items for First Messages
  const firstMessageItems = firstMessages.map((msg) => ({
    value: msg.id,
    className: newlyAddedIds.has(msg.id) ? NEW_ITEM_ANIMATION : undefined,
    title: (
      <AccordionItemTitle
        name={msg.title}
        onDelete={() => deleteMessage(msg.id)}
      />
    ),
    content: (
      <div className="space-y-4">
        <Input
          label="Name"
          labelPosition="inner"
          isRequired
          value={msg.title}
          onChange={(e) => updateMessage(msg.id, "title", e.target.value)}
        />
        <Textarea
          label="Content"
          labelPosition="inner"
          isRequired
          autoResize
          value={msg.content}
          onChange={(e) => updateMessage(msg.id, "content", e.target.value)}
        />
      </div>
    ),
  }));

  // Build accordion items for Lorebook
  const lorebookItems = lorebook.map((entry) => ({
    value: entry.id,
    className: newlyAddedIds.has(entry.id) ? NEW_ITEM_ANIMATION : undefined,
    title: (
      <AccordionItemTitle
        name={entry.title}
        onDelete={() => deleteLorebook(entry.id)}
      />
    ),
    content: (
      <div className="space-y-4">
        <Input
          label="Name"
          labelPosition="inner"
          isRequired
          value={entry.title}
          onChange={(e) => updateLorebook(entry.id, "title", e.target.value)}
        />
        <Input
          label="Trigger keywords"
          labelPosition="inner"
          isRequired
          value={entry.keys}
          onChange={(e) => updateLorebook(entry.id, "keys", e.target.value)}
        />
        <Textarea
          label="Description"
          labelPosition="inner"
          isRequired
          autoResize
          value={entry.desc}
          onChange={(e) => updateLorebook(entry.id, "desc", e.target.value)}
        />
        <Input
          label="Recall range"
          labelPosition="inner"
          isRequired
          type="number"
          value={entry.range.toString()}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 0 && value <= 100) {
              updateLorebook(entry.id, "range", value);
            }
          }}
          helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
          caption="Min 0 / Max 100"
        />
      </div>
    ),
  }));

  // Handle chat submit (wraps generateScenario)
  const handleChatSubmit = useCallback(() => {
    if (!aiPrompt.trim()) return;
    generateScenario();
  }, [aiPrompt, generateScenario]);

  // Handle chat stop (abort generation and show cancelled message)
  const handleChatStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      // Keep the reference so catch block can check signal.aborted
    }
    onIsGeneratingChange(false);

    // Add cancelled message to chat
    const cancelledMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Response generation was stopped by user.",
      step: currentStep,
      variant: "cancelled",
    };
    onChatMessagesChange([...chatMessages, cancelledMessage]);
  }, [currentStep, onChatMessagesChange, chatMessages, onIsGeneratingChange]);

  // Mobile tab configuration
  const mobileTabs = useMemo<MobileTab<"builder" | "chat">[]>(
    () => [
      { value: "builder", label: "Builder", icon: <Globe size={14} /> },
      { value: "chat", label: "AI", icon: <Sparkles size={14} /> },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mobile Tab Nav */}
      <MobileTabNav
        value={mobileTab}
        onValueChange={onMobileTabChange}
        tabs={mobileTabs}
      />

      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-4 overflow-hidden px-0 md:flex-row md:gap-6 md:px-6 md:pb-6">
        {/* Left Panel: AI Chat */}
        <ChatPanel
          messages={displayMessages}
          agent={CHAT_AGENTS.scenario}
          inputValue={aiPrompt}
          onInputChange={setAiPrompt}
          onSubmit={handleChatSubmit}
          onStop={isGenerating ? handleChatStop : undefined}
          isLoading={isGenerating || isTypingIndicator}
          disabled={isGenerating || isTypingIndicator || isWelcomeTyping || isBackgroundTyping}
          className={mobileTab === "chat" ? "" : "hidden md:flex"}
        />

        {/* Right Panel: Scenario + First Messages + Lorebook */}
        <div
          className={cn(
            "border-border-default flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:rounded-xl md:border",
            mobileTab === "builder" ? "" : "hidden md:flex",
          )}
        >
          <StepHeader
            icon={<Globe size={20} />}
            title="Scenario Builder"
            subtitle="Define world and context"
          />

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
            {/* Scenario Description */}
            <section className="space-y-3">
              <div
                className={cn(
                  "rounded-xl transition-all duration-300",
                  isBackgroundAnimating && "animate-pulse-highlight",
                )}
              >
                <Textarea
                  label="Scenario description"
                  labelPosition="inner"
                  autoResize
                  value={isBackgroundTyping ? backgroundDisplayText : background}
                  onChange={(e) => onBackgroundChange(e.target.value)}
                  disabled={isBackgroundTyping}
                  className="min-h-[200px]"
                  caption={(() => {
                    const displayedText = isBackgroundTyping ? backgroundDisplayText : background;
                    const textLength = displayedText.trim().length;
                    return (
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "tabular-nums transition-colors",
                            textLength >= MIN_SCENARIO_LENGTH
                              ? "text-green-500"
                              : textLength >= MIN_SCENARIO_LENGTH * 0.75
                                ? "text-yellow-500"
                                : "text-neutral-500",
                          )}
                        >
                          {textLength}
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="text-neutral-500">
                          {MIN_SCENARIO_LENGTH}
                        </span>
                        {textLength < MIN_SCENARIO_LENGTH && (
                          <span className="text-neutral-500">min</span>
                        )}
                        {textLength >= MIN_SCENARIO_LENGTH && (
                          <Check size={12} className="text-green-500" />
                        )}
                      </div>
                    );
                  })()}
                />
              </div>
            </section>

            {/* First Messages Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-400">
                  First messages
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMessage}
                  icon={<Plus size={14} />}
                >
                  Add
                </Button>
              </div>

              {firstMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-5 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <MessageSquare size={14} className="text-zinc-400" />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-400">
                    No first messages yet
                  </p>
                  <button
                    onClick={addMessage}
                    className="mt-1 text-[10px] text-zinc-500 hover:text-zinc-400"
                  >
                    Click to add one
                  </button>
                </div>
              ) : (
                <AccordionBase
                  type="multiple"
                  items={firstMessageItems}
                  value={openFirstMessages}
                  onValueChange={handleFirstMessagesAccordionChange}
                />
              )}
            </section>

            {/* Lorebook Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-400">
                  Lorebook
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addLorebook}
                  icon={<Plus size={14} />}
                >
                  Add
                </Button>
              </div>

              {lorebook.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-5 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <BookOpen size={14} className="text-zinc-400" />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-400">
                    No lorebook entries yet
                  </p>
                  <button
                    onClick={addLorebook}
                    className="mt-1 text-[10px] text-zinc-500 hover:text-zinc-400"
                  >
                    Click to add one
                  </button>
                </div>
              ) : (
                <AccordionBase
                  type="multiple"
                  items={lorebookItems}
                  value={openLorebook}
                  onValueChange={handleLorebookAccordionChange}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScenarioStep;
