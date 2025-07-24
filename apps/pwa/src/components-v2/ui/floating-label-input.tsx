"use client";

import { CircleHelp } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils/tailwind-utils";

import { TypoTiny } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helpText?: string;
  value?: string;
  onButtonClick?: () => void;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  variant?: "default" | "add" | "edit" | "guide";
  onClick?: () => void;
  tooltip?: string;
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      className,
      label,
      error,
      helpText,
      value,
      variant = "default",
      buttonLabel = "Add",
      buttonIcon,
      onButtonClick,
      tooltip,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative">
        <div
          className={cn(
            "relative flex w-full rounded-md bg-background-surface-4 px-3 py-2 text-sm ring-offset-background",
            "h-[57px]",
            error
              ? "border border-status-destructive-primary "
              : "focus-within:border-primary",
            props.readOnly ? "cursor-pointer" : "",
            className,
          )}
          tabIndex={-1}
        >
          <input
            value={value}
            placeholder=""
            className={cn(
              "peer flex w-full bg-transparent px-0 py-0 text-base text-text-primary placeholder:text-text-placeholder",
              "border-none focus:ring-0 focus:outline-hidden",
              "ring-offset-transparent file:border-0 file:bg-transparent file:text-base file:font-medium",
              "focus-visible:outline-hidden focus-visible:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "no-value:pt-3 no-value:pb-3",
              "has-value:pt-5 has-value:pb-1",
              variant === "add" ? "pr-16" : "",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            )}
            ref={ref}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
            {...props}
          />
          <label
            className={cn(
              "absolute pointer-events-none transition-all duration-200 ease-in-out text-text-placeholder",
              "peer-no-value:text-base peer-no-value:translate-y-2.5",
              "peer-has-value:text-xs peer-has-value:translate-y-0",
            )}
          >
            <div className="flex items-center">{label}</div>
          </label>
          {variant === "add" && (
            <Button
              onClick={onButtonClick}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 min-w-[80px]",
              )}
            >
              {buttonLabel}
            </Button>
          )}
          {variant === "edit" && (
            <Button
              onClick={onButtonClick}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "px-2 py-1 text-xs font-medium",
                "bg-primary text-primary-foreground",
                "rounded-md hover:bg-primary/90",
                "transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {buttonIcon}
            </Button>
          )}
        </div>
        {helpText && (
          <p
            className={cn(
              "text-xs mt-1 ml-4 mr-4",
              error
                ? "text-status-destructive-primary"
                : "text-text-input-subtitle",
              variant === "guide" ? "text-right" : "",
            )}
          >
            {helpText}
          </p>
        )}

        {tooltip && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 size-[24px] grid place-content-center text-text-input-subtitle hover:text-text-input-hover active:text-text-input-clicked cursor-pointer">
                  <CircleHelp size={14} className="cursor-pointer" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5} className="z-[100]">
                <div className="flex flex-col px-2 py-2">
                  <TypoTiny className="p-0 w-[186px] leading-tight">
                    {tooltip}
                  </TypoTiny>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  },
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
