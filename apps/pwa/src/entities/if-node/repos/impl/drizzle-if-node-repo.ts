import { eq } from "drizzle-orm";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Drizzle } from "@/db/drizzle";
import { ifNodes, SelectIfNode } from "@/db/schema/if-nodes";
import { IfNode } from "../../domain";
import { IfNodeMapper } from "../../mappers/if-node-mapper";
import { SaveIfNodeRepo } from "../save-if-node-repo";
import { LoadIfNodeRepo } from "../load-if-node-repo";
import { DeleteIfNodeRepo } from "../delete-if-node-repo";

export class DrizzleIfNodeRepo 
  implements SaveIfNodeRepo, LoadIfNodeRepo, DeleteIfNodeRepo {

  async saveIfNode(ifNode: IfNode): Promise<Result<IfNode>> {
    try {
      const db = await Drizzle.getInstance();
      const raw = IfNodeMapper.toPersistence(ifNode);

      // Try to update first, then insert if not found
      const existing = await db
        .select()
        .from(ifNodes)
        .where(eq(ifNodes.id, raw.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(ifNodes)
          .set({
            flow_id: raw.flow_id,
            name: raw.name,
            color: raw.color,
            logicOperator: raw.logicOperator,
            conditions: raw.conditions,
            updated_at: new Date(),
          })
          .where(eq(ifNodes.id, raw.id));
      } else {
        // Insert new
        await db.insert(ifNodes).values(raw);
      }

      return Result.ok(ifNode);
    } catch (error) {
      console.error("Failed to save if node:", error);
      return Result.fail(`Failed to save if node: ${error}`);
    }
  }

  async getIfNode(id: UniqueEntityID): Promise<Result<IfNode | null>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectIfNode[] = await db
        .select()
        .from(ifNodes)
        .where(eq(ifNodes.id, id.toString()))
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      const ifNode = IfNodeMapper.toDomain(rows[0]);
      return Result.ok(ifNode);
    } catch (error) {
      console.error("Failed to get if node:", error);
      return Result.fail(`Failed to get if node: ${error}`);
    }
  }

  async getIfNodeByFlowAndNodeId(flowId: string, nodeId: string): Promise<Result<IfNode | null>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectIfNode[] = await db
        .select()
        .from(ifNodes)
        .where(eq(ifNodes.id, nodeId)) // nodeId is the primary key
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      // Verify it belongs to the correct flow
      if (rows[0].flow_id !== flowId) {
        return Result.ok(null);
      }

      const ifNode = IfNodeMapper.toDomain(rows[0]);
      return Result.ok(ifNode);
    } catch (error) {
      console.error("Failed to get if node by flow and node ID:", error);
      return Result.fail(`Failed to get if node by flow and node ID: ${error}`);
    }
  }

  async getAllIfNodesByFlow(flowId: string): Promise<Result<IfNode[]>> {
    try {
      const db = await Drizzle.getInstance();
      const rows: SelectIfNode[] = await db
        .select()
        .from(ifNodes)
        .where(eq(ifNodes.flow_id, flowId));

      const ifNodeList = rows.map(row => IfNodeMapper.toDomain(row));
      return Result.ok(ifNodeList);
    } catch (error) {
      console.error("Failed to get if nodes by flow:", error);
      return Result.fail(`Failed to get if nodes by flow: ${error}`);
    }
  }

  async deleteIfNode(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const db = await Drizzle.getInstance();
      await db
        .delete(ifNodes)
        .where(eq(ifNodes.id, id.toString()));

      return Result.ok();
    } catch (error) {
      console.error("Failed to delete if node:", error);
      return Result.fail(`Failed to delete if node: ${error}`);
    }
  }

  async deleteAllIfNodesByFlow(flowId: string): Promise<Result<void>> {
    try {
      const db = await Drizzle.getInstance();
      await db
        .delete(ifNodes)
        .where(eq(ifNodes.flow_id, flowId));

      return Result.ok();
    } catch (error) {
      console.error("Failed to delete if nodes by flow:", error);
      return Result.fail(`Failed to delete if nodes by flow: ${error}`);
    }
  }
}