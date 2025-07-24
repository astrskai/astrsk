import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageCircle, GripVertical } from "lucide-react";
import { Switch } from "@/components-v2/ui/switch";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { PromptItem } from "./prompt-types";

interface SortableItemProps {
  item: PromptItem;
  isSelected: boolean;
  onClick: () => void;
  onToggle: (checked: boolean) => void;
  onRoleChange: (role: "system" | "user" | "assistant") => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function SortableItem({ 
  item, 
  isSelected,
  onClick,
  onToggle,
  onRoleChange,
  onDelete,
  canDelete,
}: SortableItemProps) {
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
      className="self-stretch inline-flex justify-start items-center gap-2"
    >
      <div 
        className="w-6 h-6 relative cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-text-info" />
      </div>
      <div className="flex-1 min-w-px inline-flex flex-col justify-start items-start gap-2">
        <div 
          className={cn(
            "self-stretch px-4 py-2 bg-background-surface-3 rounded-md inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer",
            isSelected ? "outline outline-2 outline-offset-[-2px] outline-border-selected-inverse" : ""
          )}
          onClick={onClick}
        >
          {item.type === "history" ? (
            <SvgIcon name="history_message" className="max-w-4 max-h-4" />
          ) : (
            <MessageCircle className="w-4 h-4 text-text-body" />
          )}
          <div className="flex-1 min-w-px justify-start text-text-body text-xs font-normal truncate">
            {item.label}
          </div>
        </div>
      </div>
      <div className="inline-flex flex-col justify-center items-center">
        <Switch 
          checked={item.enabled}
          onCheckedChange={onToggle}
          size="small"
          className="data-[state=unchecked]:bg-alpha-80/20"
        />
      </div>
    </div>
  );
}