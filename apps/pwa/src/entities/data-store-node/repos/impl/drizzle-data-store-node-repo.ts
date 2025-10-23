import { eq } from "drizzle-orm";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Drizzle } from "@/db/drizzle";
import { dataStoresNodes, SelectDataStoreNode } from "@/db/schema/data-store-nodes";
import { DataStoreNode } from "../../domain";
import { DataStoreNodeDrizzleMapper } from "../../mappers/data-store-node-drizzle-mapper";
import { SaveDataStoreNodeRepo } from "../save-data-store-node-repo";
import { LoadDataStoreNodeRepo } from "../load-data-store-node-repo";
import { DeleteDataStoreNodeRepo } from "../delete-data-store-node-repo";

export class DrizzleDataStoreNodeRepo 
  implements SaveDataStoreNodeRepo, LoadDataStoreNodeRepo, DeleteDataStoreNodeRepo {

  async saveDataStoreNode(dataStoreNode: DataStoreNode): Promise<Result<DataStoreNode>> {
    try {
      const db = await Drizzle.getInstance();
      const raw = DataStoreNodeDrizzleMapper.toPersistence(dataStoreNode);

      // Try to update first, then insert if not found
      const existing = await db
        .select()
        .from(dataStoresNodes)
        .where(eq(dataStoresNodes.id, raw.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(dataStoresNodes)
          .set({
            flow_id: raw.flow_id,
            name: raw.name,
            color: raw.color,
            data_store_fields: raw.data_store_fields,
            updated_at: new Date(),
          })
          .where(eq(dataStoresNodes.id, raw.id));
      } else {
        // Insert new
        await db.insert(dataStoresNodes).values(raw);
      }

      return Result.ok(dataStoreNode);
    } catch (error) {
      console.error("Failed to save data store node:", error);
      return Result.fail(`Failed to save data store node: ${error}`);
    }
  }

  async getDataStoreNode(id: UniqueEntityID): Promise<Result<DataStoreNode | null>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectDataStoreNode[] = await db
        .select()
        .from(dataStoresNodes)
        .where(eq(dataStoresNodes.id, id.toString()))
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      const dataStoreNode = DataStoreNodeDrizzleMapper.toDomain(rows[0]);
      return Result.ok(dataStoreNode);
    } catch (error) {
      console.error("Failed to get data store node:", error);
      return Result.fail(`Failed to get data store node: ${error}`);
    }
  }

  async getDataStoreNodeByFlowAndNodeId(flowId: string, nodeId: string): Promise<Result<DataStoreNode | null>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectDataStoreNode[] = await db
        .select()
        .from(dataStoresNodes)
        .where(eq(dataStoresNodes.id, nodeId)) // nodeId is the primary key
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      // Verify it belongs to the correct flow
      if (rows[0].flow_id !== flowId) {
        return Result.ok(null);
      }

      const dataStoreNode = DataStoreNodeDrizzleMapper.toDomain(rows[0]);
      return Result.ok(dataStoreNode);
    } catch (error) {
      console.error("Failed to get data store node by flow and node ID:", error);
      return Result.fail(`Failed to get data store node by flow and node ID: ${(error as any)?.message || String(error)}`);
    }
  }

  async getAllDataStoreNodesByFlow(flowId: string): Promise<Result<DataStoreNode[]>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectDataStoreNode[] = await db
        .select()
        .from(dataStoresNodes)
        .where(eq(dataStoresNodes.flow_id, flowId));

      const dataStoreNodes = rows.map(row => DataStoreNodeDrizzleMapper.toDomain(row));
      return Result.ok(dataStoreNodes);
    } catch (error) {
      console.error("Failed to get data store nodes by flow:", error);
      return Result.fail(`Failed to get data store nodes by flow: ${error}`);
    }
  }

  async deleteDataStoreNode(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const db = await Drizzle.getInstance();
      await db
        .delete(dataStoresNodes)
        .where(eq(dataStoresNodes.id, id.toString()));

      return Result.ok();
    } catch (error) {
      console.error("Failed to delete data store node:", error);
      return Result.fail(`Failed to delete data store node: ${error}`);
    }
  }

  async deleteAllDataStoreNodesByFlow(flowId: string): Promise<Result<void>> {
    try {
      const db = await Drizzle.getInstance();
      await db
        .delete(dataStoresNodes)
        .where(eq(dataStoresNodes.flow_id, flowId));

      return Result.ok();
    } catch (error) {
      console.error("Failed to delete data store nodes by flow:", error);
      return Result.fail(`Failed to delete data store nodes by flow: ${error}`);
    }
  }
}