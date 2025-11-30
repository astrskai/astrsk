import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNodeCloudData } from "@/shared/lib/cloud-upload-helpers";

import { DataStoreNode } from "@/entities/data-store-node/domain/data-store-node";

/**
 * Mapper for converting between DataStoreNode domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., data_store_fields, flow_id)
 * - Domain: camelCase (e.g., dataStoreFields, flowId)
 *
 * Note: During import, node IDs are remapped using the provided newNodeId.
 * The flowId is also remapped to the new local flow ID.
 */
export class DataStoreNodeSupabaseMapper {
  private constructor() {}

  // ============================================
  // DataStoreNode: Cloud → Domain
  // ============================================

  /**
   * Convert data store node cloud data to domain entity.
   * Note: Uses provided new IDs for imports to avoid conflicts.
   *
   * IMPORTANT: This mapper uses standard JSON serialization for cloud storage,
   * NOT superjson. The drizzle mapper uses superjson for local storage.
   *
   * @param data Cloud data from Supabase
   * @param newFlowId New local flow ID
   * @param newNodeId New node ID for this data store node
   */
  public static fromCloud(
    data: DataStoreNodeCloudData,
    newFlowId: string,
    newNodeId: string,
  ): Result<DataStoreNode> {
    // Parse dataStoreFields - cloud may store it as JSON string or superjson string
    let dataStoreFields: any[] = [];
    if (data.data_store_fields) {
      if (typeof data.data_store_fields === "string") {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(data.data_store_fields);
          // Check if it's superjson format (has "json" and optionally "meta" keys)
          if (parsed && typeof parsed === "object" && "json" in parsed) {
            // It's superjson format - extract the actual data
            dataStoreFields = parsed.json || [];
          } else if (Array.isArray(parsed)) {
            // It's regular JSON array
            dataStoreFields = parsed;
          } else {
            dataStoreFields = [];
          }
        } catch {
          dataStoreFields = [];
        }
      } else if (Array.isArray(data.data_store_fields)) {
        // Already an array
        dataStoreFields = data.data_store_fields;
      }
    }

    return DataStoreNode.create(
      {
        flowId: newFlowId,
        name: data.name,
        color: data.color,
        dataStoreFields,
      },
      new UniqueEntityID(newNodeId),
    );
  }

  // ============================================
  // DataStoreNode: Domain → Cloud
  // ============================================

  /**
   * Convert data store node domain entity to cloud data format.
   * Uses standard JSON serialization (not superjson).
   *
   * @param node DataStoreNode to convert
   */
  public static toCloud(node: DataStoreNode): DataStoreNodeCloudData {
    return {
      id: node.id.toString(),
      flow_id: node.props.flowId,
      name: node.props.name,
      color: node.props.color,
      // Use standard JSON for cloud storage
      data_store_fields: JSON.stringify(node.props.dataStoreFields),
      created_at: node.props.createdAt.toISOString(),
      updated_at:
        node.props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
