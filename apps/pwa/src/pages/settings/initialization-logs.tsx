import { CheckCircle2, XCircle, Clock, Copy, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  loadInitializationLog,
  clearInitializationLog,
  type InitializationLog,
  type InitializationStep,
} from "@/shared/stores/initialization-store";
import { showErrorDetails } from "@/shared/stores/error-dialog-store";
import { TypoXLarge, TypoBase } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { toast } from "sonner";

export default function InitializationLogsPage() {
  const [log, setLog] = useState<InitializationLog | null>(null);

  useEffect(() => {
    const loadedLog = loadInitializationLog();
    setLog(loadedLog);
  }, []);

  const handleCopyLogs = () => {
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

    navigator.clipboard.writeText(logText);
    toast.success("Logs copied to clipboard");
  };

  const handleClearLogs = () => {
    clearInitializationLog();
    setLog(null);
    toast.success("Logs cleared");
  };

  const handleStepClick = (step: InitializationStep) => {
    console.log("handleStepClick", step);
    if (!step.error) return;

    // Parse multi-line error messages into structured format
    const errorLines = step.error.split("\n");
    let formattedDetails = "";

    if (errorLines.length > 1 && (errorLines[0].includes("Failed to import") || errorLines[0].includes("Partially imported"))) {
      // Format for multi-file errors (like "Import default sessions")
      formattedDetails = errorLines.join("\n");
    } else {
      // Simple single-line error
      formattedDetails = step.error;
    }

    const title = step.status === "warning" ? `Warning: ${step.label}` : `Error: ${step.label}`;
    showErrorDetails(title, formattedDetails);
  };

  if (!log) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
            <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
              Initialization Logs
            </TypoXLarge>

            <div className="text-text-secondary flex flex-col items-center justify-center gap-4 py-12">
              <Clock className="h-12 w-12 opacity-50" />
              <p>No initialization logs available</p>
              <p className="text-center text-sm">
                Logs will be saved automatically on the next app initialization
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const successCount = log.steps.filter((s) => s.status === "success").length;
  const warningCount = log.steps.filter((s) => s.status === "warning").length;
  const errorCount = log.steps.filter((s) => s.status === "error").length;

  // Recalculate status from actual steps to ensure sync
  const actualHasError = errorCount > 0;
  const actualHasWarning = warningCount > 0 && errorCount === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Initialization Logs
          </TypoXLarge>

          {/* Summary Card */}
          <div className="mb-6 space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <TypoBase className="text-text-body font-semibold">
                Last Initialization
              </TypoBase>
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  actualHasError
                    ? "bg-red-900/30 text-red-400"
                    : actualHasWarning
                      ? "bg-yellow-900/30 text-yellow-400"
                      : "bg-green-900/30 text-green-400"
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

            <div className="text-text-secondary grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs opacity-70">Timestamp</div>
                <div className="mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70">Total Time</div>
                <div className="mt-1">{log.totalTime}ms</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Success</div>
                <div className="mt-1 text-green-400">{successCount} steps</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Warnings</div>
                <div className="mt-1 text-yellow-400">{warningCount} steps</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Errors</div>
                <div className="mt-1 text-red-400">{errorCount} steps</div>
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
          <div className="space-y-2">
            <TypoBase className="text-text-body mb-4 font-semibold">
              Initialization Steps ({log.steps.length})
            </TypoBase>

            {log.steps.map((step: InitializationStep, index: number) => {
              const Icon =
                step.status === "success"
                  ? CheckCircle2
                  : step.status === "warning"
                    ? AlertTriangle
                    : XCircle;
              const iconColor =
                step.status === "success"
                  ? "text-green-500"
                  : step.status === "warning"
                    ? "text-yellow-500"
                    : "text-red-500";
              const duration =
                step.startedAt && step.completedAt
                  ? new Date(step.completedAt).getTime() -
                    new Date(step.startedAt).getTime()
                  : null;

              const isClickable = step.status === "error" || step.status === "warning";

              return (
                <div
                  key={step.id}
                  onClick={() => isClickable && handleStepClick(step)}
                  className={`rounded-lg border px-4 py-3 ${
                    step.status === "error"
                      ? "cursor-pointer border-red-500/50 bg-red-500/10 transition-colors hover:bg-red-500/20"
                      : step.status === "warning"
                        ? "cursor-pointer border-yellow-500/50 bg-yellow-500/10 transition-colors hover:bg-yellow-500/20"
                        : "border-gray-700 bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary text-xs font-medium">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              step.status === "error"
                                ? "text-red-400"
                                : step.status === "warning"
                                  ? "text-yellow-400"
                                  : "text-gray-200"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>

                        {duration !== null && (
                          <span className="text-text-secondary text-xs">
                            {duration}ms
                          </span>
                        )}
                      </div>

                      {step.error && (
                        <div
                          className={`mt-2 rounded px-3 py-2 ${
                            step.status === "warning"
                              ? "bg-yellow-900/20"
                              : "bg-red-900/20"
                          }`}
                        >
                          <p
                            className={`line-clamp-2 text-xs ${
                              step.status === "warning"
                                ? "text-yellow-300"
                                : "text-red-300"
                            }`}
                          >
                            {step.error}
                          </p>
                          <p
                            className={`mt-1 text-xs italic ${
                              step.status === "warning"
                                ? "text-yellow-400/70"
                                : "text-red-400/70"
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
      </div>
    </div>
  );
}
