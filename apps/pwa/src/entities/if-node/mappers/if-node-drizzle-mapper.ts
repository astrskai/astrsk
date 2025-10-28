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

  public static toDomain(data: any): IfNode {
    const ifNodeOrError = IfNode.create(
      {
        flowId: data.flow_id || data.flowId,
        name: data.name.trim() || "Untitled If Node",
        color: data.color || "#3b82f6",
        logicOperator: data.logic_operator || data.logicOperator || "AND",
        conditions: data.conditions ? parse(data.conditions) || [] : [],
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
