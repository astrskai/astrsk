"use client";

import * as React from "react";

import { cn } from "@/shared/utils/tailwind-utils";

import { Badge } from "@/components-v2/ui/badge"; // Import the modified Badge
import {
  FloatingLabelInput,
  FloatingLabelInputProps,
} from "@/components-v2/ui/floating-label-input"; // Import base input

export interface FloatingLabelInputsProps
  extends Omit<FloatingLabelInputProps, "value" | "onChange"> {
  values: string[];
  onValuesChange: (newValues: string[]) => void;
  onBadgeClick?: (value: string, index: number) => void; // For editing
  inputPlaceholder?: string; // Optional different placeholder for the input itself
  badgeClassName?: string;
  maxBadgeCount?: number;
  warning?: boolean;
}

const FloatingLabelInputs = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputsProps
>(
  (
    {
      className,
      label,
      error,
      helpText,
      values,
      onValuesChange,
      onBadgeClick,
      inputPlaceholder,
      badgeClassName,
      maxBadgeCount,
      warning,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleAddOrUpdateValue = () => {
      if (inputValue.trim() !== "") {
        if (editingIndex !== null) {
          // Edit existing badge
          const newValues = [...values];
          newValues[editingIndex] = inputValue.trim();
          onValuesChange(newValues);
          setEditingIndex(null);
        } else {
          // Add new badge
          if (maxBadgeCount && values.length >= maxBadgeCount) {
            return;
          }
          const newValues = [...values, inputValue.trim()];
          onValuesChange(newValues);
        }
        setInputValue("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim() !== "") {
        e.preventDefault();
        handleAddOrUpdateValue();
      }
      if (e.key === "Escape") {
        setInputValue("");
        setEditingIndex(null);
      }
    };

    const handleDelete = (indexToDelete: number) => {
      const newValues = values.filter((_, index) => index !== indexToDelete);
      onValuesChange(newValues);
      // If deleting the badge currently being edited, exit editing mode
      if (editingIndex === indexToDelete) {
        setInputValue("");
        setEditingIndex(null);
      }
    };

    const handleBadgeClick = (value: string, index: number) => {};

    const handleAddValue = () => {
      if (inputValue.trim() !== "") {
        if (editingIndex !== null) {
          const newValues = [...values];
          newValues[editingIndex] = inputValue.trim();
          onValuesChange(newValues);
          setEditingIndex(null);
        } else {
          const newValues = [...values, inputValue.trim()];
          onValuesChange(newValues);
        }
        setInputValue("");
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        <FloatingLabelInput
          ref={ref}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          error={error}
          placeholder={inputPlaceholder}
          variant="add"
          buttonLabel="Add"
          onButtonClick={handleAddOrUpdateValue}
          {...props}
        />
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.map((badgeValue, index) => (
              <Badge
                key={`${badgeValue}-${index}`}
                variant="editable"
                onClick={() => handleBadgeClick(badgeValue, index)}
                onDelete={() => handleDelete(index)}
                className={cn(
                  {
                    "p-2 ring-2 ring-primary ring-offset-1 bg-background-container text-text-input-subtitle":
                      editingIndex === index,
                  },
                  badgeClassName,
                )}
              >
                {badgeValue}
              </Badge>
            ))}
          </div>
        )}
        {helpText && (
          <p
            className={cn(
              "text-xs ml-4",
              warning
                ? "text-status-warning"
                : error
                  ? "text-status-destructive-primary"
                  : "text-text-input-subtitle",
            )}
          >
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

FloatingLabelInputs.displayName = "FloatingLabelInputs";

export { FloatingLabelInputs };
