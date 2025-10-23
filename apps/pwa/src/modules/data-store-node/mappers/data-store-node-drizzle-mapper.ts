import { parse, stringify } from "superjson";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";
import { DataStoreNode } from "@/modules/data-store-node/domain/data-store-node";

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

  public static toDomain(data: any): DataStoreNode {

    const dataStoreNodeOrError = DataStoreNode.create(
      {
        flowId: data.flow_id || data.flowId,
        name: data.name.trim() || "Untitled Data Store Node",
        color: data.color || "#3b82f6",
        dataStoreFields: (() => {
          // Check if data_store_fields is already parsed by Drizzle (object) or needs parsing (string)
          let rawFields;
          
          if (data.data_store_fields) {
            if (typeof data.data_store_fields === 'string') {
              // It's a string, needs parsing
              rawFields = parse(data.data_store_fields) || [];
            } else {
              // It's already an object (parsed by Drizzle), check for json wrapper
              if (data.data_store_fields && typeof data.data_store_fields === 'object' && data.data_store_fields.json) {
                // Extract fields from SuperJSON wrapper: {json: [...]}
                rawFields = data.data_store_fields.json || [];
              } else {
                rawFields = data.data_store_fields || [];
              }
            }
          } else if (data.dataStoreFields) {
            if (typeof data.dataStoreFields === 'string') {
              // It's a string, needs parsing
              rawFields = parse(data.dataStoreFields) || [];
            } else {
              // It's already an object, check for json wrapper
              if (data.dataStoreFields && typeof data.dataStoreFields === 'object' && data.dataStoreFields.json) {
                // Extract fields from SuperJSON wrapper: {json: [...]}
                rawFields = data.dataStoreFields.json || [];
              } else {
                rawFields = data.dataStoreFields || [];
              }
            }
          } else {
            rawFields = [];
          }
          
          // Ensure we have an array
          const fields = Array.isArray(rawFields) ? rawFields : [];
          
          // Only keep defined DataStoreField properties
          return fields.map((field: any) => ({
            id: field.id,
            schemaFieldId: field.schemaFieldId,
            logic: field.logic
          }));
        })(),
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