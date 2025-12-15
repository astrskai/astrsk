import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { IfNodeCloudData } from '@/shared/lib/cloud-upload-helpers';

import { LoadIfNodeRepo } from '@/entities/if-node/repos/load-if-node-repo';
import { IfNodeSupabaseMapper } from '@/entities/if-node/mappers/if-node-supabase-mapper';

interface Command {
  flowId: UniqueEntityID;
}

/**
 * Prepare all if nodes for a flow for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareIfNodesCloudData
  implements UseCase<Command, Result<IfNodeCloudData[]>>
{
  constructor(private loadIfNodeRepo: LoadIfNodeRepo) {}

  async execute({ flowId }: Command): Promise<Result<IfNodeCloudData[]>> {
    try {
      // 1. Get all if nodes for this flow
      const nodesResult = await this.loadIfNodeRepo.getIfNodesByFlowId(flowId);
      if (nodesResult.isFailure) {
        return Result.fail<IfNodeCloudData[]>(nodesResult.getError());
      }

      const nodes = nodesResult.getValue();
      const nodeCloudDataList: IfNodeCloudData[] = [];

      // 2. Convert each node to cloud format using mapper
      for (const node of nodes) {
        const nodeData = IfNodeSupabaseMapper.toCloud(node);
        nodeCloudDataList.push(nodeData);
      }

      return Result.ok(nodeCloudDataList);
    } catch (error) {
      return Result.fail<IfNodeCloudData[]>(
        `Unexpected error preparing if nodes data: ${error}`
      );
    }
  }
}
