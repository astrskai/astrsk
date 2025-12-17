import { useState } from "react";
import { Cloud, RefreshCw, AlertCircle, Play } from "lucide-react";
import { RemoteRecoveryScript } from "@/app/recovery-services";
import { toastSuccess, toastError } from "@/shared/ui/toast";

export default function RemoteScriptPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [remoteScript] = useState(() => {
    const instance = new RemoteRecoveryScript();
    instance.setLogCallback((message: string) => {
      setLogs(prev => [...prev, message]);
    });
    return instance;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isFetchingVersions, setIsFetchingVersions] = useState(false);
  const [metadata, setMetadata] = useState<{
    version: string;
    description: string;
    updatedAt: string;
    author: string;
  } | null>(null);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("latest");

  const handleFetchVersions = async () => {
    setIsFetchingVersions(true);
    try {
      const versions = await remoteScript.fetchAvailableVersions();
      setAvailableVersions(versions);
      if (versions.length > 0) {
        toastSuccess(`Found ${versions.length} script version(s)!`);
      }
    } catch (error) {
      console.error("Version fetch failed:", error);
      toastError("Failed to fetch available versions.");
    } finally {
      setIsFetchingVersions(false);
    }
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    remoteScript.setVersion(version);
    setMetadata(null); // Clear old metadata
  };

  const handleFetchMetadata = async () => {
    setIsFetchingMetadata(true);
    try {
      const meta = await remoteScript.fetchMetadata();
      setMetadata(meta);
      if (meta) {
        toastSuccess("Script metadata loaded!");
      } else {
        toastError("No remote script available.");
      }
    } catch (error) {
      console.error("Metadata fetch failed:", error);
      toastError("Failed to fetch script metadata.");
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleRunScript = async () => {
    setIsRunning(true);
    setLogs([]);
    try {
      await remoteScript.fetchAndExecuteScript();
      toastSuccess("Remote recovery script completed!");
    } catch (error) {
      console.error("Script execution failed:", error);
      toastError("Remote script failed. Check logs for details.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadLogs = () => {
    remoteScript.downloadLogs(logs);
  };

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-default">Remote Recovery Script</h1>
        <p className="mt-2 text-sm text-fg-subtle">
          Run recovery scripts managed by the astrsk team to fix specific issues
        </p>
      </div>

      {/* Warning Box */}
      <div className="rounded-xl border border-status-warning bg-status-warning/10 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-status-warning" size={20} />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-fg-default">Important Information:</p>
            <ul className="list-disc space-y-1 pl-5 text-fg-subtle">
              <li>This tool fetches and runs recovery scripts from the astrsk team</li>
              <li>Scripts are fetched from a trusted CDN and run in a sandboxed environment</li>
              <li>All operations are logged and shown below for transparency</li>
              <li>Only use this when instructed by astrsk support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Version Selection Section */}
      <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
        <h3 className="mb-3 text-lg font-semibold text-fg-default">
          Select Script Version
        </h3>
        <p className="mb-4 text-sm text-fg-subtle">
          Choose which version of the recovery script to use. Use "latest" for the newest version, or select a specific version if instructed by support.
        </p>

        <div className="space-y-4">
          {/* Fetch Versions Button */}
          <button
            onClick={handleFetchVersions}
            disabled={isFetchingVersions}
            className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingVersions ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Loading Versions...
              </>
            ) : (
              <>
                <Cloud size={16} />
                Fetch Available Versions
              </>
            )}
          </button>

          {/* Version Selector Dropdown */}
          {availableVersions.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-fg-default">
                Script Version
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-fg-default transition-colors hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableVersions.map((version) => (
                  <option key={version} value={version}>
                    {version === "latest" ? "Latest (Recommended)" : `Version ${version}`}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-fg-subtle">
                Currently selected: <span className="font-medium">{selectedVersion}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Section */}
      <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
        <h3 className="mb-3 text-lg font-semibold text-fg-default">
          Check Script Details
        </h3>
        <p className="mb-4 text-sm text-fg-subtle">
          View details about the selected recovery script version.
        </p>
        <button
          onClick={handleFetchMetadata}
          disabled={isFetchingMetadata}
          className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFetchingMetadata ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Check Script Details
            </>
          )}
        </button>

        {/* Metadata Display */}
        {metadata && (
          <div className="mt-4 rounded-lg border border-border-default bg-surface p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-fg-subtle">Version:</span>
                <span className="font-mono text-fg-default">{metadata.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-subtle">Description:</span>
                <span className="text-fg-default">{metadata.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-subtle">Updated:</span>
                <span className="font-mono text-fg-default">
                  {new Date(metadata.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-subtle">Author:</span>
                <span className="text-fg-default">{metadata.author}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Run Script Section */}
      <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
        <h3 className="mb-3 text-lg font-semibold text-fg-default">
          Run Recovery Script
        </h3>
        <p className="mb-4 text-sm text-fg-subtle">
          Execute the remote recovery script. This will fetch the latest script from the CDN and run it.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-status-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-status-success/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Running Script...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Script
              </>
            )}
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleDownloadLogs}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-surface-overlay"
            >
              <Cloud size={16} />
              Download Logs
            </button>
          )}
        </div>
      </div>

      {/* Log Viewer */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-border-default bg-surface-raised p-6">
          <h3 className="mb-3 text-sm font-semibold text-fg-default">
            Execution Log
          </h3>
          <textarea
            readOnly
            value={logs.join("\n")}
            className="h-96 w-full resize-y rounded-lg border border-border-default bg-surface p-3 font-mono text-xs text-fg-default"
            style={{ minHeight: "300px" }}
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
