import { UniqueEntityID } from "@/shared/domain";

// Import operation-based processing
import { applyOperations, Operation } from "@/utils/operation-processor";
import { CardService } from "@/app/services/card-service";

// Import separated operation modules
import {
  mapCharacterEditsToUpdates,
  mapPlotEditsToUpdates,
  applyCharacterCardUpdates,
  applyPlotCardUpdates,
  processCardOperations,
} from "./card-operations";

import {
  mapFlowEditsToUpdates,
  applyFlowUpdates,
  processFlowOperations,
} from "./flow-operations";

import {
  preloadExistingAgentData,
  processAgentOperations,
} from "./agent-operations";

import {
  preloadExistingDataStoreNodeData,
  processDataStoreNodeOperations,
} from "./data-store-node-operations";

import { processIfNodeOperations } from "./if-node-operations";

// Re-export the mapping functions for backward compatibility
export {
  mapCharacterEditsToUpdates,
  mapPlotEditsToUpdates,
  mapFlowEditsToUpdates,
  applyCharacterCardUpdates,
  applyPlotCardUpdates,
  applyFlowUpdates,
};

/**
 * Apply operations directly to a resource using operation-based processing
 */
export async function applyOperationsToResource(
  resourceId: string,
  operations: Operation[],
  resourceType: "character_card" | "plot_card" | "flow",
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Get the current resource data
    let currentResource: any;

    if (resourceType === "flow") {
      const { FlowService } = await import("@/app/services/flow-service");
      const flowResult = await FlowService.getFlow.execute(
        new UniqueEntityID(resourceId),
      );
      if (!flowResult.isSuccess) {
        const error = `Failed to get flow: ${flowResult.getError()}`;
        errors.push(error);
        return { success: false, errors };
      }

      const currentFlow = flowResult.getValue();
      currentResource = currentFlow.toJSON();

      // Pre-load existing agent data for agent operations
      const agentOperations = operations.filter((op) =>
        op.path.startsWith("agents."),
      );
      if (agentOperations.length > 0) {
        await preloadExistingAgentData(currentResource, agentOperations);
      }

      // Pre-load existing data store node data for node operations
      const dataStoreNodeOperations = operations.filter((op) =>
        op.path.startsWith("dataStoreNodes."),
      );
      if (dataStoreNodeOperations.length > 0) {
        await preloadExistingDataStoreNodeData(
          currentResource,
          dataStoreNodeOperations,
          resourceId,
        );
      }
    } else {
      // Card handling (existing logic)
      const cardResult = await CardService.getCard.execute(
        new UniqueEntityID(resourceId),
      );
      if (!cardResult.isSuccess) {
        const error = `Failed to get card: ${cardResult.getError()}`;
        errors.push(error);
        return { success: false, errors };
      }

      const currentCard = cardResult.getValue();

      // Convert card to editable format (plain JSON)
      const { CardDrizzleMapper } = await import(
        "@/modules/card/mappers/card-drizzle-mapper"
      );
      currentResource = CardDrizzleMapper.toPersistence(currentCard);
    }

    const {
      result: updatedResource,
      errors: operationErrors,
      successCount,
    } = await applyOperations(
      currentResource,
      operations,
      resourceType === "flow" ? resourceId : undefined, // Pass resourceId as flowId for flow operations
    );

    // Process operations SEQUENTIALLY - one at a time to avoid timing issues
    // Skip operations that were successfully handled by the factory system
    if (resourceType === "flow") {
      const operationsNeedingSequentialProcessing = operations.filter((op) => {
        // Skip dataStoreNodes operations if factory processing was successful
        if (
          op.path.startsWith("dataStoreNodes.") &&
          operationErrors.length === 0
        ) {
          return false;
        }
        // Skip ifNodes operations if factory processing was successful
        if (op.path.startsWith("ifNodes.") && operationErrors.length === 0) {
          return false;
        }
        return true;
      });

      for (let i = 0; i < operationsNeedingSequentialProcessing.length; i++) {
        const operation = operationsNeedingSequentialProcessing[i];

        try {
          // Route each operation to appropriate processor and wait for completion
          if (operation.path.startsWith("flow.")) {
            const operationErrors = await processFlowOperations(
              resourceId,
              [operation], // Process single operation
              updatedResource,
            );
            errors.push(...operationErrors);
          } else if (operation.path.startsWith("agents.")) {
            const operationErrors = await processAgentOperations(
              resourceId,
              [operation], // Process single operation
              updatedResource,
            );
            errors.push(...operationErrors);
          } else if (operation.path.startsWith("dataStoreNodes.")) {
            const operationErrors = await processDataStoreNodeOperations(
              resourceId,
              [operation], // Process single operation
              updatedResource,
            );
            errors.push(...operationErrors);
          } else if (operation.path.startsWith("ifNodes.")) {
            const operationErrors = await processIfNodeOperations(
              resourceId,
              [operation], // Process single operation
              updatedResource,
            );
            errors.push(...operationErrors);
          }

          // If there was an error with this operation, we could choose to:
          // - Continue with remaining operations (current behavior)
          // - Stop processing (add: if (errors.length > previousErrorCount) break;)
        } catch (error) {
          const errorMessage = `Failed to process operation ${operation.path}: ${error}`;
          errors.push(errorMessage);
          // Continue with next operation despite error
        }
      }
    } else {
      // Card operations (character and plot cards)
      const cardErrors = await processCardOperations(
        resourceId,
        operations,
        updatedResource,
      );
      errors.push(...cardErrors);
    }

    // *** COMMENTED OUT: Direct service calls - focusing on fixing factory system ***
    /*
    if (errors.length === 0 && resourceId && operations.some(op => op.path.includes('dataStoreFields'))) {
      // Direct service call logic commented out
    }
    */

    // *** Standard query invalidation for all operations ***
    if (errors.length === 0 && resourceId && resourceType === "flow") {
      try {
        const { invalidateSingleFlowQueries } = await import(
          "@/flow-multi/utils/invalidate-flow-queries"
        );
        await invalidateSingleFlowQueries(resourceId);
      } catch (invalidationError) {
        console.warn(
          `⚠️ [EDIT-MAPPERS] Query invalidation failed for resource ${resourceId}:`,
          invalidationError,
        );
        // Don't fail the entire operation due to invalidation error
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    console.error(
      `💥 [EDIT-MAPPERS] Unexpected error applying operations to resource ${resourceId}:`,
      error,
    );
    return { success: false, errors: [`Failed to apply operations: ${error}`] };
  }
}
