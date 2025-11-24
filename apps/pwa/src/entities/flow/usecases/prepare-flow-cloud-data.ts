import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { FlowCloudData } from '@/shared/lib/cloud-upload-helpers';

import { Flow } from '@/entities/flow/domain';
import { LoadFlowRepo } from '@/entities/flow/repos/load-flow-repo';
import { FlowDrizzleMapper } from '@/entities/flow/mappers/flow-drizzle-mapper';
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

      // 2. Use mapper to convert domain → persistence format
      const persistenceData = FlowDrizzleMapper.toPersistence(flow);

      // Extract only the fields we need (type-safe)
      const {
        id,
        name,
        description,
        nodes,
        edges,
        response_template,
        data_store_schema,
        panel_structure,
        viewport,
        vibe_session_id,
        ready_state,
        validation_issues,
        tags,
        summary,
        version,
        conceptual_origin,
      } = persistenceData as any; // Cast only for extraction

      // 3. Calculate token_count as sum of all agents' token_count
      const agentsResult = await this.loadAgentRepo.getAgentsByFlowId(flowId);
      let tokenCount = 0;

      if (agentsResult.isSuccess) {
        const agents = agentsResult.getValue();
        tokenCount = agents.reduce(
          (sum, agent) => sum + (agent.props.tokenCount || 0),
          0
        );
      }

      // 4. Build Supabase data with explicit fields
      const flowData: FlowCloudData = {
        id,
        name,
        description,
        nodes,
        edges,
        response_template,
        data_store_schema,
        panel_structure,
        viewport,
        vibe_session_id,
        ready_state,
        validation_issues,
        token_count: tokenCount,
        tags,
        summary,
        version,
        conceptual_origin,
        session_id: sessionId?.toString() || null,
        is_public: false,
        owner_id: null,
        created_at: flow.props.createdAt.toISOString(),
        updated_at:
          flow.props.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return Result.ok(flowData);
    } catch (error) {
      return Result.fail<FlowCloudData>(
        `Unexpected error preparing flow data: ${error}`
      );
    }
  }
}
