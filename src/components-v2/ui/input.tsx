import * as React from "react";

import { cn } from "@/components-v2/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-8 w-full rounded-md bg-background-surface-0 px-4 py-2 text-xs font-normal text-text-primary outline outline-1 outline-offset-[-1px] outline-border-normal transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-placeholder focus-visible:outline-border-selected-inverse focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
