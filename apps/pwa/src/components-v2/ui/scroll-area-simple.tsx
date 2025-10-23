import * as React from "react";
import { cn } from "@/shared/lib/cn";

interface ScrollAreaSimpleProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
}

const ScrollAreaSimple = React.forwardRef<HTMLDivElement, ScrollAreaSimpleProps>(
  ({ className, children, orientation = "vertical", style, ...props }, ref) => {
    const scrollStyles: React.CSSProperties = {
      scrollbarColor: "color-mix(in srgb, var(--text-primary) 50%, transparent) transparent",
      scrollbarWidth: "thin",
      ...style,
    };

    const scrollClasses = cn(
      orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
      orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
      orientation === "both" && "overflow-auto",
      className
    );

    return (
      <div
        ref={ref}
        className={scrollClasses}
        style={scrollStyles}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollAreaSimple.displayName = "ScrollAreaSimple";

export { ScrollAreaSimple };