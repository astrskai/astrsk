import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PgliteQueryResultHKT } from "drizzle-orm/pglite";

import { Schema } from "@/db/schema/schema";

export type Transaction = PgTransaction<
  PgliteQueryResultHKT,
  typeof Schema,
  ExtractTablesWithRelations<typeof Schema>
>;
