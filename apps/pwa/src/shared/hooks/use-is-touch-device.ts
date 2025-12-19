import { useEffect, useState } from "react";

/**
 * Hook to detect if the device has touch capability
 * Checks for touch events support and pointer type
 *
 * This is different from isMobile - a device can be touch-capable but not mobile
 * (e.g., Windows Surface, iPad with keyboard)
 *
 * @returns boolean indicating if the device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    // SSR guard
    if (typeof window === "undefined") return false;

    // Initial detection
    return detectTouchCapability();
  });

  useEffect(() => {
    // Update touch detection after mount (in case initial detection was wrong)
    setIsTouchDevice(detectTouchCapability());

    // Listen for pointer events to detect if user switches between touch and mouse
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        setIsTouchDevice(true);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return isTouchDevice;
}

/**
 * Internal function to detect touch capability
 * Uses multiple detection methods for better accuracy
 */
function detectTouchCapability(): boolean {
  // SSR guard
  if (typeof window === "undefined") return false;

  // Method 1: Check for touch events support
  const hasTouchEvents =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Method 2: Check pointer type (modern browsers)
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // Method 3: Check if any pointer can hover (non-touch devices can hover)
  const canHover = window.matchMedia("(any-hover: hover)").matches;

  // Touch device if:
  // - Has touch events support, OR
  // - Has coarse pointer (finger), OR
  // - Cannot hover (touch devices can't truly hover)
  return hasTouchEvents || hasCoarsePointer || !canHover;
}
