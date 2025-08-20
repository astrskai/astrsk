import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Flow } from "@/modules/flow/domain/flow";
import { LoadFlowRepo } from "@/modules/flow/repos/load-flow-repo";
import { LoadDataStoreNodeRepo } from "@/modules/data-store-node/repos";
import { LoadIfNodeRepo } from "@/modules/if-node/repos";
import { NodeType } from "@/flow-multi/types/node-types";

/**
 * Enhanced GetFlow that properly loads flow with nodes from dedicated tables.
 * This addresses the bug where data store nodes disappear after cache invalidation.
 */
export class GetFlowWithNodes implements UseCase<UniqueEntityID, Result<Flow>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private loadIfNodeRepo: LoadIfNodeRepo,
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<Flow>> {
    try {
      // 1. Get base flow data
      const flowOrError = await this.loadFlowRepo.getFlowById(id);
      if (flowOrError.isFailure) {
        return Result.fail(flowOrError.getError());
      }
      
      const flow = flowOrError.getValue();

      // 2. Enhance nodes with data from dedicated tables
      const enhancedNodes = await Promise.all(
        flow.props.nodes.map(async (node) => {
          try {
            switch (node.type) {
              case NodeType.DATA_STORE: {
                // Load from dedicated data store table
                const dataStoreOrError = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
                  id.toString(),
                  node.id
                );
                
                if (dataStoreOrError.isSuccess) {
                  const dataStoreNode = dataStoreOrError.getValue();
                  if (dataStoreNode) {
                    
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        name: dataStoreNode.name,
                        color: dataStoreNode.color,
                        dataStoreFields: dataStoreNode.dataStoreFields,
                      }
                    };
                  }
                }
                
                return node; // Fallback to embedded data
              }

              case NodeType.IF: {
                // Load from dedicated if node table
                const ifNodeOrError = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
                  id.toString(),
                  node.id
                );
                
                if (ifNodeOrError.isSuccess) {
                  const ifNode = ifNodeOrError.getValue();
                  if (ifNode) {
                    
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        name: ifNode.name,
                        color: ifNode.color,
                        logicOperator: ifNode.logicOperator,
                        conditions: ifNode.conditions,
                      }
                    };
                  }
                }
                
                return node; // Fallback to embedded data
              }

              case NodeType.AGENT:
              case NodeType.START:
              case NodeType.END:
              default:
                // These nodes don't have dedicated tables (yet), use embedded data
                return node;
            }
          } catch (nodeError) {
            console.error(`Failed to enhance node ${node.id}:`, nodeError);
            return node; // Fallback to original node
          }
        })
      );


      // 3. Create enhanced flow with properly loaded nodes
      const enhancedFlowOrError = Flow.create(
        {
          ...flow.props,
          nodes: enhancedNodes,
        },
        flow.id
      );

      if (enhancedFlowOrError.isFailure) {
        return Result.fail(enhancedFlowOrError.getError());
      }

      return Result.ok(enhancedFlowOrError.getValue());
    } catch (error) {
      return Result.fail(
        `Failed to get flow with nodes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}