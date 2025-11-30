import { parse, stringify } from "superjson";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";
import { DataStoreNode } from "@/entities/data-store-node/domain/data-store-node";

export class DataStoreNodeDrizzleMapper {
  public static toPersistence(dataStoreNode: DataStoreNode): any {
    return {
      id: dataStoreNode.id.toString(),
      flow_id: dataStoreNode.props.flowId,
      name: dataStoreNode.props.name,
      color: dataStoreNode.props.color,
      data_store_fields: stringify(dataStoreNode.props.dataStoreFields),
      created_at: dataStoreNode.props.createdAt,
      updated_at: dataStoreNode.props.updatedAt,
    };
  }

  /**
   * Parse fields that may be in different formats:
   * - superjson string (from local DB): '{"json":[...],"meta":{...}}'
   * - regular JSON string (from cloud): '[...]'
   * - already parsed array
   */
  private static parseFields(fields: any): any[] {
    if (!fields) return [];

    // Already an array
    if (Array.isArray(fields)) return fields;

    // String - try to parse
    if (typeof fields === "string") {
      try {
        // First try superjson.parse (for local DB format)
        const superjsonResult = parse(fields);
        if (Array.isArray(superjsonResult)) {
          return superjsonResult;
        }
      } catch {
        // superjson.parse failed, try regular JSON
      }

      try {
        // Try regular JSON.parse (for cloud format)
        const jsonResult = JSON.parse(fields);
        if (Array.isArray(jsonResult)) {
          return jsonResult;
        }
        // Check if it's superjson wrapper format
        if (jsonResult && typeof jsonResult === "object" && "json" in jsonResult) {
          return jsonResult.json || [];
        }
      } catch {
        // Both failed
      }
    }

    // Object with json wrapper (already parsed superjson format)
    if (fields && typeof fields === "object" && "json" in fields) {
      return fields.json || [];
    }

    return [];
  }

  public static toDomain(data: any): DataStoreNode {
    // Get raw fields from either snake_case or camelCase property
    const rawFieldsSource = data.data_store_fields ?? data.dataStoreFields;
    const parsedFields = this.parseFields(rawFieldsSource);

    // Only keep defined DataStoreField properties
    const dataStoreFields = parsedFields.map((field: any) => ({
      id: field.id,
      schemaFieldId: field.schemaFieldId,
      logic: field.logic,
    }));

    const dataStoreNodeOrError = DataStoreNode.create(
      {
        flowId: data.flow_id || data.flowId,
        name: data.name.trim() || "Untitled Data Store Node",
        color: data.color || "#3b82f6",
        dataStoreFields,
      },
      new UniqueEntityID(data.id),
    );

    if (dataStoreNodeOrError.isFailure) {
      logger.error(dataStoreNodeOrError.getError());
      throw new Error(dataStoreNodeOrError.getError());
    }

    const dataStoreNode = dataStoreNodeOrError.getValue();
    
    // Set timestamps if they exist
    if (data.created_at || data.createdAt) {
      dataStoreNode.props.createdAt = new Date(data.created_at || data.createdAt);
    }
    if (data.updated_at || data.updatedAt) {
      dataStoreNode.props.updatedAt = new Date(data.updated_at || data.updatedAt);
    }

    return dataStoreNode;
  }
}