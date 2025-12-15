import { Result } from "@/shared/core";
import { Transaction } from "@/db/transaction";
import { DataStoreNode } from "../domain";

export interface SaveDataStoreNodeRepo {
  saveDataStoreNode(dataStoreNode: DataStoreNode, tx?: Transaction): Promise<Result<DataStoreNode>>;
}