import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

import { SelectFlow, InsertFlow } from "@/db/schema/flows";
import { Flow } from "@/modules/flow/domain";

export class FlowDrizzleMapper {
  private constructor() {}

  /**
   * Convert database row to domain entity
   */
  public static toDomain(row: SelectFlow): Flow {
    try {
      // Parse panel structure if exists
      const panelStructure = row.panel_structure as any;

      // Parse viewport if exists
      const viewport = row.viewport as any;

      // Create flow entity
      const flowOrError = Flow.create(
        {
          name: row.name,
          description: row.description,
          nodes: row.nodes,
          edges: row.edges as any[],
          responseTemplate: row.response_template,
          panelStructure,
          viewport,
        },
        new UniqueEntityID(row.id),
      );

      // Check error
      if (flowOrError.isFailure) {
        logger.error(flowOrError.getError());
        throw new Error(flowOrError.getError());
      }

      // Return flow
      return flowOrError.getValue();
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

      return {
        id: flow.id.toString(),
        name: props.name,
        description: props.description,
        nodes: props.nodes,
        edges: props.edges,
        response_template: props.responseTemplate,
        panel_structure: props.panelStructure,
        viewport: props.viewport,
      };
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
