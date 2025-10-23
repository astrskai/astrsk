"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useEffect, useState, useMemo } from "react";

import { SortableBlockListItemV2 } from "@/features/card/components/edit-sheet/sortable-block-list-item-v2";
import { Entry } from "@/entities/card/domain";

interface SortableBlockListV2Props {
  items: Entry[];
  onChange: (items: Entry[]) => void;
  onEntryChange: (id: string, updatedEntry: Entry) => void;
  onEntryDelete: (id: string) => void;
  onEntryClone: (id: string) => void;
  clonedItemId?: string | null; // ID of newly cloned item for highlighting
  deleteItemId?: string | null; // ID of item being deleted for animation
  openItems: string[]; // Array of open item IDs
  onOpenItemsChange: (openItems: string[]) => void; // Callback for open items change
  tryedValidation?: boolean; // Whether validation errors should be shown
}

export function SortableBlockListV2({
  items,
  onChange,
  onEntryChange,
  onEntryDelete,
  onEntryClone,
  clonedItemId = null,
  deleteItemId = null,
  openItems,
  onOpenItemsChange,
  tryedValidation = false,
}: SortableBlockListV2Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (item) => item.id.toString() === active.id,
      );
      const newIndex = items.findIndex(
        (item) => item.id.toString() === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // const activeEntry = items.find((item) => item.id.toString() === activeId);

  // Ensure items have unique string IDs for dnd-kit
  const itemIds = useMemo(
    () => items.map((item) => item.id.toString()),
    [items],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((entry) => {
            const entryId = entry.id.toString();

            return (
              <SortableBlockListItemV2
                key={entryId}
                id={entryId}
                entry={entry}
                onChange={onEntryChange}
                onDelete={onEntryDelete}
                onClone={onEntryClone}
                isOpen={openItems.includes(entryId)}
                onOpenChange={(open) => {
                  if (open) {
                    onOpenItemsChange([...openItems, entryId]);
                  } else {
                    onOpenItemsChange(openItems.filter((id) => id !== entryId));
                  }
                }}
                isHighlighted={entryId === clonedItemId}
                isDeleting={entryId === deleteItemId}
                tryedValidation={tryedValidation}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
