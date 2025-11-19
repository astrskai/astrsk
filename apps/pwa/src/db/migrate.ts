// Base: https://github.com/drizzle-team/drizzle-orm/discussions/2532#discussioncomment-11729397

import { Drizzle } from "@/db/drizzle";
import migrations from "@/db/migrations/migrations.json";
import { logger } from "@/shared/lib";

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
 * Check if database has been initialized by verifying:
 * 1. Migration table exists
 * 2. Migration records exist
 * 3. Essential application tables exist (sessions, flows, etc.)
 * This is used to detect if initialization is truly needed (e.g., after cache clear)
 */
export async function isDatabaseInitialized(): Promise<boolean> {
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
      logger.debug("❌ Migration table does not exist");
      return false;
    }

    // Step 2: Check migration records
    const recordsResult = await db.execute(`
      SELECT COUNT(*) as count
      FROM "${MIGRATION_SCHEMA}"."${MIGRATION_TABLE}"
    `);

    const recordCount = Number(recordsResult.rows[0]?.count || 0);

    if (recordCount === 0) {
      logger.debug("❌ No migration records found");
      return false;
    }

    // Step 3: Check essential application tables
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
      logger.warn(`❌ Missing essential tables: ${missingTables.join(', ')}`);
      return false;
    }

    // All checks passed - database is initialized
    return true;
  } catch (error) {
    // If any error occurs, assume database is not initialized
    logger.error("❌ Error checking database initialization:", error);
    return false;
  }
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

export async function migrate(
  onProgress?: (
    step: string,
    status: "start" | "success" | "warning" | "error",
    error?: string,
  ) => void,
) {
  try {
    // Get db instance
    onProgress?.("database-init", "start");
    const db = await Drizzle.getInstance();
    logger.debug("🚀 Starting pglite migration...");
    onProgress?.("database-init", "success");

    // Ensure migrations schema and table exists
    onProgress?.("migration-schema", "start");
    await ensureMigrationsSchema();
    await ensureMigrationsTable();
    onProgress?.("migration-schema", "success");

    // Get already executed migrations
    onProgress?.("check-migrations", "start");
    const executedHashes = await getMigratedHashes();

    // Filter and execute pending migrations
    const pendingMigrations = migrations.filter(
      (migration) => !executedHashes.includes(migration.hash),
    );
    if (pendingMigrations.length === 0) {
      logger.debug("✨ No pending migrations found.");
      onProgress?.("check-migrations", "success");
      onProgress?.("run-migrations", "success"); // Mark as success when skipped
      return;
    }
    logger.debug(`📦 Found ${pendingMigrations.length} pending migrations`);
    onProgress?.("check-migrations", "success");

    // Execute migrations in sequence
    onProgress?.("run-migrations", "start");
    for (const migration of pendingMigrations) {
      logger.debug(`⚡ Executing migration: ${migration.hash}`);
      try {
        // Execute each SQL statement in sequence
        for (const sql of migration.sql) {
          await db.execute(sql);
        }

        // Record successful migration
        await recordMigration(migration.hash);
        logger.debug(`✅ Successfully completed migration: ${migration.hash}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `❌ Failed to execute migration ${migration.hash}:`,
          error,
        );
        onProgress?.("run-migrations", "error", errorMessage);
        throw error;
      }
    }
    logger.debug("🎉 All migrations completed successfully");
    onProgress?.("run-migrations", "success");
  } catch (error) {
    logger.error("Migration error:", error);
    throw error;
  }
}
