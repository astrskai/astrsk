"use client";

import { CircleHelp } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib";

import { TypoTiny } from "@/components/ui/typo";
import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

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
            "bg-background-surface-4 ring-offset-background relative flex w-full rounded-md px-3 py-2 text-sm",
            "h-[57px]",
            error
              ? "border-status-destructive-primary border"
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
              "peer text-text-primary placeholder:text-text-placeholder flex w-full bg-transparent px-0 py-0 text-base",
              "border-none focus:ring-0 focus:outline-hidden",
              "ring-offset-transparent file:border-0 file:bg-transparent file:text-base file:font-medium",
              "focus-visible:ring-0 focus-visible:outline-hidden",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "no-value:pt-3 no-value:pb-3",
              "has-value:pt-5 has-value:pb-1",
              variant === "add" ? "pr-16" : "",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
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
              "text-text-placeholder pointer-events-none absolute transition-all duration-200 ease-in-out",
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
                "absolute top-1/2 right-4 min-w-[80px] -translate-y-1/2",
              )}
            >
              {buttonLabel}
            </Button>
          )}
          {variant === "edit" && (
            <Button
              onClick={onButtonClick}
              className={cn(
                "absolute top-1/2 right-2 -translate-y-1/2",
                "px-2 py-1 text-xs font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 rounded-md",
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
              "mt-1 mr-4 ml-4 text-xs",
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
                <div className="text-text-input-subtitle hover:text-text-input-hover active:text-text-input-clicked absolute top-1/2 right-2 grid size-[24px] -translate-y-1/2 cursor-pointer place-content-center">
                  <CircleHelp size={14} className="cursor-pointer" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5} className="z-[100]">
                <div className="flex flex-col px-2 py-2">
                  <TypoTiny className="w-[186px] p-0 leading-tight">
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
