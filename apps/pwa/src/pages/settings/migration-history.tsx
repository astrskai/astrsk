import { CheckCircle2, XCircle, Clock, Copy, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useMigrationLogStore,
  type MigrationLogEntry,
  type MigrationExecution,
} from "@/shared/stores/migration-log-store";
import { showErrorDetails } from "@/shared/stores/error-dialog-store";
import { showMigrationDetails } from "@/shared/stores/migration-details-dialog-store";
import { TypoXLarge, TypoBase } from "@/shared/ui";
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
          .map((m) => `  - ${m.fileName} (${m.duration}ms) ${m.status === "success" ? "✅" : "❌"}`)
          .join("\n");

        return `[${timestamp}] ${status} - ${log.totalTime}ms\n${migrations}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(logText);
    toast.success("Migration history copied to clipboard");
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
    // Show error dialog for failed migrations
    if (migration.error) {
      showErrorDetails(
        `Migration Failed: ${migration.fileName}`,
        migration.error,
      );
      return;
    }

    // Show details dialog for successful migrations
    showMigrationDetails(migration);
  };

  if (logs.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
            <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
              Migration History
            </TypoXLarge>

            <div className="text-text-secondary flex flex-col items-center justify-center gap-4 py-12">
              <Clock className="h-12 w-12 opacity-50" />
              <p>No migration history available</p>
              <p className="text-center text-sm">
                Migration logs will be saved automatically when new migrations are executed
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Migration History
          </TypoXLarge>

          {/* Summary Card */}
          <div className="mb-6 space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <TypoBase className="text-text-body font-semibold">
                Recent Migrations
              </TypoBase>
              <div className="text-text-secondary text-sm">
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
              const successCount = log.executedMigrations.filter((m) => m.status === "success").length;
              const errorCount = log.executedMigrations.filter((m) => m.status === "error").length;

              return (
                <div
                  key={log.id}
                  className={`rounded-lg border ${
                    log.hasError
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-700 bg-gray-800/50"
                  }`}
                >
                  {/* Log Header */}
                  <button
                    type="button"
                    onClick={() => toggleLogExpansion(log.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="mt-0.5">
                        {log.hasError ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-text-primary text-sm font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="text-text-secondary mt-1 text-xs">
                          {log.executedMigrations.length} migration(s) • {log.totalTime}ms
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-text-secondary flex items-center gap-2 text-xs">
                        {errorCount > 0 && (
                          <span className="text-red-400">
                            {errorCount} failed
                          </span>
                        )}
                        {successCount > 0 && (
                          <span className="text-green-400">
                            {successCount} success
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Migration Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 px-4 py-3">
                      <div className="space-y-2">
                        {log.executedMigrations.map((migration, index) => (
                          <div
                            key={migration.hash}
                            onClick={() => handleMigrationClick(migration)}
                            className={`cursor-pointer rounded border px-3 py-2 transition-colors ${
                              migration.status === "error"
                                ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                                : "border-gray-700 bg-gray-800/30 hover:bg-gray-700/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {migration.status === "success" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <div className="text-sm font-medium">
                                    Migration {index + 1}
                                  </div>
                                  <div className="text-text-secondary mt-0.5 font-mono text-xs">
                                    {migration.fileName}
                                  </div>
                                </div>
                              </div>
                              <div className="text-text-secondary text-xs">
                                {migration.duration}ms
                              </div>
                            </div>

                            {migration.error ? (
                              <div className="mt-2 rounded bg-red-900/20 px-2 py-1">
                                <p className="line-clamp-2 text-xs text-red-300">
                                  {migration.error}
                                </p>
                                <p className="mt-1 text-xs italic text-red-400/70">
                                  Click to see full error details
                                </p>
                              </div>
                            ) : (
                              <div className="mt-2 rounded bg-gray-900/20 px-2 py-1">
                                <p className="text-xs italic text-gray-400/70">
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
      </div>
    </div>
  );
}
