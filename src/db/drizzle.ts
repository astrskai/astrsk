import { drizzle } from "drizzle-orm/pglite";

import { Pglite } from "@/db/pglite";
import { Schema } from "@/db/schema/schema";
import { PGlite } from "@electric-sql/pglite";

export class Drizzle {
  private static _instance: ReturnType<typeof drizzle<typeof Schema>>;
  private static _initPromise: Promise<
    ReturnType<typeof drizzle<typeof Schema>>
  > | null = null;

  public static async getInstance() {
    // Check instance exists
    if (Drizzle._instance) {
      return Drizzle._instance;
    }

    // Check if instance is initializing
    if (Drizzle._initPromise) {
      return Drizzle._initPromise;
    }

    // Create init promise
    Drizzle._initPromise = (async () => {
      // Get PGlite instance
      const pglite = await Pglite.getInstance();

      // Create drizzle instance
      Drizzle._instance = drizzle<typeof Schema>({
        client: pglite as PGlite,
        schema: Schema,
      });

      // Return drizzle instance
      return Drizzle._instance;
    })();

    // Return drizzle init promise
    return Drizzle._initPromise;
  }
}
