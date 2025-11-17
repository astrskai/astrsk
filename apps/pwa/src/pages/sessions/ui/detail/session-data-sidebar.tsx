import { useState, useMemo, useCallback } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import { cn } from "@/shared/lib";
import { DataStoreSchemaField } from "@/entities/flow/domain";
import { Session } from "@/entities/session/domain";
import { useSaveSession } from "@/entities/session/api";
import "./session-data-sidebar.css";

interface SessionDataSidebarProps {
  session: Session;
  isOpen: boolean;
  sortedDataSchemaFields: DataStoreSchemaField[];
  isInitialDataStore: boolean;
  lastTurnDataStore: Record<string, string>;
  savedLayout?: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

export default function SessionDataSidebar({
  session,
  isOpen,
  sortedDataSchemaFields,
  isInitialDataStore,
  lastTurnDataStore,
  savedLayout,
}: SessionDataSidebarProps) {
  const saveSessionMutation = useSaveSession();

  // Generate default layout: 2-column grid
  const defaultLayout = useMemo<Layout[]>(
    () =>
      sortedDataSchemaFields.map((field, index) => ({
        i: field.name, // unique ID
        x: (index % 2) * 6, // 2-column grid (0 or 6)
        y: Math.floor(index / 2) * 3, // row position
        w: 6, // half width (12 cols total)
        h: 3, // 3 rows tall
        minW: 4, // minimum 4 columns
        minH: 2, // minimum 2 rows
      })),
    [sortedDataSchemaFields],
  );

  // Use saved layout if available, otherwise use default
  const initialLayout = useMemo<Layout[]>(
    () => savedLayout || defaultLayout,
    [savedLayout, defaultLayout],
  );

  const [layout, setLayout] = useState<Layout[]>(initialLayout);

  // Update layout state during drag/resize (no DB save)
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  // Save layout to database only when drag stops
  const handleDragStop = useCallback(
    async (newLayout: Layout[]) => {
      try {
        // Use session from props (avoid race condition)
        session.setWidgetLayout(
          newLayout.map((item) => ({
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          })),
        );

        // Save to backend
        await saveSessionMutation.mutateAsync({ session });
      } catch (error) {
        toast.error("Failed to save layout", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation],
  );

  // Save layout to database only when resize stops
  const handleResizeStop = handleDragStop;

  // Reset layout to default
  const handleResetLayout = useCallback(async () => {
    try {
      setLayout(defaultLayout);

      // Clear widget layout using session from props (undefined = use default)
      session.setWidgetLayout(undefined);

      // Save to backend
      await saveSessionMutation.mutateAsync({ session });

      toast.success("Layout reset to default");
    } catch (error) {
      toast.error("Failed to reset layout", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session, defaultLayout, saveSessionMutation]);

  return (
    <aside
      className={cn(
        "w-80 overflow-hidden bg-transparent transition-all duration-300 ease-in-out",
        // Mobile: fixed overlay with slide animation
        "fixed top-10 bottom-0 left-0 z-10",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: relative layout with opacity + max-width animation
        "md:relative md:top-0 md:h-dvh md:translate-x-0 md:pt-28",
        isOpen
          ? "md:max-w-80 md:opacity-100"
          : "md:max-w-0 md:overflow-hidden md:opacity-0",
      )}
    >
      <div className="h-full overflow-y-auto px-4">
        {/* Reset Layout Button */}
        <div className="sticky top-0 z-20 mb-2 hidden justify-end bg-transparent pt-2 pb-2">
          <button
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1 rounded-md border border-gray-500 bg-gray-800/80 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-gray-400 hover:bg-gray-700/80 hover:text-gray-100"
            aria-label="Reset layout to default"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Layout
          </button>
        </div>

        <GridLayout
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          cols={12} // 12-column grid system
          rowHeight={60} // each row is 60px
          width={288} // 320px - 32px padding (16px * 2)
          compactType="vertical" // automatic vertical compaction (magnetic)
          preventCollision={false} // allow overlapping during drag
          isDraggable={true} // enable drag
          isResizable={true} // enable resize
          margin={[8, 8]} // gap between widgets (x, y)
          draggableHandle=".drag-handle" // only drag from handle
        >
          {sortedDataSchemaFields.map((field) => (
            <div
              key={field.name}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-md border border-gray-50/20 bg-gray-50/20 backdrop-blur-lg transition-shadow hover:shadow-lg"
            >
              {/* Header: Field name + Drag handle */}
              <div className="flex items-center border-b border-gray-50/10 bg-gray-50/5">
                {/* Drag handle - left side */}
                <div className="drag-handle flex cursor-move items-center justify-center px-1 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-xs text-gray-50">⋮⋮</div>
                </div>

                {/* Field name - always visible */}
                <div className="flex-1 truncate px-2 py-2 text-center text-sm font-semibold break-words text-gray-50">
                  {field.name}
                </div>

                {/* Spacer for symmetry */}
                <div className="w-5"></div>
              </div>

              {/* Content area: Value only */}
              <div className="flex flex-1 items-center justify-center overflow-auto p-3">
                <div className="w-full text-center text-base font-semibold break-words text-gray-50">
                  {isInitialDataStore
                    ? field.initialValue
                    : field.name in lastTurnDataStore
                      ? lastTurnDataStore[field.name]
                      : "--"}
                </div>
              </div>

              {/* Resize handle indicator (visual only) */}
              <div className="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize opacity-0 transition-opacity group-hover:opacity-50">
                <svg
                  viewBox="0 0 16 16"
                  className="h-full w-full text-gray-400"
                >
                  <path
                    d="M15 15L15 10M15 15L10 15M15 15L11 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </GridLayout>
      </div>
    </aside>
  );
}
