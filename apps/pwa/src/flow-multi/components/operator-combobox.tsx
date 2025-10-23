import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, CaseUpper, Hash, ToggleRight } from "lucide-react";
import { cn } from "@/shared/lib";
import { SvgIcon } from "@/shared/ui";
import {
  ConditionDataType,
  ConditionOperator,
  getOperatorsForDataType,
  OPERATOR_LABELS,
} from "@/flow-multi/types/condition-types";

interface OperatorComboboxProps {
  value: {
    dataType: ConditionDataType | null;
    operator: ConditionOperator | null;
  };
  onChange: (dataType: ConditionDataType, operator: ConditionOperator) => void;
  className?: string;
  placeholder?: string;
}

export function OperatorCombobox({
  value,
  onChange,
  className,
  placeholder = "Select",
}: OperatorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<ConditionDataType | null>(
    null,
  );
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setExpandedType(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const dropdownHeight = 300; // Estimated max height of dropdown

      // If not enough space below but enough space above, position on top
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && value.dataType) {
      // When opening, expand the current data type if one is selected
      setExpandedType(value.dataType);
    } else {
      setExpandedType(null);
    }
  };

  const handleTypeClick = (type: ConditionDataType) => {
    if (expandedType === type) {
      setExpandedType(null);
    } else {
      setExpandedType(type);
    }
  };

  const handleOperatorClick = (
    dataType: ConditionDataType,
    operator: ConditionOperator,
  ) => {
    onChange(dataType, operator);
    setIsOpen(false);
    setExpandedType(null);
  };

  const dataTypes: {
    type: ConditionDataType;
    label: string;
    icon: JSX.Element;
  }[] = [
    {
      type: "string",
      label: "String",
      icon: <CaseUpper className="h-4 w-4" />,
    },
    { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
    {
      type: "integer",
      label: "Integer",
      icon: <SvgIcon name="integer" size={16} />,
    },
    {
      type: "boolean",
      label: "Boolean",
      icon: <ToggleRight className="h-4 w-4" />,
    },
  ];

  const getIconForType = (type: ConditionDataType) => {
    const dataType = dataTypes.find((dt) => dt.type === type);
    return dataType?.icon;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="bg-background-surface-0 outline-border-normal hover:outline-border-selected-inverse focus:outline-border-selected-inverse flex min-h-8 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md p-2 outline outline-1 outline-offset-[-1px] transition-all"
      >
        <div className="flex flex-1 items-center justify-start gap-1">
          {value.dataType && value.operator ? (
            <>
              <div className="text-text-primary h-4 w-4">
                {getIconForType(value.dataType)}
              </div>
              <div className="flex flex-1 items-center justify-start gap-4">
                <div className="text-text-primary flex-1 justify-start truncate text-xs font-normal">
                  {OPERATOR_LABELS[value.operator]}
                </div>
              </div>
            </>
          ) : (
            <div className="text-text-placeholder flex-1 justify-start text-xs font-normal">
              {placeholder}
            </div>
          )}
        </div>
        <div className="relative h-4 w-4">
          <ChevronDown
            className={cn(
              "text-background-surface-5 absolute top-[-2px] left-[-1px] max-h-4 max-w-4 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full",
            dropdownPosition === "bottom"
              ? "top-full mt-1"
              : "bottom-full mb-1",
          )}
        >
          <div className="bg-background-surface-1 inline-flex max-h-[650px] w-full flex-col items-start justify-start overflow-y-auto rounded-lg p-1 shadow-lg">
            {dataTypes.map((dataType, index) => (
              <div
                key={dataType.type}
                className="flex flex-col items-start justify-start gap-1 self-stretch"
              >
                {/* Data Type Header - Add border-t for all except first */}
                <div
                  onClick={() => handleTypeClick(dataType.type)}
                  className={cn(
                    "group inline-flex cursor-pointer items-center justify-between self-stretch p-2 transition-colors",
                    index > 0 && "border-border-dark border-t",
                    value.dataType === dataType.type && !expandedType
                      ? "bg-background-surface-3 rounded-md shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]"
                      : "",
                  )}
                >
                  <div className="flex items-center justify-start gap-1">
                    <div
                      className={cn(
                        "h-4 w-4",
                        value.dataType === dataType.type
                          ? "text-text-primary"
                          : "text-text-subtle group-hover:text-text-primary",
                      )}
                    >
                      {dataType.icon}
                    </div>
                    <div
                      className={cn(
                        "justify-start text-xs",
                        value.dataType === dataType.type
                          ? "text-text-primary font-semibold"
                          : "text-text-subtle group-hover:text-text-primary font-normal",
                      )}
                    >
                      {dataType.label}
                    </div>
                  </div>
                  <div className="relative h-4 w-4">
                    <ChevronDown
                      className={cn(
                        "absolute top-[-2px] left-[-1px] max-h-4 max-w-4",
                        value.dataType === dataType.type
                          ? "text-text-primary"
                          : "text-background-surface-5 group-hover:text-text-primary",
                        expandedType === dataType.type && "rotate-180",
                      )}
                    />
                  </div>
                </div>

                {/* Operators List (shown when expanded) */}
                {expandedType === dataType.type && (
                  <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                    {getOperatorsForDataType(dataType.type).map((operator) => (
                      <div
                        key={operator}
                        onClick={() =>
                          handleOperatorClick(dataType.type, operator)
                        }
                        className={cn(
                          "group inline-flex cursor-pointer items-center justify-start gap-2 self-stretch rounded-md p-2 transition-colors",
                          value.operator === operator &&
                            value.dataType === dataType.type
                            ? "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]"
                            : "",
                        )}
                      >
                        <div
                          className={cn(
                            "justify-start text-xs",
                            value.operator === operator &&
                              value.dataType === dataType.type
                              ? "text-text-primary font-semibold"
                              : "text-text-subtle group-hover:text-text-primary font-normal",
                          )}
                        >
                          {OPERATOR_LABELS[operator]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
