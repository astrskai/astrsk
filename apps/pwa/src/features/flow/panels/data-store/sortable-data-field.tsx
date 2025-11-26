import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { DataStoreField } from "@/entities/flow/domain/flow";

interface SortableDataFieldProps {
  field: DataStoreField;
  fieldName: string; // Display name from schema
  isSelected: boolean;
  onClick: () => void;
}

export function SortableDataField({ 
  field, 
  fieldName,
  isSelected,
  onClick,
}: SortableDataFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.schemaFieldId });

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
        className="w-6 h-6 relative cursor-grab active:cursor-grabbing flex items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="max-w-4 max-h-4 text-fg-subtle" />
      </div>
      <div 
        className="flex-1 min-w-px inline-flex flex-col justify-start items-start gap-2 cursor-pointer"
        onClick={onClick}
      >
        <div className={`self-stretch px-4 py-2 bg-surface-overlay rounded-md inline-flex justify-start items-center gap-2 overflow-hidden ${
          isSelected 
            ? 'outline outline-2 outline-offset-[-2px] outline-border-emphasis' 
            : ''
        }`}>
          <div className="flex-1 min-w-px justify-start text-fg-muted text-xs font-normal">
            {`{{${fieldName}}}`}
          </div>
        </div>
      </div>
    </div>
  );
}