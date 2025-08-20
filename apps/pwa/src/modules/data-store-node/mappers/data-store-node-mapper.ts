import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode } from "../domain";
import { SelectDataStoreNode, InsertDataStoreNode } from "@/db/schema/data-store-nodes";

export class DataStoreNodeMapper {
  public static toDomain(raw: SelectDataStoreNode): DataStoreNode {
    const dataStoreNodeOrError = DataStoreNode.create(
      {
        flowId: raw.flow_id,
        name: raw.name,
        color: raw.color,
        dataStoreFields: raw.data_store_fields || [],
      },
      new UniqueEntityID(raw.id),
    );

    if (dataStoreNodeOrError.isFailure) {
      throw new Error(dataStoreNodeOrError.getError());
    }

    return dataStoreNodeOrError.getValue();
  }

  public static toPersistence(dataStoreNode: DataStoreNode): InsertDataStoreNode {
    return {
      id: dataStoreNode.id.toString(),
      flow_id: dataStoreNode.flowId,
      name: dataStoreNode.name,
      color: dataStoreNode.color,
      data_store_fields: dataStoreNode.dataStoreFields,
      created_at: dataStoreNode.createdAt,
      updated_at: dataStoreNode.updatedAt,
    };
  }
}