import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Download, RefreshCw, Search, TestTube, Skull } from "lucide-react";
import { LegacyCharacterRecovery, TestBreakSystem, TestLegacySetup } from "@/app/recovery-services";
import { toastSuccess, toastError, toastInfo, toastWarning } from "@/shared/ui/toast";

export default function CharacterRecoveryPage() {
  const [logs, setLogs] = useState<string[]>([]);

  // Check if system was just broken (after page reload)
  useEffect(() => {
    const breakResult = localStorage.getItem('astrsk_test_break_result');
    if (breakResult) {
      try {
        const data = JSON.parse(breakResult);
        const elapsed = Date.now() - data.timestamp;

        // Only show if less than 10 seconds ago (recent reload)
        if (elapsed < 10000) {
          toastWarning(
            `💥 System broken! ${data.charactersDeleted} characters deleted. Use "Diagnose Database State" to check.`
          );
        }

        // Clean up
        localStorage.removeItem('astrsk_test_break_result');
      } catch (e) {
        console.error('Failed to parse break result:', e);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [recovery] = useState(() => {
    const instance = new LegacyCharacterRecovery();
    instance.setLogCallback((message: string) => {
      setLogs(prev => [...prev, message]);
    });
    return instance;
  });
  const [testBreaker] = useState(() => {
    const instance = new TestBreakSystem();
    instance.setLogCallback((message: string) => {
      setLogs(prev => [...prev, message]);
    });
    return instance;
  });
  const [testSetup] = useState(() => {
    const instance = new TestLegacySetup();
    instance.setLogCallback((message: string) => {
      setLogs(prev => [...prev, message]);
    });
    return instance;
  });
  const [isRecovering, setIsRecovering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [report, setReport] = useState<{
    hasLegacyTables: boolean;
    legacyCharacterCount: number;
    currentCharacterCount: number;
    legacyScenarioCount: number;
    currentScenarioCount: number;
    missingCharacters: number;
    missingScenarios: number;
    canRecover: boolean;
  } | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<{
    characters: { recovered: number; failed: number };
    scenarios: { recovered: number; failed: number };
  } | null>(null);


  const handleRecover = async () => {
    setIsRecovering(true);
    setLogs([]);
    try {
      const result = await recovery.recoverAll();
      setRecoveryResult(result);

      const totalRecovered =
        result.characters.recovered + result.scenarios.recovered;
      const totalFailed = result.characters.failed + result.scenarios.failed;

      if (totalRecovered > 0 && totalFailed === 0) {
        toastSuccess(
          `Successfully recovered ${totalRecovered} items! Refresh the page to see your characters.`
        );
      } else if (totalRecovered > 0) {
        toastInfo(
          `Recovered ${totalRecovered} items, ${totalFailed} failed. Check console for details.`
        );
      } else {
        toastError("No items were recovered. Check console for details.");
      }
    } catch (error) {
      console.error("Recovery failed:", error);
      toastError("Recovery failed. Check console for details.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    setLogs([]);
    try {
      await recovery.downloadBackup();
      toastSuccess("Backup file downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toastError("Failed to download backup. Check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  // COMMENTED OUT - Test Mode functions (can be re-enabled for testing)
  const handleConvertToLegacy = async () => {
    if (!confirm("⚠️ TEST MODE: This will copy your current characters to legacy tables for testing. Continue?")) {
      return;
    }

    setIsConverting(true);
    setLogs([]);
    try {
      const result = await testSetup.createLegacyTablesAndCopy();
      toastSuccess(
        `Test setup complete! Copied ${result.characters} characters and ${result.scenarios} scenarios to legacy tables.`
      );
      toastInfo("Your current data is still intact. You can now test the recovery feature.");
    } catch (error) {
      console.error("Test setup failed:", error);
      toastError("Failed to create test environment. Check console for details.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleBreakSystem = async () => {
    if (!confirm(
      "💥 DANGER: This will BREAK your system by simulating a migration failure!\n\n" +
      "What will happen:\n" +
      "- Characters will be moved to legacy tables\n" +
      "- Characters will be DELETED from new tables\n" +
      "- Your sessions will have broken references\n" +
      "- Characters will DISAPPEAR from the UI\n" +
      "- Page will RELOAD to clear cache\n\n" +
      "This simulates the exact scenario users experience after a failed migration.\n\n" +
      "Continue?"
    )) {
      return;
    }

    setIsBreaking(true);
    setLogs([]);
    try {
      const result = await testBreaker.breakSystem();

      toastSuccess(
        `System broken! ${result.charactersDeleted} characters deleted, ${result.scenariosDeleted} scenarios deleted. ` +
        `Check logs for details. Manually reload page to clear cache.`
      );
      setIsBreaking(false);
    } catch (error) {
      console.error("Break system failed:", error);
      toastError("Failed to break system. Check console for details.");
      setIsBreaking(false);
    }
  };

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setLogs([]);
    try {
      const result = await recovery.checkLegacyData();
      setReport(result);

      if (result.canRecover) {
        toastWarning(
          `Data loss detected!\n` +
          `Missing: ${result.missingCharacters} characters, ${result.missingScenarios} scenarios`
        );
      } else {
        toastSuccess("No data loss detected. Your data is safe!");
      }
    } catch (error) {
      console.error("Diagnostic failed:", error);
      toastError("Failed to check database state. Check console for details.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-default">Character & Scenario Recovery</h1>
        <p className="mt-2 text-sm text-fg-subtle">
          Recover character and scenario data from old database tables
        </p>
      </div>

      {/* Test Mode (Developer Tool) - COMMENTED OUT FOR NOW */}
      {/* <div className="rounded-2xl border border-status-warning bg-status-warning/10 p-6">
        <div className="mb-4 flex items-start gap-3">
          <TestTube className="mt-0.5 shrink-0 text-status-warning" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-fg-default">Test Mode - Developer Tools</h3>
            <p className="mt-1 text-sm text-fg-subtle">
              Simulate migration failure scenarios to test the recovery system.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleConvertToLegacy}
            disabled={isConverting || isBreaking || isDiagnosing}
            className="flex items-center gap-2 rounded-lg border border-status-warning bg-surface px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-status-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConverting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <TestTube size={16} />
                Safe Mode (Copy)
              </>
            )}
          </button>
          <button
            onClick={handleBreakSystem}
            disabled={isConverting || isBreaking || isDiagnosing}
            className="flex items-center gap-2 rounded-lg border border-status-error bg-status-error/10 px-4 py-2 text-sm font-medium text-status-error transition-colors hover:bg-status-error/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBreaking ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Breaking...
              </>
            ) : (
              <>
                <Skull size={16} />
                Danger Mode (Delete)
              </>
            )}
          </button>
          <button
            onClick={handleDiagnose}
            disabled={isConverting || isBreaking || isDiagnosing}
            className="flex items-center gap-2 rounded-lg border border-status-info bg-status-info/10 px-4 py-2 text-sm font-medium text-status-info transition-colors hover:bg-status-info/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDiagnosing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search size={16} />
                Diagnose DB State
              </>
            )}
          </button>
        </div>
        <div className="mt-3 text-xs text-fg-subtle">
          <p><strong>Safe Mode:</strong> Copies to legacy tables, keeps current data (no deletion)</p>
          <p className="mt-1"><strong className="text-status-error">Danger Mode:</strong> Simulates real migration failure (DELETES characters, breaks sessions)</p>
          <p className="mt-1"><strong className="text-status-info">Diagnose DB State:</strong> Check exact table counts to understand where data is stored</p>
        </div>
      </div> */}

      {/* Recovery Card */}
      <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
        {/* Info Box */}
        <div className="mb-6 rounded-xl border border-status-info bg-status-info/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-status-info" size={20} />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-fg-default">When to use:</p>
              <ul className="list-disc space-y-1 pl-5 text-fg-subtle">
                <li>Characters disappeared after app update</li>
                <li>Characters missing from library or sessions</li>
                <li>Migration errors in logs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 1: Diagnose */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-fg-default">
            Step 1: Diagnose Database State
          </h3>
          <button
            onClick={handleDiagnose}
            disabled={isDiagnosing}
            className="flex items-center gap-2 rounded-lg bg-status-info px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-status-info/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDiagnosing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Diagnosing...
              </>
            ) : (
              <>
                <Search size={16} />
                Diagnose Database State
              </>
            )}
          </button>

          {/* Results */}
          {report && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-border-default bg-surface p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-fg-subtle">Legacy characters:</div>
                    <div className="font-mono text-lg text-fg-default">
                      {report.legacyCharacterCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-fg-subtle">Current characters:</div>
                    <div className="font-mono text-lg text-fg-default">
                      {report.currentCharacterCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-fg-subtle">Missing characters:</div>
                    <div
                      className={`font-mono text-lg ${
                        report.missingCharacters > 0
                          ? "text-status-error"
                          : "text-status-success"
                      }`}
                    >
                      {report.missingCharacters}
                    </div>
                  </div>
                  <div>
                    <div className="text-fg-subtle">Missing scenarios:</div>
                    <div
                      className={`font-mono text-lg ${
                        report.missingScenarios > 0
                          ? "text-status-error"
                          : "text-status-success"
                      }`}
                    >
                      {report.missingScenarios}
                    </div>
                  </div>
                </div>
              </div>

              {report.canRecover && (
                <div className="rounded-lg border border-status-warning bg-status-warning/10 p-4">
                  <div className="flex gap-2">
                    <AlertCircle
                      className="shrink-0 text-status-warning"
                      size={20}
                    />
                    <p className="text-sm text-fg-default">
                      Data loss detected! Proceed to Step 2 to recover your data.
                    </p>
                  </div>
                </div>
              )}

              {!report.canRecover && report.hasLegacyTables && (
                <div className="rounded-lg border border-status-success bg-status-success/10 p-4">
                  <div className="flex gap-2">
                    <CheckCircle
                      className="shrink-0 text-status-success"
                      size={20}
                    />
                    <p className="text-sm text-fg-default">
                      All data migrated successfully! No recovery needed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Backup (Optional) */}
        {report?.canRecover && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-fg-default">
              Step 2: Download Backup (Optional)
            </h3>
            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Backup
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Recover */}
        {report?.canRecover && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg-default">
              Step 3: Recover Data
            </h3>
            <button
              onClick={handleRecover}
              disabled={isRecovering}
              className="flex items-center gap-2 rounded-lg bg-status-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-status-success/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecovering ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Recovering...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Recover Data
                </>
              )}
            </button>

            {/* Recovery Results */}
            {recoveryResult && (
              <div className="mt-4 rounded-lg border border-status-success bg-status-success/10 p-4">
                <h4 className="mb-3 text-sm font-semibold text-fg-default">
                  Recovery Complete
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-fg-subtle">Characters recovered:</span>
                    <span className="font-mono text-status-success">
                      {recoveryResult.characters.recovered}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg-subtle">Scenarios recovered:</span>
                    <span className="font-mono text-status-success">
                      {recoveryResult.scenarios.recovered}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-fg-default">
                  Refresh the page to see your recovered characters!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Viewer */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
          <h3 className="mb-3 text-sm font-semibold text-fg-default">
            Recovery Log
          </h3>
          <textarea
            readOnly
            value={logs.join("\n")}
            className="h-64 w-full resize-y rounded-lg border border-border-default bg-surface p-3 font-mono text-xs text-fg-default"
            style={{ minHeight: "200px" }}
          />
          <button
            onClick={() => setLogs([])}
            className="mt-3 rounded-lg border border-border-default bg-surface px-3 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-surface-overlay"
          >
            Clear Log
          </button>
        </div>
      )}
    </div>
  );
}
