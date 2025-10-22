import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/utils";

interface SortableItem {
  id: string;
  name: string;
}

interface SortableItemProps<T extends SortableItem> {
  item: T;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableItem<T extends SortableItem>({
  item,
  isSelected,
  onClick,
}: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="self-stretch inline-flex justify-start items-center gap-1"
    >
      <div
        className="w-6 h-6 relative cursor-grab active:cursor-grabbing flex items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-text-info" />
      </div>
      <button
        onClick={onClick}
        className={cn(
          "flex-1 min-w-0 px-4 py-2 rounded-md outline outline-1 outline-offset-[-1px] flex justify-start items-center overflow-hidden transition-all",
          isSelected
            ? "bg-background-surface-4 outline-text-primary"
            : "bg-background-surface-3 outline-background-surface-2 hover:outline-border-normal",
        )}
      >
        <div className="text-left text-text-primary text-xs font-semibold truncate">
          {item.name}
        </div>
      </button>
    </div>
  );
}