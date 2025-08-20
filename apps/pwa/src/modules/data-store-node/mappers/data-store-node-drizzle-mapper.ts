import { parse, stringify } from "superjson";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";
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
        dataStoreFields: data.data_store_fields 
          ? (parse(data.data_store_fields) || [])
          : data.dataStoreFields
            ? (parse(data.dataStoreFields) || [])
            : [],
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