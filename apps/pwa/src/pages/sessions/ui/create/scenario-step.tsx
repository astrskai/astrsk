import { useState, useRef, useEffect, useCallback } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  MessageSquare,
  BookOpen,
  Globe,
  Loader2,
  Send,
  Bot,
  User,
} from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { AccordionBase } from "@/shared/ui";
import { toastWarning, toastError } from "@/shared/ui/toast";
import { cn, logger } from "@/shared/lib";
import {
  generateScenarioResponse,
  type ScenarioBuilderMessage,
} from "@/app/services/system-agents";

// Shared input styles matching the design system
const INPUT_FOCUS_STYLES =
  "outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 focus:border-brand-500";

// Animation for newly added items - uses existing animate-fade-in-up from global.css
const FADE_IN_ANIMATION = "animate-fade-in-up";

// Chat message for AI conversation
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Character info for scenario context
export interface CharacterContext {
  name: string;
  description: string; // Limited to 500 chars
}

// Minimum characters required for scenario description
const MIN_SCENARIO_LENGTH = 400;

interface ScenarioStepProps {
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
          <button
            type="button"
            onClick={handleCopy}
            onKeyDown={handleCopyKeyDown}
            className="cursor-pointer text-neutral-500 hover:text-neutral-400"
            aria-label="Copy item"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Scenario Step
 * Second step in new session stepper for creating/editing scenario context
 */
export function ScenarioStep({
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
}: ScenarioStepProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const aiInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Track newly added items for animation (IDs that were just added by AI)
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Auto-focus AI input on mount
  useEffect(() => {
    aiInputRef.current?.focus();
  }, []);

  // Clear animation flags after animation completes
  useEffect(() => {
    if (newlyAddedIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyAddedIds(new Set());
      }, 500); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [newlyAddedIds]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Track which accordions are open
  const openFirstMessages = firstMessages
    .filter((msg) => msg.expanded)
    .map((msg) => msg.id);
  const openLorebook = lorebook
    .filter((entry) => entry.expanded)
    .map((entry) => entry.id);

  // --- First Message Handlers ---
  const addMessage = () => {
    const newId = Date.now().toString();
    onFirstMessagesChange([
      ...firstMessages,
      { id: newId, title: "New Message", content: "", expanded: true },
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
    const newId = Date.now().toString();
    onLorebookChange([
      ...lorebook,
      {
        id: newId,
        title: "New Entry",
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

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: aiPrompt,
    };
    const updatedMessages = [...chatMessages, userMessage];
    onChatMessagesChange(updatedMessages);
    setAiPrompt("");
    onIsGeneratingChange(true);

    try {
      // Convert chat messages to scenario builder format
      const scenarioMessages: ScenarioBuilderMessage[] = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

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
          ? { name: playerCharacter.name, description: playerCharacter.description }
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
          onBackgroundChange(bg);
        },
        onEditBackground: (bg: string) => {
          onBackgroundChange(bg);
        },
        onAddFirstMessage: (message: { id: string; title: string; content: string }) => {
          newIds.push(message.id);
          setNewlyAddedIds((prev) => new Set([...prev, message.id]));
          currentFirstMessages = [
            ...currentFirstMessages,
            { ...message, expanded: true },
          ];
          onFirstMessagesChange(currentFirstMessages);
        },
        onAddLorebookEntry: (entry: { id: string; title: string; keys: string; desc: string; range: number }) => {
          newIds.push(entry.id);
          setNewlyAddedIds((prev) => new Set([...prev, entry.id]));
          currentLorebook = [
            ...currentLorebook,
            { ...entry, expanded: true },
          ];
          onLorebookChange(currentLorebook);
        },
      };

      // Generate AI response with tool calling
      const result = await generateScenarioResponse({
        messages: scenarioMessages,
        currentScenario,
        callbacks,
      });

      // Add AI response to chat
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.text || "I've made the changes to your scenario.",
      };
      onChatMessagesChange([...updatedMessages, aiResponse]);

      logger.info("[ScenarioStep] AI response generated", {
        toolResults: result.toolResults?.length || 0,
      });
    } catch (error) {
      logger.error("[ScenarioStep] Error generating scenario", error);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error
          ? `Sorry, I encountered an error: ${error.message}`
          : "Sorry, I encountered an error while generating the scenario. Please check your model settings.",
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
  ]);

  // Build accordion items for First Messages
  const firstMessageItems = firstMessages.map((msg) => ({
    value: msg.id,
    className: newlyAddedIds.has(msg.id) ? FADE_IN_ANIMATION : undefined,
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
    className: newlyAddedIds.has(entry.id) ? FADE_IN_ANIMATION : undefined,
    title: (
      <AccordionItemTitle
        name={entry.title}
        onDelete={() => deleteLorebook(entry.id)}
      />
    ),
    content: (
      <div className="space-y-4">
        <Input
          label="Lorebook name"
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
          placeholder="e.g. City, Rain"
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4 overflow-hidden px-0 md:flex-row md:gap-6 md:px-6 md:pb-6">
        {/* Left Panel: AI Chat (Desktop only) */}
        <div className="hidden min-w-0 flex-1 flex-col border-border-default md:flex md:max-w-md md:rounded-xl md:border">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-border-default p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
              <Sparkles size={16} className="text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg-default">AI Assistant</h2>
              <p className="font-mono text-xs text-fg-muted">
                Generate scenario
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chatMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay">
                  <Sparkles size={20} className="text-fg-subtle" />
                </div>
                <p className="text-sm font-medium text-fg-muted">
                  Start a conversation
                </p>
                <p className="mt-1 max-w-[200px] text-xs text-fg-subtle">
                  Describe your scenario idea and I'll help you create it
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-brand-500/20"
                        : "bg-surface-overlay",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User size={14} className="text-brand-400" />
                    ) : (
                      <Bot size={14} className="text-fg-muted" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-brand-500/10 text-fg-default"
                        : "bg-surface-overlay text-fg-default",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-overlay">
                  <Bot size={14} className="text-fg-muted" />
                </div>
                <div className="rounded-xl bg-surface-overlay px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-fg-muted" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex-shrink-0 border-t border-border-default p-4">
            <div className="relative">
              <input
                ref={aiInputRef}
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your scenario idea..."
                className={cn(
                  "w-full rounded-lg border border-border-default bg-surface-raised py-2.5 pl-3 pr-10 text-sm text-fg-default placeholder:text-fg-subtle",
                  INPUT_FOCUS_STYLES,
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateScenario();
                  }
                }}
              />
              <button
                onClick={generateScenario}
                disabled={!aiPrompt.trim() || isGenerating}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Scenario + First Messages + Lorebook */}
        <div className="flex min-w-0 flex-1 flex-col border-border-default md:rounded-xl md:border">
          {/* Header */}
          <div className="flex flex-shrink-0 flex-col gap-4 border-b border-border-default p-4 md:p-6">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-fg-default md:text-2xl">
                <Globe size={20} className="text-brand-400" />
                Scenario Builder
              </h1>
              <p className="mt-1 font-mono text-xs text-fg-muted">
                Define world and context
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
            {/* Mobile: AI Generation Prompt */}
            <section className="space-y-3 md:hidden">
              <label className="text-xs font-bold text-fg-muted">
                AI generation prompt
              </label>
              <div className="relative">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your scenario idea and let AI generate it for you..."
                  className={cn(
                    "min-h-[100px] w-full resize-none rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-sm text-fg-default placeholder:text-fg-subtle",
                    INPUT_FOCUS_STYLES,
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      generateScenario();
                    }
                  }}
                />
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    onClick={generateScenario}
                    disabled={!aiPrompt.trim() || isGenerating}
                    loading={isGenerating}
                    variant="secondary"
                    size="sm"
                    icon={!isGenerating ? <Sparkles size={14} /> : undefined}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </section>

            {/* Scenario Description */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-fg-muted">
                  Scenario description
                </label>
                <span
                  className={cn(
                    "text-xs font-medium",
                    background.trim().length >= MIN_SCENARIO_LENGTH
                      ? "text-green-500"
                      : "text-fg-muted",
                  )}
                >
                  {background.trim().length} / {MIN_SCENARIO_LENGTH} min
                </span>
              </div>
              <textarea
                value={background}
                onChange={(e) => onBackgroundChange(e.target.value)}
                placeholder="Describe Scene, Location, Time Period, Ground Rules...

This sets the stage for your story."
                className={cn(
                  "min-h-[200px] w-full resize-none rounded-lg border bg-surface-raised px-4 py-3 text-sm text-fg-default placeholder:text-fg-subtle",
                  INPUT_FOCUS_STYLES,
                  background.trim().length >= MIN_SCENARIO_LENGTH
                    ? "border-green-500/50"
                    : "border-border-default",
                )}
              />
              {background.trim().length < MIN_SCENARIO_LENGTH && (
                <p className="text-xs text-fg-subtle">
                  Please write at least {MIN_SCENARIO_LENGTH} characters to continue
                </p>
              )}
            </section>

            {/* First Messages Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-fg-muted">
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
                <div className="rounded-xl border border-dashed border-border-subtle bg-canvas/50 p-6 text-center">
                  <MessageSquare
                    size={28}
                    className="mx-auto mb-2 text-fg-subtle"
                  />
                  <p className="text-xs text-fg-muted">No first messages yet</p>
                  <button
                    onClick={addMessage}
                    className="mt-2 text-xs font-bold text-brand-400 hover:text-brand-300"
                  >
                    Add your first message
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
                <label className="text-xs font-bold text-fg-muted">
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
                <div className="rounded-xl border border-dashed border-border-subtle bg-canvas/50 p-6 text-center">
                  <BookOpen size={28} className="mx-auto mb-2 text-fg-subtle" />
                  <p className="text-xs text-fg-muted">No lorebook entries yet</p>
                  <button
                    onClick={addLorebook}
                    className="mt-2 text-xs font-bold text-brand-400 hover:text-brand-300"
                  >
                    Add your first entry
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
