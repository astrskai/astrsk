// Base: https://github.com/drizzle-team/drizzle-orm/discussions/2532#discussioncomment-11729397

import { Drizzle } from "@/db/drizzle";
import migrations from "@/db/migrations/migrations.json";
import { logger } from "@/shared/utils";

const MIGRATION_TABLE = "__drizzle_migrations";
const MIGRATION_SCHEMA = "drizzle";

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

export async function migrate() {
  try {
    // Get db instance
    const db = await Drizzle.getInstance();
    logger.debug("🚀 Starting pglite migration...");

    // Ensure migrations schema and table exists
    await ensureMigrationsSchema();
    await ensureMigrationsTable();

    // Get already executed migrations
    const executedHashes = await getMigratedHashes();

    // Filter and execute pending migrations
    const pendingMigrations = migrations.filter(
      (migration) => !executedHashes.includes(migration.hash),
    );
    if (pendingMigrations.length === 0) {
      logger.debug("✨ No pending migrations found.");
      return;
    }
    logger.debug(`📦 Found ${pendingMigrations.length} pending migrations`);

    // Execute migrations in sequence
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
        logger.error(
          `❌ Failed to execute migration ${migration.hash}:`,
          error,
        );
        throw error;
      }
    }
    logger.debug("🎉 All migrations completed successfully");
  } catch (error) {
    logger.error("Migration error:", error);
  }
}
