import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { FlowCloudData } from '@/shared/lib/cloud-upload-helpers';

import { LoadFlowRepo } from '@/entities/flow/repos/load-flow-repo';
import { FlowSupabaseMapper } from '@/entities/flow/mappers/flow-supabase-mapper';
import { LoadAgentRepo } from '@/entities/agent/repos/load-agent-repo';

interface Command {
  flowId: UniqueEntityID;
  sessionId?: UniqueEntityID | null; // If part of session, set session_id
}

/**
 * Prepare flow data for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareFlowCloudData
  implements UseCase<Command, Result<FlowCloudData>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
  ) { }

  async execute({
    flowId,
    sessionId = null,
  }: Command): Promise<Result<FlowCloudData>> {
    try {
      // 1. Get flow
      const flowResult = await this.loadFlowRepo.getFlowById(flowId);
      if (flowResult.isFailure) {
        return Result.fail<FlowCloudData>(flowResult.getError());
      }

      const flow = flowResult.getValue();

      // 2. Calculate token_count as sum of all agents' token_count
      const agentsResult = await this.loadAgentRepo.getAgentsByFlowId(flowId);
      let tokenCount = 0;

      if (agentsResult.isSuccess) {
        const agents = agentsResult.getValue();
        tokenCount = agents.reduce(
          (sum, agent) => sum + (agent.props.tokenCount || 0),
          0
        );
      }

      // 3. Use mapper to convert domain → cloud format
      const flowData = FlowSupabaseMapper.toCloud(flow, tokenCount, sessionId);

      return Result.ok(flowData);
    } catch (error) {
      return Result.fail<FlowCloudData>(
        `Unexpected error preparing flow data: ${error}`
      );
    }
  }
}
