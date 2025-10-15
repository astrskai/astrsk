import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/migrations",
  dialect: "postgresql",
  schema: "./src/schema",

  driver: "pglite",
  dbCredentials: {
    url: "./pglite/", // Local PGlite
  },

  migrations: {
    prefix: "timestamp",
  },
});
