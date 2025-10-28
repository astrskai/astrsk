import { Operation } from "../lib/operation-processor";

/**
 * Process if-node operations
 */
export async function processIfNodeOperations(
  resourceId: string,
  operations: Operation[],
  updatedResource: any,
): Promise<string[]> {
  const errors: string[] = [];

  console.log(
    `🔄 [IF-NODE-OPERATIONS] Starting IF node operations processing:`,
    {
      resourceId,
      operationCount: operations.length,
      operationPaths: operations.map((op) => op.path),
    },
  );

  for (const operation of operations) {
    try {
      console.log(`🔄 [IF-NODE-OPERATIONS] Processing ifNode operation:`, {
        path: operation.path,
        operation: operation.operation,
      });

      const { FlowService } = await import("@/app/services/flow-service");

      if (operation.path.includes("conditions")) {
        // Handle ifNode conditions operations
        const nodeIdMatch = operation.path.match(/^ifNodes\.([^.]+)\./);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];

          // Handle SET operations on indexed conditions (e.g., conditions[0])
          if (
            operation.operation === "set" &&
            operation.path.match(/\.conditions\[\d+\]$/)
          ) {
            // Import IfNodeService
            const { IfNodeService } = await import(
              "@/app/services/if-node-service"
            );

            // Extract the index from the path
            const indexMatch = operation.path.match(/\.conditions\[(\d+)\]$/);
            if (!indexMatch) {
              errors.push(`Invalid condition index in path: ${operation.path}`);
              console.error(
                `❌ [IF-NODE-OPERATIONS] Invalid condition index in path: ${operation.path}`,
              );
              continue;
            }

            const conditionIndex = parseInt(indexMatch[1]);
            const existingNode = updatedResource.ifNodes?.[nodeId];

            console.log(`🔍 [IF-NODE-OPERATIONS] Node lookup debug for SET:`, {
              nodeId,
              conditionIndex,
              hasIfNodes: !!updatedResource.ifNodes,
              ifNodeKeys: updatedResource.ifNodes
                ? Object.keys(updatedResource.ifNodes)
                : [],
              existingNode: existingNode
                ? {
                    id: existingNode.id,
                    name: existingNode.name,
                    conditionsCount: existingNode.conditions?.length || 0,
                  }
                : null,
            });

            if (!existingNode) {
              errors.push(
                `IF node ${nodeId} not found in updatedResource.ifNodes`,
              );
              console.error(
                `❌ [IF-NODE-OPERATIONS] IF node ${nodeId} not found in updatedResource.ifNodes`,
              );
              continue;
            }

            let conditions = [...(existingNode?.conditions || [])];

            // Ensure the array is large enough for the index
            while (conditions.length <= conditionIndex) {
              conditions.push({
                id: "",
                dataType: null,
                value1: "",
                operator: null,
                value2: "",
              });
            }

            // Set the condition at the specific index
            if (operation.value) {
              conditions[conditionIndex] = {
                id: operation.value.id || conditions[conditionIndex].id || "",
                dataType: operation.value.dataType,
                value1: operation.value.value1 || "",
                operator: operation.value.operator,
                value2: operation.value.value2 || "",
              };
            }

            console.log(
              `🔄 [IF-NODE-OPERATIONS] Processing IF node condition SET at index ${conditionIndex}:`,
              {
                nodeId,
                conditionIndex,
                conditionsCount: conditions.length,
                conditions,
                path: operation.path,
                operation: operation.operation,
                newCondition: operation.value,
              },
            );

            // Update the IF node conditions
            const updateResult =
              await IfNodeService.updateIfNodeConditions.execute({
                flowId: resourceId,
                nodeId: nodeId,
                conditions: conditions,
              });

            if (!updateResult.isSuccess) {
              errors.push(
                `Failed to update IF node condition at index ${conditionIndex}: ${updateResult.getError()}`,
              );
              console.error(
                `❌ [IF-NODE-OPERATIONS] IF node condition SET update failed:`,
                updateResult.getError(),
              );
            } else {
              console.log(
                `✅ [IF-NODE-OPERATIONS] IF node condition SET updated successfully:`,
                {
                  nodeId,
                  conditionIndex,
                  conditionsCount: conditions.length,
                },
              );

              // Update the local resource to reflect the change
              if (!updatedResource.ifNodes) updatedResource.ifNodes = {};
              if (!updatedResource.ifNodes[nodeId]) {
                updatedResource.ifNodes[nodeId] = { ...existingNode };
              }
              updatedResource.ifNodes[nodeId].conditions = conditions;

              // Invalidate queries to refresh UI
              try {
                const { queryClient } = await import(
                  "@/app/queries/query-client"
                );
                const { ifNodeKeys } = await import(
                  "@/app/queries/if-node/query-factory"
                );

                const queryKey = ifNodeKeys.detail(nodeId);
                console.log(
                  `🔍 [IF-NODE-OPERATIONS] About to invalidate query key:`,
                  queryKey,
                );

                // Invalidate IF node queries
                await queryClient.invalidateQueries({
                  queryKey: queryKey,
                });

                console.log(
                  `✅ [IF-NODE-OPERATIONS] Invalidated IF node queries: ${nodeId}`,
                  { queryKey },
                );
              } catch (invalidationError) {
                console.warn(
                  `⚠️ [IF-NODE-OPERATIONS] Could not invalidate IF node queries:`,
                  invalidationError,
                );
              }
            }
          }
          // For PUT operations on conditions, use the operation value directly as the new condition
          else if (
            operation.operation === "put" &&
            operation.path.endsWith(".conditions")
          ) {
            // Import IfNodeService
            const { IfNodeService } = await import(
              "@/app/services/if-node-service"
            );

            // Get current conditions from the existing node in updatedResource
            const existingNode = updatedResource.ifNodes?.[nodeId];

            console.log(`🔍 [IF-NODE-OPERATIONS] Node lookup debug:`, {
              nodeId,
              hasIfNodes: !!updatedResource.ifNodes,
              ifNodeKeys: updatedResource.ifNodes
                ? Object.keys(updatedResource.ifNodes)
                : [],
              existingNode: existingNode
                ? {
                    id: existingNode.id,
                    name: existingNode.name,
                    conditionsCount: existingNode.conditions?.length || 0,
                  }
                : null,
            });

            if (!existingNode) {
              errors.push(
                `IF node ${nodeId} not found in updatedResource.ifNodes`,
              );
              console.error(
                `❌ [IF-NODE-OPERATIONS] IF node ${nodeId} not found in updatedResource.ifNodes`,
              );
              continue;
            }

            let conditions = [...(existingNode?.conditions || [])];

            // Add the new condition from the operation
            if (operation.value) {
              conditions.push(operation.value);
            }

            // Defensive programming: ensure conditions is always an array
            if (!Array.isArray(conditions)) {
              console.warn(
                `⚠️ [IF-NODE-OPERATIONS] Conditions is not an array, converting:`,
                {
                  nodeId,
                  conditionsType: typeof conditions,
                  conditions,
                },
              );
              conditions = [];
            }

            console.log(
              `🔄 [IF-NODE-OPERATIONS] Processing IF node conditions update:`,
              {
                nodeId,
                conditionsCount: conditions.length,
                conditions,
                path: operation.path,
                operation: operation.operation,
                newCondition: operation.value,
              },
            );

            // Update the IF node conditions
            const updateResult =
              await IfNodeService.updateIfNodeConditions.execute({
                flowId: resourceId,
                nodeId: nodeId,
                conditions: conditions,
              });

            if (!updateResult.isSuccess) {
              errors.push(
                `Failed to update IF node conditions: ${updateResult.getError()}`,
              );
              console.error(
                `❌ [IF-NODE-OPERATIONS] IF node conditions update failed:`,
                updateResult.getError(),
              );
            } else {
              console.log(
                `✅ [IF-NODE-OPERATIONS] IF node conditions updated successfully:`,
                {
                  nodeId,
                  conditionsCount: conditions.length,
                },
              );

              // Update the local resource to reflect the change
              if (!updatedResource.ifNodes) updatedResource.ifNodes = {};
              if (!updatedResource.ifNodes[nodeId]) {
                updatedResource.ifNodes[nodeId] = { ...existingNode };
              }
              updatedResource.ifNodes[nodeId].conditions = conditions;

              // Invalidate queries to refresh UI
              try {
                const { queryClient } = await import(
                  "@/app/queries/query-client"
                );
                const { ifNodeKeys } = await import(
                  "@/app/queries/if-node/query-factory"
                );

                const queryKey = ifNodeKeys.detail(nodeId);
                console.log(
                  `🔍 [IF-NODE-OPERATIONS] About to invalidate query key:`,
                  queryKey,
                );

                // Invalidate IF node queries
                await queryClient.invalidateQueries({
                  queryKey: queryKey,
                });

                console.log(
                  `✅ [IF-NODE-OPERATIONS] Invalidated IF node queries: ${nodeId}`,
                  { queryKey },
                );
              } catch (invalidationError) {
                console.warn(
                  `⚠️ [IF-NODE-OPERATIONS] Could not invalidate IF node queries:`,
                  invalidationError,
                );
              }
            }
          } else {
            errors.push(
              `Unsupported IF node conditions operation: ${operation.operation} on ${operation.path}`,
            );
            console.error(
              `❌ [IF-NODE-OPERATIONS] Unsupported operation: ${operation.operation} on ${operation.path}`,
            );
          }
        }
      } else if (operation.path.includes(".name")) {
        // Handle IF node name updates
        const nodeIdMatch = operation.path.match(/^ifNodes\.([^.]+)\.name$/);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          const { IfNodeService } = await import(
            "@/app/services/if-node-service"
          );

          const result = await IfNodeService.updateIfNodeName.execute({
            flowId: resourceId,
            nodeId: nodeId,
            name: operation.value,
          });

          if (!result.isSuccess) {
            errors.push(`Failed to update IF node name: ${result.getError()}`);
            console.error(
              `❌ [IF-NODE-OPERATIONS] IF node name update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [IF-NODE-OPERATIONS] IF node name updated successfully:`,
              {
                nodeId,
                newName: operation.value,
              },
            );
          }
        }
      } else if (operation.path.includes(".color")) {
        // Handle IF node color updates
        const nodeIdMatch = operation.path.match(/^ifNodes\.([^.]+)\.color$/);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          const { IfNodeService } = await import(
            "@/app/services/if-node-service"
          );

          const result = await IfNodeService.updateIfNodeColor.execute({
            flowId: resourceId,
            nodeId: nodeId,
            color: operation.value,
          });

          if (!result.isSuccess) {
            errors.push(`Failed to update IF node color: ${result.getError()}`);
            console.error(
              `❌ [IF-NODE-OPERATIONS] IF node color update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [IF-NODE-OPERATIONS] IF node color updated successfully:`,
              {
                nodeId,
                newColor: operation.value,
              },
            );
          }
        }
      } else if (operation.path.includes(".logicOperator")) {
        // Handle IF node logic operator updates
        const nodeIdMatch = operation.path.match(
          /^ifNodes\.([^.]+)\.logicOperator$/,
        );
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          const { IfNodeService } = await import(
            "@/app/services/if-node-service"
          );

          const result = await IfNodeService.updateIfNodeLogicOperator.execute({
            flowId: resourceId,
            nodeId: nodeId,
            logicOperator: operation.value,
          });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update IF node logic operator: ${result.getError()}`,
            );
            console.error(
              `❌ [IF-NODE-OPERATIONS] IF node logic operator update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [IF-NODE-OPERATIONS] IF node logic operator updated successfully:`,
              {
                nodeId,
                newLogicOperator: operation.value,
              },
            );
          }
        }
      } else {
        // Handle other ifNode operations
        console.error(
          `❌ [IF-NODE-OPERATIONS] IfNode operation NOT IMPLEMENTED:`,
          {
            path: operation.path,
            operation: operation.operation,
            status: "OPERATION_SKIPPED",
            reason: "Operation type not handled in if-node-operations.ts",
          },
        );
      }
    } catch (error) {
      errors.push(
        `Failed to apply if-node operation ${operation.path}: ${error}`,
      );
    }
  }

  console.log(
    `🏁 [IF-NODE-OPERATIONS] IF node operations processing complete:`,
    {
      resourceId,
      totalOperations: operations.length,
      errorCount: errors.length,
      successCount: operations.length - errors.length,
      successRate: `${Math.round(((operations.length - errors.length) / operations.length) * 100)}%`,
    },
  );

  return errors;
}
