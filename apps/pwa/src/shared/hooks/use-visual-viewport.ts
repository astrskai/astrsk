import { useEffect, useState } from "react";

/**
 * Hook to track the visual viewport height.
 * Useful for handling mobile keyboard appearance without layout shifts.
 *
 * Returns the current visual viewport height, which excludes the keyboard
 * when it's visible on mobile devices.
 */
export function useVisualViewport() {
  const [height, setHeight] = useState<number>(
    typeof window !== "undefined"
      ? window.visualViewport?.height ?? window.innerHeight
      : 0,
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      setHeight(vv.height);
    };

    // Set initial value
    handleResize();

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return height;
}
