import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/shared/stores/session-store";
import { sessionQueries } from "@/entities/session/api";
import { MemoryTestPanel } from "./memory-test-panel";

export function MemoryTestFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedSessionId } = useSessionStore();

  // Fetch session data to display name
  const { data: session } = useQuery({
    ...sessionQueries.detail(selectedSessionId ?? undefined),
    enabled: !!selectedSessionId,
  });

  // Don't show if no session is selected
  if (!selectedSessionId) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-1/2 translate-x-12 z-50 px-3 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        title="Open Memory Test Panel"
      >
        Memory Test
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-[700px] max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Memory Recall Test
          </h2>
          <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
            <div>
              Session: <span className="font-medium text-gray-700 dark:text-gray-300">{session?.name || "Loading..."}</span>
            </div>
            <div className="font-mono">
              ID: <span className="text-gray-600 dark:text-gray-400">{selectedSessionId.toString()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <MemoryTestPanel sessionId={selectedSessionId.toString()} />
      </div>
    </div>
  );
}
