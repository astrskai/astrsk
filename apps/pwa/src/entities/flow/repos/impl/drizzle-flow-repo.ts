import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { flows } from "@/db/schema/flows";
import { Transaction } from "@/db/transaction";
import { ApiSource } from "@/entities/api/domain";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";
import { FlowDrizzleMapper } from "@/entities/flow/mappers/flow-drizzle-mapper";
import {
  DeleteFlowRepo,
  LoadFlowRepo,
  SaveFlowRepo,
  SearchFlowQuery,
} from "@/entities/flow/repos";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleFlowRepo
  implements SaveFlowRepo, LoadFlowRepo, DeleteFlowRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async updateResponseTemplate(flowId: string, template: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(flows)
        .set({ response_template: template })  // Use snake_case column name
        .where(eq(flows.id, flowId));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update response template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateDataStoreSchema(flowId: string, schema: any): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(flows)
        .set({ data_store_schema: schema })  // Use snake_case column name
        .where(eq(flows.id, flowId));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update data store schema: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateFlowName(flowId: UniqueEntityID, name: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(flows)
        .set({ name })
        .where(eq(flows.id, flowId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update flow name: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateFlowViewport(flowId: UniqueEntityID, viewport: any): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(flows)
        .set({ viewport })
        .where(eq(flows.id, flowId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update flow viewport: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updatePanelLayout(flowId: UniqueEntityID, panelStructure: any): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(flows)
        .set({ 
          panel_structure: panelStructure,
          updated_at: new Date()
        })
        .where(eq(flows.id, flowId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update panel layout: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateNodePosition(flowId: UniqueEntityID, nodeId: string, position: { x: number; y: number }): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // First get the current nodes array
      const row = await db
        .select({ nodes: flows.nodes })
        .from(flows)
        .where(eq(flows.id, flowId.toString()))
        .then(getOneOrThrow);
      
      // Find and update the specific node's position
      const nodes = row.nodes as any[];
      const nodeIndex = nodes.findIndex((n: any) => n.id === nodeId);
      
      if (nodeIndex === -1) {
        return Result.fail(`Node with id ${nodeId} not found in flow`);
      }
      
      // Update only the position
      nodes[nodeIndex] = {
        ...nodes[nodeIndex],
        position
      };
      
      // Save back only the nodes field
      await db
        .update(flows)
        .set({ nodes })
        .where(eq(flows.id, flowId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update node position: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateNodesPositions(flowId: UniqueEntityID, positions: Array<{ nodeId: string; position: { x: number; y: number } }>): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // First get the current nodes array
      const row = await db
        .select({ nodes: flows.nodes })
        .from(flows)
        .where(eq(flows.id, flowId.toString()))
        .then(getOneOrThrow);
      
      // Update positions for all specified nodes
      const nodes = row.nodes as any[];
      for (const update of positions) {
        const nodeIndex = nodes.findIndex((n: any) => n.id === update.nodeId);
        if (nodeIndex !== -1) {
          nodes[nodeIndex] = {
            ...nodes[nodeIndex],
            position: update.position
          };
        }
      }
      
      // Save back only the nodes field
      await db
        .update(flows)
        .set({ nodes })
        .where(eq(flows.id, flowId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update node positions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateNode(flowId: string, nodeId: string, nodeData: any): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // First get the current nodes array
      const row = await db
        .select({ nodes: flows.nodes })
        .from(flows)
        .where(eq(flows.id, flowId))
        .then(getOneOrThrow);
      
      // Find and update the specific node
      const nodes = row.nodes as any[];
      const nodeIndex = nodes.findIndex((n: any) => n.id === nodeId);
      
      if (nodeIndex === -1) {
        return Result.fail(`Node with id ${nodeId} not found in flow`);
      }
      
      // Update the node's data
      nodes[nodeIndex] = {
        ...nodes[nodeIndex],
        data: nodeData
      };
      
      // Save back only the nodes field
      await db
        .update(flows)
        .set({ nodes })
        .where(eq(flows.id, flowId));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateNodesAndEdges(flowId: UniqueEntityID, nodes: any[], edges: any[]): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // Update nodes and edges directly in database
      await db
        .update(flows)
        .set({ 
          nodes: nodes,
          edges: edges,
          updated_at: new Date()
        })
        .where(eq(flows.id, flowId.toString()));

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        `Failed to update nodes and edges: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

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
      const flow = FlowDrizzleMapper.toDomain(row);
      return Result.ok(flow);
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

  async updateFlowValidation(
    flowId: string,
    readyState: ReadyState,
    validationIssues: any[],
    tx?: Transaction
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .update(flows)
        .set({
          ready_state: readyState,
          validation_issues: validationIssues,
          updated_at: new Date(),
        })
        .where(eq(flows.id, flowId));

      return Result.ok();
    } catch (error) {
      return Result.fail<void>(
        `Failed to update flow validation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async updateFlowReadyState(
    flowId: string,
    readyState: ReadyState,
    tx?: Transaction
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .update(flows)
        .set({
          ready_state: readyState,
          updated_at: new Date(),
        })
        .where(eq(flows.id, flowId));

      return Result.ok();
    } catch (error) {
      return Result.fail<void>(
        `Failed to update flow ready state: ${
          error instanceof Error ? error.message : String(error)
        }`
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
