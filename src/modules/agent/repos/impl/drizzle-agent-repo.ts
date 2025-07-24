import { and, asc, desc, eq, gt, inArray, like, SQL } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { agents } from "@/db/schema/agents";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Agent } from "@/modules/agent/domain";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import {
  DeleteAgentRepo,
  LoadAgentRepo,
  SaveAgentRepo,
  SearchAgentQuery,
} from "@/modules/agent/repos";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class DrizzleAgentRepo
  implements SaveAgentRepo, LoadAgentRepo, DeleteAgentRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}
  constructor() {}

  async saveAgent(agent: Agent, tx?: Transaction): Promise<Result<Agent>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = AgentDrizzleMapper.toPersistence(agent);

      // Insert or update agent
      const savedRow = await db
        .insert(agents)
        .values(row)
        .onConflictDoUpdate({
          target: agents.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Agents,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved agent
      return Result.ok(AgentDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to save agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getAgentById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Agent>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select agent by id
      const row = await db
        .select()
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then(getOneOrThrow);

      // Return agent
      return Result.ok(AgentDrizzleMapper.toDomain(row));
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to get agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async searchAgents(
    query: SearchAgentQuery,
    tx?: Transaction,
  ): Promise<Result<Agent[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Make filters
      const filters = [
        query.targetApiType
          ? eq(agents.target_api_type, query.targetApiType)
          : undefined,
        query.keyword ? like(agents.name, `%${query.keyword}%`) : undefined,
      ].filter(Boolean) as SQL<unknown>[];

      // if (query.targetApiType) {
      //   filters.push(eq(agents.target_api_type, query.targetApiType));
      // }

      // if (query.targetModel) {
      //   filters.push(like(agents.target_model, `%${query.targetModel}%`));
      // }

      // if (query.keyword) {
      //   filters.push(like(agents.name, `%${query.keyword}%`));
      // }

      // Select agents
      const rows = await db
        .select()
        .from(agents)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(desc(agents.created_at));

      // Convert rows to entities
      const entities = rows.map((row) => AgentDrizzleMapper.toDomain(row));

      // Return agents
      return Result.ok(entities);
    } catch (error) {
      return Result.fail<Agent[]>(
        `Failed to search agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async canUseAgentName(
    name: string,
    tx?: Transaction,
  ): Promise<Result<boolean>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Check if agent with same name exists
      const row = await db
        .select()
        .from(agents)
        .where(eq(agents.name, name))
        .limit(1);

      // Return true if no agent with same name exists
      return Result.ok(row.length === 0);
    } catch (error) {
      return Result.fail<boolean>(
        `Failed to check agent name: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deleteAgent(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete agent by id
      await db.delete(agents).where(eq(agents.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Agents,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok();
    } catch (error) {
      return Result.fail<void>(
        `Failed to delete agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
