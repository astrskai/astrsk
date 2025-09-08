import { UniqueEntityID } from "@/shared/domain";
import { Operation } from "@/utils/operation-processor";

/**
 * Pre-load existing agent data into the resource to ensure deep merge operations
 * can append to existing prompt messages instead of starting from empty arrays
 */
export async function preloadExistingAgentData(
  resource: any,
  agentOperations: Operation[],
): Promise<void> {
  const { AgentService } = await import("@/app/services/agent-service");

  // Extract unique agent IDs from operations
  const agentIds = new Set<string>();
  for (const op of agentOperations) {
    const match = op.path.match(/^agents\.([^.]+)\./);
    if (match) {
      agentIds.add(match[1]);
    }
  }

  // Initialize agents object if it doesn't exist
  if (!resource.agents) {
    resource.agents = {};
  }

  // Load each agent's data
  for (const agentId of agentIds) {
    try {
      const agentResult = await AgentService.getAgent.execute(
        new UniqueEntityID(agentId),
      );
      if (agentResult.isSuccess) {
        const agent = agentResult.getValue();
        // Convert agent to JSON and store prompt messages and schema fields
        resource.agents[agentId] = {
          promptMessages:
            (agent as any).props.promptMessages?.map((msg: any) =>
              msg.toJSON ? msg.toJSON() : msg,
            ) || [],
          schemaFields: (agent as any).props.schemaFields || [],
        };
      }
    } catch (error) {
      // Agent not found or error - start with empty arrays
      resource.agents[agentId] = {
        promptMessages: [],
        schemaFields: [],
      };
    }
  }
}

/**
 * Process agent-specific operations
 */
export async function processAgentOperations(
  resourceId: string,
  operations: Operation[],
  updatedResource: any,
): Promise<string[]> {
  const errors: string[] = [];

  for (const operation of operations) {
    try {
      console.log(`🔄 [AGENT-OPERATIONS] Processing agent operation:`, {
        path: operation.path,
        operation: operation.operation,
      });

      // Agent operations need to be saved through agent service
      const { AgentService } = await import("@/app/services/agent-service");

      if (
        operation.path.includes(".promptMessages") ||
        operation.path.includes(".schemaFields")
      ) {
        // Handle agent prompt message and schema fields operations
        const agentIdMatch = operation.path.match(/^agents\.([^.]+)\./);
        if (agentIdMatch) {
          const agentId = agentIdMatch[1];

          // Get the updated agent data from the operation processor results
          const updatedAgentData =
            updatedResource.agents && updatedResource.agents[agentId];

          // Fix: The updatedAgentData might contain nested agents structure from deep merge
          const actualAgentData =
            updatedAgentData?.agents?.[agentId] || updatedAgentData;

          if (actualAgentData) {
            // Convert the updated agent data to a proper Agent domain object
            const getResult = await AgentService.getAgent.execute(
              new UniqueEntityID(agentId),
            );

            if (getResult.isSuccess) {
              const agent = getResult.getValue();

              // Apply updated prompt messages from deep merge processing (like lorebook)
              if (actualAgentData.promptMessages) {
                try {
                  const { parsePromptMessage } = await import(
                    "@/modules/agent/domain/prompt-message"
                  );
                  const updatedMessages = [];

                  for (const msgData of actualAgentData.promptMessages) {
                    const messageResult = parsePromptMessage(msgData);
                    if (messageResult.isSuccess) {
                      updatedMessages.push(messageResult.getValue());
                    }
                  }

                  // Replace the agent's prompt messages with the deep-merge-processed ones
                  (agent as any).props.promptMessages = updatedMessages;
                } catch (parseError) {
                  console.error(
                    `❌ [AGENT-OPERATIONS] Failed to parse deep merge processed messages for agent ${agentId}:`,
                    parseError,
                  );
                }
              }

              // Apply updated schema fields from deep merge processing
              if (actualAgentData.schemaFields) {
                // Schema fields are simple objects, no parsing needed
                (agent as any).props.schemaFields =
                  actualAgentData.schemaFields;
              }

              // Save the updated agent
              const saveResult = await AgentService.saveAgent.execute(agent);

              if (!saveResult.isSuccess) {
                errors.push(
                  `Failed to save agent: ${saveResult.getError()}`,
                );
              } else {
                // Invalidate agent queries to refresh UI
                try {
                  const { queryClient } = await import(
                    "@/app/queries/query-client"
                  );
                  const { agentQueries } = await import(
                    "@/app/queries/agent/query-factory"
                  );

                  // Invalidate relevant agent queries using the new query factory structure
                  await queryClient.invalidateQueries({
                    queryKey: agentQueries.detail(agentId).queryKey,
                  });
                  await queryClient.invalidateQueries({
                    queryKey: agentQueries.prompt(agentId).queryKey,
                  });
                  await queryClient.invalidateQueries({
                    queryKey: agentQueries.output(agentId).queryKey,
                  });

                  console.log(
                    `✅ [AGENT-OPERATIONS] Invalidated agent queries for ${agentId}`,
                  );
                } catch (invalidationError) {
                  console.warn(
                    `⚠️ [AGENT-OPERATIONS] Could not invalidate agent queries:`,
                    invalidationError,
                  );
                  // Don't fail the operation just because invalidation failed
                }
              }
            } else {
              errors.push(
                `Failed to get agent for update: ${getResult.getError()}`,
              );
            }
          } else {
            errors.push(
              `Updated agent data not found for agent: ${agentId}`,
            );
          }
        }
      } else if (operation.path.includes(".name")) {
        // Handle agent name updates
        const agentIdMatch = operation.path.match(
          /^agents\.([^.]+)\.name$/,
        );
        if (agentIdMatch) {
          const agentId = agentIdMatch[1];

          const result = await AgentService.updateAgentName.execute({
            agentId: agentId,
            name: operation.value,
          });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update agent name: ${result.getError()}`,
            );
            console.error(
              `❌ [AGENT-OPERATIONS] Agent name update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [AGENT-OPERATIONS] Agent name updated successfully:`,
              {
                agentId,
                newName: operation.value,
              },
            );
            
            // Invalidate agent queries to refresh UI
            try {
              const { queryClient } = await import(
                "@/app/queries/query-client"
              );
              const { agentQueries } = await import(
                "@/app/queries/agent/query-factory"
              );

              // Invalidate relevant agent queries
              await queryClient.invalidateQueries({
                queryKey: agentQueries.detail(agentId).queryKey,
              });
              await queryClient.invalidateQueries({
                queryKey: agentQueries.name(agentId).queryKey,
              });

              console.log(
                `✅ [AGENT-OPERATIONS] Invalidated agent name queries for ${agentId}`,
              );
            } catch (invalidationError) {
              console.warn(
                `⚠️ [AGENT-OPERATIONS] Could not invalidate agent queries:`,
                invalidationError,
              );
              // Don't fail the operation just because invalidation failed
            }
          }
        }
      } else if (operation.path.includes(".enabledStructuredOutput")) {
        // Handle agent enabledStructuredOutput updates
        const agentIdMatch = operation.path.match(
          /^agents\.([^.]+)\.enabledStructuredOutput$/,
        );
        if (agentIdMatch) {
          const agentId = agentIdMatch[1];

          const result = await AgentService.updateAgentOutput.execute({
            agentId: agentId,
            enabledStructuredOutput: operation.value,
          });

          if (!result.isSuccess) {
            errors.push(
              `Failed to update agent enabledStructuredOutput: ${result.getError()}`,
            );
            console.error(
              `❌ [AGENT-OPERATIONS] Agent enabledStructuredOutput update failed:`,
              result.getError(),
            );
          } else {
            console.log(
              `✅ [AGENT-OPERATIONS] Agent enabledStructuredOutput updated successfully:`,
              {
                agentId,
                enabledStructuredOutput: operation.value,
              },
            );
            
            // Invalidate agent queries to refresh UI
            try {
              const { queryClient } = await import(
                "@/app/queries/query-client"
              );
              const { agentKeys } = await import(
                "@/app/queries/agent/query-factory"
              );

              // Invalidate output query specifically
              await queryClient.invalidateQueries({
                queryKey: agentKeys.output(agentId),
              });

              console.log(
                `✅ [AGENT-OPERATIONS] Invalidated agent output queries: ${agentId}`,
              );
            } catch (invalidationError) {
              console.warn(
                `⚠️ [AGENT-OPERATIONS] Could not invalidate agent queries:`,
                invalidationError,
              );
            }
          }
        }
      } else {
        // Handle general agent updates
        const agentIdMatch = operation.path.match(/^agents\.([^.]+)\./);
        if (agentIdMatch) {
          const agentId = agentIdMatch[1];

          // For other agent operations, use saveAgent to persist changes
          const getResult = await AgentService.getAgent.execute(
            new UniqueEntityID(agentId),
          );
          if (getResult.isSuccess) {
            const agent = getResult.getValue();
            const result = await AgentService.saveAgent.execute(agent);

            if (!result.isSuccess) {
              errors.push(`Failed to save agent: ${result.getError()}`);
              console.error(
                `❌ [AGENT-OPERATIONS] Agent save failed:`,
                result.getError(),
              );
            } else {
              console.log(`✅ [AGENT-OPERATIONS] Agent saved successfully:`, {
                agentId,
                path: operation.path,
              });
              
              // Invalidate agent queries to refresh UI (similar to prompt/schema operations)
              try {
                const { queryClient } = await import(
                  "@/app/queries/query-client"
                );
                const { agentQueries } = await import(
                  "@/app/queries/agent/query-factory"
                );

                // Invalidate relevant agent queries
                await queryClient.invalidateQueries({
                  queryKey: agentQueries.detail(agentId).queryKey,
                });
                await queryClient.invalidateQueries({
                  queryKey: agentQueries.output(agentId).queryKey,
                });

                console.log(
                  `✅ [AGENT-OPERATIONS] Invalidated agent queries for ${agentId}`,
                );
              } catch (invalidationError) {
                console.warn(
                  `⚠️ [AGENT-OPERATIONS] Could not invalidate agent queries:`,
                  invalidationError,
                );
                // Don't fail the operation just because invalidation failed
              }
            }
          } else {
            errors.push(
              `Failed to get agent for update: ${getResult.getError()}`,
            );
            console.error(
              `❌ [AGENT-OPERATIONS] Agent get failed:`,
              getResult.getError(),
            );
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to apply agent operation ${operation.path}: ${error}`);
    }
  }

  return errors;
}