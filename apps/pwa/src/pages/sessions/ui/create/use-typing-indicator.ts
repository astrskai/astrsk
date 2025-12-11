import { useState, useEffect, useMemo } from "react";

import type { ChatMessage } from "./chat-panel";
import type { SessionStep } from "./session-stepper";

interface UseTypingIndicatorOptions {
  messages: ChatMessage[];
  isLoading: boolean;
  currentStep?: SessionStep;
  showTypingIndicator?: boolean;
}

interface UseTypingIndicatorResult {
  /** Messages that should be visible (after typing indicator delay) */
  visibleMessages: ChatMessage[];
  /** Messages waiting for their typing indicator delay */
  pendingTypingMessages: ChatMessage[];
  /** Whether to show the typing indicator dots */
  shouldShowTypingIndicator: boolean;
  /** Which step's avatar to show for typing indicator */
  typingIndicatorStep: SessionStep | undefined;
}

/**
 * Hook to manage typing indicator logic for chat components.
 * Handles message reveal delays and typing indicator visibility.
 */
export function useTypingIndicator({
  messages,
  isLoading,
  currentStep,
  showTypingIndicator,
}: UseTypingIndicatorOptions): UseTypingIndicatorResult {
  // Track message IDs that have completed their typing indicator delay
  const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());

  // Process messages with typingIndicatorDuration
  // - Messages without duration: show immediately
  // - Messages with duration: show after delay (tracked in revealedMessageIds)
  const visibleMessages = useMemo(() => {
    return messages.filter(msg => {
      // No duration = show immediately
      if (!msg.typingIndicatorDuration) return true;
      // Has duration = only show if revealed
      return revealedMessageIds.has(msg.id);
    });
  }, [messages, revealedMessageIds]);

  // Find messages that need typing indicator (have duration, not yet revealed)
  const pendingTypingMessages = useMemo(() => {
    return messages.filter(msg =>
      msg.typingIndicatorDuration && !revealedMessageIds.has(msg.id)
    );
  }, [messages, revealedMessageIds]);

  // Process pending messages with typing indicator delay
  useEffect(() => {
    if (pendingTypingMessages.length === 0) return;

    // Process first pending message
    const firstPending = pendingTypingMessages[0];
    const duration = firstPending.typingIndicatorDuration || 1000;

    const timer = setTimeout(() => {
      setRevealedMessageIds(prev => new Set([...prev, firstPending.id]));
    }, duration);

    return () => clearTimeout(timer);
  }, [pendingTypingMessages]);

  // Determine if typing indicator should show:
  // 1. If we have pending messages with typing indicator duration
  // 2. If showTypingIndicator is explicitly set
  // 3. Otherwise, show when loading AND no streaming content
  const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
  const hasStreamingContent = lastVisibleMessage?.role === "assistant" && lastVisibleMessage?.content;

  const shouldShow =
    pendingTypingMessages.length > 0 ||
    (showTypingIndicator !== undefined
      ? showTypingIndicator
      : isLoading && !hasStreamingContent);

  // Get the step for typing indicator avatar (from pending message or fallback)
  const typingIndicatorStep = pendingTypingMessages.length > 0
    ? pendingTypingMessages[0].step
    : (currentStep || lastVisibleMessage?.step);

  return {
    visibleMessages,
    pendingTypingMessages,
    shouldShowTypingIndicator: shouldShow,
    typingIndicatorStep,
  };
}
