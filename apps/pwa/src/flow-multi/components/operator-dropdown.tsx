import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils';
import {
  ConditionDataType,
  ConditionOperator,
  getOperatorsForDataType,
  OPERATOR_LABELS,
} from '@/flow-multi/types/condition-types';

interface OperatorDropdownProps {
  value: {
    dataType: ConditionDataType;
    operator: ConditionOperator;
  };
  onChange: (dataType: ConditionDataType, operator: ConditionOperator) => void;
  className?: string;
}

export function OperatorDropdown({ value, onChange, className }: OperatorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ConditionDataType | null>(value.dataType);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedType(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTypeClick = (type: ConditionDataType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const handleOperatorClick = (dataType: ConditionDataType, operator: ConditionOperator) => {
    onChange(dataType, operator);
    setIsOpen(false);
    setSelectedType(null);
  };

  const dataTypes: { type: ConditionDataType; label: string }[] = [
    { type: 'string', label: 'String' },
    { type: 'number', label: 'Number' },
    { type: 'integer', label: 'Integer' },
    { type: 'boolean', label: 'Boolean' },
  ];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline outline-1 outline-offset-[-1px] outline-border-normal flex justify-between items-center overflow-hidden cursor-pointer hover:bg-background-surface-1 transition-colors"
      >
        <div className="flex-1 flex justify-start items-center gap-4">
          <div className="flex-1 justify-start text-text-primary text-xs font-normal">
            {OPERATOR_LABELS[value.operator]}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-text-subtle transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 mt-1">
          <div className="relative inline-flex justify-start items-start gap-1.5">
            {/* Operators submenu - positioned to the LEFT of the data types */}
            {selectedType && (
              <div className="w-40 max-h-80 p-1 bg-background-surface-1 rounded-lg shadow-lg inline-flex flex-col justify-start items-start gap-1.5 overflow-y-auto">
                {getOperatorsForDataType(selectedType).map((operator) => (
                  <div
                    key={operator}
                    onClick={() => handleOperatorClick(selectedType, operator)}
                    className={cn(
                      "w-full px-2 py-1 rounded-md inline-flex justify-center items-center gap-2 cursor-pointer transition-colors",
                      value.operator === operator && value.dataType === selectedType ?
                        "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]" :
                        "hover:bg-background-surface-2"
                    )}
                  >
                    <div className={cn(
                      "text-center justify-start text-xs whitespace-nowrap",
                      value.operator === operator && value.dataType === selectedType ?
                        "text-text-primary font-semibold" :
                        "text-text-subtle font-normal"
                    )}>
                      {OPERATOR_LABELS[operator]}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Data types menu */}
            <div className="w-32 p-1 bg-background-surface-1 rounded-lg shadow-lg inline-flex flex-col justify-start items-start gap-1.5">
              {dataTypes.map((dataType) => (
                <div
                  key={dataType.type}
                  className="relative w-full"
                >
                  <div
                    onClick={() => handleTypeClick(dataType.type)}
                    className={cn(
                      "w-full h-6 px-2 py-1 rounded-md inline-flex justify-between items-center cursor-pointer transition-colors",
                      selectedType === dataType.type ? 
                        "bg-background-surface-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]" : 
                        "hover:bg-background-surface-2",
                      value.dataType === dataType.type && "font-semibold"
                    )}
                  >
                    <div className={cn(
                      "text-center justify-start text-xs",
                      selectedType === dataType.type || value.dataType === dataType.type ? 
                        "text-text-primary font-semibold" : 
                        "text-text-subtle font-normal"
                    )}>
                      {dataType.label}
                    </div>
                    <div className="w-4 h-4 relative overflow-hidden">
                      <ChevronRight className={cn(
                        "w-3 h-3 absolute left-[0.5px] top-[0.5px] transform rotate-180",
                        selectedType === dataType.type || value.dataType === dataType.type ?
                          "text-text-primary" :
                          "text-background-surface-5"
                      )} />
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