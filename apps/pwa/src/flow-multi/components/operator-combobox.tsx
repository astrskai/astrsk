import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CaseUpper, Hash, ToggleRight } from 'lucide-react';
import { cn } from '@/shared/utils';
import { SvgIcon } from '@/components-v2/svg-icon';
import {
  ConditionDataType,
  ConditionOperator,
  getOperatorsForDataType,
  OPERATOR_LABELS,
} from '@/flow-multi/types/condition-types';

interface OperatorComboboxProps {
  value: {
    dataType: ConditionDataType | null;
    operator: ConditionOperator | null;
  };
  onChange: (dataType: ConditionDataType, operator: ConditionOperator) => void;
  className?: string;
  placeholder?: string;
}

export function OperatorCombobox({ value, onChange, className, placeholder = "Select" }: OperatorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<ConditionDataType | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedType(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
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

  const handleOperatorClick = (dataType: ConditionDataType, operator: ConditionOperator) => {
    onChange(dataType, operator);
    setIsOpen(false);
    setExpandedType(null);
  };

  const dataTypes: { type: ConditionDataType; label: string; icon: JSX.Element }[] = [
    { type: 'string', label: 'String', icon: <CaseUpper className="w-4 h-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { type: 'integer', label: 'Integer', icon: <SvgIcon name="integer" size={16} /> },
    { type: 'boolean', label: 'Boolean', icon: <ToggleRight className="w-4 h-4" /> },
  ];

  const getIconForType = (type: ConditionDataType) => {
    const dataType = dataTypes.find(dt => dt.type === type);
    return dataType?.icon;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="w-full min-h-8 p-2 bg-background-surface-0 rounded-md outline outline-1 outline-offset-[-1px] outline-border-normal flex justify-between items-center overflow-hidden cursor-pointer hover:outline-border-selected-inverse focus:outline-border-selected-inverse transition-all"
      >
        <div className="flex-1 flex justify-start items-center gap-1">
          {value.dataType && value.operator ? (
            <>
              <div className="w-4 h-4 text-text-primary">
                {getIconForType(value.dataType)}
              </div>
              <div className="flex-1 flex justify-start items-center gap-4">
                <div className="flex-1 justify-start text-text-primary text-xs font-normal truncate">
                  {OPERATOR_LABELS[value.operator]}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 justify-start text-text-placeholder text-xs font-normal">
              {placeholder}
            </div>
          )}
        </div>
        <div className="w-4 h-4 relative">
          <ChevronDown className={cn(
            "max-w-4 max-h-4 absolute left-[-1px] top-[-2px] text-background-surface-5 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full",
          dropdownPosition === 'bottom' ? "mt-1 top-full" : "mb-1 bottom-full"
        )}>
          <div className="p-1 bg-background-surface-1 rounded-lg shadow-lg inline-flex flex-col justify-start items-start gap-3 w-full max-h-[280px] overflow-y-auto">
            {dataTypes.map((dataType) => (
              <div key={dataType.type} className="self-stretch flex flex-col justify-start items-start gap-1">
                {/* Data Type Header */}
                <div
                  onClick={() => handleTypeClick(dataType.type)}
                  className={cn(
                    "self-stretch h-6 px-2 py-1 rounded-md inline-flex justify-between items-center cursor-pointer transition-colors",
                    value.dataType === dataType.type && !expandedType
                      ? "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]" 
                      : ""
                  )}
                >
                  <div className="flex justify-start items-center gap-1">
                    <div className={cn(
                      value.dataType === dataType.type
                        ? "text-text-primary"
                        : "text-text-subtle"
                    )}>
                      {dataType.icon}
                    </div>
                    <div className={cn(
                      "text-center justify-start text-xs",
                      value.dataType === dataType.type
                        ? "text-text-primary font-semibold"
                        : "text-text-subtle font-normal"
                    )}>
                      {dataType.label}
                    </div>
                  </div>
                  <div className="w-4 h-4 relative">
                    <ChevronDown className={cn(
                      "max-w-4 max-h-4 absolute left-[-1px] top-[-2px]",
                      value.dataType === dataType.type
                        ? "text-text-primary"
                        : "text-background-surface-5",
                      expandedType === dataType.type && "rotate-180"
                    )} />
                  </div>
                </div>

                {/* Operators List (shown when expanded) */}
                {expandedType === dataType.type && (
                  <div className="flex flex-col justify-start items-start gap-1">
                    {getOperatorsForDataType(dataType.type).map((operator) => (
                      <div
                        key={operator}
                        onClick={() => handleOperatorClick(dataType.type, operator)}
                        className={cn(
                          "self-stretch px-2 py-1 rounded-md inline-flex justify-center items-center gap-2 cursor-pointer transition-colors group",
                          value.operator === operator && value.dataType === dataType.type
                            ? "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]"
                            : ""
                        )}
                      >
                        <div className={cn(
                          "text-center justify-start text-xs",
                          value.operator === operator && value.dataType === dataType.type
                            ? "text-text-primary font-semibold"
                            : "text-text-subtle font-normal group-hover:text-text-primary"
                        )}>
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