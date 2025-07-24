import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { flows } from "@/db/schema/flows";
import { Transaction } from "@/db/transaction";
import { ApiSource } from "@/modules/api/domain";
import { Flow } from "@/modules/flow/domain/flow";
import { FlowDrizzleMapper } from "@/modules/flow/mappers/flow-drizzle-mapper";
import {
  DeleteFlowRepo,
  LoadFlowRepo,
  SaveFlowRepo,
  SearchFlowQuery,
} from "@/modules/flow/repos";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class DrizzleFlowRepo
  implements SaveFlowRepo, LoadFlowRepo, DeleteFlowRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveFlow(flow: Flow, tx?: Transaction): Promise<Result<Flow>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = FlowDrizzleMapper.toPersistence(flow);

      // Insert or update flow
      const savedRow = await db
        .insert(flows)
        .values(row)
        .onConflictDoUpdate({
          target: flows.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Flows,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved flow
      return Result.ok(FlowDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return Result.fail<Flow>(
        `Failed to save flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getFlowById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Flow>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select flow by id
      const row = await db
        .select()
        .from(flows)
        .where(eq(flows.id, id.toString()))
        .then(getOneOrThrow);

      // Return flow
      return Result.ok(FlowDrizzleMapper.toDomain(row));
    } catch (error) {
      return Result.fail<Flow>(
        `Failed to get flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async searchFlow(
    query: SearchFlowQuery,
    tx?: Transaction,
  ): Promise<Result<Flow[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Make filters
      const filters = [];

      if (query.taskType) {
        // @ts-ignore
        filters.push(eq(flows.task_type, query.taskType));
      }

      if (query.keyword) {
        filters.push(
          // @ts-ignore
          or(
            ilike(flows.name, `%${query.keyword}%`),
            ilike(flows.description, `%${query.keyword}%`),
          ),
        );
      }

      // Select flows
      const rows = await db
        .select()
        .from(flows)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(desc(flows.created_at));

      // Convert rows to entities
      const entities = rows.map((row) => FlowDrizzleMapper.toDomain(row));

      // Return flows
      return Result.ok(entities);
    } catch (error) {
      return Result.fail<Flow[]>(
        `Failed to search flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async canUseFlowName(
    name: string,
    tx?: Transaction,
  ): Promise<Result<boolean>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Check if flow with same name exists
      const row = await db
        .select()
        .from(flows)
        .where(eq(flows.name, name))
        .limit(1);

      // Return true if no flow with same name exists
      return Result.ok(row.length === 0);
    } catch (error) {
      return Result.fail<boolean>(
        `Failed to check flow name: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deleteFlow(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete flow by id
      await db.delete(flows).where(eq(flows.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Flows,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok();
    } catch (error) {
      return Result.fail<void>(
        `Failed to delete flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async listFlowByProvider(
    provider: ApiSource,
    tx?: Transaction,
  ): Promise<Result<Flow[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select flows by provider, handling both formats:
      // 1. Format: "provider:modelId" (e.g. "ollama:mistral")
      // 2. Legacy format: modelId == provider (e.g. "ollama")
      const rows = await db
        .select()
        .from(flows)
        .where(
          sql.raw(
            `jsonb_path_exists(agents, '$.* ? (@.modelId like_regex "^${provider}:" || @.modelId == "${provider}" || @.model_id like_regex "^${provider}:" || @.model_id == "${provider}")')`,
          ),
        );

      // Convert rows to entities
      const entities = rows.map((row) => FlowDrizzleMapper.toDomain(row));

      // Return flows
      return Result.ok(entities);
    } catch (error) {
      return Result.fail<Flow[]>(
        `Failed to list flows by provider: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
