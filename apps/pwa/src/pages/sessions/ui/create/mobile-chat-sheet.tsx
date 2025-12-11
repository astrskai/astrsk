import { useRef, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, ChevronDown, Maximize2, Minimize2, Sparkles, Send, Square } from "lucide-react";
import { cn } from "@/shared/lib";

import type { ChatMessage, ChatAgentConfig } from "./chat-panel";
import { ASSISTANT_AVATARS } from "./chat-panel";
import type { SessionStep } from "./session-stepper";
import { useTypingIndicator } from "./use-typing-indicator";

interface MobileChatSheetProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Agent configuration for the current step */
  agent: ChatAgentConfig;
  /** Current step - used for typing indicator avatar */
  currentStep?: SessionStep;
  /** Submit handler - called with form data when validation passes */
  onSubmit: (data: { message: string }) => void;
  /** Stop handler (optional, only when generation can be stopped) */
  onStop?: () => void;
  /** Whether AI is currently generating */
  isLoading?: boolean;
}

type SheetState = "collapsed" | "peek" | "expanded";

const SHEET_HEIGHTS = {
  collapsed: 100,      // Handle + message preview + input bar
  peek: "50dvh",       // Half screen (dynamic viewport height for mobile browser address bar)
  expanded: "calc(100dvh - 100px)",   // Full screen minus header (stepper + header ~100px)
} as const;

/**
 * Mobile Chat Bottom Sheet
 * Provides always-visible input with expandable chat history
 */
export function MobileChatSheet({
  messages,
  agent,
  currentStep,
  onSubmit,
  onStop,
  isLoading = false,
}: MobileChatSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use form context from parent (FormProvider in new.tsx)
  const { register, handleSubmit, formState: { isValid } } = useFormContext<{ message: string }>();

  const {
    visibleMessages,
    pendingTypingMessages,
    shouldShowTypingIndicator: shouldShow,
    typingIndicatorStep,
  } = useTypingIndicator({
    messages,
    isLoading,
    currentStep,
  });

  // Scroll to bottom when visible messages change (in expanded/peek state)
  useEffect(() => {
    if (sheetState !== "collapsed") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages, sheetState]);

  // Header tap: always collapse, or open to peek if collapsed
  const handleHeaderClick = () => {
    setSheetState(sheetState === "collapsed" ? "peek" : "collapsed");
  };

  // Toggle between peek and expanded
  const handleSizeToggle = () => {
    setSheetState(sheetState === "expanded" ? "peek" : "expanded");
  };

  const getSheetHeight = () => {
    if (sheetState === "expanded") return SHEET_HEIGHTS.expanded;
    if (sheetState === "peek") return SHEET_HEIGHTS.peek;
    return SHEET_HEIGHTS.collapsed;
  };

  // Get last message for preview in collapsed state
  const lastMessage = visibleMessages[visibleMessages.length - 1];

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
    >
      <div className="flex h-full flex-col rounded-t-2xl border-t border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-2 px-3 pt-2 pb-1">
          {/* Spacer for centering (visible in peek/expanded) */}
          {sheetState !== "collapsed" && <div className="h-8 w-8 flex-shrink-0" />}

          {/* Drag handle - tappable to toggle collapsed/peek */}
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col items-center overflow-hidden rounded-lg py-1 active:bg-zinc-800/50"
            onClick={handleHeaderClick}
          >
            <div className="mb-1 h-1 w-8 rounded-full bg-zinc-600" />

            {/* Collapsed: show last message preview or typing indicator */}
            {sheetState === "collapsed" && (
              <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
                {shouldShow ? (
                  <>
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-overlay">
                      <img
                        src={typingIndicatorStep ? ASSISTANT_AVATARS[typingIndicatorStep] : ASSISTANT_AVATARS.scenario}
                        alt="AI"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full" />
                      <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.2s]" />
                      <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.4s]" />
                    </div>
                    <ChevronUp size={14} className="ml-auto text-zinc-500" />
                  </>
                ) : lastMessage ? (
                  <>
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-overlay">
                      {lastMessage.role === "user" ? (
                        <span className="text-[8px] font-bold text-brand-400">U</span>
                      ) : (
                        <img
                          src={lastMessage.step ? ASSISTANT_AVATARS[lastMessage.step] : ASSISTANT_AVATARS.scenario}
                          alt="AI"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                      {lastMessage.content}
                    </p>
                    <ChevronUp size={14} className="flex-shrink-0 text-zinc-500" />
                  </>
                ) : (
                  <ChevronUp size={14} className="text-zinc-500" />
                )}
              </div>
            )}

            {/* Peek/Expanded: show collapse indicator */}
            {sheetState !== "collapsed" && (
              <ChevronDown size={14} className="text-zinc-500" />
            )}
          </button>

          {/* Expand/Minimize button (visible in peek/expanded) */}
          {sheetState !== "collapsed" && (
            <button
              type="button"
              onClick={handleSizeToggle}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 active:bg-zinc-800"
            >
              {sheetState === "expanded" ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
            </button>
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              {...register("message", { required: true })}
              placeholder={agent.inputPlaceholder || "Ask AI..."}
              disabled={isLoading}
              className={cn(
                "bg-zinc-800 text-fg-default placeholder:text-fg-subtle flex-1 rounded-full border-0 px-4 py-2 text-sm",
                "focus:ring-brand-500/30 ring-1 ring-transparent outline-none",
              )}
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
                disabled={isLoading || !isValid}
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                  isLoading || !isValid
                    ? "bg-zinc-800 text-fg-subtle"
                    : "bg-brand-600 text-white",
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
