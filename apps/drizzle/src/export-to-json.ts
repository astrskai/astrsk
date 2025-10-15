// This script is for migration export and is NOT bundled in the renderer. Safe to use Node.js APIs here.

import { promises as fs } from "fs";

import { readMigrationFiles } from "drizzle-orm/migrator";

const migrations = readMigrationFiles({
  migrationsFolder: "./src/migrations",
});

async function exportMigrationsToJson() {
  const jsonContent = JSON.stringify(migrations, null, 2);
  await fs.writeFile(
    "./src/migrations/migrations.json",
    jsonContent,
    "utf-8",
  );
  console.log("Migrations exported to JSON");
}
exportMigrationsToJson();
