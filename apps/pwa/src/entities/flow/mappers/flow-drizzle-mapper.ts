import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

import { SelectFlow, InsertFlow } from "@/db/schema/flows";
import { Flow, ReadyState } from "@/entities/flow/domain";
import { NodeType } from "@/entities/flow/model/node-types";
import { EndNodeType } from "@/entities/flow/model/end-node-types";
import { StartNodeType } from "@/entities/flow/model/start-node-types";

export class FlowDrizzleMapper {
  private constructor() {}

  /**
   * Ensure END nodes have endType set (backward compatibility)
   * Mutates nodes array in place
   */
  private static ensureEndNodeTypes(nodes: any[]): void {
    for (const node of nodes) {
      if (node.type === NodeType.END && !node.data?.endType) {
        // Set endType based on node ID convention
        let endType: EndNodeType;
        if (node.id === "end") {
          endType = EndNodeType.CHARACTER;
        } else if (node.id === "end-user") {
          endType = EndNodeType.USER;
        } else if (node.id === "end-plot") {
          endType = EndNodeType.PLOT;
        } else {
          // Unknown END node - default to CHARACTER
          endType = EndNodeType.CHARACTER;
        }

        // Set endType on node data
        if (!node.data) {
          node.data = {};
        }
        node.data.endType = endType;
      }
    }
  }

  /**
   * Ensure all START/END nodes exist for Character, User, and Plot
   * Adds missing nodes with proper positioning (backward compatibility)
   * Mutates nodes array in place
   */
  private static ensureMultiPathNodes(nodes: any[]): void {
    // Check which nodes exist
    const hasUserStart = nodes.some(n => n.id === "start-user");
    const hasPlotStart = nodes.some(n => n.id === "start-plot");
    const hasUserEnd = nodes.some(n => n.id === "end-user");
    const hasPlotEnd = nodes.some(n => n.id === "end-plot");

    // Add missing START nodes (left side)
    if (!hasUserStart) {
      nodes.push({
        id: "start-user",
        type: NodeType.START,
        position: { x: 0, y: 150 },
        data: {
          startType: StartNodeType.USER,
        },
        deletable: false,
        zIndex: 1000,
      });
    }

    if (!hasPlotStart) {
      nodes.push({
        id: "start-plot",
        type: NodeType.START,
        position: { x: 0, y: 300 },
        data: {
          startType: StartNodeType.PLOT,
        },
        deletable: false,
        zIndex: 1000,
      });
    }

    // Add missing END nodes (right side)
    if (!hasUserEnd) {
      nodes.push({
        id: "end-user",
        type: NodeType.END,
        position: { x: 870, y: 150 },
        data: {
          endType: EndNodeType.USER,
          agentId: "end-user",
        },
        deletable: false,
        zIndex: 1000,
      });
    }

    if (!hasPlotEnd) {
      nodes.push({
        id: "end-plot",
        type: NodeType.END,
        position: { x: 870, y: 300 },
        data: {
          endType: EndNodeType.PLOT,
          agentId: "end-plot",
        },
        deletable: false,
        zIndex: 1000,
      });
    }
  }

  /**
   * Convert database row to domain entity
   */
  public static toDomain(row: SelectFlow): Flow {
    try {

      // Parse panel structure if exists
      const panelStructure = row.panel_structure as any;

      // Parse viewport if exists
      const viewport = row.viewport as any;

      // Parse data store schema if exists
      const dataStoreSchema = row.data_store_schema as any;

      // Transparent migrations (backward compatibility)
      const nodes = row.nodes as any[];
      this.ensureEndNodeTypes(nodes);        // Add endType to END nodes
      this.ensureMultiPathNodes(nodes);      // Add missing User/Plot START/END nodes

      // Create flow entity
      const flowOrError = Flow.create(
        {
          name: row.name,
          description: row.description,
          nodes: nodes,
          edges: row.edges as any[],
          responseTemplate: row.response_template,
          responseTemplateUser: row.response_template_user || '',
          responseTemplatePlot: row.response_template_plot || '',
          dataStoreSchema,
          panelStructure,
          viewport,
          readyState: (row.ready_state as ReadyState) || ReadyState.Draft,
          validationIssues: row.validation_issues as any,
        },
        new UniqueEntityID(row.id),
      );

      // Check error
      if (flowOrError.isFailure) {
        logger.error(flowOrError.getError());
        throw new Error(flowOrError.getError());
      }

      // Return flow
      const flow = flowOrError.getValue();
      
      return flow;
    } catch (error) {
      logger.error(`Failed to convert flow row to domain: ${error}`);
      throw error;
    }
  }

  /**
   * Convert domain entity to database row
   */
  public static toPersistence(flow: Flow): InsertFlow {
    try {
      const props = flow.props;


      const result = {
        id: flow.id.toString(),
        name: props.name,
        description: props.description,
        nodes: props.nodes,
        edges: props.edges,
        response_template: props.responseTemplate,
        response_template_user: props.responseTemplateUser || '',
        response_template_plot: props.responseTemplatePlot || '',
        data_store_schema: props.dataStoreSchema,
        panel_structure: props.panelStructure,
        viewport: props.viewport,
        ready_state: props.readyState,
        validation_issues: props.validationIssues,
        created_at: props.createdAt,
        updated_at: props.updatedAt,
      };


      return result;
    } catch (error) {
      logger.error(`Failed to convert flow domain to row: ${error}`);
      throw error;
    }
  }

  /**
   * Convert domain entity to storage with timestamps
   */
  public static toStorage(flow: Flow): InsertFlow {
    const row = this.toPersistence(flow);
    return {
      ...row,
      created_at: flow.props.createdAt,
      updated_at: flow.props.updatedAt,
    };
  }
}
