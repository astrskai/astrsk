import { useEffect, useState, useRef } from "react";

interface TypewriterOptions {
  /**
   * Base text that always stays (e.g., "Describe a scenario to play ")
   */
  baseText: string;
  /**
   * Array of text variations to cycle through (e.g., ["#Adventure", "#SciFi"])
   */
  variations: string[];
  /**
   * Typing speed in milliseconds per character
   * @default 100
   */
  typingSpeed?: number;
  /**
   * Erasing speed in milliseconds per character
   * @default 50
   */
  erasingSpeed?: number;
  /**
   * Pause duration after typing completes (before erasing)
   * @default 2000
   */
  pauseAfterTyping?: number;
  /**
   * Pause duration after erasing completes (before next variation)
   * @default 500
   */
  pauseAfterErasing?: number;
}

/**
 * Custom hook for typewriter animation effect
 * Cycles through text variations with typing and erasing animations
 *
 * @example
 * const placeholder = useTypewriterPlaceholder({
 *   baseText: "Describe a scenario to play ",
 *   variations: ["#Adventure", "#SciFi", "#Romance"],
 * });
 * // Returns: "Describe a scenario to play #Adventure" (typing...)
 * //          "Describe a scenario to play #Adven" (erasing...)
 * //          "Describe a scenario to play #SciFi" (typing...)
 */
export function useTypewriterPlaceholder({
  baseText,
  variations,
  typingSpeed = 100,
  erasingSpeed = 50,
  pauseAfterTyping = 2000,
  pauseAfterErasing = 500,
}: TypewriterOptions): string {
  const [currentText, setCurrentText] = useState(baseText);
  const [variationIndex, setVariationIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const currentVariation = variations[variationIndex];

    if (isTyping) {
      // Typing phase
      if (charIndex < currentVariation.length) {
        timeoutRef.current = setTimeout(() => {
          setCurrentText(baseText + currentVariation.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, typingSpeed);
      } else {
        // Finished typing - pause before erasing
        timeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, pauseAfterTyping);
      }
    } else {
      // Erasing phase
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => {
          setCurrentText(baseText + currentVariation.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        }, erasingSpeed);
      } else {
        // Finished erasing - pause before next variation
        timeoutRef.current = setTimeout(() => {
          setVariationIndex((prev) => (prev + 1) % variations.length);
          setIsTyping(true);
        }, pauseAfterErasing);
      }
    }

    // Cleanup timeout on unmount or before next effect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    baseText,
    variations,
    variationIndex,
    isTyping,
    charIndex,
    typingSpeed,
    erasingSpeed,
    pauseAfterTyping,
    pauseAfterErasing,
  ]);

  return currentText;
}
