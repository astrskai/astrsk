import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/migrations",
  dialect: "postgresql",
  schema: "./src/db/schema",

  driver: "pglite",
  dbCredentials: {
    url: "./pglite/", // Local PGlite
  },

  migrations: {
    prefix: "timestamp",
  },
});
