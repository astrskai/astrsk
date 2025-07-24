"use client";

import { CircleAlert } from "lucide-react";

import { cn } from "@/components-v2/lib/utils";

const CardText = ({
  label,
  children,
  multiline,
}: {
  label?: string;
  children?: React.ReactNode;
  multiline?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-[4px]">
      {label && (
        <div className="font-[500] text-[12px] leading-[15px] text-text-input-subtitle">
          {label}
        </div>
      )}
      <div
        className={cn(
          "font-[400] text-[16px] leading-[19px] text-text-primary",
          !multiline && "line-clamp-1",
        )}
      >
        {children}
      </div>
    </div>
  );
};

const Card = ({
  buttons,
  active,
  error,
  hideErrorIcon,
  disabled,
  children,
  className,
  onClick,
}: {
  buttons?: React.ReactNode;
  active?: boolean;
  error?: boolean;
  hideErrorIcon?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn(
        "relative m-[16px] bg-background-card",
        "border border-border-container rounded-[8px]",
        "flex flex-row",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      onClick={onClick}
    >
      <div className="grow m-[16px] flex flex-row gap-[8px]">
        {error && !hideErrorIcon && (
          <CircleAlert
            size={24}
            className="shrink-0 text-status-destructive-light"
          />
        )}
        {children}
      </div>
      {buttons && (
        <div
          className={cn(
            "shrink-0 w-[40px] px-[8px] py-[16px] rounded-tr-[8px] rounded-br-[8px]",
            "bg-background-container text-text-input-subtitle",
            "flex flex-col gap-[12px]",
          )}
        >
          {buttons}
        </div>
      )}
      {active && (
        <div
          className={cn(
            "absolute inset-[-1px] rounded-[8px] pointer-events-none",
            "inset-ring-2 inset-ring-primary-normal",
          )}
        />
      )}
      {!active && error && (
        <div
          className={cn(
            "absolute inset-[-1px] rounded-[8px] pointer-events-none",
            "inset-ring-2 inset-ring-status-destructive-light",
          )}
        />
      )}
    </div>
  );
};

export { Card, CardText };
