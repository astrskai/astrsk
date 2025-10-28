/**
 * Data Store Node processors
 */

import {
  pathPatterns,
  PathProcessor,
  OperationContext,
  PathMatchResult,
} from "../path-processor-factory";
import {
  handleOperationError,
  handleCriticalError,
} from "../operation-error-handler";

export const dataStoreNodeProcessors = {
  base: {
    pattern: pathPatterns.dataStoreNodes.base,
    description: "Set entire data store node",
    handler: async (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;

        if (!resource.dataStoreNodes) resource.dataStoreNodes = {};

        if (context.operation === "set") {
          // Check if flowId is available for service calls
          const flowId = context.flowId || resource.id || resource.flowId;

          if (flowId && context.value) {
            // Use service layer to create/update the data store node
            const { DataStoreNodeService } = await import(
              "@/app/services/data-store-node-service"
            );

            const result =
              await DataStoreNodeService.createDataStoreNode.execute({
                flowId: flowId,
                nodeId: nodeId,
                name: context.value.name || "Data Store Node",
                color: context.value.color || "#3b82f6",
                dataStoreFields: context.value.dataStoreFields || [],
              });

            if (result.isSuccess) {
              // Update local resource to reflect the change
              resource.dataStoreNodes[nodeId] = context.value;
            } else {
              throw new Error(
                `Failed to create/update data store node: ${result.getError()}`,
              );
            }
          } else {
            // Fallback to local update if no flowId available
            resource.dataStoreNodes[nodeId] = context.value;
          }
        } else if (context.operation === "remove") {
          // Check if flowId is available for service calls
          const flowId = context.flowId || resource.id || resource.flowId;

          if (flowId) {
            // Use service layer to delete the data store node
            const { DataStoreNodeService } = await import(
              "@/app/services/data-store-node-service"
            );

            const result =
              await DataStoreNodeService.deleteDataStoreNode.execute({
                nodeId: nodeId,
              });

            if (result.isSuccess) {
              // Update local resource to reflect the change
              delete resource.dataStoreNodes[nodeId];
            } else {
              throw new Error(
                `Failed to delete data store node: ${result.getError()}`,
              );
            }
          } else {
            // Fallback to local update if no flowId available
            delete resource.dataStoreNodes[nodeId];
          }
        }

        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(
          error as Error,
          {
            operation: "set_data_store_node",
            path: `dataStoreNodes.${match.groups.group1}`,
            processor: "data-store-nodes",
            inputData: context.value,
          },
          "Failed to update data store node",
        );
      }
    },
  } as PathProcessor,

  field: {
    pattern: pathPatterns.dataStoreNodes.field,
    description: "Set individual data store node field",
    handler: async (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;
        const fieldName = match.groups.group2;

        if (!resource.dataStoreNodes) resource.dataStoreNodes = {};
        if (!resource.dataStoreNodes[nodeId])
          resource.dataStoreNodes[nodeId] = {};

        // Check if flowId is available for service calls
        const flowId = context.flowId || resource.id || resource.flowId;

        // Special handling for dataStoreFields - treat as array append with existing field preservation
        if (fieldName === "dataStoreFields" && context.operation === "put") {
          // Get existing fields from current data store node (preserve what's already there)
          const currentFieldsArray =
            resource.dataStoreNodes[nodeId].dataStoreFields;
          const existingFields = Array.isArray(currentFieldsArray)
            ? [...currentFieldsArray]
            : [];

          // Check if there's an index in the value for insertion logic
          if (context.value && typeof context.value.index === "number") {
            // INSERT operation: add new field at index, shifting existing fields right
            const { index, ...fieldData } = context.value;
            existingFields.splice(index, 0, fieldData);
          } else {
            // APPEND operation: add new field at the end

            // Ensure the field has all required properties
            const newField = {
              id:
                context.value.id ||
                new (
                  await import("@/shared/domain")
                ).UniqueEntityID().toString(),
              schemaFieldId: context.value.schemaFieldId,
              logic: context.value.logic || "",
            };

            existingFields.push(newField);
          }

          // Use service to update fields if flowId is available
          if (flowId) {
            const { DataStoreNodeService } = await import(
              "@/app/services/data-store-node-service"
            );

            const result =
              await DataStoreNodeService.updateDataStoreNodeFields.execute({
                flowId: flowId,
                nodeId: nodeId,
                fields: existingFields,
              });

            if (result.isSuccess) {
              // Update local resource to reflect the change
              resource.dataStoreNodes[nodeId].dataStoreFields = existingFields;

              // Invalidate specific data store node queries
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
                queryClient.invalidateQueries({
                  queryKey: dataStoreNodeKeys.fields(nodeId),
                });
              } catch (invalidationError) {
                console.warn(
                  "⚠️ [DATA-STORE-PROCESSOR] Could not invalidate data store node queries:",
                  invalidationError,
                );
              }
            } else {
              throw new Error(
                `Failed to update data store fields: ${result.getError()}`,
              );
            }
          } else {
            // Fallback to local update if no flowId available
            resource.dataStoreNodes[nodeId].dataStoreFields = existingFields;
          }
        } else {
          // Standard field operations
          if (context.operation === "set") {
            // Use appropriate service based on field name if flowId is available
            if (flowId) {
              const { DataStoreNodeService } = await import(
                "@/app/services/data-store-node-service"
              );

              if (fieldName === "name") {
                const result =
                  await DataStoreNodeService.updateDataStoreNodeName.execute({
                    flowId: flowId,
                    nodeId: nodeId,
                    name: context.value,
                  });

                if (result.isSuccess) {
                  resource.dataStoreNodes[nodeId][fieldName] = context.value;
                } else {
                  throw new Error(
                    `Failed to update data store name: ${result.getError()}`,
                  );
                }
              } else if (fieldName === "color") {
                const result =
                  await DataStoreNodeService.updateDataStoreNodeColor.execute({
                    flowId: flowId,
                    nodeId: nodeId,
                    color: context.value,
                  });

                if (result.isSuccess) {
                  resource.dataStoreNodes[nodeId][fieldName] = context.value;
                } else {
                  throw new Error(
                    `Failed to update data store color: ${result.getError()}`,
                  );
                }
              } else {
                // Fallback to local update for other fields
                resource.dataStoreNodes[nodeId][fieldName] = context.value;
              }
            } else {
              // Fallback to local update if no flowId available
              resource.dataStoreNodes[nodeId][fieldName] = context.value;
            }
          } else if (context.operation === "remove") {
            delete resource.dataStoreNodes[nodeId][fieldName];
          }
        }

        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(
          error as Error,
          {
            operation: "update_data_store_field",
            path: `dataStoreNodes.${match.groups.group1}.${match.groups.group2}`,
            processor: "data-store-nodes",
            inputData: context.value,
          },
          "Failed to update data store field",
        );
      }
    },
  } as PathProcessor,

  dataStoreFieldsAppend: {
    pattern: pathPatterns.dataStoreNodes.dataStoreFields.append,
    description: "Append field to data store node dataStoreFields array",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;

        if (!resource.dataStoreNodes) resource.dataStoreNodes = {};
        if (!resource.dataStoreNodes[nodeId])
          resource.dataStoreNodes[nodeId] = {};
        if (!Array.isArray(resource.dataStoreNodes[nodeId].dataStoreFields)) {
          resource.dataStoreNodes[nodeId].dataStoreFields = [];
        }

        if (context.operation === "put") {
          resource.dataStoreNodes[nodeId].dataStoreFields.push(context.value);
        }

        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: "append_data_store_field",
          path: `dataStoreNodes.${match.groups.group1}.dataStoreFields.append`,
          processor: "data-store-nodes",
          inputData: context.value,
        });
      }
    },
  } as PathProcessor,

  dataStoreFieldsIndexed: {
    pattern: pathPatterns.dataStoreNodes.dataStoreFields.indexed,
    description: "Set data store node field at specific index",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;
        const index = parseInt(match.groups.group2);

        if (!resource.dataStoreNodes) resource.dataStoreNodes = {};
        if (!resource.dataStoreNodes[nodeId])
          resource.dataStoreNodes[nodeId] = {};
        if (!Array.isArray(resource.dataStoreNodes[nodeId].dataStoreFields)) {
          resource.dataStoreNodes[nodeId].dataStoreFields = [];
        }

        // Extend array if needed
        while (
          resource.dataStoreNodes[nodeId].dataStoreFields.length <= index
        ) {
          resource.dataStoreNodes[nodeId].dataStoreFields.push({});
        }

        if (context.operation === "set") {
          resource.dataStoreNodes[nodeId].dataStoreFields[index] =
            context.value;
        } else if (context.operation === "put") {
          // PUT should INSERT at the index, shifting existing items
          resource.dataStoreNodes[nodeId].dataStoreFields.splice(
            index,
            0,
            context.value,
          );
        } else if (context.operation === "remove") {
          resource.dataStoreNodes[nodeId].dataStoreFields.splice(index, 1);
        }

        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: "set_indexed_data_store_field",
          path: `dataStoreNodes.${match.groups.group1}.dataStoreFields[${match.groups.group2}]`,
          processor: "data-store-nodes",
          inputData: context.value,
        });
      }
    },
  } as PathProcessor,
};
