import { GripVertical, Code } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib";
import { SchemaFieldItem } from "./output-types";

interface SortableSchemaFieldProps {
  agentKey: string;
  field: SchemaFieldItem;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableSchemaField({
  agentKey,
  field,
  isSelected,
  onClick,
}: SortableSchemaFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="self-stretch inline-flex justify-start items-center gap-2"
    >
      <div 
        className="w-6 h-6 relative cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-fg-subtle" />
      </div>
      <div className="flex-1 min-w-px inline-flex flex-col justify-start items-start gap-2">
        <div 
          className={cn(
            "self-stretch px-4 py-2 bg-surface-overlay rounded-md inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer",
            isSelected ? "outline outline-2 outline-offset-[-2px] outline-border-emphasis" : ""
          )}
          onClick={onClick}
        >
          <Code className="w-4 h-4 text-fg-muted" />
          <div className="flex-1 min-w-px justify-start text-fg-muted text-xs font-normal truncate">
            {`{{${agentKey}.${field.name}}}`}
          </div>
        </div>
      </div>
    </div>
  );
}