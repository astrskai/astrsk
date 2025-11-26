import {
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useMigrationLogStore,
  type MigrationLogEntry,
  type MigrationExecution,
} from "@/shared/stores/migration-log-store";
import { showErrorDetails } from "@/shared/stores/error-dialog-store";
import { showMigrationDetails } from "@/shared/stores/migration-details-dialog-store";
import { Button } from "@/shared/ui/forms";
import { toast } from "sonner";

export default function MigrationHistoryPage() {
  const logs = useMigrationLogStore.use.logs();
  const loadLogs = useMigrationLogStore.use.loadLogs();
  const clearLogs = useMigrationLogStore.use.clearLogs();
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleCopyLogs = () => {
    if (logs.length === 0) return;

    const logText = logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const status = log.hasError ? "❌ Failed" : "✅ Success";
        const migrations = log.executedMigrations
          .map(
            (m) =>
              `  - ${m.fileName} (${m.duration}ms) ${m.status === "success" ? "✅" : "❌"}`,
          )
          .join("\n");

        return `[${timestamp}] ${status} - ${log.totalTime}ms\n${migrations}`;
      })
      .join("\n\n");

    navigator.clipboard
      .writeText(logText)
      .then(() => {
        toast.success("Migration history copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy migration history to clipboard");
      });
  };

  const handleClearLogs = () => {
    clearLogs();
    toast.success("Migration history cleared");
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const handleMigrationClick = (migration: MigrationExecution) => {
    if (migration.error) {
      showErrorDetails(
        `Migration Failed: ${migration.fileName}`,
        migration.error,
      );
      return;
    }

    showMigrationDetails(migration);
  };

  if (logs.length === 0) {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-fg-muted">
          <Clock className="h-12 w-12 opacity-50" />
          <p>No migration history available</p>
          <p className="text-center text-sm text-fg-subtle">
            Migration logs will be saved automatically when new migrations are
            executed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      {/* Summary Card */}
      <div className="space-y-4 rounded-2xl border border-border-default bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-fg-default">
            Recent Migrations
          </span>
          <div className="text-sm text-fg-muted">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLogs}
            icon={<Copy className="h-4 w-4" />}
          >
            Copy History
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearLogs}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Migration Log Entries */}
      <div className="space-y-3">
        {logs.map((log: MigrationLogEntry) => {
          const isExpanded = expandedLogIds.has(log.id);
          const successCount = log.executedMigrations.filter(
            (m) => m.status === "success",
          ).length;
          const errorCount = log.executedMigrations.filter(
            (m) => m.status === "error",
          ).length;

          return (
            <div
              key={log.id}
              className={`overflow-hidden rounded-xl border ${
                log.hasError
                  ? "border-status-error/50 bg-status-error/10"
                  : "border-border-default bg-surface-raised"
              }`}
            >
              {/* Log Header */}
              <button
                type="button"
                onClick={() => toggleLogExpansion(log.id)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-overlay"
              >
                <div className="flex items-center gap-3">
                  <div className="mt-0.5">
                    {log.hasError ? (
                      <XCircle className="h-5 w-5 text-status-error" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-status-success" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-fg-default">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-fg-subtle">
                      {log.executedMigrations.length} migration(s) •{" "}
                      {log.totalTime}ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-fg-subtle">
                    {errorCount > 0 && (
                      <span className="text-status-error">
                        {errorCount} failed
                      </span>
                    )}
                    {successCount > 0 && (
                      <span className="text-status-success">
                        {successCount} success
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-fg-subtle" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-fg-subtle" />
                  )}
                </div>
              </button>

              {/* Expanded Migration Details */}
              {isExpanded && (
                <div className="border-t border-border-default px-4 py-3">
                  <div className="space-y-2">
                    {log.executedMigrations.map((migration, index) => (
                      <div
                        key={migration.hash}
                        onClick={() => handleMigrationClick(migration)}
                        className={`cursor-pointer rounded-lg border px-3 py-2 transition-colors ${
                          migration.status === "error"
                            ? "border-status-error/50 bg-status-error/10 hover:bg-status-error/20"
                            : "border-border-default bg-surface hover:bg-surface-overlay"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {migration.status === "success" ? (
                              <CheckCircle2 className="h-4 w-4 text-status-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-status-error" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-fg-default">
                                Migration {index + 1}
                              </div>
                              <div className="mt-0.5 font-mono text-xs text-fg-subtle">
                                {migration.fileName}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-fg-subtle">
                            {migration.duration}ms
                          </div>
                        </div>

                        {migration.error ? (
                          <div className="mt-2 rounded-lg bg-status-error/20 px-2 py-1">
                            <p className="line-clamp-2 text-xs text-status-error">
                              {migration.error}
                            </p>
                            <p className="mt-1 text-xs italic text-status-error/70">
                              Click to see full error details
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 rounded-lg bg-surface-overlay px-2 py-1">
                            <p className="text-xs italic text-fg-subtle">
                              Click to see SQL details
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
