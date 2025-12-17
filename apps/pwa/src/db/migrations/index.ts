/**
 * Database Migrations
 *
 * Exports:
 * - runUnifiedMigrations: Main function to run all migrations (SQL + TypeScript)
 * - hasPendingMigrations: Check if there are pending migrations
 * - getMigrationStatus: Get migration execution status (for debugging)
 * - getLastMigrationError: Get details of the last migration error
 */

export {
  runUnifiedMigrations,
  hasPendingMigrations,
  getMigrationStatus,
  getLastMigrationError,
  type MigrationErrorDetails,
} from "./unified-migration-runner";
