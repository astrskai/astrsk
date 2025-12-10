import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypingEffectOptions {
  /** Milliseconds per character (default: 15) */
  speed?: number;
  /** Auto-adjust speed based on text length (default: true) */
  autoSpeed?: boolean;
  /** Minimum speed in ms per char when autoSpeed is enabled (default: 5) */
  minSpeed?: number;
  /** Maximum speed in ms per char when autoSpeed is enabled (default: 20) */
  maxSpeed?: number;
  /** Text length threshold for speed adjustment (default: 200) */
  speedThreshold?: number;
  /** Callback when typing completes */
  onComplete?: () => void;
}

interface UseTypingEffectReturn {
  /** Current displayed text (partial during typing) */
  displayText: string;
  /** Whether currently typing */
  isTyping: boolean;
  /** Start typing the given text */
  startTyping: (text: string) => void;
  /** Stop typing immediately */
  stopTyping: () => void;
  /** Skip to end (show full text) */
  skipToEnd: () => void;
}

/**
 * Calculate typing speed based on text length
 * Longer text = faster typing to avoid user frustration
 */
function calculateSpeed(
  textLength: number,
  options: Required<
    Pick<
      UseTypingEffectOptions,
      "speed" | "autoSpeed" | "minSpeed" | "maxSpeed" | "speedThreshold"
    >
  >,
): number {
  if (!options.autoSpeed) {
    return options.speed;
  }

  // For short text (< threshold), use normal speed
  if (textLength <= options.speedThreshold) {
    return options.speed;
  }

  // For longer text, progressively speed up
  // At 2x threshold: speed is halved (faster)
  // At 4x threshold: speed is at minimum
  const ratio = textLength / options.speedThreshold;
  const speedFactor = Math.max(0.25, 1 / ratio);
  const adjustedSpeed = options.speed * speedFactor;

  return Math.max(options.minSpeed, Math.min(options.maxSpeed, adjustedSpeed));
}

/**
 * Hook for typing/streaming text effect
 *
 * @example
 * ```tsx
 * const { displayText, isTyping, startTyping } = useTypingEffect({
 *   speed: 15,
 *   autoSpeed: true,
 *   onComplete: () => console.log("Done!"),
 * });
 *
 * // Start typing
 * startTyping("Hello, world!");
 *
 * // In render
 * <p>{displayText}</p>
 * ```
 */
export function useTypingEffect(
  options: UseTypingEffectOptions = {},
): UseTypingEffectReturn {
  const {
    speed = 15,
    autoSpeed = true,
    minSpeed = 5,
    maxSpeed = 20,
    speedThreshold = 200,
    onComplete,
  } = options;

  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [targetText, setTargetText] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTyping(false);
  }, []);

  const skipToEnd = useCallback(() => {
    stopTyping();
    setDisplayText(targetText);
    onCompleteRef.current?.();
  }, [targetText, stopTyping]);

  const startTyping = useCallback(
    (text: string) => {
      // Stop any existing typing
      stopTyping();

      // Reset state
      setTargetText(text);
      setDisplayText("");
      charIndexRef.current = 0;
      setIsTyping(true);

      // Calculate speed based on text length
      const typingSpeed = calculateSpeed(text.length, {
        speed,
        autoSpeed,
        minSpeed,
        maxSpeed,
        speedThreshold,
      });

      // Start typing interval
      intervalRef.current = setInterval(() => {
        if (charIndexRef.current < text.length) {
          charIndexRef.current++;
          setDisplayText(text.slice(0, charIndexRef.current));
        } else {
          stopTyping();
          onCompleteRef.current?.();
        }
      }, typingSpeed);
    },
    [speed, autoSpeed, minSpeed, maxSpeed, speedThreshold, stopTyping],
  );

  return {
    displayText,
    isTyping,
    startTyping,
    stopTyping,
    skipToEnd,
  };
}
