// Base: https://github.com/drizzle-team/drizzle-orm/discussions/2532#discussioncomment-11729397

import { Drizzle } from "@/db/drizzle";
import migrations from "@/db/migrations/migrations.json";
import { logger } from "@/shared/lib";
import { useMigrationLogStore } from "@/shared/stores/migration-log-store";

const MIGRATION_TABLE = "__drizzle_migrations";
const MIGRATION_SCHEMA = "drizzle";

/**
 * Debug function to list all tables in the database
 * Useful for checking database state in development
 */
export async function listAllTables(): Promise<void> {
  try {
    const db = await Drizzle.getInstance();
    const result = await db.execute(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);

    logger.debug("📋 All tables in database:");
    result.rows.forEach(row => {
      logger.debug(`  - ${row.table_schema}.${row.table_name}`);
    });
  } catch (error) {
    logger.error("Error listing tables:", error);
  }
}

/**
 * Check if database has pending migrations by verifying:
 * 1. Migration table exists (if not, migrations needed)
 * 2. Essential application tables exist (if not, migrations needed)
 * 3. Unexecuted migration files exist (if yes, migrations needed)
 *
 * Returns true if migrations are needed, false otherwise.
 * This ensures app updates with new migration files will execute them.
 */
export async function hasPendingMigrations(): Promise<boolean> {
  try {
    const db = await Drizzle.getInstance();

    // Step 1: Check if migration table exists
    const tableExistsResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = '${MIGRATION_SCHEMA}'
        AND table_name = '${MIGRATION_TABLE}'
      ) as table_exists
    `);

    const tableExists = tableExistsResult.rows[0]?.table_exists === true;
    if (!tableExists) {
      logger.debug("✅ Migration table does not exist - migrations needed");
      return true; // Migrations needed
    }

    // Step 2: Check essential application tables
    // These tables should exist if migrations ran successfully
    const essentialTables = [
      'sessions',
      'flows',
      'cards',
      'turns',  // Message/turn history
      'api_connections',
    ];

    const tablesCheckResult = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${essentialTables.map(t => `'${t}'`).join(', ')})
    `);

    const foundTables = tablesCheckResult.rows.map(row => row.table_name);
    const missingTables = essentialTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      logger.warn(`✅ Missing essential tables: ${missingTables.join(', ')} - migrations needed`);
      return true; // Migrations needed
    }

    // Step 3: Check for unexecuted migration files
    const executedHashes = await getMigratedHashes();
    const pendingMigrations = migrations.filter(
      (migration) => !executedHashes.includes(migration.hash),
    );

    if (pendingMigrations.length > 0) {
      logger.debug(`✅ Found ${pendingMigrations.length} pending migration(s) - migrations needed`);
      return true; // Migrations needed
    }

    // All checks passed - no migrations needed
    logger.debug("⏭️ No pending migrations found");
    return false;
  } catch (error) {
    // If any error occurs, assume migrations are needed (safe default)
    logger.error("⚠️ Error checking pending migrations, will run migrations:", error);
    return true;
  }
}

/**
 * @deprecated Use hasPendingMigrations() instead
 * Check if database has been initialized.
 * This function is kept for backward compatibility but returns the inverse of hasPendingMigrations.
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  const pending = await hasPendingMigrations();
  return !pending;
}

async function ensureMigrationsSchema() {
  const db = await Drizzle.getInstance();
  await db.execute(`
    CREATE SCHEMA IF NOT EXISTS "${MIGRATION_SCHEMA}"
  `);
}

async function ensureMigrationsTable() {
  const db = await Drizzle.getInstance();

  // Check migration table exists and drop if it has wrong schema
  try {
    const checkResult = await db.execute(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = '${MIGRATION_SCHEMA}'
      AND table_name = '${MIGRATION_TABLE}'
      AND column_name = 'created_at'
    `);

    if (checkResult.rows.length > 0) {
      const dataType = checkResult.rows[0].data_type;
      if (dataType === "bigint") {
        logger.error("Dropping migration table with incorrect schema...");
        await db.execute(
          `DROP TABLE "${MIGRATION_SCHEMA}"."${MIGRATION_TABLE}"`,
        );
      }
    }
  } catch (error) {
    // Table might not exist yet, which is fine
    logger.error(
      "Migration table does not exist yet, will create new one",
      error,
    );
  }

  // Create migration table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_SCHEMA}"."${MIGRATION_TABLE}" (
      hash TEXT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getMigratedHashes(): Promise<string[]> {
  const db = await Drizzle.getInstance();
  const result = await db.execute(`
    SELECT hash FROM "${MIGRATION_SCHEMA}"."${MIGRATION_TABLE}" ORDER BY created_at ASC
  `);
  return result.rows.map((row) => row.hash as string);
}

async function recordMigration(hash: string) {
  const db = await Drizzle.getInstance();
  await db.execute(`
    INSERT INTO "${MIGRATION_SCHEMA}"."${MIGRATION_TABLE}" (hash, created_at)
    VALUES ('${hash}', CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
  `);
}

// Helper to extract filename from folderMillis timestamp
function getFileNameFromTimestamp(folderMillis: number): string {
  const date = new Date(folderMillis);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function migrate(
  onProgress?: (
    step: string,
    status: "start" | "success" | "warning" | "error",
    error?: string,
  ) => void,
) {
  let currentStep: string | undefined;

  // Start migration log
  const { startMigrationLog, recordMigration: recordMigrationLog, finalizeMigrationLog } =
    useMigrationLogStore.getState();

  try {
    // Get db instance
    currentStep = "database-init";
    onProgress?.(currentStep, "start");
    const db = await Drizzle.getInstance();
    logger.debug("🚀 Starting pglite migration...");
    onProgress?.(currentStep, "success");

    // Ensure migrations schema and table exists
    currentStep = "migration-schema";
    onProgress?.(currentStep, "start");
    await ensureMigrationsSchema();
    await ensureMigrationsTable();
    onProgress?.(currentStep, "success");

    // Get already executed migrations
    currentStep = "check-migrations";
    onProgress?.(currentStep, "start");
    const executedHashes = await getMigratedHashes();

    // Filter and execute pending migrations
    const pendingMigrations = migrations.filter(
      (migration) => !executedHashes.includes(migration.hash),
    );
    if (pendingMigrations.length === 0) {
      logger.debug("✨ No pending migrations found.");
      onProgress?.(currentStep, "success");
      onProgress?.("run-migrations", "success"); // Mark as success when skipped
      return;
    }
    logger.debug(`📦 Found ${pendingMigrations.length} pending migrations`);
    onProgress?.(currentStep, "success");

    // Start migration log only if there are migrations to execute
    startMigrationLog();

    // Execute migrations in sequence
    currentStep = "run-migrations";
    onProgress?.(currentStep, "start");
    for (const migration of pendingMigrations) {
      const migrationStartTime = performance.now();
      logger.debug(`⚡ Executing migration: ${migration.hash}`);

      // Generate filename from folderMillis
      const fileName = getFileNameFromTimestamp(migration.folderMillis);

      try {
        // Execute each SQL statement in sequence
        for (const sql of migration.sql) {
          await db.execute(sql);
        }

        // Record successful migration in DB
        await recordMigration(migration.hash);

        // Record in migration log (with SQL statements)
        const duration = Math.round(performance.now() - migrationStartTime);
        recordMigrationLog(migration.hash, fileName, duration, "success", undefined, migration.sql);

        logger.debug(`✅ Successfully completed migration: ${migration.hash}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `❌ Failed to execute migration ${migration.hash}:`,
          error,
        );

        // Record failed migration in log (with SQL statements)
        const duration = Math.round(performance.now() - migrationStartTime);
        recordMigrationLog(migration.hash, fileName, duration, "error", errorMessage, migration.sql);

        // Finalize log even on error
        finalizeMigrationLog();

        onProgress?.(currentStep, "error", errorMessage);
        throw error;
      }
    }
    logger.debug("🎉 All migrations completed successfully");
    onProgress?.(currentStep, "success");

    // Finalize migration log
    finalizeMigrationLog();
  } catch (error) {
    logger.error("Migration error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (currentStep) {
      onProgress?.(currentStep, "error", msg);
    }
    throw error;
  }
}
