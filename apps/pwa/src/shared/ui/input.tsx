import * as React from "react";

import { cn } from "@/shared/lib";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "bg-background-surface-0 text-text-primary outline-border-normal file:text-foreground placeholder:text-text-placeholder focus-visible:outline-border-selected-inverse flex min-h-8 w-full rounded-md px-4 py-2 text-xs font-normal outline outline-offset-[-1px] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50",
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
