import { UniqueEntityID } from "@/shared/domain";
import { IfNode } from "../domain";
import { SelectIfNode, InsertIfNode } from "@/db/schema/if-nodes";

export class IfNodeMapper {
  public static toDomain(raw: SelectIfNode): IfNode {
    const ifNodeOrError = IfNode.create(
      {
        flowId: raw.flow_id,
        name: raw.name,
        color: raw.color,
        logicOperator: (raw.logicOperator as 'AND' | 'OR') || 'AND',
        conditions: raw.conditions || [],
      },
      new UniqueEntityID(raw.id),
    );

    if (ifNodeOrError.isFailure) {
      throw new Error(ifNodeOrError.getError());
    }

    return ifNodeOrError.getValue();
  }

  public static toPersistence(ifNode: IfNode): InsertIfNode {
    return {
      id: ifNode.id.toString(),
      flow_id: ifNode.flowId,
      name: ifNode.name,
      color: ifNode.color,
      logicOperator: ifNode.logicOperator,
      conditions: ifNode.conditions,
      created_at: ifNode.createdAt,
      updated_at: ifNode.updatedAt,
    };
  }
}