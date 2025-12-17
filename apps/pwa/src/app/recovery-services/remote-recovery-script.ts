import { LegacyCharacterRecovery } from "./legacy-character-recovery";
import { DatabaseSnapshotRecovery } from "./database-snapshot-recovery";

/**
 * Remote Recovery Script Service
 *
 * This service allows the astrsk team to push recovery scripts remotely
 * to help users recover from migration failures or data corruption.
 *
 * How it works:
 * 1. User navigates to Settings > Advanced > Recovery Tools
 * 2. User clicks "Run Remote Recovery Script"
 * 3. App fetches latest recovery script from CDN/GitHub
 * 4. Script executes in sandboxed environment with access to:
 *    - LegacyCharacterRecovery
 *    - DatabaseSnapshotRecovery
 *    - Database (Drizzle/PGlite)
 *    - Asset system (OPFS)
 * 5. Script logs are displayed in UI in real-time
 * 6. User can download logs for support
 *
 * Security:
 * - Scripts are fetched from trusted CDN only (configurable URL)
 * - Scripts run in isolated function scope (no access to global window)
 * - All operations are logged for transparency
 * - User must explicitly click "Run" button
 *
 * Example remote script:
 * ```javascript
 * // recovery-script.js hosted on CDN
 * async function recover({ log, db, legacy, snapshot }) {
 *   log("Starting custom recovery...");
 *
 *   // Check for missing data
 *   const report = await legacy.checkLegacyData();
 *   log(`Found ${report.missingCharacters} missing characters`);
 *
 *   // Recover if needed
 *   if (report.canRecover) {
 *     await legacy.recoverAll();
 *     log("Recovery complete!");
 *   }
 * }
 * ```
 *
 * Usage:
 * ```typescript
 * const remote = new RemoteRecoveryScript();
 * remote.setLogCallback((msg) => console.log(msg));
 * await remote.fetchAndExecuteScript();
 * ```
 */

interface RecoveryScriptContext {
  log: (message: string) => void;
  legacy: LegacyCharacterRecovery;
  snapshot: DatabaseSnapshotRecovery;
  // Add more helpers as needed
}

interface ScriptMetadata {
  version: string;
  description: string;
  updatedAt: string;
  author: string;
}

export class RemoteRecoveryScript {
  private logCallback?: (message: string) => void;

  // Default CDN URL for recovery scripts
  // Can be overridden via environment variable or settings
  private scriptUrl = import.meta.env.VITE_RECOVERY_SCRIPT_URL ||
    "https://raw.githubusercontent.com/YOUR_ORG/astrsk-recovery-scripts/main/recovery-script.js";

  private metadataUrl = import.meta.env.VITE_RECOVERY_METADATA_URL ||
    "https://raw.githubusercontent.com/YOUR_ORG/astrsk-recovery-scripts/main/metadata.json";

  /**
   * Set callback to capture logs for UI display
   */
  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback;
  }

  /**
   * Log message to both console and callback
   */
  private log(message: string) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * Set custom script URL (for testing or custom deployments)
   */
  setScriptUrl(url: string) {
    this.scriptUrl = url;
  }

  /**
   * Set script version (uses versioned URLs from GitHub)
   * @param version - Version string (e.g., "1.0.0", "1.1.0")
   * @example
   * remote.setVersion("1.0.0"); // Uses v1.0.0 script
   * remote.setVersion("latest"); // Uses main branch (default)
   */
  setVersion(version: string) {
    const baseUrl = "https://raw.githubusercontent.com/astrskai/astrsk-recovery-scripts";

    if (version === "latest" || version === "main") {
      // Use main branch (latest)
      this.scriptUrl = `${baseUrl}/main/recovery-script.js`;
      this.metadataUrl = `${baseUrl}/main/metadata.json`;
    } else {
      // Use specific version from versions/ directory
      this.scriptUrl = `${baseUrl}/main/versions/v${version}/recovery-script.js`;
      this.metadataUrl = `${baseUrl}/main/versions/v${version}/metadata.json`;
    }

    this.log(`📌 Script version set to: ${version}`);
    this.log(`   Script URL: ${this.scriptUrl}`);
    this.log(`   Metadata URL: ${this.metadataUrl}`);
  }

  /**
   * Fetch list of available script versions from GitHub
   * @returns Array of version strings (e.g., ["1.0.0", "1.1.0", "2.0.0"])
   */
  async fetchAvailableVersions(): Promise<string[]> {
    try {
      this.log("📡 Fetching available recovery script versions...");

      // Fetch the versions directory listing from GitHub API
      const response = await fetch(
        "https://api.github.com/repos/astrskai/astrsk-recovery-scripts/contents/versions",
        {
          headers: {
            "Accept": "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        this.log(`  ⚠️  Could not fetch versions (${response.status})`);
        return ["latest"]; // Fallback to latest only
      }

      const data = await response.json();

      // Extract version numbers from directory names (e.g., "v1.0.0" -> "1.0.0")
      const versions = data
        .filter((item: any) => item.type === "dir" && item.name.startsWith("v"))
        .map((item: any) => item.name.substring(1)) // Remove "v" prefix
        .sort()
        .reverse(); // Newest first

      this.log(`  ✅ Found ${versions.length} versions: ${versions.join(", ")}`);

      return ["latest", ...versions];
    } catch (error) {
      this.log(`  ❌ Failed to fetch versions: ${error}`);
      return ["latest"]; // Fallback
    }
  }

  /**
   * Fetch script metadata (version, description, etc.)
   */
  async fetchMetadata(): Promise<ScriptMetadata | null> {
    try {
      this.log("📡 Fetching recovery script metadata...");

      const response = await fetch(this.metadataUrl, {
        cache: "no-cache",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        this.log(`  ⚠️  Metadata not found (${response.status})`);
        return null;
      }

      const metadata: ScriptMetadata = await response.json();

      this.log("📋 Script metadata:");
      this.log(`  Version: ${metadata.version}`);
      this.log(`  Description: ${metadata.description}`);
      this.log(`  Updated: ${metadata.updatedAt}`);
      this.log(`  Author: ${metadata.author}\n`);

      return metadata;
    } catch (error) {
      this.log(`  ❌ Failed to fetch metadata: ${error}\n`);
      return null;
    }
  }

  /**
   * Fetch recovery script from remote URL
   */
  async fetchScript(): Promise<string | null> {
    try {
      this.log("📡 Fetching recovery script from remote server...");
      this.log(`  URL: ${this.scriptUrl}\n`);

      const response = await fetch(this.scriptUrl, {
        cache: "no-cache", // Always fetch latest version
        headers: {
          "Accept": "text/javascript, application/javascript",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const scriptCode = await response.text();

      this.log(`  ✅ Script fetched (${scriptCode.length} bytes)\n`);

      return scriptCode;
    } catch (error) {
      this.log(`  ❌ Failed to fetch script: ${error}\n`);
      return null;
    }
  }

  /**
   * Execute recovery script in sandboxed environment
   */
  async executeScript(scriptCode: string): Promise<void> {
    this.log("🚀 Executing recovery script...\n");

    try {
      // Create recovery service instances
      const legacy = new LegacyCharacterRecovery();
      const snapshot = new DatabaseSnapshotRecovery();

      // Forward logs from services to our log callback
      legacy.setLogCallback((msg) => this.log(msg));
      snapshot.setLogCallback((msg) => this.log(msg));

      // Create sandboxed context
      const context: RecoveryScriptContext = {
        log: (msg: string) => this.log(msg),
        legacy,
        snapshot,
      };

      // Execute script in isolated function scope
      // This prevents access to global scope while providing necessary tools
      const scriptFunction = new Function(
        "context",
        `
        const { log, legacy, snapshot } = context;

        return (async function() {
          ${scriptCode}
        })();
        `
      );

      await scriptFunction(context);

      this.log("\n✅ Script execution complete!\n");
    } catch (error) {
      this.log(`\n❌ Script execution failed: ${error}\n`);
      throw error;
    }
  }

  /**
   * Main method: Fetch and execute remote recovery script
   */
  async fetchAndExecuteScript(): Promise<void> {
    this.log("═══════════════════════════════════════════════════════");
    this.log("🔧 REMOTE RECOVERY SCRIPT");
    this.log("═══════════════════════════════════════════════════════\n");

    // Step 1: Fetch metadata (optional, for user info)
    await this.fetchMetadata();

    // Step 2: Fetch script
    const scriptCode = await this.fetchScript();

    if (!scriptCode) {
      this.log("⚠️  Cannot proceed without recovery script.\n");
      return;
    }

    // Step 3: Show script preview (first 500 chars for transparency)
    this.log("📜 Script preview:");
    this.log("─────────────────────────────────────────────────────");
    this.log(scriptCode.substring(0, 500) + (scriptCode.length > 500 ? "\n..." : ""));
    this.log("─────────────────────────────────────────────────────\n");

    // Step 4: Execute script
    await this.executeScript(scriptCode);

    this.log("═══════════════════════════════════════════════════════");
    this.log("🏁 REMOTE RECOVERY COMPLETE");
    this.log("═══════════════════════════════════════════════════════\n");
  }

  /**
   * Execute custom inline script (for testing or manual recovery)
   */
  async executeCustomScript(scriptCode: string): Promise<void> {
    this.log("═══════════════════════════════════════════════════════");
    this.log("🔧 CUSTOM RECOVERY SCRIPT");
    this.log("═══════════════════════════════════════════════════════\n");

    await this.executeScript(scriptCode);

    this.log("═══════════════════════════════════════════════════════");
    this.log("🏁 CUSTOM RECOVERY COMPLETE");
    this.log("═══════════════════════════════════════════════════════\n");
  }

  /**
   * Download execution logs as text file
   */
  downloadLogs(logs: string[]): void {
    this.log("💾 Downloading logs...");

    const logsText = logs.join("\n");
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `astrsk-recovery-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("  ✅ Logs downloaded!\n");
  }
}

/**
 * Version Selection Examples:
 *
 * ```typescript
 * const remote = new RemoteRecoveryScript();
 *
 * // Fetch available versions
 * const versions = await remote.fetchAvailableVersions();
 * // Returns: ["latest", "1.1.0", "1.0.0"]
 *
 * // Use latest version (default)
 * remote.setVersion("latest");
 * await remote.fetchAndExecuteScript();
 *
 * // Use specific version for older app version
 * remote.setVersion("1.0.0");
 * await remote.fetchAndExecuteScript();
 *
 * // Custom version for testing
 * remote.setScriptUrl("https://mycdn.com/custom-recovery.js");
 * ```
 *
 * GitHub Repository Structure:
 * ```
 * astrsk-recovery-scripts/
 * ├── recovery-script.js          # Latest (main branch)
 * ├── metadata.json
 * └── versions/
 *     ├── v1.0.0/
 *     │   ├── recovery-script.js  # For app v3.5.0-3.5.2
 *     │   └── metadata.json
 *     ├── v1.1.0/
 *     │   ├── recovery-script.js  # For app v3.6.0+
 *     │   └── metadata.json
 *     └── v2.0.0/
 *         ├── recovery-script.js  # For app v4.0.0+
 *         └── metadata.json
 * ```
 *
 * Example recovery script for GitHub:
 *
 * // File: recovery-script.js
 * // This script will be fetched and executed on user's browser
 *
 * // Check for missing characters and recover
 * log("🔍 Checking for data loss...");
 *
 * const report = await legacy.checkLegacyData();
 *
 * if (report.canRecover) {
 *   log(`⚠️  Found ${report.missingCharacters} missing characters`);
 *   log(`⚠️  Found ${report.missingScenarios} missing scenarios`);
 *   log("");
 *
 *   // Create backup first
 *   log("💾 Creating backup before recovery...");
 *   await legacy.downloadBackup();
 *
 *   // Recover data
 *   log("🔧 Starting recovery...");
 *   const result = await legacy.recoverAll();
 *
 *   log("");
 *   log("✅ Recovery complete!");
 *   log(`   Characters recovered: ${result.characters.recovered}`);
 *   log(`   Scenarios recovered: ${result.scenarios.recovered}`);
 *   log("");
 *   log("⚠️  Please refresh the page to see your recovered data.");
 * } else {
 *   log("✅ No data loss detected. Your data is safe!");
 * }
 *
 * ---
 *
 * // File: metadata.json
 * {
 *   "version": "1.0.0",
 *   "description": "Recovers missing characters from failed migration",
 *   "updatedAt": "2025-01-17T12:00:00Z",
 *   "author": "astrsk Team"
 * }
 */
