"use client";

import * as React from "react";

import { cn } from "@/shared/utils/tailwind-utils";

import { Textarea } from "@/components-v2/ui/textarea";

export interface FloatingLabelTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: boolean;
  helpText?: string;
  value?: string;
}

const FloatingLabelTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FloatingLabelTextareaProps
>(({ className, label, error, helpText, value, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(
    !!value || !!props.defaultValue,
  );

  React.useEffect(() => {
    setHasValue(!!value || !!props.defaultValue);
  }, [value, props.defaultValue]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const isEmpty = e.target.value.trim() === "";
    setHasValue(!isEmpty);
    props.onChange?.(e);
  };

  // Track initial touch position for scroll direction detection
  const touchStartY = React.useRef<number>(0);

  // Handle touch events to allow parent scroll when textarea is not scrollable
  const handleTouchStart = (e: React.TouchEvent<HTMLTextAreaElement>) => {
    touchStartY.current = e.touches[0].clientY;

    const textarea = e.currentTarget;
    const scrollHeight = textarea.scrollHeight;
    const height = textarea.clientHeight;

    // Only stop propagation if textarea content is scrollable
    if (scrollHeight > height) {
      e.stopPropagation();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const scrollTop = textarea.scrollTop;
    const scrollHeight = textarea.scrollHeight;
    const height = textarea.clientHeight;

    // If textarea is not scrollable, allow parent to handle touch events
    if (scrollHeight <= height) {
      return;
    }

    // Calculate scroll direction
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const isScrollingDown = deltaY > 0;
    const isScrollingUp = deltaY < 0;

    // If at top of textarea and trying to scroll up, allow parent to handle
    if (scrollTop === 0 && isScrollingUp) {
      return;
    }

    // If at bottom of textarea and trying to scroll down, allow parent to handle
    if (scrollTop >= scrollHeight - height && isScrollingDown) {
      return;
    }

    // Otherwise, prevent parent from handling (textarea is handling the scroll)
    e.stopPropagation();
  };
  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex w-full rounded-md bg-background-surface-4 px-3 py-2 text-base ring-offset-background min-h-[100px] max-h-[360px]",
          error
            ? "border border-status-destructive-primary"
            : "focus-within:border-primary",
          className,
        )}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
          }
        }}
        tabIndex={-1}
      >
        <label
          htmlFor={props.id}
          className={cn(
            "absolute pointer-events-none transition-all duration-200 ease-in-out",
            hasValue
              ? "text-xs transform -translate-y-1 top-3 text-text-input-subtitle"
              : "text-base text-text-input-subtitle top-[18px] -translate-y-0",
          )}
        >
          {label}
        </label>
        <Textarea
          value={value}
          className={cn(
            "flex w-full bg-transparent px-0 py-0 text-base text-text-primary placeholder:text-text-placeholder",
            "border-none focus:ring-0 focus:outline-hidden",
            "ring-offset-transparent file:border-0 file:bg-transparent file:text-base file:font-medium",
            "focus-visible:outline-hidden focus-visible:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "overflow-y-auto overscroll-contain",
            hasValue ? "mt-5 pb-1" : "pt-[10px] pb-[10px]",
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          {...props}
        />
      </div>
      {helpText && (
        <p
          className={cn(
            "text-xs mt-1 ml-4",
            error
              ? "text-status-destructive-primary"
              : "text-text-input-subtitle",
          )}
        >
          {helpText}
        </p>
      )}
    </div>
  );
});

FloatingLabelTextarea.displayName = "FloatingLabelTextarea";

export { FloatingLabelTextarea };
