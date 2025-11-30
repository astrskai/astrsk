import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { IfNodeCloudData } from "@/shared/lib/cloud-upload-helpers";

import { IfNode } from "@/entities/if-node/domain/if-node";

/**
 * Mapper for converting between IfNode domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., flow_id) with some exceptions (logicOperator is camelCase)
 * - Domain: camelCase (e.g., logicOperator, flowId)
 *
 * Note: During import, node IDs are remapped using the provided newNodeId.
 * The flowId is also remapped to the new local flow ID.
 *
 * IMPORTANT: This mapper uses standard JSON serialization for cloud storage,
 * NOT superjson. The drizzle mapper uses superjson for local storage.
 */
export class IfNodeSupabaseMapper {
  private constructor() {}

  // ============================================
  // IfNode: Cloud → Domain
  // ============================================

  /**
   * Convert if node cloud data to domain entity.
   * Note: Uses provided new IDs for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param newFlowId New local flow ID
   * @param newNodeId New node ID for this if node
   */
  public static fromCloud(
    data: IfNodeCloudData,
    newFlowId: string,
    newNodeId: string,
  ): Result<IfNode> {
    // Convert cloud logicOperator (lowercase) to domain format (uppercase)
    const logicOperator = (data.logicOperator?.toUpperCase() ?? "AND") as
      | "AND"
      | "OR";

    // Parse conditions - cloud may store it as JSON string or superjson string
    let conditions: any[] = [];
    if (data.conditions) {
      if (typeof data.conditions === "string") {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(data.conditions);
          // Check if it's superjson format (has "json" and optionally "meta" keys)
          if (parsed && typeof parsed === "object" && "json" in parsed) {
            // It's superjson format - extract the actual data
            conditions = parsed.json || [];
          } else if (Array.isArray(parsed)) {
            // It's regular JSON array
            conditions = parsed;
          } else {
            conditions = [];
          }
        } catch {
          conditions = [];
        }
      } else if (Array.isArray(data.conditions)) {
        // Already an array
        conditions = data.conditions;
      }
    }

    return IfNode.create(
      {
        flowId: newFlowId,
        name: data.name,
        color: data.color,
        logicOperator,
        conditions,
      },
      new UniqueEntityID(newNodeId),
    );
  }

  // ============================================
  // IfNode: Domain → Cloud
  // ============================================

  /**
   * Convert if node domain entity to cloud data format.
   * Uses standard JSON serialization (not superjson).
   *
   * @param node IfNode to convert
   */
  public static toCloud(node: IfNode): IfNodeCloudData {
    return {
      id: node.id.toString(),
      flow_id: node.props.flowId,
      name: node.props.name,
      color: node.props.color,
      logicOperator: node.props.logicOperator,
      // Use standard JSON for cloud storage
      conditions: JSON.stringify(node.props.conditions),
      created_at: node.props.createdAt.toISOString(),
      updated_at:
        node.props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
