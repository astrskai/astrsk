import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageCircle, GripVertical } from "lucide-react";
import { Switch } from "@/components-v2/ui/switch";
import { cn } from "@/shared/lib/cn";
import { SvgIcon } from "@/components/ui/svg-icon";
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
      className="inline-flex items-center justify-start gap-2 self-stretch"
    >
      <div
        className="relative h-6 w-6 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="text-text-info h-4 w-4" />
      </div>
      <div className="inline-flex min-w-px flex-1 flex-col items-start justify-start gap-2">
        <div
          className={cn(
            "bg-background-surface-3 inline-flex cursor-pointer items-center justify-start gap-2 self-stretch overflow-hidden rounded-md px-4 py-2",
            isSelected
              ? "outline-border-selected-inverse outline outline-2 outline-offset-[-2px]"
              : "",
          )}
          onClick={onClick}
        >
          {item.type === "history" ? (
            <SvgIcon name="history_message" className="max-h-4 max-w-4" />
          ) : (
            <MessageCircle className="text-text-body h-4 w-4" />
          )}
          <div className="text-text-body min-w-px flex-1 justify-start truncate text-xs font-normal">
            {item.label}
          </div>
        </div>
      </div>
      <div className="inline-flex flex-col items-center justify-center">
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
