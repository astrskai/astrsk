import { useState, useEffect } from "react";

// Screen size breakpoints (must match TailwindCSS config)
const BREAKPOINT_SM = 640; // sm breakpoint
const BREAKPOINT_MD = 768; // md breakpoint
const BREAKPOINT_LG = 1024; // lg breakpoint
const BREAKPOINT_XL = 1280; // xl breakpoint
const BREAKPOINT_2XL = 1536; // 2xl breakpoint

interface LayoutConfig {
  characterWidth: string;
  plotWidth: string;
  isVertical: boolean;
}

/**
 * Custom hook for responsive layout calculations
 * Determines the appropriate widths for character and plot lists based on screen size
 */
export const useResponsiveLayout = (): LayoutConfig => {
  const [layout, setLayout] = useState<LayoutConfig>({
    characterWidth: "50%",
    plotWidth: "50%",
    isVertical: false,
  });

  useEffect(() => {
    const updateLayout = () => {
      const screenWidth = window.innerWidth;
      let newLayout: LayoutConfig;

      if (screenWidth < BREAKPOINT_MD) {
        // Stack vertically on small screens
        newLayout = {
          characterWidth: "50%",
          plotWidth: "50%",
          isVertical: false,
        };
      } else if (screenWidth < BREAKPOINT_LG) {
        // Stack vertically on medium screens but with more reasonable widths
        newLayout = {
          characterWidth: "50%",
          plotWidth: "50%",
          isVertical: false,
        };
      } else if (screenWidth < BREAKPOINT_XL) {
        // Side by side on large screens with equal width
        newLayout = {
          characterWidth: "50%",
          plotWidth: "50%",
          isVertical: false,
        };
      } else if (screenWidth < BREAKPOINT_2XL) {
        // Character list gets more space on xl screens
        newLayout = {
          characterWidth: "50%",
          plotWidth: "50%",
          isVertical: false,
        };
      } else {
        // Character list gets even more space on 2xl screens
        newLayout = {
          characterWidth: "50%",
          plotWidth: "50%",
          isVertical: false,
        };
      }

      setLayout(newLayout);
    };

    // Update layout on mount and window resize
    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return layout;
};
