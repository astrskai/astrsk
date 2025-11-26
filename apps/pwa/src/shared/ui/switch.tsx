"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/shared/lib";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  variant?: "default" | "v1";
  size?: "small" | "medium";
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant = "default", size = "medium", ...props }, ref) => {
  if (variant === "v1") {
    return (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-9 shrink-0 cursor-pointer items-center rounded-full border-3 border-transparent shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-heavy data-[state=unchecked]:bg-canvas",
          className,
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-fg-default shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0",
          )}
        />
      </SwitchPrimitives.Root>
    );
  }

  // Default variant - new Figma design
  const isSmall = size === "small";

  return (
    <SwitchPrimitives.Root
      className={cn(
        "inline-flex shrink-0",
        isSmall ? "h-6 w-10 min-w-[40px]" : "h-8 w-12 min-w-[48px]",
        "cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "bg-surface-overlay",
        "data-[state=checked]:bg-fg-default",
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full transition-transform",
          isSmall ? "h-[18px] w-[18px]" : "h-6 w-6",
          "bg-fg-muted",
          "data-[state=checked]:bg-hover",
          isSmall
            ? "data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[3px]"
            : "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1",
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
