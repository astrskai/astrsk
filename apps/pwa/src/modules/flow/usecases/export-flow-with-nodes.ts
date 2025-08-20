import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { LoadFlowRepo } from "@/modules/flow/repos/load-flow-repo";
import { LoadAgentRepo } from "@/modules/agent/repos";
import { LoadDataStoreNodeRepo } from "@/modules/data-store-node/repos";
import { LoadIfNodeRepo } from "@/modules/if-node/repos";
import { NodeType } from "@/flow-multi/types/node-types";

// Enhanced legacy format - extends flow structure with separate node data

export class ExportFlowWithNodes implements UseCase<UniqueEntityID, Result<File>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private loadIfNodeRepo: LoadIfNodeRepo,
  ) {}

  async execute(flowId: UniqueEntityID): Promise<Result<File>> {
    try {
      // 1. Get flow data
      const flowOrError = await this.loadFlowRepo.getFlowById(flowId);
      if (flowOrError.isFailure) {
        return Result.fail(flowOrError.getError());
      }
      const flow = flowOrError.getValue();

      // 2. Collect all node data by type
      const agents: Record<string, any> = {};
      const dataStoreNodes: Record<string, any> = {};
      const ifNodes: Record<string, any> = {};

      // Track processing results for debugging
      const processing = {
        agents: { found: 0, exported: 0, failed: 0 },
        dataStoreNodes: { found: 0, exported: 0, failed: 0 },
        ifNodes: { found: 0, exported: 0, failed: 0 },
      };

      for (const node of flow.props.nodes) {
        try {
          switch (node.type) {
            case NodeType.AGENT: {
              processing.agents.found++;
              
              // For agent nodes, the agentId might be in node.data.agentId or just node.id
              const agentId = (node.data as any)?.agentId || node.id;
              const agentOrError = await this.loadAgentRepo.getAgentById(new UniqueEntityID(agentId));
              
              if (agentOrError.isSuccess) {
                agents[node.id] = agentOrError.getValue().toJSON();
                processing.agents.exported++;
              } else {
                console.warn(`Failed to export agent for node ${node.id}:`, agentOrError.getError());
                processing.agents.failed++;
              }
              break;
            }

            case NodeType.DATA_STORE: {
              processing.dataStoreNodes.found++;
              
              // Try to get from separate data store first
              const dataStoreOrError = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
                flowId.toString(), 
                node.id
              );
              
              if (dataStoreOrError.isSuccess) {
                const dataStoreNode = dataStoreOrError.getValue();
                if (dataStoreNode) {
                  dataStoreNodes[node.id] = {
                    name: dataStoreNode.name,
                    color: dataStoreNode.color,
                    dataStoreFields: dataStoreNode.dataStoreFields,
                    createdAt: dataStoreNode.createdAt.toISOString(),
                    updatedAt: dataStoreNode.updatedAt?.toISOString(),
                  };
                  processing.dataStoreNodes.exported++;
                }
              } else {
                // For current users: extract data from node.data (embedded structure)
                if (node.data && typeof node.data === 'object') {
                  const embeddedData = node.data as any;
                  dataStoreNodes[node.id] = {
                    name: embeddedData.name || "Data Update",
                    color: embeddedData.color || "#3b82f6",
                    dataStoreFields: embeddedData.dataStoreFields || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    source: "embedded", // Mark as extracted from embedded data
                  };
                  processing.dataStoreNodes.exported++;
                  console.info(`Exported embedded data for data store node ${node.id}`);
                } else {
                  console.warn(`No data found for data store node ${node.id}`);
                  processing.dataStoreNodes.failed++;
                }
              }
              break;
            }

            case NodeType.IF: {
              processing.ifNodes.found++;
              
              // Try to get from separate data store first
              const ifNodeOrError = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
                flowId.toString(), 
                node.id
              );
              
              if (ifNodeOrError.isSuccess) {
                const ifNode = ifNodeOrError.getValue();
                if (ifNode) {
                  ifNodes[node.id] = {
                    name: ifNode.name,
                    color: ifNode.color,
                    logicOperator: ifNode.logicOperator,
                    conditions: ifNode.conditions,
                    createdAt: ifNode.createdAt.toISOString(),
                    updatedAt: ifNode.updatedAt?.toISOString(),
                  };
                  processing.ifNodes.exported++;
                }
              } else {
                // For current users: extract data from node.data (embedded structure)
                if (node.data && typeof node.data === 'object') {
                  const embeddedData = node.data as any;
                  ifNodes[node.id] = {
                    name: embeddedData.name || "If Condition",
                    color: embeddedData.color || "#3b82f6",
                    logicOperator: embeddedData.logicOperator || "AND",
                    conditions: embeddedData.conditions || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    source: "embedded", // Mark as extracted from embedded data
                  };
                  processing.ifNodes.exported++;
                  console.info(`Exported embedded data for if node ${node.id}`);
                } else {
                  console.warn(`No data found for if node ${node.id}`);
                  processing.ifNodes.failed++;
                }
              }
              break;
            }
          }
        } catch (nodeError) {
          console.error(`Error processing node ${node.id} (type: ${node.type}):`, nodeError);
        }
      }

      // 3. Log processing summary
      console.info('Export processing summary:', processing);

      // 4. Create comprehensive export structure (enhanced legacy format)
      const flowJson = flow.toJSON();
      const exportData: any = {
        // Keep legacy format structure
        ...flowJson,
        // Add agent data (just like legacy format)
        agents,
      };

      // Debug: Check actual content of node data objects
      console.info('🔧 Export Data Objects Check:', {
        dataStoreNodesKeys: Object.keys(dataStoreNodes),
        dataStoreNodesLength: Object.keys(dataStoreNodes).length,
        ifNodesKeys: Object.keys(ifNodes),
        ifNodesLength: Object.keys(ifNodes).length,
        dataStoreNodesSample: Object.keys(dataStoreNodes).length > 0 ? dataStoreNodes[Object.keys(dataStoreNodes)[0]] : 'empty',
        ifNodesSample: Object.keys(ifNodes).length > 0 ? ifNodes[Object.keys(ifNodes)[0]] : 'empty'
      });

      // Only add separate node data sections if they contain data
      // This ensures compatibility: flows with only agents remain in legacy format
      const hasDataStoreNodes = Object.keys(dataStoreNodes).length > 0;
      const hasIfNodes = Object.keys(ifNodes).length > 0;
      
      console.info('🔧 Export Format Decision:', {
        hasDataStoreNodes,
        hasIfNodes,
        willUseEnhancedFormat: hasDataStoreNodes || hasIfNodes
      });
      
      if (hasDataStoreNodes || hasIfNodes) {
        // Enhanced format: add separate node data sections
        if (hasDataStoreNodes) {
          exportData.dataStoreNodes = dataStoreNodes;
        }
        if (hasIfNodes) {
          exportData.ifNodes = ifNodes;
        }
        // Add metadata for enhanced format tracking
        exportData.exportedAt = new Date().toISOString();
        exportData.exportedBy = "astrsk-v2.3.0";
      }

      // 5. Add processing metadata for debugging (only for enhanced format)
      if (hasDataStoreNodes || hasIfNodes) {
        exportData.metadata = {
          processing,
          totalNodes: flow.props.nodes.length,
          nodeTypes: flow.props.nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
      }

      // 6. Create file
      const jsonString = JSON.stringify(exportData, null, 2);
      console.info('📄 Export JSON Content Sample:', {
        contentLength: jsonString.length,
        contentSample: jsonString.substring(0, 500) + '...',
        hasDataStoreNodesInJSON: jsonString.includes('"dataStoreNodes"'),
        hasIfNodesInJSON: jsonString.includes('"ifNodes"'),
        hasExportedAtInJSON: jsonString.includes('"exportedAt"')
      });
      
      const blob = new Blob([jsonString], {
        type: "application/json",
      });
      const file = new File([blob], `${flow.props.name}.json`, {
        type: "application/json",
      });

      const format = (hasDataStoreNodes || hasIfNodes) ? "enhanced" : "legacy-compatible";
      console.info(`Successfully exported flow "${flow.props.name}" with:`, {
        agents: Object.keys(agents).length,
        dataStoreNodes: Object.keys(dataStoreNodes).length,
        ifNodes: Object.keys(ifNodes).length,
        totalFileSize: blob.size,
        format: format
      });

      return Result.ok(file);
    } catch (error) {
      console.error('Export failed:', error);
      return Result.fail(
        `Failed to export flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}