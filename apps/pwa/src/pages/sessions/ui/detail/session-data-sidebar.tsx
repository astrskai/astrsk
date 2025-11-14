import { cn } from "@/shared/lib";
import { DataStoreSchemaField } from "@/entities/flow/domain";

interface SessionDataSidebarProps {
  isOpen: boolean;
  sortedDataSchemaFields: DataStoreSchemaField[];
  isInitialDataStore: boolean;
  lastTurnDataStore: Record<string, string>;
}

export default function SessionDataSidebar({
  isOpen,
  sortedDataSchemaFields,
  isInitialDataStore,
  lastTurnDataStore,
}: SessionDataSidebarProps) {
  return (
    <aside
      className={cn(
        "w-80 bg-transparent transition-all duration-300 ease-in-out",
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
      <div className="flex flex-col gap-2 p-4">
        {sortedDataSchemaFields.map((field, index) => (
          <div
            key={`${field.name}-${index}`}
            className="flex w-fit flex-col items-center justify-center rounded-md border border-gray-50/20 bg-gray-50/20 p-4 backdrop-blur-lg"
          >
            <div className="text-sm">{field.name}</div>

            <div className="text-md font-semibold">
              {isInitialDataStore
                ? field.initialValue
                : field.name in lastTurnDataStore
                  ? lastTurnDataStore[field.name]
                  : "--"}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
