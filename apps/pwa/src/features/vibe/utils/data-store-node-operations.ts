import { Operation } from "../lib/operation-processor";
import { DataStoreNode } from "@/modules/data-store-node/domain/data-store-node";
import { UniqueEntityID } from "@/shared/domain";

/**
 * Pre-load existing data store node data into the resource to ensure deep merge operations
 * can append to existing fields instead of starting from empty arrays
 */
export async function preloadExistingDataStoreNodeData(
  resource: any,
  dataStoreNodeOperations: Operation[],
  flowId: string,
): Promise<void> {
  // Extract unique node IDs from operations
  const nodeIds = new Set<string>();
  for (const op of dataStoreNodeOperations) {
    const match = op.path.match(/^dataStoreNodes\.([^.]+)\./);
    if (match) {
      nodeIds.add(match[1]);
    }
  }

  // Initialize dataStoreNodes object if it doesn't exist
  if (!resource.dataStoreNodes) {
    resource.dataStoreNodes = {};
  }

  // Load each node's data from the flow's data store nodes
  for (const nodeId of nodeIds) {
    try {
      const { DataStoreNodeService } = await import(
        "@/app/services/data-store-node-service"
      );

      // Try to get the specific node data
      const nodeResult = await DataStoreNodeService.getDataStoreNode.execute(
        new UniqueEntityID(nodeId),
      );
      if (nodeResult.isSuccess) {
        const node = nodeResult.getValue();
        if (node) {
          // Convert node to JSON and store fields with correct property name
          resource.dataStoreNodes[nodeId] = {
            dataStoreFields: node.dataStoreFields || [],
          };
        } else {
          // Node is null - start with empty array
          resource.dataStoreNodes[nodeId] = {
            dataStoreFields: [],
          };
        }
      }
    } catch (error) {
      // Node not found or error - start with empty array
      resource.dataStoreNodes[nodeId] = {
        dataStoreFields: [],
      };
    }
  }
}

/**
 * Process data store node operations
 */
export async function processDataStoreNodeOperations(
  resourceId: string,
  operations: Operation[],
  updatedResource: any,
): Promise<string[]> {
  const errors: string[] = [];

  for (const operation of operations) {
    try {
      const { DataStoreNodeService } = await import(
        "@/app/services/data-store-node-service"
      );

      if (operation.path.includes(".dataStoreFields")) {
        // Handle dataStoreNode fields operations
        const nodeIdMatch = operation.path.match(/^dataStoreNodes\.([^.]+)\./);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          // Get the current data store node
          const getResult = await DataStoreNodeService.getDataStoreNode.execute(
            new UniqueEntityID(nodeId),
          );

          if (getResult.isSuccess) {
            const node = getResult.getValue();

            console.log(`🔍 [DEBUG] Retrieved node:`, {
              nodeId,
              nodeProps: node
                ? Object.keys((node as any).props || {})
                : "NO PROPS",
              dataStoreFields:
                (node as any)?.props?.dataStoreFields || "NOT FOUND",
              fields: (node as any)?.props?.fields || "NOT FOUND",
            });

            // Get current fields from the node - try both property names
            const currentFields =
              (node as any).props.dataStoreFields ||
              (node as any).props.fields ||
              [];

            console.log(`🔍 [DEBUG] Current fields retrieved:`, {
              currentFields,
              fieldCount: currentFields.length,
              operationValue: operation.value,
              operationType: operation.operation,
              fullPath: operation.path,
            });

            // Add the new field from the operation value
            let updatedFields = [...currentFields];

            if (
              operation.operation === "put" &&
              operation.path.endsWith(".dataStoreFields")
            ) {
              // This is adding a new field - append it to existing fields
              updatedFields.push(operation.value);
              console.log(
                `🔄 [DATA-STORE-NODE-OPERATIONS] Adding new field to node ${nodeId}:`,
                {
                  newField: operation.value,
                  previousFieldCount: currentFields.length,
                  newFieldCount: updatedFields.length,
                  allUpdatedFields: updatedFields,
                },
              );
            } else {
              console.log(`🔍 [DEBUG] Operation condition not met:`, {
                operation: operation.operation,
                expectedOperation: "put",
                pathEndsWith: operation.path.endsWith(".dataStoreFields"),
                actualPath: operation.path,
              });
            }

            if (updatedFields) {
              // Update the node's fields with the processed data
              (node as any).props.dataStoreFields = updatedFields;

              console.log(
                `🔍 [DEBUG] About to call updateDataStoreNodeFields with:`,
                {
                  flowId: resourceId,
                  nodeId: nodeId,
                  fieldsToSave: updatedFields,
                  fieldsCount: updatedFields.length,
                },
              );

              // Save the updated node (this uses the existing updateFields use case internally)
              const updateResult =
                await DataStoreNodeService.updateDataStoreNodeFields.execute({
                  flowId: resourceId,
                  nodeId: nodeId,
                  fields: updatedFields,
                });

              console.log(`🔍 [DEBUG] UpdateDataStoreNodeFields result:`, {
                success: updateResult.isSuccess,
                error: updateResult.isSuccess ? null : updateResult.getError(),
              });

              if (!updateResult.isSuccess) {
                console.error(
                  `❌ [DEBUG] Field update failed:`,
                  updateResult.getError(),
                );
                errors.push(
                  `Failed to update data store node fields: ${updateResult.getError()}`,
                );
              } else {
                console.log(
                  `✅ [DATA-STORE-NODE-OPERATIONS] Data store node fields updated successfully:`,
                  {
                    nodeId,
                    fieldsCount: updatedFields.length,
                  },
                );

                // Invalidate queries to refresh UI
                try {
                  const { queryClient } = await import(
                    "@/app/queries/query-client"
                  );
                  const { dataStoreNodeKeys } = await import(
                    "@/app/queries/data-store-node/query-factory"
                  );

                  // Invalidate data store node queries
                  queryClient.invalidateQueries({
                    queryKey: dataStoreNodeKeys.detail(nodeId),
                  });

                  console.log(
                    `✅ [DATA-STORE-NODE-OPERATIONS] Invalidated data store node queries: ${nodeId}`,
                  );
                } catch (invalidationError) {
                  console.warn(
                    `⚠️ [DATA-STORE-NODE-OPERATIONS] Could not invalidate data store node queries:`,
                    invalidationError,
                  );
                }
              }
            }
          } else {
            errors.push(
              `Failed to get data store node for update: ${getResult.getError()}`,
            );
          }
        }
      } else if (operation.path.includes(".name")) {
        // Handle data store node name updates
        const nodeIdMatch = operation.path.match(
          /^dataStoreNodes\.([^.]+)\.name$/,
        );
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];

          const result =
            await DataStoreNodeService.updateDataStoreNodeName.execute({
              flowId: resourceId,
              nodeId: nodeId,
              name: operation.value,
            });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update data store node name: ${result.getError()}`,
            );
            console.error(
              `❌ [DATA-STORE-NODE-OPERATIONS] DataStoreNode name update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [DATA-STORE-NODE-OPERATIONS] DataStoreNode name updated successfully:`,
              {
                nodeId,
                newName: operation.value,
              },
            );
          }
        }
      } else if (operation.path.includes(".color")) {
        // Handle data store node color updates
        const nodeIdMatch = operation.path.match(
          /^dataStoreNodes\.([^.]+)\.color$/,
        );
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];

          const result =
            await DataStoreNodeService.updateDataStoreNodeColor.execute({
              flowId: resourceId,
              nodeId: nodeId,
              color: operation.value,
            });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update data store node color: ${result.getError()}`,
            );
            console.error(
              `❌ [DATA-STORE-NODE-OPERATIONS] DataStoreNode color update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [DATA-STORE-NODE-OPERATIONS] DataStoreNode color updated successfully:`,
              {
                nodeId,
                newColor: operation.value,
              },
            );
          }
        }
      } else {
        // Handle other dataStoreNode operations
        console.warn(
          `⚠️ [DATA-STORE-NODE-OPERATIONS] DataStoreNode operation not fully implemented:`,
          {
            path: operation.path,
            operation: operation.operation,
          },
        );
      }
    } catch (error) {
      errors.push(
        `Failed to apply data store node operation ${operation.path}: ${error}`,
      );
    }
  }

  return errors;
}
