import { useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { User, Send, Square } from "lucide-react";
import { cn } from "@/shared/lib";

import type { SessionStep } from "./session-stepper";
import { useTypingIndicator } from "./use-typing-indicator";

/**
 * Step-specific assistant avatar images
 */
export const ASSISTANT_AVATARS: Record<SessionStep, string> = {
  scenario: "/img/session/scenario_assistant.jpeg",
  cast: "/img/session/cast_assistant.jpeg",
  stats: "/img/session/stats_assistant.jpeg",
};

/**
 * Get assistant info based on step
 */
function getAssistantInfo(step?: SessionStep): {
  name: string;
  colorClass: string;
  avatarUrl: string;
} {
  const defaultAvatar = ASSISTANT_AVATARS.scenario;
  switch (step) {
    case "scenario":
      return {
        name: "Scenario AI",
        colorClass: "text-brand-400",
        avatarUrl: ASSISTANT_AVATARS.scenario,
      };
    case "cast":
      return {
        name: "Cast AI",
        colorClass: "text-brand-400",
        avatarUrl: ASSISTANT_AVATARS.cast,
      };
    case "stats":
      return {
        name: "Stats AI",
        colorClass: "text-brand-400",
        avatarUrl: ASSISTANT_AVATARS.stats,
      };
    default:
      return {
        name: "AI",
        colorClass: "text-brand-400",
        avatarUrl: defaultAvatar,
      };
  }
}

/**
 * Chat message type for AI conversations
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Which step this message was created in */
  step?: SessionStep;
  /** Message variant for special styling */
  variant?: "default" | "cancelled";
  /** If true, this message is system-generated (welcome, max limit, etc.) and should NOT be included in AI chat history */
  isSystemGenerated?: boolean;
  /** If set, show typing indicator for this duration (ms) before displaying the message */
  typingIndicatorDuration?: number;
  /** If true, animate the message content with typewriter effect after typing indicator */
  typingAnimation?: boolean;
}

/**
 * Agent configuration for different step contexts
 */
export interface ChatAgentConfig {
  /** Empty state message */
  emptyTitle: string;
  /** Empty state description */
  emptyDescription: string;
  /** Input placeholder text */
  inputPlaceholder: string;
}

interface ChatPanelProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Agent configuration for this chat context */
  agent: ChatAgentConfig;
  /** Current step - used for typing indicator avatar */
  currentStep?: SessionStep;
  /** Stop handler - called when user clicks stop during loading */
  onStop?: () => void;
  /** Whether AI is currently generating (disables input, shows stop button) */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable Chat Panel component
 * Used across session creation steps (Scenario, Cast, HUD)
 */
export function ChatPanel({
  messages,
  agent,
  currentStep,
  onStop,
  isLoading = false,
  className,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use form context from parent (FormProvider in new.tsx)
  const {
    register,
    formState: { isValid },
  } = useFormContext<{ message: string }>();

  const {
    visibleMessages,
    shouldShowTypingIndicator: shouldShow,
    typingIndicatorStep,
  } = useTypingIndicator({
    messages,
    isLoading,
    currentStep,
  });

  // Auto-scroll chat to bottom when visible messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <div
      className={cn(
        "border-border-default flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-w-md md:rounded-xl md:border",
        className,
      )}
    >
      {/* Chat Messages */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-4 pb-2">
        <div className="space-y-4">
            {visibleMessages.map((msg) => {
              const assistantInfo =
                msg.role === "assistant" ? getAssistantInfo(msg.step) : null;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full",
                      msg.role === "user"
                        ? "bg-brand-500/20"
                        : "bg-surface-overlay",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User size={14} className="text-brand-400" />
                    ) : (
                      <img
                        src={
                          assistantInfo?.avatarUrl || ASSISTANT_AVATARS.scenario
                        }
                        alt={assistantInfo?.name || "AI"}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex max-w-[80%] flex-col">
                    {assistantInfo && (
                      <span
                        className={cn(
                          "mb-0.5 text-[10px] font-medium",
                          assistantInfo.colorClass,
                        )}
                      >
                        {assistantInfo.name}
                      </span>
                    )}
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-brand-500/30 text-fg-default"
                          : "bg-surface-overlay text-fg-default",
                        msg.variant === "cancelled" && "text-fg-subtle italic",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Typing indicator - controlled by shouldShow */}
            {shouldShow && (
              <div className="flex gap-3">
                <div className="bg-surface-overlay flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                  <img
                    src={getAssistantInfo(typingIndicatorStep).avatarUrl}
                    alt="AI"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-surface-overlay flex h-7 items-center gap-1 rounded-xl px-3">
                  <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full" />
                  <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.2s]" />
                  <span className="animate-bounce-typing bg-fg-muted h-1.5 w-1.5 rounded-full [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
      </div>

      {/* Chat Input - form is wrapped by parent in new.tsx */}
      <div className="flex-shrink-0 px-3 pt-2 pb-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            {...register("message", { required: true })}
            placeholder={agent.inputPlaceholder}
            disabled={isLoading}
            className={cn(
              "bg-surface-overlay text-fg-default placeholder:text-fg-subtle flex-1 rounded-full border-0 px-4 py-2.5 text-sm",
              "focus:ring-brand-500/30 ring-1 ring-transparent outline-none",
              "transition-shadow duration-200",
            )}
          />
          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition-all duration-200 hover:scale-105 hover:bg-red-500/30"
              title="Stop generating"
            >
              <Square size={14} className="fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
                isLoading || !isValid
                  ? "bg-surface-overlay text-fg-subtle"
                  : "bg-brand-600 hover:bg-brand-500 text-white hover:scale-105",
              )}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-configured agent configs for each step
 */
export const CHAT_AGENTS = {
  scenario: {
    emptyTitle: "Start a conversation",
    emptyDescription: "",
    inputPlaceholder: "",
  },
  cast: {
    emptyTitle: "Create a character",
    emptyDescription: "",
    inputPlaceholder: "",
  },
  stats: {
    emptyTitle: "Start a conversation",
    emptyDescription: "",
    inputPlaceholder: "",
  },
} as const satisfies Record<SessionStep, ChatAgentConfig>;
