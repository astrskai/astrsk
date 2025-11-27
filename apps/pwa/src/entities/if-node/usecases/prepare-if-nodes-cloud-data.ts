import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { IfNodeCloudData } from '@/shared/lib/cloud-upload-helpers';

import { LoadIfNodeRepo } from '@/entities/if-node/repos/load-if-node-repo';
import { IfNodeDrizzleMapper } from '@/entities/if-node/mappers/if-node-drizzle-mapper';

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

      // 2. Convert each node to cloud format
      for (const node of nodes) {
        // Use mapper to convert domain → persistence format
        const persistenceData = IfNodeDrizzleMapper.toPersistence(node);

        // Extract only the fields we need (type-safe)
        const {
          id,
          flow_id,
          name,
          color,
          logic_operator,
          conditions,
        } = persistenceData as any; // Cast only for extraction

        // Build Supabase data with explicit fields
        const nodeData: IfNodeCloudData = {
          id,
          flow_id,
          name,
          color: color || '#3b82f6',
          logicOperator: logic_operator || null,
          conditions,
          created_at: node.props.createdAt.toISOString(),
          updated_at:
            node.props.updatedAt?.toISOString() || new Date().toISOString(),
        };

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
