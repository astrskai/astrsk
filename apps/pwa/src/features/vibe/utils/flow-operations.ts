import { EditableFlowData } from "vibe-shared-types";
import { UniqueEntityID } from "@/shared/domain";
import { Operation } from "../lib/operation-processor";

/**
 * Map edited flow data from backend format to service call format
 */
export function mapFlowEditsToUpdates(edited: EditableFlowData): {
  name?: string;
  agents?: Record<string, any>;
  ifNodes?: Record<string, any>;
  dataStoreNodes?: Record<string, any>;
  edges?: any[];
  nodes?: any[];
} {
  return {
    name: edited.name,
    agents: edited.agents,
    ifNodes: edited.ifNodes,
    dataStoreNodes: edited.dataStoreNodes,
    edges: edited.edges,
    nodes: edited.nodes,
  };
}

/**
 * Apply flow updates using FlowService static methods
 */
export async function applyFlowUpdates(
  flowId: string,
  updates: ReturnType<typeof mapFlowEditsToUpdates>,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { FlowService } = await import("@/app/services/flow-service");
  const { UniqueEntityID } = await import("@/shared/domain");

  try {
    // Apply flow name change
    if (updates.name !== undefined) {
      const result = await FlowService.updateFlowName.execute({
        flowId: new UniqueEntityID(flowId),
        name: updates.name,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update flow name: ${result.getError()}`);
      }
    }

    // Apply nodes and edges changes together
    if (updates.nodes !== undefined || updates.edges !== undefined) {
      const result = await FlowService.updateNodesAndEdges.execute({
        flowId: flowId,
        nodes: updates.nodes || [],
        edges: updates.edges || [],
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update nodes and edges: ${result.getError()}`);
      }
    }

    // Note: Agent, IfNode, and DataStoreNode updates would need specific handling
    // based on the actual flow structure and available service methods

    return { success: errors.length === 0, errors };
  } catch (error) {
    // Failed to apply flow updates
    return {
      success: false,
      errors: [error?.toString() || "Unknown error"],
    };
  }
}

/**
 * Process flow-specific operations
 */
export async function processFlowOperations(
  resourceId: string,
  operations: Operation[],
  updatedResource: any,
): Promise<string[]> {
  const errors: string[] = [];

  for (const operation of operations) {
    try {
      if (operation.path === "flow.name") {
        // Handle flow name operations
        console.log(`🔄 [FLOW-OPERATIONS] Processing flow name operation:`, {
          path: operation.path,
          operation: operation.operation,
          newValue: operation.value,
        });

        const { FlowService } = await import("@/app/services/flow-service");
        const result = await FlowService.updateFlowName.execute({
          flowId: new UniqueEntityID(resourceId),
          name: operation.value,
        });

        if (!result.isSuccess) {
          errors.push(`Failed to update flow name: ${result.getError()}`);
          console.error(
            `❌ [FLOW-OPERATIONS] Flow name update failed:`,
            result.getError(),
          );
        } else {
          console.log(`✅ [FLOW-OPERATIONS] Flow name updated successfully:`, {
            newName: operation.value,
          });
        }
      } else if (operation.path === "flow.response_template") {
        // Handle flow response_template operations
        console.log(
          `🔄 [FLOW-OPERATIONS] Processing flow response_template operation:`,
          {
            path: operation.path,
            operation: operation.operation,
            valueLength: operation.value?.length || 0,
          },
        );

        const { FlowService } = await import("@/app/services/flow-service");
        const result = await FlowService.updateResponseTemplate.execute({
          flowId: resourceId,
          responseTemplate: operation.value,
        });

        if (!result.isSuccess) {
          errors.push(
            `Failed to update flow response_template: ${result.getError()}`,
          );
          console.error(
            `❌ [FLOW-OPERATIONS] Flow response_template update failed:`,
            result.getError(),
          );
        } else {
          console.log(
            `✅ [FLOW-OPERATIONS] Flow response_template updated successfully:`,
            {
              templateLength: operation.value?.length || 0,
            },
          );
        }
      } else if (operation.path.startsWith("flow.data_store_schema")) {
        // Handle flow data store schema operations
        console.log(
          `🔄 [FLOW-OPERATIONS] Processing flow data_store_schema operation:`,
          {
            path: operation.path,
            operation: operation.operation,
            valueType: typeof operation.value,
          },
        );

        // Get the current flow to access its data store schema
        const { FlowService } = await import("@/app/services/flow-service");
        const flowResult = await FlowService.getFlow.execute(
          new UniqueEntityID(resourceId),
        );

        if (!flowResult.isSuccess) {
          errors.push(
            `Failed to get flow for data store schema update: ${flowResult.getError()}`,
          );
          console.error(
            `❌ [FLOW-OPERATIONS] Flow retrieval failed:`,
            flowResult.getError(),
          );
        } else {
          const flow = flowResult.getValue();
          let updatedSchema = flow.props.dataStoreSchema || { fields: [] };

          // Apply the operation to the schema
          if (
            operation.path === "flow.data_store_schema.fields" &&
            operation.operation === "put"
          ) {
            // Add new field
            updatedSchema.fields = [...updatedSchema.fields, operation.value];
          } else if (
            operation.path === "flow.data_store_schema" &&
            operation.operation === "set"
          ) {
            // Replace entire schema
            updatedSchema = operation.value;
          }
          // Add more operation handlers as needed

          const result = await FlowService.updateDataStoreSchema.execute({
            flowId: resourceId,
            schema: updatedSchema,
          });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update flow data store schema: ${result.getError()}`,
            );
            console.error(
              `❌ [FLOW-OPERATIONS] Flow data store schema update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [FLOW-OPERATIONS] Flow data store schema updated successfully:`,
              {
                fieldCount: updatedSchema.fields?.length || 0,
                operation: operation.operation,
                path: operation.path,
              },
            );
          }
        }
      } else if (
        operation.path === "flow.nodes" &&
        operation.operation === "put"
      ) {
        // Handle node creation during approval - backend persistence with proper color assignment
        console.log(
          `🔄 [FLOW-OPERATIONS] Processing flow nodes operation (APPROVAL):`,
          {
            path: operation.path,
            operation: operation.operation,
            nodeId: operation.value?.id,
            nodeType: operation.value?.nodeType,
          },
        );

        const { id: nodeId, nodeType, name, position } = operation.value;
        const { FlowService } = await import("@/app/services/flow-service");

        try {
          // Step 0: Get proper color assignment
          const { getNextAvailableColor } = await import(
            "@/features/flow/utils/node-color-assignment"
          );
          const nodeColor = await getNextAvailableColor({
            props: { nodes: updatedResource.nodes || [] },
            id: resourceId,
          });

          console.log(
            `🎨 [FLOW-OPERATIONS] Assigned color for ${nodeType} node:`,
            {
              nodeId,
              assignedColor: nodeColor,
            },
          );

          // Step 1: Create the actual node in the resource (was skipped during preview)
          if (!updatedResource.nodes) updatedResource.nodes = [];

          const newNode = {
            id: nodeId,
            type: nodeType,
            position,
            name:
              name ||
              `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodeId.slice(-8)}`,
            // For data store and if nodes, include flowId in data for UI component compatibility
            data:
              nodeType === "dataStore" || nodeType === "if"
                ? { flowId: resourceId }
                : undefined,
          };

          // Add node to resource
          updatedResource.nodes.push(newNode);

          console.log(
            "✅ [FLOW-OPERATIONS] Node added to resource during approval:",
            {
              id: newNode.id,
              type: newNode.type,
              name: newNode.name,
              color: nodeColor,
            },
          );

          // Step 2: Create the domain entity in backend with proper color
          if (nodeType === "dataStore") {
            console.log(
              `🚨🚨🚨 [FLOW-OPERATIONS] DATA STORE NODE CREATION CALLED - VIBE CODING PATH`,
              {
                nodeId,
                nodeType,
                name,
                color: nodeColor,
              },
            );
            const { DataStoreNodeService } = await import(
              "@/app/services/data-store-node-service"
            );
            const result =
              await DataStoreNodeService.createDataStoreNode.execute({
                nodeId: nodeId,
                flowId: resourceId,
                name: name || `Data Store ${nodeId.slice(-8)}`,
                color: nodeColor, // Use proper color assignment
                dataStoreFields: [],
              });

            if (!result.isSuccess) {
              errors.push(
                `Failed to create data store node: ${result.getError()}`,
              );
              console.error(
                `❌ [FLOW-OPERATIONS] Data store node creation failed:`,
                result.getError(),
              );
              continue;
            } else {
              // Verify the node was actually created by querying it back
              console.log(
                `✅ [FLOW-OPERATIONS] Data Store node created successfully, verifying database persistence...`,
              );
              const { DataStoreNodeService } = await import(
                "@/app/services/data-store-node-service"
              );
              const { UniqueEntityID } = await import("@/shared/domain");
              const verifyResult =
                await DataStoreNodeService.getDataStoreNode.execute(
                  new UniqueEntityID(nodeId),
                );

              if (!verifyResult.isSuccess) {
                console.warn(
                  `⚠️ [FLOW-OPERATIONS] Data Store node creation verification failed, retrying once...`,
                );
                // Retry verification once after small delay
                await new Promise((resolve) => setTimeout(resolve, 50));
                const retryResult =
                  await DataStoreNodeService.getDataStoreNode.execute(
                    new UniqueEntityID(nodeId),
                  );

                if (!retryResult.isSuccess) {
                  errors.push(
                    `Data Store node created but not immediately queryable: ${retryResult.getError()}`,
                  );
                  console.error(
                    `❌ [FLOW-OPERATIONS] Data Store node verification failed after retry`,
                  );
                  continue;
                }
              }

              console.log(
                `✅ [FLOW-OPERATIONS] Data Store node verified in database, ready for next operation`,
              );
            }
          } else if (nodeType === "if") {
            console.log(
              `🚨🚨🚨 [FLOW-OPERATIONS] IF NODE CREATION CALLED - VIBE CODING PATH`,
              {
                nodeId,
                nodeType,
                name,
                color: nodeColor,
                timestamp: new Date().toISOString(),
              },
            );
            const { IfNodeService } = await import(
              "@/app/services/if-node-service"
            );
            const result = await IfNodeService.createIfNode.execute({
              nodeId: nodeId,
              flowId: resourceId,
              name: name || `If Node ${nodeId.slice(-8)}`,
              color: nodeColor, // Use proper color assignment
              conditions: [],
              logicOperator: "AND",
            });

            if (!result.isSuccess) {
              errors.push(`Failed to create if node: ${result.getError()}`);
              console.error(
                `❌ [FLOW-OPERATIONS] If node creation failed:`,
                result.getError(),
              );
              continue;
            } else {
              // Verify the node was actually created by querying it back
              console.log(
                `✅ [FLOW-OPERATIONS] IF node created successfully, verifying database persistence...`,
              );
              const verifyResult = await IfNodeService.getIfNode.execute(
                new UniqueEntityID(nodeId),
              );

              if (!verifyResult.isSuccess) {
                console.warn(
                  `⚠️ [FLOW-OPERATIONS] IF node creation verification failed, retrying once...`,
                );
                // Retry verification once after small delay
                await new Promise((resolve) => setTimeout(resolve, 50));
                const retryResult = await IfNodeService.getIfNode.execute(
                  new UniqueEntityID(nodeId),
                );

                if (!retryResult.isSuccess) {
                  errors.push(
                    `IF node created but not immediately queryable: ${retryResult.getError()}`,
                  );
                  console.error(
                    `❌ [FLOW-OPERATIONS] IF node verification failed after retry`,
                  );
                  continue;
                }
              }

              console.log(
                `✅ [FLOW-OPERATIONS] IF node verified in database, ready for next operation`,
              );
            }
          } else if (nodeType === "agent") {
            console.log(
              `🚨🚨🚨 [FLOW-OPERATIONS] AGENT NODE CREATION CALLED - VIBE CODING PATH`,
              {
                nodeId,
                nodeType,
                name,
                color: nodeColor,
              },
            );

            // Step 1: Create the actual node in the resource (same pattern as other nodes)
            if (!updatedResource.nodes) updatedResource.nodes = [];

            const agentName = name || `Agent ${nodeId.slice(-8)}`;
            const newNode = {
              id: nodeId,
              type: nodeType,
              position,
              name: agentName,
              color: nodeColor,
            };

            // Add node to resource for frontend display
            updatedResource.nodes.push(newNode);

            console.log(
              "✅ [FLOW-OPERATIONS] Agent node added to resource during approval:",
              {
                id: newNode.id,
                type: newNode.type,
                name: newNode.name,
                color: nodeColor,
              },
            );

            // Step 2: Create the agent configuration data in frontend resource
            if (!updatedResource.agents) updatedResource.agents = {};

            updatedResource.agents[nodeId] = {
              id: nodeId,
              name: agentName,
              targetApiType: "chat",
              enabledStructuredOutput: false,
              promptMessages: [],
              textPrompt: "",
            };

            console.log(
              `✅ [FLOW-OPERATIONS] Agent data created in frontend resource:`,
              {
                nodeId,
                agentName: agentName,
                targetApiType: updatedResource.agents[nodeId].targetApiType,
              },
            );

            // Step 3: Create the agent in database via service layer
            const { Agent, ApiType } = await import("@/entities/agent/domain");
            const { UniqueEntityID } = await import("@/shared/domain");
            const { AgentService } = await import(
              "@/app/services/agent-service"
            );

            // Create agent domain entity
            const agentOrError = Agent.create(
              {
                name: agentName,
                description: "",
                targetApiType: ApiType.Chat,
                color: nodeColor,
                promptMessages: [],
                schemaFields: [],
                flowId: new UniqueEntityID(resourceId),
              },
              new UniqueEntityID(nodeId),
            );

            if (agentOrError.isFailure) {
              errors.push(`Agent creation failed: ${agentOrError.getError()}`);
              console.error(
                `❌ [FLOW-OPERATIONS] Agent domain entity creation failed:`,
                agentOrError.getError(),
              );
              continue;
            }

            const agent = agentOrError.getValue();
            const result = await AgentService.saveAgent.execute(agent);

            if (!result.isSuccess) {
              errors.push(
                `Failed to create agent in database: ${result.getError()}`,
              );
              console.error(
                `❌ [FLOW-OPERATIONS] Agent database creation failed:`,
                result.getError(),
              );
              continue;
            } else {
              // Verify the agent was actually created by querying it back
              console.log(
                `✅ [FLOW-OPERATIONS] Agent created in database successfully, verifying persistence...`,
              );
              const verifyResult = await AgentService.getAgent.execute(
                new UniqueEntityID(nodeId),
              );

              if (!verifyResult.isSuccess) {
                console.warn(
                  `⚠️ [FLOW-OPERATIONS] Agent creation verification failed, retrying once...`,
                );
                // Retry verification once after small delay
                await new Promise((resolve) => setTimeout(resolve, 50));
                const retryResult = await AgentService.getAgent.execute(
                  new UniqueEntityID(nodeId),
                );

                if (!retryResult.isSuccess) {
                  errors.push(
                    `Agent created but not immediately queryable: ${retryResult.getError()}`,
                  );
                  console.error(
                    `❌ [FLOW-OPERATIONS] Agent verification failed after retry`,
                  );
                  continue;
                }
              }

              console.log(
                `✅ [FLOW-OPERATIONS] Agent verified in database, ready for next operation`,
              );
            }
          }

          // Step 3: Update flow nodes and edges via FlowService
          const flowResult = await FlowService.updateNodesAndEdges.execute({
            flowId: resourceId,
            nodes: updatedResource.nodes || [],
            edges: updatedResource.edges || [],
          });

          if (!flowResult.isSuccess) {
            errors.push(
              `Failed to update flow nodes and edges: ${flowResult.getError()}`,
            );
            console.error(
              `❌ [FLOW-OPERATIONS] Flow update failed:`,
              flowResult.getError(),
            );
          } else {
            // Step 4: Notify UI of the changes (now that everything is persisted)
            const { notifyFlowNodesEdgesUpdate } = await import(
              "@/shared/lib/flow-local-state-sync"
            );

            // Ensure all edges have the required 'type' field for ReactFlow
            const edgesWithType = (updatedResource.edges || []).map(
              (edge: any) => ({
                ...edge,
                type: edge.type || "default",
              }),
            );

            notifyFlowNodesEdgesUpdate(
              resourceId,
              updatedResource.nodes || [],
              edgesWithType,
            );

            console.log(
              `✅ [FLOW-OPERATIONS] Node created and flow updated successfully:`,
              {
                nodeId,
                nodeType,
                name,
                color: nodeColor,
              },
            );
          }
        } catch (nodeError) {
          errors.push(
            `Failed to create ${nodeType} node ${nodeId}: ${nodeError}`,
          );
          console.error(`❌ [FLOW-OPERATIONS] Node creation error:`, nodeError);
        }
      } else if (
        operation.path === "flow.edges" &&
        operation.operation === "put"
      ) {
        // Handle edge creation during approval - backend persistence
        console.log(
          `🔄 [FLOW-OPERATIONS] Processing flow edges operation (APPROVAL):`,
          {
            path: operation.path,
            operation: operation.operation,
            edgeId: operation.value?.id,
            source: operation.value?.source,
            target: operation.value?.target,
          },
        );

        const { id, source, target, sourceHandle } = operation.value;
        const { FlowService } = await import("@/app/services/flow-service");

        try {
          // Step 1: Create the actual edge in the resource (was skipped during preview)
          if (!updatedResource.edges) updatedResource.edges = [];

          // Use provided ID or generate one
          const edgeId = id || `edge-${source}-${target}-${Date.now()}`;

          // Convert sourceHandle boolean to string and label for frontend
          let label;
          let sourceHandleString;
          if (sourceHandle === true) {
            label = "True";
            sourceHandleString = "true";
          } else if (sourceHandle === false) {
            label = "False";
            sourceHandleString = "false";
          }
          // If sourceHandle is undefined, both label and sourceHandleString remain undefined

          const newEdge = {
            id: edgeId,
            source,
            target,
            sourceHandle: sourceHandleString, // Use string version for ReactFlow
            label,
            type: "default",
          };

          // Check for duplicate edges (same source/target)
          const existingEdge = updatedResource.edges.find(
            (edge: any) => edge.source === source && edge.target === target,
          );

          if (!existingEdge) {
            // Add edge to resource
            updatedResource.edges.push(newEdge);

            console.log(
              "✅ [FLOW-OPERATIONS] Edge added to resource during approval:",
              {
                id: newEdge.id,
                source: newEdge.source,
                target: newEdge.target,
                label: newEdge.label,
              },
            );

            // Step 2: Update flow nodes and edges via FlowService
            const flowResult = await FlowService.updateNodesAndEdges.execute({
              flowId: resourceId,
              nodes: updatedResource.nodes || [],
              edges: updatedResource.edges || [],
            });

            if (!flowResult.isSuccess) {
              errors.push(
                `Failed to update flow nodes and edges: ${flowResult.getError()}`,
              );
              console.error(
                `❌ [FLOW-OPERATIONS] Flow update failed:`,
                flowResult.getError(),
              );
            } else {
              // Step 3: Notify UI of the changes (now that everything is persisted)
              const { notifyFlowNodesEdgesUpdate } = await import(
                "@/shared/lib/flow-local-state-sync"
              );

              // Ensure all edges have the required 'type' field for ReactFlow
              const edgesWithType = (updatedResource.edges || []).map(
                (edge: any) => ({
                  ...edge,
                  type: edge.type || "default",
                }),
              );

              notifyFlowNodesEdgesUpdate(
                resourceId,
                updatedResource.nodes || [],
                edgesWithType,
              );

              console.log(
                `✅ [FLOW-OPERATIONS] Edge created and flow updated successfully:`,
                {
                  edgeId,
                  source,
                  target,
                  label,
                },
              );
            }
          } else {
            console.log(`ℹ️ [FLOW-OPERATIONS] Edge already exists, skipping:`, {
              source,
              target,
            });
          }
        } catch (edgeError) {
          errors.push(
            `Failed to create edge ${source}->${target}: ${edgeError}`,
          );
          console.error(`❌ [FLOW-OPERATIONS] Edge creation error:`, edgeError);
        }
      }
    } catch (error) {
      errors.push(`Failed to apply flow operation ${operation.path}: ${error}`);
    }
  }

  return errors;
}
