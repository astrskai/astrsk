"use client";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
import { FloatingLabelInput } from "@/shared/ui/floating-label-input";
import { FloatingLabelInputs } from "@/shared/ui/floating-label-inputs";
import { FloatingLabelTextarea } from "@/shared/ui/floating-label-textarea";
import { Entry } from "@/modules/card/domain";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface EntryBlockV2Props {
  entry: Entry;
  onChange: (newEntry: Entry) => void;
  onDelete: () => void;
  onClone: () => void;
  id: string; // Unique prefix for element IDs
  isOpen?: boolean; // Control content visibility
  onOpenChange?: (open: boolean) => void; // Handle state changes
  tryedValidation?: boolean; // Whether to show validation errors
}

export const EntryBlockV2: React.FC<EntryBlockV2Props> = ({
  entry,
  onChange,
  onDelete,
  onClone,
  id,
  isOpen = false,
  onOpenChange,
  tryedValidation = false, // Default to false (don't show errors)
}) => {
  const isMobile = useIsMobile();
  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    keys: "",
    content: "",
    recallRange: "",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const result = entry.withName(newName);
    if (result.isSuccess) {
      onChange(result.getValue());
      // Clear the error if the field is now valid
      if (newName.trim() !== "") {
        setErrors((prev) => ({ ...prev, name: "" }));
      } else {
        setErrors((prev) => ({ ...prev, name: "Name is required" }));
      }
    }
  };

  const handleKeysChange = (keys: string[]) => {
    const result = entry.withKeys(keys);
    if (result.isSuccess) {
      onChange(result.getValue());
      // Validate that there's at least one keyword
      if (keys.length > 0) {
        setErrors((prev) => ({ ...prev, keys: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          keys: "At least one keyword is required. Press Enter to add a keyword.",
        }));
      }
    }
  };

  const handleRecallRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const recallRange = parseInt(e.target.value, 10);
    let result;
    if (!isNaN(recallRange) && recallRange >= 1) {
      result = entry.withRecallRange(recallRange);
    } else {
      result = entry.withRecallRange(0);
    }

    if (result.isSuccess) {
      onChange(result.getValue());
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const result = entry.withContent(newContent);
    if (result.isSuccess) {
      onChange(result.getValue());
      // Clear the error if the field is now valid
      if (newContent.trim() !== "") {
        setErrors((prev) => ({ ...prev, content: "" }));
      } else {
        setErrors((prev) => ({ ...prev, content: "Content is required" }));
      }
    }
  };

  // Toggle open/close state
  const toggleOpen = () => {
    if (onOpenChange) {
      onOpenChange(!isOpen);
    }
  };

  // When validation state changes, automatically open if there are errors and isValidated is true
  useEffect(() => {
    const hasErrors =
      errors.name || errors.keys || errors.content || errors.recallRange;
    if (tryedValidation && hasErrors && !isOpen && onOpenChange) {
      onOpenChange(true);
    }
  }, [tryedValidation, errors, isOpen, onOpenChange]);

  // Validate all fields on initial render and when entry changes
  useEffect(() => {
    const newErrors = {
      name: entry.name.trim() === "" ? "Name is required" : "",
      keys: entry.keys.length === 0 ? "At least one keyword is required" : "",
      content: entry.content.trim() === "" ? "Content is required" : "",
      recallRange:
        entry.recallRange === 0 ? "Recall range must be greater than 0" : "",
    };
    setErrors(newErrors);
  }, [entry]);

  const nonIntegerKeys = ["e", "E", "+", "-", "."];
  const ignoreNonIntegerKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    if (nonIntegerKeys.includes(key)) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={`w-full ${isMobile ? "bg-background-surface-3" : "bg-background-card"} border border-border-light rounded-md overflow-hidden`}
      id={`entry-${id}`}
    >
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2 w-full">
          <div className="w-full pr-4">
            {isOpen ? (
              <FloatingLabelInput
                id={`${id}-name`}
                label="Lore book name*"
                value={entry.name}
                onChange={handleNameChange}
                className="w-full"
                error={tryedValidation && !!errors.name}
                helpText={(tryedValidation && errors.name) || ""}
              />
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={toggleOpen}
              >
                <span>{entry.name || "Name*"}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost_white"
              size="icon"
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onClone?.();
              }}
            >
              <Copy className="min-w-[24px] min-h-[24px]" />
              <span className="sr-only">Clone entry</span>
            </Button>
            <Button
              type="button"
              variant="ghost_white"
              size="icon"
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="min-w-[24px] min-h-[24px]" />
              <span className="sr-only">Delete entry</span>
            </Button>
            <Button
              type="button"
              variant="ghost_white"
              size="icon"
              onClick={toggleOpen}
              className="focus:outline-none"
            >
              {isOpen ? (
                <ChevronUp className="min-w-[24px] min-h-[24px]" />
              ) : (
                <ChevronDown className="min-w-[24px] min-h-[24px]" />
              )}
              <span className="sr-only">{isOpen ? "Close" : "Open"}</span>
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {isMobile ? (
            <>
              <FloatingLabelInputs
                id={`${id}-keys`}
                label="Trigger keywords*"
                values={entry.keys}
                onValuesChange={handleKeysChange}
                helpText={
                  tryedValidation && errors.keys
                    ? errors.keys
                    : entry.keys.length === 0
                      ? "When a character uses these words, this entry activates."
                      : undefined
                }
                error={tryedValidation && !!errors.keys}
                className="w-full"
                badgeClassName={isMobile ? "bg-background-surface-2" : ""}
              />
              <FloatingLabelInput
                id={`${id}-recall-range`}
                label="Recall range"
                type="number"
                value={String(entry.recallRange)}
                onChange={handleRecallRangeChange}
                onKeyDown={ignoreNonIntegerKey}
                className="w-full"
                min={0}
                helpText={
                  tryedValidation && errors.recallRange
                    ? "Recall range must be greater than 0"
                    : "min 1 / Max 10"
                }
                error={tryedValidation && !!errors.recallRange}
                tooltip="Set the scan depth to determine how many messages are checked for triggers."
              />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <FloatingLabelInputs
                id={`${id}-keys`}
                label="Trigger keywords*"
                values={entry.keys}
                onValuesChange={handleKeysChange}
                helpText={
                  tryedValidation && errors.keys
                    ? errors.keys
                    : entry.keys.length === 0
                      ? "When a character uses these words, this entry activates."
                      : undefined
                }
                error={tryedValidation && !!errors.keys}
                className="w-full"
                badgeClassName={isMobile ? "bg-background-surface-2" : ""}
              />
              <FloatingLabelInput
                id={`${id}-recall-range`}
                label="Recall range"
                type="number"
                value={String(entry.recallRange)}
                onChange={handleRecallRangeChange}
                onKeyDown={ignoreNonIntegerKey}
                className="w-34"
                min={0}
                helpText={
                  tryedValidation && errors.recallRange
                    ? "Recall range must be greater than 0"
                    : undefined
                }
                error={tryedValidation && !!errors.recallRange}
                tooltip="Set the scan depth to determine how many messages are checked for triggers."
              />
            </div>
          )}
          <FloatingLabelTextarea
            id={`${id}-content`}
            label="Description*"
            value={entry.content}
            onChange={handleContentChange}
            className="min-h-[100px]"
            error={tryedValidation && !!errors.content}
            helpText={(tryedValidation && errors.content) || "{{entries}}"}
          />
        </div>
      )}
    </div>
  );
};

EntryBlockV2.displayName = "EntryBlockV2";
