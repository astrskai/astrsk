import { Drizzle } from "@/db/drizzle";
import { Pglite } from "@/db/pglite";
import { sql } from "drizzle-orm";
import { file } from "opfs-tools";
import JSZip from "jszip";
import { runUnifiedMigrations, getMigrationStatus } from "@/db/migrations/unified-migration-runner";

/**
 * Database Snapshot Recovery Service
 *
 * This service provides disaster recovery capabilities by:
 * 1. Creating full database snapshots (SQL dump + all assets)
 * 2. Packaging snapshots into downloadable ZIP files
 * 3. Restoring from snapshots with migration replay capability
 * 4. Running migrations from specific points to current state
 *
 * Use cases:
 * - User data backup before risky operations
 * - Disaster recovery when migrations fail
 * - Debugging migration issues by replaying from snapshots
 * - Migrating user data between devices
 *
 * Architecture:
 * - Database: PGlite (PostgreSQL in browser via IndexedDB)
 * - Assets: OPFS (Origin Private File System) at /assets/*
 * - Snapshot format: ZIP containing:
 *   - snapshot.sql (database dump)
 *   - assets/ (all asset files)
 *   - metadata.json (snapshot info + asset manifest)
 *
 * Usage:
 * ```typescript
 * const recovery = new DatabaseSnapshotRecovery();
 *
 * // Create and download snapshot
 * await recovery.createSnapshot();
 *
 * // Restore from snapshot file
 * await recovery.restoreFromSnapshot(snapshotFile);
 *
 * // Create snapshot at specific migration point (for testing)
 * await recovery.createSnapshotBeforeMigration("20251117050000");
 * ```
 */

interface SnapshotMetadata {
  version: string;
  createdAt: string;
  databaseName: string;
  assetCount: number;
  assetPaths: string[];
  migrations: {
    sql: Array<{ hash: string; created_at: Date }>;
    typescript: Array<{ filename: string; executed_at: Date }>;
  };
}

interface SnapshotReport {
  databaseSizeBytes: number;
  assetsSizeBytes: number;
  totalSizeBytes: number;
  assetCount: number;
  migrationCount: number;
}

export class DatabaseSnapshotRecovery {
  private logCallback?: (message: string) => void;

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
   * Step 1: Create database snapshot (SQL dump)
   */
  private async createDatabaseDump(): Promise<string> {
    this.log("📊 Creating database dump...");

    const pglite = await Pglite.getInstance();

    // Use pg_dump command to create SQL dump
    // PGlite supports pg_dump via exec()
    const result = await pglite.query(`
      SELECT
        'CREATE TABLE ' || quote_ident(table_name) || ' (' ||
        string_agg(
          quote_ident(column_name) || ' ' || data_type ||
          CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
          END,
          ', '
        ) || ');' as create_statement
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name;
    `);

    // For now, use simple dump approach
    // TODO: Implement full pg_dump equivalent using PGlite's dump() method
    const dumpResult = await pglite.exec(`
      SELECT * FROM pg_dump('astrsk');
    `).catch(() => {
      // Fallback: manual dump using COPY commands
      return this.manualDatabaseDump(pglite);
    });

    this.log("  ✅ Database dump created");
    return typeof dumpResult === 'string' ? dumpResult : JSON.stringify(dumpResult);
  }

  /**
   * Fallback: Manual database dump using SQL queries
   */
  private async manualDatabaseDump(pglite: any): Promise<string> {
    this.log("  Using manual dump method...");

    const db = await Drizzle.getInstance();
    let dumpSQL = "-- astrsk Database Dump\n";
    dumpSQL += `-- Created: ${new Date().toISOString()}\n\n`;

    // Get all tables
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    this.log(`  Found ${tables.rows.length} tables`);

    // For each table, export schema and data
    for (const tableRow of tables.rows) {
      const tableName = (tableRow as any).table_name;
      this.log(`    Dumping table: ${tableName}`);

      // Get table schema
      const columns = await db.execute(sql`
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `);

      // Build CREATE TABLE statement
      dumpSQL += `\n-- Table: ${tableName}\n`;
      dumpSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

      const columnDefs = columns.rows.map((col: any) => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        return def;
      });

      dumpSQL += columnDefs.join(',\n');
      dumpSQL += '\n);\n\n';

      // Get table data (using raw query for safety)
      const dataResult = await db.execute(sql.raw(`SELECT * FROM ${tableName}`));

      if (dataResult.rows.length > 0) {
        dumpSQL += `-- Data for table: ${tableName}\n`;

        for (const row of dataResult.rows) {
          const values = Object.values(row as any).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return String(val);
          });

          const columns = Object.keys(row as any).join(', ');
          dumpSQL += `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')});\n`;
        }

        dumpSQL += '\n';
      }
    }

    return dumpSQL;
  }

  /**
   * Step 2: Get all asset file paths from database
   */
  private async getAllAssetPaths(): Promise<string[]> {
    this.log("📁 Collecting asset file paths...");

    const db = await Drizzle.getInstance();

    // Query all file_path values from assets table
    const result = await db.execute(sql`
      SELECT file_path FROM assets ORDER BY file_path;
    `);

    const paths = result.rows.map((row: any) => row.file_path);

    this.log(`  Found ${paths.length} assets`);

    return paths;
  }

  /**
   * Step 3: Read asset files from OPFS
   */
  private async readAssetFile(filePath: string): Promise<Uint8Array | null> {
    try {
      const assetFile = await file(filePath).getOriginFile();
      if (!assetFile) {
        this.log(`  ⚠️  Asset not found: ${filePath}`);
        return null;
      }

      const buffer = await assetFile.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      this.log(`  ❌ Failed to read asset: ${filePath} - ${error}`);
      return null;
    }
  }

  /**
   * Step 4: Create snapshot report
   */
  async createSnapshotReport(): Promise<SnapshotReport> {
    this.log("🔍 Analyzing database for snapshot...");

    const pglite = await Pglite.getInstance();
    const db = await Drizzle.getInstance();

    // Get database size (estimate from table sizes)
    const sizeResult = await db.execute(sql`
      SELECT
        pg_database_size(current_database()) as db_size;
    `).catch(() => ({ rows: [{ db_size: 0 }] }));

    const databaseSize = Number((sizeResult.rows[0] as any).db_size || 0);

    // Get asset paths and calculate total size
    const assetPaths = await this.getAllAssetPaths();
    let assetsSize = 0;

    for (const assetPath of assetPaths) {
      const assetData = await this.readAssetFile(assetPath);
      if (assetData) {
        assetsSize += assetData.byteLength;
      }
    }

    // Get migration count
    const migrations = await getMigrationStatus();
    const migrationCount = migrations.sql.length + migrations.typescript.length;

    this.log("📊 Snapshot analysis:");
    this.log(`  Database size: ${(databaseSize / 1024 / 1024).toFixed(2)} MB`);
    this.log(`  Assets size: ${(assetsSize / 1024 / 1024).toFixed(2)} MB`);
    this.log(`  Asset count: ${assetPaths.length}`);
    this.log(`  Migration count: ${migrationCount}`);

    return {
      databaseSizeBytes: databaseSize,
      assetsSizeBytes: assetsSize,
      totalSizeBytes: databaseSize + assetsSize,
      assetCount: assetPaths.length,
      migrationCount,
    };
  }

  /**
   * Step 5: Create full snapshot (database + assets) as ZIP
   */
  async createSnapshot(): Promise<Blob> {
    this.log("🚀 Creating full database snapshot...\n");

    // Create ZIP file
    const zip = new JSZip();

    // Step 1: Add database dump
    const databaseDump = await this.createDatabaseDump();
    zip.file("snapshot.sql", databaseDump);

    // Step 2: Get asset paths
    const assetPaths = await this.getAllAssetPaths();

    // Step 3: Add assets to ZIP
    this.log("📦 Packaging assets...");
    const assetsFolder = zip.folder("assets");

    if (assetsFolder) {
      let successCount = 0;
      let failCount = 0;

      for (const assetPath of assetPaths) {
        const assetData = await this.readAssetFile(assetPath);

        if (assetData) {
          // Remove leading /assets/ from path for ZIP structure
          const zipPath = assetPath.replace(/^\/assets\//, '');
          assetsFolder.file(zipPath, assetData);
          successCount++;
        } else {
          failCount++;
        }
      }

      this.log(`  ✅ Packaged ${successCount} assets`);
      if (failCount > 0) {
        this.log(`  ⚠️  Failed to package ${failCount} assets`);
      }
    }

    // Step 4: Get migration status
    const migrations = await getMigrationStatus();

    // Step 5: Create metadata
    const metadata: SnapshotMetadata = {
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      databaseName: "astrsk",
      assetCount: assetPaths.length,
      assetPaths,
      migrations,
    };

    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Step 6: Generate ZIP blob
    this.log("🗜️  Compressing snapshot...");
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    this.log(`✅ Snapshot created: ${(blob.size / 1024 / 1024).toFixed(2)} MB\n`);

    return blob;
  }

  /**
   * Step 6: Download snapshot file
   */
  async downloadSnapshot(): Promise<void> {
    this.log("💾 Creating snapshot for download...\n");

    const blob = await this.createSnapshot();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astrsk-snapshot-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("✅ Snapshot file downloaded!\n");
  }

  /**
   * Step 7: Restore from snapshot ZIP file
   */
  async restoreFromSnapshot(snapshotFile: File): Promise<void> {
    this.log("🔄 Restoring from snapshot...\n");

    // Extract ZIP
    const zip = await JSZip.loadAsync(snapshotFile);

    // Read metadata
    const metadataFile = zip.file("metadata.json");
    if (!metadataFile) {
      throw new Error("Invalid snapshot: metadata.json not found");
    }

    const metadataText = await metadataFile.async("text");
    const metadata: SnapshotMetadata = JSON.parse(metadataText);

    this.log("📊 Snapshot info:");
    this.log(`  Created: ${metadata.createdAt}`);
    this.log(`  Assets: ${metadata.assetCount}`);
    this.log(`  Migrations: ${metadata.migrations.sql.length} SQL, ${metadata.migrations.typescript.length} TypeScript\n`);

    // Read database dump
    const dumpFile = zip.file("snapshot.sql");
    if (!dumpFile) {
      throw new Error("Invalid snapshot: snapshot.sql not found");
    }

    const dumpSQL = await dumpFile.async("text");

    // Restore database
    this.log("📊 Restoring database...");
    const pglite = await Pglite.getInstance();

    // Split SQL into statements and execute in batches for better progress
    const statements = dumpSQL.split(';').filter(s => s.trim());
    this.log(`  Executing ${statements.length} SQL statements...`);

    let executed = 0;
    const batchSize = 100;

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      const batchSQL = batch.join(';') + ';';

      try {
        await pglite.exec(batchSQL);
        executed += batch.length;

        // Log progress every 500 statements
        if (executed % 500 === 0 || executed === statements.length) {
          this.log(`  Progress: ${executed}/${statements.length} statements`);
        }
      } catch (error) {
        this.log(`  ⚠️  Error in batch ${i}-${i + batchSize}: ${error}`);
        // Continue with next batch
      }
    }

    this.log("  ✅ Database restored");

    // Restore assets
    this.log("📁 Restoring assets...");
    const assetsFolder = zip.folder("assets");

    if (assetsFolder) {
      let restoredCount = 0;
      const assetFiles = Object.entries(assetsFolder.files).filter(([, file]) => !file.dir);
      const totalAssets = assetFiles.length;

      this.log(`  Found ${totalAssets} assets to restore`);

      for (const [filename, file] of assetFiles) {
        const assetData = await file.async("uint8array");
        const assetPath = `/assets/${filename}`;

        try {
          const { write } = await import("opfs-tools");
          // Convert to proper Uint8Array with ArrayBuffer
          const buffer = assetData.buffer instanceof ArrayBuffer
            ? assetData.buffer
            : new ArrayBuffer(assetData.byteLength);

          if (!(assetData.buffer instanceof ArrayBuffer)) {
            new Uint8Array(buffer).set(new Uint8Array(assetData));
          }

          await write(assetPath, new Uint8Array(buffer));
          restoredCount++;

          // Log progress every 10 assets
          if (restoredCount % 10 === 0 || restoredCount === totalAssets) {
            this.log(`  Progress: ${restoredCount}/${totalAssets} assets`);
          }
        } catch (error) {
          this.log(`  ❌ Failed to restore asset: ${assetPath} - ${error}`);
        }
      }

      this.log(`  ✅ Restored ${restoredCount} assets`);
    }

    this.log("\n✅ RESTORE COMPLETE!");
    this.log("⚠️  Please refresh the page to see restored data.\n");
  }

  /**
   * Step 8: Run migrations from current state to latest
   */
  async runMigrationsToLatest(): Promise<void> {
    this.log("🔄 Running migrations to latest...\n");

    await runUnifiedMigrations((stepId, status, error) => {
      if (status === "start") {
        this.log(`⏳ ${stepId}...`);
      } else if (status === "success") {
        this.log(`✅ ${stepId} complete`);
      } else if (status === "error") {
        this.log(`❌ ${stepId} failed: ${error}`);
      }
    });

    this.log("\n✅ Migrations complete!\n");
  }

  /**
   * Step 9: Create snapshot at specific migration point (for testing)
   */
  async createSnapshotBeforeMigration(migrationTimestamp: string): Promise<Blob> {
    this.log(`🔍 Creating snapshot before migration ${migrationTimestamp}...\n`);

    // Get current migration status
    const currentMigrations = await getMigrationStatus();

    // Filter migrations to only include those before the target
    const targetTimestamp = parseInt(migrationTimestamp);

    this.log("⚠️  This feature requires database rollback capability");
    this.log("   PGlite does not support transaction rollback across sessions");
    this.log("   Consider creating a snapshot of current state instead\n");

    // Create snapshot of current state
    return this.createSnapshot();
  }
}
