import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "motion/react";
import { ChevronDown, Sparkles, Send, Square } from "lucide-react";
import { cn } from "@/shared/lib";

import type { ChatMessage, ChatAgentConfig } from "./chat-panel";
import { ASSISTANT_AVATARS } from "./chat-panel";
import type { SessionStep } from "./session-stepper";
import { useTypingIndicator } from "./use-typing-indicator";

interface MobileChatSheetProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Agent configuration */
  agent: ChatAgentConfig;
  /** Current step - used for typing indicator avatar */
  currentStep?: SessionStep;
  /** Current input value */
  inputValue: string;
  /** Input change handler */
  onInputChange: (value: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Stop handler */
  onStop?: () => void;
  /** Whether AI is currently generating */
  isLoading?: boolean;
  /** Whether to show typing indicator */
  showTypingIndicator?: boolean;
  /** Whether submit is disabled */
  disabled?: boolean;
}

type SheetState = "collapsed" | "peek" | "expanded";

const SHEET_HEIGHTS = {
  collapsed: 56, // Just input bar
  peek: 280,     // Input + last few messages
  expanded: "85vh" as const,
};

/**
 * Mobile Chat Bottom Sheet
 * Provides always-visible input with expandable chat history
 */
export function MobileChatSheet({
  messages,
  agent,
  currentStep,
  inputValue,
  onInputChange,
  onSubmit,
  onStop,
  isLoading = false,
  showTypingIndicator,
  disabled = false,
}: MobileChatSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const {
    visibleMessages,
    pendingTypingMessages,
    shouldShowTypingIndicator: shouldShow,
    typingIndicatorStep,
  } = useTypingIndicator({
    messages,
    isLoading,
    currentStep,
    showTypingIndicator,
  });

  // Auto-expand when new message arrives and we're not collapsed
  useEffect(() => {
    if (visibleMessages.length > 0 && sheetState === "collapsed") {
      // Auto-peek when AI responds
      const lastMessage = visibleMessages[visibleMessages.length - 1];
      if (lastMessage?.role === "assistant") {
        setSheetState("peek");
      }
    }
  }, [visibleMessages, sheetState]);

  // Scroll to bottom when visible messages change (in expanded/peek state)
  useEffect(() => {
    if (sheetState !== "collapsed") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages, sheetState]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    onSubmit();
    // Auto-expand to peek when user sends message
    if (sheetState === "collapsed") {
      setSheetState("peek");
    }
  };

  // Handle drag end to snap to states
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Fast swipe detection
    if (Math.abs(velocity) > 500) {
      if (velocity < 0) {
        // Swiping up
        setSheetState(sheetState === "collapsed" ? "peek" : "expanded");
      } else {
        // Swiping down
        setSheetState(sheetState === "expanded" ? "peek" : "collapsed");
      }
      return;
    }

    // Position-based snapping
    if (offset < -50) {
      setSheetState(sheetState === "collapsed" ? "peek" : "expanded");
    } else if (offset > 50) {
      setSheetState(sheetState === "expanded" ? "peek" : "collapsed");
    }
  };

  // Toggle between states on header click
  const handleHeaderClick = () => {
    if (sheetState === "collapsed") {
      setSheetState("peek");
    } else if (sheetState === "peek") {
      setSheetState("expanded");
    } else {
      setSheetState("collapsed");
    }
  };

  const getSheetHeight = () => {
    if (sheetState === "expanded") return SHEET_HEIGHTS.expanded;
    if (sheetState === "peek") return SHEET_HEIGHTS.peek;
    return SHEET_HEIGHTS.collapsed;
  };

  // Get last visible message for preview
  const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
  const hasUnreadResponse = lastVisibleMessage?.role === "assistant" && sheetState === "collapsed";

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      initial={{ y: "100%" }}
      animate={{
        y: 0,
        height: getSheetHeight(),
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
      }}
      drag="y"
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col rounded-t-2xl border-t border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Drag Handle & Header */}
        <div
          className="flex flex-shrink-0 cursor-grab flex-col items-center pt-2 pb-1 active:cursor-grabbing"
          onClick={handleHeaderClick}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="mb-2 h-1 w-8 rounded-full bg-zinc-600" />

          {/* Collapsed state: Show preview of last message */}
          {sheetState === "collapsed" && hasUnreadResponse && lastVisibleMessage && (
            <div className="flex w-full items-center gap-2 px-3 pb-1">
              <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                <img
                  src={lastVisibleMessage.step ? ASSISTANT_AVATARS[lastVisibleMessage.step] : ASSISTANT_AVATARS.scenario}
                  alt="AI"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="flex-1 truncate text-xs text-zinc-400">
                {lastVisibleMessage.content}
              </p>
              <ChevronDown size={14} className="rotate-180 text-zinc-500" />
            </div>
          )}
        </div>

        {/* Chat Messages (visible in peek/expanded) */}
        <AnimatePresence>
          {sheetState !== "collapsed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto px-3"
            >
              {visibleMessages.length === 0 && pendingTypingMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-4 text-center">
                  <div className="bg-surface-overlay mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                    <Sparkles size={16} className="text-fg-subtle" />
                  </div>
                  <p className="text-fg-muted text-xs">{agent.emptyTitle}</p>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full",
                          msg.role === "user" ? "bg-brand-500/20" : "bg-surface-overlay",
                        )}
                      >
                        {msg.role === "user" ? (
                          <span className="text-[10px] font-bold text-brand-400">U</span>
                        ) : (
                          <img
                            src={msg.step ? ASSISTANT_AVATARS[msg.step] : ASSISTANT_AVATARS.scenario}
                            alt="AI"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                          msg.role === "user"
                            ? "bg-brand-500/30 text-fg-default"
                            : "bg-surface-overlay text-fg-default",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  {shouldShow && (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-overlay">
                        <img
                          src={typingIndicatorStep ? ASSISTANT_AVATARS[typingIndicatorStep] : ASSISTANT_AVATARS.scenario}
                          alt="AI"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="bg-surface-overlay flex h-6 items-center gap-1 rounded-xl px-3">
                        <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full" />
                        <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.2s]" />
                        <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar (always visible) */}
        <div className="flex-shrink-0 border-t border-zinc-800 px-3 py-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={agent.inputPlaceholder || "Ask AI..."}
              className={cn(
                "bg-zinc-800 text-fg-default placeholder:text-fg-subtle flex-1 rounded-full border-0 px-4 py-2 text-sm",
                "focus:ring-brand-500/30 ring-1 ring-transparent outline-none",
              )}
              onFocus={() => {
                if (sheetState === "collapsed") {
                  setSheetState("peek");
                }
              }}
            />
            {isLoading && onStop ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400"
              >
                <Square size={12} className="fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim() || disabled}
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                  inputValue.trim() && !disabled
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-800 text-fg-subtle",
                )}
              >
                <Send size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
