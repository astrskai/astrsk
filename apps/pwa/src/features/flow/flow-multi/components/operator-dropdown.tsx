import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib";
import {
  ConditionDataType,
  ConditionOperator,
  getOperatorsForDataType,
  OPERATOR_LABELS,
} from "@/features/flow/flow-multi/types/condition-types";

interface OperatorDropdownProps {
  value: {
    dataType: ConditionDataType;
    operator: ConditionOperator;
  };
  onChange: (dataType: ConditionDataType, operator: ConditionOperator) => void;
  className?: string;
}

export function OperatorDropdown({
  value,
  onChange,
  className,
}: OperatorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ConditionDataType | null>(
    value.dataType,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedType(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleTypeClick = (type: ConditionDataType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const handleOperatorClick = (
    dataType: ConditionDataType,
    operator: ConditionOperator,
  ) => {
    onChange(dataType, operator);
    setIsOpen(false);
    setSelectedType(null);
  };

  const dataTypes: { type: ConditionDataType; label: string }[] = [
    { type: "string", label: "String" },
    { type: "number", label: "Number" },
    { type: "integer", label: "Integer" },
    { type: "boolean", label: "Boolean" },
  ];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background-surface-0 outline-border-normal hover:bg-background-surface-1 flex min-h-8 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-4 py-2 outline outline-1 outline-offset-[-1px] transition-colors"
      >
        <div className="flex flex-1 items-center justify-start gap-4">
          <div className="text-text-primary flex-1 justify-start text-xs font-normal">
            {OPERATOR_LABELS[value.operator]}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "text-text-subtle h-4 w-4 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 mt-1">
          <div className="relative inline-flex items-start justify-start gap-1.5">
            {/* Operators submenu - positioned to the LEFT of the data types */}
            {selectedType && (
              <div className="bg-background-surface-1 inline-flex max-h-80 w-40 flex-col items-start justify-start gap-1.5 overflow-y-auto rounded-lg p-1 shadow-lg">
                {getOperatorsForDataType(selectedType).map((operator) => (
                  <div
                    key={operator}
                    onClick={() => handleOperatorClick(selectedType, operator)}
                    className={cn(
                      "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-2 py-1 transition-colors",
                      value.operator === operator &&
                        value.dataType === selectedType
                        ? "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]"
                        : "hover:bg-background-surface-2",
                    )}
                  >
                    <div
                      className={cn(
                        "justify-start text-center text-xs whitespace-nowrap",
                        value.operator === operator &&
                          value.dataType === selectedType
                          ? "text-text-primary font-semibold"
                          : "text-text-subtle font-normal",
                      )}
                    >
                      {OPERATOR_LABELS[operator]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Data types menu */}
            <div className="bg-background-surface-1 inline-flex w-32 flex-col items-start justify-start gap-1.5 rounded-lg p-1 shadow-lg">
              {dataTypes.map((dataType) => (
                <div key={dataType.type} className="relative w-full">
                  <div
                    onClick={() => handleTypeClick(dataType.type)}
                    className={cn(
                      "inline-flex h-6 w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 transition-colors",
                      selectedType === dataType.type
                        ? "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]"
                        : "hover:bg-background-surface-2",
                      value.dataType === dataType.type && "font-semibold",
                    )}
                  >
                    <div
                      className={cn(
                        "justify-start text-center text-xs",
                        selectedType === dataType.type ||
                          value.dataType === dataType.type
                          ? "text-text-primary font-semibold"
                          : "text-text-subtle font-normal",
                      )}
                    >
                      {dataType.label}
                    </div>
                    <div className="relative h-4 w-4 overflow-hidden">
                      <ChevronRight
                        className={cn(
                          "absolute top-[0.5px] left-[0.5px] h-3 w-3 rotate-180 transform",
                          selectedType === dataType.type ||
                            value.dataType === dataType.type
                            ? "text-text-primary"
                            : "text-background-surface-5",
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
