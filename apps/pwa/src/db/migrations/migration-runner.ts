/**
 * Central Migration Runner
 *
 * Runs all data migrations in order on app startup.
 * All migrations should be idempotent (safe to run multiple times).
 *
 * Add new migrations here as needed:
 * 1. Import the migration function
 * 2. Add it to the migrations array
 * 3. Migrations run in array order
 */

import { migrateCardsData } from "./migrate-cards-data";

interface Migration {
  name: string;
  fn: () => Promise<void>;
}

/**
 * List of all data migrations
 * Add new migrations to the end of this array
 */
const migrations: Migration[] = [
  {
    name: "migrate-cards-data",
    fn: migrateCardsData,
  },
  // Add future migrations here:
  // {
  //   name: "migrate-something-else",
  //   fn: migrateSomethingElse,
  // },
];

/**
 * Run all data migrations
 * Idempotent - safe to run on every app startup
 */
export async function runMigrations(): Promise<void> {
  console.log("🔄 Starting data migrations...");

  for (const migration of migrations) {
    try {
      console.log(`  ⏳ Running: ${migration.name}...`);
      await migration.fn();
      console.log(`  ✅ Completed: ${migration.name}`);
    } catch (error) {
      console.error(`  ❌ Failed: ${migration.name}`, error);
      // Don't throw - allow app to continue even if migration fails
      // This prevents breaking the app if a migration has issues
    }
  }

  console.log("✨ Data migrations complete");
}
