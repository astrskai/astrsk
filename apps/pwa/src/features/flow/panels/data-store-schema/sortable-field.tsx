import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { DataStoreSchemaField } from "./data-store-schema-types";

interface SortableFieldProps {
  field: DataStoreSchemaField;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableField({ 
  field, 
  isSelected,
  onClick,
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  // No drag styles since we're disabling drag functionality
  const style = {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="self-stretch inline-flex justify-start items-center gap-2"
    >
      {/* Hidden drag handle - completely hidden */}
      <div className="hidden">
        <GripVertical className="min-w-4 min-h-4 text-text-info" />
      </div>
      <div 
        className={`flex-1 min-w-px inline-flex flex-col justify-start items-start gap-2 cursor-pointer`}
        onClick={onClick}
      >
        <div className={`self-stretch px-4 py-2 bg-background-surface-3 rounded-md inline-flex justify-start items-center gap-2 overflow-hidden ${
          isSelected 
            ? 'outline outline-2 outline-offset-[-2px] outline-border-selected-inverse' 
            : ''
        }`}>
          <div className="flex-1 min-w-px justify-start text-text-body text-xs font-normal">
            {`{{${field.name}}}`}
          </div>
        </div>
      </div>
    </div>
  );
}