import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNodeCloudData } from "@/shared/lib/cloud-upload-helpers";

import { LoadDataStoreNodeRepo } from "@/entities/data-store-node/repos/load-data-store-node-repo";
import { DataStoreNodeDrizzleMapper } from "@/entities/data-store-node/mappers/data-store-node-drizzle-mapper";

interface Command {
  flowId: UniqueEntityID;
}

/**
 * Prepare all data store nodes for a flow for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareDataStoreNodesCloudData
  implements UseCase<Command, Result<DataStoreNodeCloudData[]>>
{
  constructor(private loadDataStoreNodeRepo: LoadDataStoreNodeRepo) {}

  async execute({
    flowId,
  }: Command): Promise<Result<DataStoreNodeCloudData[]>> {
    try {
      // 1. Get all data store nodes for this flow
      const nodesResult =
        await this.loadDataStoreNodeRepo.getDataStoreNodesByFlowId(flowId);
      if (nodesResult.isFailure) {
        return Result.fail<DataStoreNodeCloudData[]>(nodesResult.getError());
      }

      const nodes = nodesResult.getValue();
      const nodeCloudDataList: DataStoreNodeCloudData[] = [];

      // 2. Convert each node to cloud format
      for (const node of nodes) {
        // Use mapper to convert domain → persistence format
        const persistenceData = DataStoreNodeDrizzleMapper.toPersistence(node);

        // Extract only the fields we need (type-safe)
        const { id, flow_id, name, color, data_store_fields } =
          persistenceData as any; // Cast only for extraction

        // Build Supabase data with explicit fields
        const nodeData: DataStoreNodeCloudData = {
          id,
          flow_id,
          name,
          color: color || "#3b82f6",
          data_store_fields,
          created_at: node.props.createdAt.toISOString(),
          updated_at:
            node.props.updatedAt?.toISOString() || new Date().toISOString(),
        };

        nodeCloudDataList.push(nodeData);
      }

      return Result.ok(nodeCloudDataList);
    } catch (error) {
      return Result.fail<DataStoreNodeCloudData[]>(
        `Unexpected error preparing data store nodes data: ${error}`,
      );
    }
  }
}
