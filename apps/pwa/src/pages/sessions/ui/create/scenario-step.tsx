import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Copy,
  MessageSquare,
  BookOpen,
  Check,
  Sparkles,
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
import type { ChatMessage } from "./chat-panel";
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

// Generation progress tracking
type GenerationSection = "background" | "firstMessages" | "lorebook";

interface GenerationProgress {
  currentSection: GenerationSection | null;
  counts: {
    background: boolean; // true if updated
    firstMessages: number;
    lorebook: number;
  };
}

// Initial welcome message content
const WELCOME_MESSAGE_CONTENT =
  "Hi! I'm here to help you build your scenario. Tell me about the world, setting, or story you'd like to create, and I'll help you craft the background, first messages, and lorebook entries.";

/** Chat handlers interface for parent registration */
export interface ChatHandlers {
  onSubmit: (prompt: string) => void;
  onStop: () => void;
}

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
  // Chat handlers ref (for parent to call submit/stop)
  chatHandlersRef: React.MutableRefObject<ChatHandlers | null>;
  // Chat UI state callbacks
  onChatLoadingChange: (loading: boolean) => void;
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
 * Bounce Text Animation
 * Characters bounce sequentially like loading dots
 */
const BounceText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const chars = text.split("");
  const charDelay = 0.04;
  const bounceDuration = 0.25;
  const pauseBetweenCycles = 1.5;

  return (
    <span className={cn("inline-flex", className)}>
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: bounceDuration,
            repeat: Infinity,
            repeatDelay:
              pauseBetweenCycles + (chars.length - index) * charDelay,
            delay: index * charDelay,
            ease: [0.33, 1, 0.68, 1], // easeOutCubic
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
};

/**
 * Floating Progress Indicator
 * Shows generation progress at bottom of scroll area with gradient overlay
 * Displays completion summary before fading out
 */
const FloatingProgressIndicator = ({
  isGenerating,
  progress,
  showCompletion,
  onCompletionDismiss,
}: {
  isGenerating: boolean;
  progress: GenerationProgress;
  showCompletion: boolean;
  onCompletionDismiss: () => void;
}) => {
  const isVisible = isGenerating || showCompletion;

  // Auto-dismiss completion after delay
  useEffect(() => {
    if (showCompletion && !isGenerating) {
      const timer = setTimeout(onCompletionDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCompletion, isGenerating, onCompletionDismiss]);

  const getSectionIcon = () => {
    switch (progress.currentSection) {
      case "background":
        return <Sparkles size={16} className="text-[var(--color-brand-400)]" />;
      case "firstMessages":
        return (
          <MessageSquare size={16} className="text-[var(--color-brand-400)]" />
        );
      case "lorebook":
        return <BookOpen size={16} className="text-[var(--color-brand-400)]" />;
      default:
        return <Sparkles size={16} className="text-[var(--color-brand-400)]" />;
    }
  };

  const getSectionLabel = () => {
    switch (progress.currentSection) {
      case "background":
        return "Generating scenario";
      case "firstMessages":
        return "Writing first message";
      case "lorebook":
        return "Creating lorebook entry";
      default:
        return "Generating";
    }
  };

  const getCount = () => {
    switch (progress.currentSection) {
      case "firstMessages":
        return progress.counts.firstMessages;
      case "lorebook":
        return progress.counts.lorebook;
      default:
        return null;
    }
  };

  // Build completion summary
  const getCompletionSummary = () => {
    const parts: string[] = [];
    if (progress.counts.background) parts.push("Scenario");
    if (progress.counts.firstMessages > 0) {
      parts.push(
        `${progress.counts.firstMessages} message${progress.counts.firstMessages > 1 ? "s" : ""}`,
      );
    }
    if (progress.counts.lorebook > 0) {
      parts.push(`${progress.counts.lorebook} lorebook`);
    }
    return parts.length > 0 ? parts.join(" · ") : "Done";
  };

  return (
    <>
      {/* Bottom gradient overlay - always present, position animates */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-t from-black to-transparent"
        initial={false}
        animate={{ bottom: isVisible ? 64 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="pointer-events-none sticky bottom-0 z-10"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Floating indicator card */}
            <div className="bg-black px-4 pb-4">
              <motion.div
                className={cn(
                  "flex h-12 items-center justify-between rounded-xl border px-4",
                  showCompletion && !isGenerating
                    ? "border-green-500/30 bg-green-950"
                    : "border-zinc-700/60 bg-zinc-900",
                )}
              >
                {showCompletion && !isGenerating ? (
                  // Completion state
                  <>
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }}
                      >
                        <Check size={16} className="text-green-400" />
                      </motion.div>
                      <span className="text-sm font-medium text-zinc-200">
                        {getCompletionSummary()}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">Added</span>
                  </>
                ) : (
                  // Generating state
                  <>
                    <div className="flex items-center gap-3">
                      <div className="animate-pulse">{getSectionIcon()}</div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={progress.currentSection}
                          className="text-sm font-medium text-[var(--color-brand-300)]"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <BounceText text={getSectionLabel()} />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {getCount() !== null && (
                      <div className="relative inline-flex min-w-[1.5rem] items-center justify-center overflow-hidden rounded-md bg-[var(--color-brand-400)]/20 px-1.5 py-0.5">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={getCount()}
                            className="text-xs font-semibold text-[var(--color-brand-300)] tabular-nums"
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -12, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                          >
                            {getCount()}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
  chatHandlersRef,
  onChatLoadingChange,
}: ScenarioStepProps) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track newly added items for animation (IDs that were just added by AI)
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Track when background was just updated by AI for animation
  const [isBackgroundAnimating, setIsBackgroundAnimating] = useState(false);

  // Track generation progress for floating indicator
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgress>({
      currentSection: null,
      counts: { background: false, firstMessages: 0, lorebook: 0 },
    });

  // Show completion summary after generation finishes
  const [showCompletion, setShowCompletion] = useState(false);

  // Track if scrolled to bottom (hide gradient when at bottom)
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Handle scroll to detect bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 20; // pixels from bottom
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsAtBottom(isNearBottom);
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check initial state
    handleScroll();

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Track previous isGenerating to detect completion
  const prevIsGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    // Generation just finished (was true, now false)
    if (prevIsGeneratingRef.current && !isGenerating) {
      // Only show completion if something was actually generated
      const hasContent =
        generationProgress.counts.background ||
        generationProgress.counts.firstMessages > 0 ||
        generationProgress.counts.lorebook > 0;
      if (hasContent) {
        setShowCompletion(true);
      }
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, generationProgress.counts]);

  const handleCompletionDismiss = useCallback(() => {
    setShowCompletion(false);
  }, []);

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
  const [pendingBackground, setPendingBackground] = useState<string | null>(
    null,
  );

  // Update actual background when typing completes
  useEffect(() => {
    if (!isBackgroundTyping && pendingBackground !== null) {
      onBackgroundChange(pendingBackground);
      setPendingBackground(null);
    }
  }, [isBackgroundTyping, pendingBackground, onBackgroundChange]);

  // Add initial welcome message with typing indicator and animation
  // useTypingIndicator hook handles both typing indicator and typewriter animation
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: WELCOME_MESSAGE_CONTENT, // Full content - hook handles animation
        step: "scenario",
        isSystemGenerated: true, // Exclude from AI chat history
        typingIndicatorDuration: 1500, // Show typing indicator for 1.5 seconds
        typingAnimation: true, // Animate the text after typing indicator
      };
      onChatMessagesChange([welcomeMessage]);
    }
  }, []); // Only run on mount

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
  const generateScenario = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
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
        content: prompt,
        step: currentStep,
      };
      const updatedMessages = [...chatMessages, userMessage];
      onChatMessagesChange(updatedMessages);
      onIsGeneratingChange(true);

      try {
        // Convert chat messages to scenario builder format
        // Filter out system-generated messages (welcome, etc.) from AI context
        const scenarioMessages: ScenarioBuilderMessage[] = updatedMessages
          .filter((msg) => !msg.isSystemGenerated)
          .map((msg) => ({
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

        // Reset progress at start of generation
        setGenerationProgress({
          currentSection: null,
          counts: { background: false, firstMessages: 0, lorebook: 0 },
        });

        // Callbacks update UI immediately as each tool executes
        const callbacks = {
          onSetBackground: (bg: string) => {
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "background",
              counts: { ...prev.counts, background: true },
            }));
            setIsBackgroundAnimating(true);
            setPendingBackground(bg);
            startBackgroundTyping(bg);
          },
          onEditBackground: (bg: string) => {
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "background",
              counts: { ...prev.counts, background: true },
            }));
            setIsBackgroundAnimating(true);
            setPendingBackground(bg);
            startBackgroundTyping(bg);
          },
          onAddFirstMessage: (message: {
            id: string;
            title: string;
            content: string;
          }) => {
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "firstMessages",
              counts: {
                ...prev.counts,
                firstMessages: prev.counts.firstMessages + 1,
              },
            }));
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
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "firstMessages",
            }));
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
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "lorebook",
              counts: { ...prev.counts, lorebook: prev.counts.lorebook + 1 },
            }));
            newIds.push(entry.id);
            setNewlyAddedIds((prev) => new Set([...prev, entry.id]));
            currentLorebook = [
              ...currentLorebook,
              { ...entry, expanded: true },
            ];
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
            setGenerationProgress((prev) => ({
              ...prev,
              currentSection: "lorebook",
            }));
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
              ? {
                  ...msg,
                  content:
                    chunk.text || "I've made the changes to your scenario.",
                }
              : msg,
          );
          onChatMessagesChange(currentMessages);

          finalResult = chunk;
        }

        logger.info("[ScenarioStep] AI response generated", {
          toolResults: finalResult?.toolResults?.length || 0,
        });
      } catch (error) {
        // Check if this was an abort - don't show error for user-initiated abort
        if (
          (error as Error).name === "AbortError" ||
          abortControllerRef.current?.signal.aborted
        ) {
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
    },
    [
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
      currentStep,
    ],
  );

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

  // Handle chat submit - receives prompt from parent
  const handleChatSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return;
      generateScenario(prompt);
    },
    [generateScenario],
  );

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
      isSystemGenerated: true, // Exclude from AI chat history
    };
    onChatMessagesChange([...chatMessages, cancelledMessage]);
  }, [currentStep, onChatMessagesChange, chatMessages, onIsGeneratingChange]);

  // Register chat handlers with parent (via ref to avoid re-renders)
  useEffect(() => {
    chatHandlersRef.current = {
      onSubmit: handleChatSubmit,
      onStop: handleChatStop,
    };
    return () => {
      chatHandlersRef.current = null;
    };
  }, [handleChatSubmit, handleChatStop, chatHandlersRef]);

  // Sync chat loading state to parent (only when AI is generating response)
  useEffect(() => {
    onChatLoadingChange(isGenerating);
  }, [isGenerating, onChatLoadingChange]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Scenario + First Messages + Lorebook */}
      <div className="border-border-default relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:rounded-xl md:border">
        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
        >
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
                  const displayedText = isBackgroundTyping
                    ? backgroundDisplayText
                    : background;
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
              <div className="flex items-center gap-2">
                {firstMessages.length > 0 && (
                  <div className="flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-500/15 px-1.5 font-mono text-xs font-semibold text-brand-400">
                    {firstMessages.length}
                  </div>
                )}
                <label className="text-xs font-semibold text-neutral-400">
                  First messages
                </label>
              </div>
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-raised/30 px-4 py-5 text-center">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface">
                  <MessageSquare size={14} className="text-fg-muted" />
                </div>
                <p className="text-[11px] font-medium text-fg-muted">
                  No first messages yet
                </p>
                <button
                  onClick={addMessage}
                  className="mt-1 text-[10px] text-fg-subtle hover:text-fg-muted"
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
              <div className="flex items-center gap-2">
                {lorebook.length > 0 && (
                  <div className="flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-500/15 px-1.5 font-mono text-xs font-semibold text-brand-400">
                    {lorebook.length}
                  </div>
                )}
                <label className="text-xs font-semibold text-neutral-400">
                  Lorebook
                </label>
              </div>
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-raised/30 px-4 py-5 text-center">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface">
                  <BookOpen size={14} className="text-fg-muted" />
                </div>
                <p className="text-[11px] font-medium text-fg-muted">
                  No lorebook entries yet
                </p>
                <button
                  onClick={addLorebook}
                  className="mt-1 text-[10px] text-fg-subtle hover:text-fg-muted"
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

        {/* Bottom gradient overlay - animates with same timing as indicator, fades at bottom */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-t from-black to-transparent"
          initial={false}
          animate={{
            bottom: isGenerating || showCompletion ? 64 : 0,
            opacity: isAtBottom && !isGenerating && !showCompletion ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {/* Floating Progress Indicator */}
        <FloatingProgressIndicator
          isGenerating={isGenerating}
          progress={generationProgress}
          showCompletion={showCompletion}
          onCompletionDismiss={handleCompletionDismiss}
        />
      </div>
    </div>
  );
}

export default ScenarioStep;
