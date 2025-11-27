import {
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  loadInitializationLog,
  clearInitializationLog,
  type InitializationLog,
  type PersistedInitializationStep,
} from "@/shared/stores/initialization-store";
import { showErrorDetails } from "@/shared/stores/error-dialog-store";
import { Button } from "@/shared/ui/forms";
import { toastError, toastSuccess } from "@/shared/ui/toast";

export default function InitializationLogsPage() {
  const [log, setLog] = useState<InitializationLog | null>(null);

  useEffect(() => {
    const loadedLog = loadInitializationLog();
    setLog(loadedLog);
  }, []);

  const handleCopyLogs = async () => {
    if (!log) return;

    const errorSteps = log.steps
      .filter((s) => s.status === "error")
      .map((s) => `${s.label}: ${s.error}`)
      .join("\n");

    const logText = `Initialization Log
Timestamp: ${new Date(log.timestamp).toLocaleString()}
Total Time: ${log.totalTime}ms
Status: ${log.hasError ? "❌ Failed" : "✅ Success"}

${errorSteps ? `Errors:\n${errorSteps}` : "All steps completed successfully"}`;

    try {
      await navigator.clipboard.writeText(logText);
      toastSuccess("Logs copied to clipboard");
    } catch {
      toastError("Failed to copy logs to clipboard");
    }
  };

  const handleClearLogs = () => {
    clearInitializationLog();
    setLog(null);
    toastSuccess("Logs cleared");
  };

  const handleStepClick = (step: PersistedInitializationStep) => {
    if (!step.error) return;

    const errorLines = step.error.split("\n");
    let formattedDetails = "";

    if (
      errorLines.length > 1 &&
      (errorLines[0].includes("Failed to import") ||
        errorLines[0].includes("Partially imported"))
    ) {
      formattedDetails = errorLines.join("\n");
    } else {
      formattedDetails = step.error;
    }

    const title =
      step.status === "warning"
        ? `Warning: ${step.label}`
        : `Error: ${step.label}`;
    showErrorDetails(title, formattedDetails);
  };

  if (!log) {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-fg-muted">
          <Clock className="h-12 w-12 opacity-50" />
          <p>No initialization logs available</p>
          <p className="text-center text-sm text-fg-subtle">
            Logs will be saved automatically on the next app initialization
          </p>
        </div>
      </div>
    );
  }

  const successCount = log.steps.filter((s) => s.status === "success").length;
  const warningCount = log.steps.filter((s) => s.status === "warning").length;
  const errorCount = log.steps.filter((s) => s.status === "error").length;

  const actualHasError = errorCount > 0;
  const actualHasWarning = warningCount > 0 && errorCount === 0;

  return (
    <div className="space-y-6 py-8">
      {/* Summary Card */}
      <div className="space-y-4 rounded-2xl border border-border-default bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-fg-default">
            Last Initialization
          </span>
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              actualHasError
                ? "bg-status-error/20 text-status-error"
                : actualHasWarning
                  ? "bg-status-warning/20 text-status-warning"
                  : "bg-status-success/20 text-status-success"
            }`}
          >
            {actualHasError ? (
              <>
                <XCircle className="h-4 w-4" />
                Failed
              </>
            ) : actualHasWarning ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                Partial Success
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Success
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-fg-muted">
          <div>
            <div className="text-xs text-fg-subtle">Timestamp</div>
            <div className="mt-1">{new Date(log.timestamp).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-fg-subtle">Total Time</div>
            <div className="mt-1">{log.totalTime}ms</div>
          </div>
          <div>
            <div className="text-xs text-fg-subtle">Success</div>
            <div className="mt-1 text-status-success">{successCount} steps</div>
          </div>
          <div>
            <div className="text-xs text-fg-subtle">Warnings</div>
            <div className="mt-1 text-status-warning">{warningCount} steps</div>
          </div>
          <div>
            <div className="text-xs text-fg-subtle">Errors</div>
            <div className="mt-1 text-status-error">{errorCount} steps</div>
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
            Copy Logs
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearLogs}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        <h3 className="px-2 text-sm font-semibold text-fg-default">
          Initialization Steps ({log.steps.length})
        </h3>

        {log.steps.map((step: PersistedInitializationStep, index: number) => {
          const Icon =
            step.status === "success"
              ? CheckCircle2
              : step.status === "warning"
                ? AlertTriangle
                : XCircle;
          const iconColor =
            step.status === "success"
              ? "text-status-success"
              : step.status === "warning"
                ? "text-status-warning"
                : "text-status-error";
          const duration =
            step.startedAt && step.completedAt
              ? new Date(step.completedAt).getTime() -
                new Date(step.startedAt).getTime()
              : null;

          const isClickable =
            step.status === "error" || step.status === "warning";

          return (
            <div
              key={step.id}
              onClick={() => isClickable && handleStepClick(step)}
              className={`rounded-xl border px-4 py-3 ${
                step.status === "error"
                  ? "cursor-pointer border-status-error/50 bg-status-error/10 transition-colors hover:bg-status-error/20"
                  : step.status === "warning"
                    ? "cursor-pointer border-status-warning/50 bg-status-warning/10 transition-colors hover:bg-status-warning/20"
                    : "border-border-default bg-surface-raised"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-fg-subtle">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          step.status === "error"
                            ? "text-status-error"
                            : step.status === "warning"
                              ? "text-status-warning"
                              : "text-fg-default"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {duration !== null && (
                      <span className="text-xs text-fg-subtle">{duration}ms</span>
                    )}
                  </div>

                  {step.error && (
                    <div
                      className={`mt-2 rounded-lg px-3 py-2 ${
                        step.status === "warning"
                          ? "bg-status-warning/20"
                          : "bg-status-error/20"
                      }`}
                    >
                      <p
                        className={`line-clamp-2 text-xs ${
                          step.status === "warning"
                            ? "text-status-warning"
                            : "text-status-error"
                        }`}
                      >
                        {step.error}
                      </p>
                      <p
                        className={`mt-1 text-xs italic ${
                          step.status === "warning"
                            ? "text-status-warning/70"
                            : "text-status-error/70"
                        }`}
                      >
                        Click to see full details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
