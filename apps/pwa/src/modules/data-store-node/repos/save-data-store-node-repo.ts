import { Result } from "@/shared/core";
import { DataStoreNode } from "../domain";

export interface SaveDataStoreNodeRepo {
  saveDataStoreNode(dataStoreNode: DataStoreNode): Promise<Result<DataStoreNode>>;
}