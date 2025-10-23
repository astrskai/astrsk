"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import { cn } from "@/shared/lib";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

export interface FloatingLabelSelectProps
  extends React.ComponentPropsWithoutRef<typeof Select> {
  className?: string;
  label: string;
  error?: boolean;
  helpText?: string;
  children: React.ReactNode;
  triggerClassName?: string;
}

const FloatingLabelSelect = React.forwardRef<
  React.ElementRef<typeof Select>,
  FloatingLabelSelectProps
>(
  (
    { className, label, error, helpText, children, triggerClassName, ...props },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(
      !!props.defaultValue || !!props.value,
    );

    React.useEffect(() => {
      setHasValue(!!props.defaultValue || !!props.value);
    }, [props.defaultValue, props.value]);

    const handleOpenChange = (open: boolean) => {
      setIsFocused(open);
      if (props.onOpenChange) {
        props.onOpenChange(open);
      }
    };

    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative h-14 w-full rounded-md border border-input bg-transparent text-sm ring-offset-background",
            error ? "border-destructive" : "focus-within:border-primary",
          )}
        >
          <label
            className={cn(
              "absolute pointer-events-none transition-all duration-200 ease-in-out px-3",
              isFocused || hasValue
                ? "text-xs transform -translate-y-1 top-2 text-muted-foreground"
                : "text-base text-muted-foreground top-1/2 -translate-y-1/2",
            )}
          >
            {label}
          </label>
          <Select
            {...props}
            onOpenChange={handleOpenChange}
            onValueChange={(value) => {
              setHasValue(!!value);
              if (props.onValueChange) {
                props.onValueChange(value);
              }
            }}
          >
            <SelectTrigger
              className={cn(
                "h-full w-full border-none focus:ring-0 focus:outline-hidden shadow-none",
                "ring-offset-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "focus-visible:outline-hidden focus-visible:ring-0",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isFocused || hasValue ? "pt-5 pb-1" : "pt-3 pb-3",
                triggerClassName,
              )}
            >
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>{children}</SelectContent>
          </Select>
        </div>
        {helpText && (
          <p
            className={cn(
              "text-xs mt-1",
              error ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

FloatingLabelSelect.displayName = "FloatingLabelSelect";

export { FloatingLabelSelect };
