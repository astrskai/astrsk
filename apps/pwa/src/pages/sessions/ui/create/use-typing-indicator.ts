import { useState, useEffect, useMemo, useRef } from "react";

import type { ChatMessage } from "./chat-panel";
import type { SessionStep } from "./session-stepper";

interface UseTypingIndicatorOptions {
  messages: ChatMessage[];
  isLoading: boolean;
  currentStep?: SessionStep;
  showTypingIndicator?: boolean;
}

interface UseTypingIndicatorResult {
  /** Messages that should be visible (with typing animation applied) */
  visibleMessages: ChatMessage[];
  /** Messages waiting for their typing indicator delay */
  pendingTypingMessages: ChatMessage[];
  /** Whether to show the typing indicator dots */
  shouldShowTypingIndicator: boolean;
  /** Which step's avatar to show for typing indicator */
  typingIndicatorStep: SessionStep | undefined;
}

// Typing animation speed (characters per interval)
const TYPING_INTERVAL = 20; // ms between characters
const CHARS_PER_TICK = 2; // characters to add per tick

/**
 * Hook to manage typing indicator and typing animation for chat components.
 * Handles:
 * 1. Typing indicator display (dots animation) based on typingIndicatorDuration
 * 2. Typing animation for message content (typewriter effect)
 */
export function useTypingIndicator({
  messages,
  isLoading,
  currentStep,
  showTypingIndicator,
}: UseTypingIndicatorOptions): UseTypingIndicatorResult {
  // Track message IDs that have completed their typing indicator delay
  const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());

  // Track typing animation progress for each message { messageId: charIndex }
  const [typingProgress, setTypingProgress] = useState<Record<string, number>>({});

  // Track message IDs that have completed typing animation
  const [completedTypingIds, setCompletedTypingIds] = useState<Set<string>>(new Set());

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

  // Find messages that need typing animation (revealed, have typingAnimation flag, not completed)
  const messagesNeedingAnimation = useMemo(() => {
    return messages.filter(msg =>
      msg.typingAnimation &&
      msg.content &&
      revealedMessageIds.has(msg.id) &&
      !completedTypingIds.has(msg.id)
    );
  }, [messages, revealedMessageIds, completedTypingIds]);

  // Run typing animation for messages
  useEffect(() => {
    if (messagesNeedingAnimation.length === 0) return;

    const timer = setInterval(() => {
      setTypingProgress(prev => {
        const newProgress = { ...prev };
        let hasUpdates = false;

        for (const msg of messagesNeedingAnimation) {
          const currentPos = prev[msg.id] || 0;
          const targetLength = msg.content.length;

          if (currentPos < targetLength) {
            newProgress[msg.id] = Math.min(currentPos + CHARS_PER_TICK, targetLength);
            hasUpdates = true;

            // Mark as completed when done
            if (newProgress[msg.id] >= targetLength) {
              setCompletedTypingIds(prevIds => new Set([...prevIds, msg.id]));
            }
          }
        }

        return hasUpdates ? newProgress : prev;
      });
    }, TYPING_INTERVAL);

    return () => clearInterval(timer);
  }, [messagesNeedingAnimation]);

  // Process visible messages with typing animation applied
  const visibleMessages = useMemo(() => {
    return messages
      .filter(msg => {
        // No typingIndicatorDuration = show immediately
        if (!msg.typingIndicatorDuration) return true;
        // Has duration = only show if revealed
        return revealedMessageIds.has(msg.id);
      })
      .map(msg => {
        // Apply typing animation progress if applicable
        if (msg.typingAnimation && !completedTypingIds.has(msg.id)) {
          const progress = typingProgress[msg.id] || 0;
          return {
            ...msg,
            content: msg.content.slice(0, progress),
          };
        }
        return msg;
      })
      // Filter out empty assistant messages (prevents empty bubbles)
      // This handles: 1) typing animation with 0 progress, 2) streaming placeholder with empty content
      .filter(msg => {
        // User messages: always show
        if (msg.role === "user") return true;
        // Assistant messages: only show if there's content to display
        return msg.content.length > 0;
      });
  }, [messages, revealedMessageIds, typingProgress, completedTypingIds]);

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
