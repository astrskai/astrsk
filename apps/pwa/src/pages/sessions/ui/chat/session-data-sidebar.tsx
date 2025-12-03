import { useCallback } from "react";
import { ChartNoAxesColumnIncreasing, PanelLeftClose, X } from "lucide-react";
import { toastError } from "@/shared/ui/toast";

import { cn } from "@/shared/lib";
import { logger } from "@/shared/lib/logger";
import { DataStoreSchemaField } from "@/entities/flow/domain";
import { Session } from "@/entities/session/domain";
import { Turn } from "@/entities/turn/domain/turn";
import { DataStoreSavedField } from "@/entities/turn/domain/option";
import { useSaveSession } from "@/entities/session/api";
import { useUpdateTurn } from "@/entities/turn/api/turn-queries";
import { UniqueEntityID } from "@/shared/domain";
import { SvgIcon, ScrollArea } from "@/shared/ui";
import { SortableDataSchemaFieldItem } from "./message-components";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface SessionDataSidebarProps {
  session: Session;
  isOpen: boolean;
  onToggle: () => void;
  sortedDataSchemaFields: DataStoreSchemaField[];
  isInitialDataStore: boolean;
  lastTurnDataStore: Record<string, string>;
  lastTurn?: Turn;
  streamingMessageId?: UniqueEntityID | null;
  streamingAgentName?: string;
  streamingModelName?: string;
}

export default function SessionDataSidebar({
  session,
  isOpen,
  onToggle,
  sortedDataSchemaFields,
  isInitialDataStore,
  lastTurnDataStore,
  lastTurn,
  streamingMessageId,
  streamingAgentName,
  streamingModelName,
}: SessionDataSidebarProps) {
  const saveSessionMutation = useSaveSession();
  const updateTurnMutation = useUpdateTurn();

  // DnD sensors for data schema reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end for data schema field reordering
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !session) {
        return;
      }

      const oldIndex = sortedDataSchemaFields.findIndex(
        (f) => f.name === active.id,
      );
      const newIndex = sortedDataSchemaFields.findIndex(
        (f) => f.name === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reorderedFields = arrayMove(
        sortedDataSchemaFields,
        oldIndex,
        newIndex,
      );
      const newOrder = reorderedFields.map((f) => f.name);

      try {
        session.setDataSchemaOrder(newOrder);
        saveSessionMutation.mutate({
          session,
        });
      } catch (error) {
        logger.error("Failed to update data schema order", error);
        toastError("Failed to update field order");
      }
    },
    [sortedDataSchemaFields, session, saveSessionMutation],
  );

  // Update last turn data store
  const updateDataStore = useCallback(
    async (name: string, value: string) => {
      if (!lastTurn) {
        logger.error("No message");
        toastError("No message");
        return;
      }

      try {
        // Find the field to update
        const updatedDataStore = lastTurn.dataStore.map(
          (field: DataStoreSavedField) =>
            field.name === name ? { ...field, value } : field,
        );

        // Update the turn with new dataStore
        lastTurn.setDataStore(updatedDataStore);

        // Save to database
        updateTurnMutation.mutate({
          turn: lastTurn,
        });
      } catch (error) {
        logger.error("Failed to update data store", error);
        toastError("Failed to update data store field");
      }
    },
    [updateTurnMutation, lastTurn],
  );

  return (
    <>
      {/* Floating Toggle Button - visible when sidebar is closed, same style as settings button */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute z-40 left-4 top-4",
          "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
          "border border-border-subtle bg-surface",
          "text-fg-muted hover:text-fg-default hover:bg-surface-raised",
          // Desktop only
          "max-md:hidden",
          // Hide when sidebar is open - no animation
          isOpen && "hidden",
        )}
        title="Open session data panel"
        aria-label="Open session data panel"
      >
        <ChartNoAxesColumnIncreasing className="h-5 w-5" />
      </button>

      {/* Sidebar - Left side within session container */}
      <aside
        className={cn(
          "bg-surface",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          // Desktop: fixed width sidebar on left
          "md:absolute md:top-0 md:bottom-0 md:left-0 md:z-30 md:w-96",
          "md:shadow-[8px_0_24px_-4px_rgba(0,0,0,0.5)]",
          isOpen ? "md:translate-x-0" : "md:-translate-x-full",
          // Mobile: full screen overlay from bottom
          "max-md:fixed max-md:inset-0 max-md:z-50",
          isOpen ? "max-md:translate-y-0" : "max-md:translate-y-full",
        )}
      >
        {/* Sidebar Header - matches settings sidebar style */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface p-4">
          {streamingMessageId ? (
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <SvgIcon
                name="astrsk_symbol"
                size={24}
                className="animate-spin flex-shrink-0"
              />
              <div className="truncate text-sm">
                <span className="text-fg-muted">{streamingAgentName}</span>
                <span className="font-semibold text-fg-default ml-1">{streamingModelName}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Collapse Button - on right side */}
          <button
            onClick={onToggle}
            className="cursor-pointer text-fg-subtle hover:text-fg-default"
            title="Close panel"
            aria-label="Close data panel"
          >
            {/* Desktop: Panel close icon, Mobile: X icon */}
            <PanelLeftClose className="h-5 w-5 hidden md:block" />
            <X className="h-5 w-5 md:hidden" />
          </button>
        </div>

        {/* Sidebar Content - Scrollable single column list */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full w-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={sortedDataSchemaFields.map((field) => field.name)}
                strategy={verticalListSortingStrategy}
              >
                {sortedDataSchemaFields.map((field) => (
                  <SortableDataSchemaFieldItem
                    key={field.name}
                    name={field.name}
                    type={field.type}
                    value={
                      isInitialDataStore
                        ? field.initialValue
                        : field.name in lastTurnDataStore
                          ? lastTurnDataStore[field.name]
                          : "--"
                    }
                    onEdit={isInitialDataStore ? undefined : updateDataStore}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </ScrollArea>

          {/* Bottom Fade Gradient for Scroll hint */}
          <div className="h-6 w-full bg-gradient-to-t from-surface to-transparent pointer-events-none absolute bottom-0 left-0 z-10" />
        </div>
      </aside>
    </>
  );
}
