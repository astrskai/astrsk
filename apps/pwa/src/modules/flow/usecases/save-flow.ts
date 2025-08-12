import { Result, UseCase } from "@/shared/core";

import { Flow } from "@/modules/flow/domain/flow";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";

export class SaveFlow implements UseCase<Flow, Result<Flow>> {
  constructor(private saveFlowRepo: SaveFlowRepo) {}

  async execute(flow: Flow): Promise<Result<Flow>> {
    try {
      console.log('[SaveFlow] Executing save for flow:', {
        flowId: flow.id.toString(),
        dataStoreSchema: flow.props.dataStoreSchema,
        schemaFieldsCount: flow.props.dataStoreSchema?.fields?.length || 0,
        schemaFields: flow.props.dataStoreSchema?.fields
      });
      
      const savedFlow = await this.saveFlowRepo.saveFlow(flow);
      
      console.log('[SaveFlow] Flow saved to repo, result:', {
        success: savedFlow.isSuccess,
        savedSchemaFieldsCount: savedFlow.isSuccess ? savedFlow.getValue().props.dataStoreSchema?.fields?.length || 0 : 0
      });
      
      return savedFlow;
    } catch (error) {
      console.error('[SaveFlow] Error during save:', error);
      return Result.fail(
        `Failed to save flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
