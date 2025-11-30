import { parse, stringify } from "superjson";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";
import { IfNode } from "@/entities/if-node/domain/if-node";

export class IfNodeDrizzleMapper {
  public static toPersistence(ifNode: IfNode): any {
    return {
      id: ifNode.id.toString(),
      flow_id: ifNode.props.flowId,
      name: ifNode.props.name,
      color: ifNode.props.color,
      logic_operator: ifNode.props.logicOperator,
      conditions: stringify(ifNode.props.conditions),
      created_at: ifNode.props.createdAt,
      updated_at: ifNode.props.updatedAt,
    };
  }

  /**
   * Parse conditions field that may be in different formats:
   * - superjson string (from local DB): '{"json":[...],"meta":{...}}'
   * - regular JSON string (from cloud): '[...]'
   * - already parsed array
   */
  private static parseConditions(conditions: any): any[] {
    if (!conditions) return [];

    // Already an array
    if (Array.isArray(conditions)) return conditions;

    // String - try to parse
    if (typeof conditions === "string") {
      try {
        // First try superjson.parse (for local DB format)
        const superjsonResult = parse(conditions);
        if (Array.isArray(superjsonResult)) {
          return superjsonResult;
        }
      } catch {
        // superjson.parse failed, try regular JSON
      }

      try {
        // Try regular JSON.parse (for cloud format)
        const jsonResult = JSON.parse(conditions);
        if (Array.isArray(jsonResult)) {
          return jsonResult;
        }
        // Check if it's superjson wrapper format
        if (jsonResult && typeof jsonResult === "object" && "json" in jsonResult) {
          return jsonResult.json || [];
        }
      } catch {
        // Both failed
      }
    }

    // Object with json wrapper (already parsed superjson format)
    if (conditions && typeof conditions === "object" && "json" in conditions) {
      return conditions.json || [];
    }

    return [];
  }

  public static toDomain(data: any): IfNode {
    const ifNodeOrError = IfNode.create(
      {
        flowId: data.flow_id || data.flowId,
        name: data.name.trim() || "Untitled If Node",
        color: data.color || "#3b82f6",
        logicOperator: data.logic_operator || data.logicOperator || "AND",
        conditions: this.parseConditions(data.conditions),
      },
      new UniqueEntityID(data.id),
    );

    if (ifNodeOrError.isFailure) {
      logger.error(ifNodeOrError.getError());
      throw new Error(ifNodeOrError.getError());
    }

    const ifNode = ifNodeOrError.getValue();

    // Set timestamps if they exist
    if (data.created_at || data.createdAt) {
      ifNode.props.createdAt = new Date(data.created_at || data.createdAt);
    }
    if (data.updated_at || data.updatedAt) {
      ifNode.props.updatedAt = new Date(data.updated_at || data.updatedAt);
    }

    return ifNode;
  }
}
