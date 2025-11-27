import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import {
  ShareLinkResult,
  uploadFlowToCloud,
  createSharedResource,
} from "@/shared/lib/cloud-upload-helpers";
import { DEFAULT_SHARE_EXPIRATION_DAYS } from "@/shared/lib/supabase-client";

import { PrepareFlowCloudData } from "./prepare-flow-cloud-data";
import { PrepareAgentsCloudData } from "@/entities/agent/usecases/prepare-agents-cloud-data";
import { PrepareDataStoreNodesCloudData } from "@/entities/data-store-node/usecases/prepare-data-store-nodes-cloud-data";
import { PrepareIfNodesCloudData } from "@/entities/if-node/usecases/prepare-if-nodes-cloud-data";

interface Command {
  flowId: UniqueEntityID;
  expirationDays?: number;
}

import { CloneFlow } from "./clone-flow";
import { DeleteFlowWithNodes } from "./delete-flow-with-nodes";

/**
 * Export a flow (with all child nodes) to cloud storage and create a shareable link
 * Strategy:
 * 1. Clone the flow locally (generates new UUIDs for everything)
 * 2. Export the cloned flow to cloud
 * 3. Delete the cloned flow
 */
export class ExportFlowToCloud
  implements UseCase<Command, Result<ShareLinkResult>> {
  constructor(
    private cloneFlow: CloneFlow,
    private deleteFlowWithNodes: DeleteFlowWithNodes,
    private prepareFlowData: PrepareFlowCloudData,
    private prepareAgentsData: PrepareAgentsCloudData,
    private prepareDataStoreNodesData: PrepareDataStoreNodesCloudData,
    private prepareIfNodesData: PrepareIfNodesCloudData,
  ) { }

  async execute({
    flowId,
    expirationDays = DEFAULT_SHARE_EXPIRATION_DAYS,
  }: Command): Promise<Result<ShareLinkResult>> {
    let clonedFlowId: UniqueEntityID | null = null;

    try {
      // 1. Clone the flow to generate new IDs
      // We don't need to rename it since it's temporary
      const cloneResult = await this.cloneFlow.execute({
        flowId,
        shouldRename: false,
      });

      if (cloneResult.isFailure) {
        return Result.fail<ShareLinkResult>(cloneResult.getError());
      }

      const clonedFlow = cloneResult.getValue();
      clonedFlowId = clonedFlow.id;

      // Small delay to ensure database writes are committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. Prepare flow data using the CLONED flow ID
      const flowDataResult = await this.prepareFlowData.execute({
        flowId: clonedFlowId,
        sessionId: null, // Standalone flow
      });
      if (flowDataResult.isFailure) {
        return Result.fail<ShareLinkResult>(flowDataResult.getError());
      }
      const flowData = flowDataResult.getValue();

      // 3. Prepare agents data
      const agentsDataResult = await this.prepareAgentsData.execute({
        flowId: clonedFlowId,
      });
      if (agentsDataResult.isFailure) {
        return Result.fail<ShareLinkResult>(agentsDataResult.getError());
      }
      const agents = agentsDataResult.getValue();

      // 4. Prepare data store nodes data
      const dataStoreNodesDataResult =
        await this.prepareDataStoreNodesData.execute({ flowId: clonedFlowId });
      if (dataStoreNodesDataResult.isFailure) {
        return Result.fail<ShareLinkResult>(
          dataStoreNodesDataResult.getError(),
        );
      }
      const dataStoreNodes = dataStoreNodesDataResult.getValue();

      // 5. Prepare if nodes data
      const ifNodesDataResult = await this.prepareIfNodesData.execute({
        flowId: clonedFlowId,
      });
      if (ifNodesDataResult.isFailure) {
        return Result.fail<ShareLinkResult>(ifNodesDataResult.getError());
      }
      const ifNodes = ifNodesDataResult.getValue();

      // 6. Upload all data to cloud
      const uploadResult = await uploadFlowToCloud(
        flowData,
        agents,
        dataStoreNodes,
        ifNodes,
      );
      if (uploadResult.isFailure) {
        return Result.fail<ShareLinkResult>(uploadResult.getError());
      }

      // 7. Create shared resource entry using the NEW flow ID
      const shareResult = await createSharedResource(
        "flow",
        clonedFlowId.toString(),
        expirationDays,
      );
      if (shareResult.isFailure) {
        return Result.fail<ShareLinkResult>(shareResult.getError());
      }

      return shareResult;
    } catch (error) {
      return Result.fail<ShareLinkResult>(
        `Unexpected error exporting flow to cloud: ${error}`,
      );
    } finally {
      // 8. Cleanup: Delete the temporary cloned flow
      if (clonedFlowId) {
        try {
          await this.deleteFlowWithNodes.execute(clonedFlowId);
        } catch (cleanupError) {
          console.error(
            `Failed to cleanup temporary flow ${clonedFlowId}:`,
            cleanupError,
          );
          // Don't fail the operation if cleanup fails, but log it
        }
      }
    }
  }
}
