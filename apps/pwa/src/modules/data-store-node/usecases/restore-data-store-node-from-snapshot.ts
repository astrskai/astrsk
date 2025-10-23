import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { DataStoreNode } from "@/modules/data-store-node/domain";
import { SaveDataStoreNodeRepo } from "@/modules/data-store-node/repos/save-data-store-node-repo";
import { DataStoreNodeDrizzleMapper } from "@/modules/data-store-node/mappers/data-store-node-drizzle-mapper";
import { SelectDataStoreNode } from "@/db/schema/data-store-nodes";

export class RestoreDataStoreNodeFromSnapshot implements UseCase<SelectDataStoreNode, Result<DataStoreNode>> {
  constructor(private saveDataStoreNodeRepo: SaveDataStoreNodeRepo) {}

  async execute(dataStoreNodeDbFormat: SelectDataStoreNode): Promise<Result<DataStoreNode>> {
    try {
      // Use DataStoreNodeDrizzleMapper to convert database format to domain object
      // This handles all the complex object reconstruction properly
      const dataStoreNode = DataStoreNodeDrizzleMapper.toDomain(dataStoreNodeDbFormat);

      // Use the existing save functionality to restore the data store node
      const restoredDataStoreNodeResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(dataStoreNode);
      return restoredDataStoreNodeResult;
    } catch (error) {
      return formatFail("Failed to restore data store node from snapshot", error);
    }
  }
}