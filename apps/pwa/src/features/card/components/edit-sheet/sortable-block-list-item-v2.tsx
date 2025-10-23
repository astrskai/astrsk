"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import React from "react";

import { EntryBlockV2 } from "@/features/card/components/edit-sheet/entry-block-v2";
import { cn } from "@/shared/lib";
import { Button } from "@/components-v2/ui/button";
import { Entry } from "@/modules/card/domain";

interface SortableBlockListItemV2Props {
  id: string; // Dnd-kit requires a unique string ID
  entry: Entry;
  onChange: (id: string, updatedEntry: Entry) => void;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
  isOpen?: boolean; // Control accordion open state
  onOpenChange?: (open: boolean) => void; // Handle accordion state changes
  isOpacityEnabled?: boolean;
  isHighlighted?: boolean; // Whether this item should be highlighted (e.g., newly cloned)
  isDeleting?: boolean; // Whether this item is being deleted
  tryedValidation?: boolean; // Whether validation errors should be shown
}

export function SortableBlockListItemV2({
  id,
  entry,
  onChange,
  onDelete,
  onClone,
  isOpen,
  onOpenChange,
  isOpacityEnabled,
  isHighlighted = false,
  isDeleting = false,
  tryedValidation = false,
}: SortableBlockListItemV2Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  const handleEntryChange = (updatedEntry: Entry) => {
    onChange(id, updatedEntry);
  };

  const handleEntryDelete = () => {
    onDelete(id);
  };

  const handleEntryClone = () => {
    onClone(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative", // Add left padding to accommodate the absolutely positioned handle
        isDragging && "opacity-50 z-50", // Style when dragging
        isOpacityEnabled && "transition-opacity",
        isHighlighted && "animate-highlight",
        isDeleting && "animate-delete",
      )}
    >
      {/* Drag Handle - Absolutely positioned */}
      {/* <Button
        variant="ghost"
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-0 top-1/2 -translate-x-8 flex items-center justify-center cursor-grab touch-none py-4 px-2 text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging && "cursor-grabbing",
        )}
        aria-label="Drag entry"
      >
        <GripVertical className="h-5 w-5" />
      </Button> */}

      {/* Entry Block - Now takes full width */}
      <div className="flex-1">
        <EntryBlockV2
          id={id}
          entry={entry}
          onChange={handleEntryChange}
          onDelete={handleEntryDelete}
          onClone={handleEntryClone}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          tryedValidation={tryedValidation}
        />
      </div>
    </div>
  );
}
