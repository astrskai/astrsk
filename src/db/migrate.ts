// Source: https://github.com/drizzle-team/drizzle-orm/discussions/2532

import type { MigrationConfig } from "drizzle-orm/migrator";

import { Drizzle } from "@/db/drizzle";
import migrations from "@/db/migrations/migrations.json";

export async function migrate() {
  try {
    const db = await Drizzle.getInstance();
    // Check dialect and session
    if ("dialect" in db === false || db.dialect === null) {
      throw new Error("Dialect not found");
    }
    if (
      typeof db.dialect !== "object" ||
      "migrate" in db.dialect === false ||
      typeof db.dialect.migrate !== "function"
    ) {
      throw new Error("Migrate method not found in dialect");
    }
    if ("session" in db === false) {
      throw new Error("Session not found");
    }

    // Execute migrations
    await db.dialect.migrate(migrations, db.session, {
      migrationsTable: "__drizzle_migrations",
      migrationsSchema: "drizzle",
    } satisfies Omit<MigrationConfig, "migrationsFolder">);
  } catch (error) {
    console.error("Migration error:", error);
  }
}
