import { Result } from "@/shared/core/result";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { PartialOmit } from "@/shared/utils";
import { IfCondition } from "@/flow-multi/nodes/if-node";

export interface IfNodeProps {
  flowId: string;
  name: string;
  color: string;
  logicOperator: 'AND' | 'OR';
  conditions: IfCondition[];
  
  // Set by System
  createdAt: Date;
  updatedAt?: Date;
}

export type CreateIfNodeProps = PartialOmit<IfNodeProps, "createdAt" | "updatedAt">;
export type UpdateIfNodeProps = Partial<CreateIfNodeProps>;

export class IfNode extends AggregateRoot<IfNodeProps> {
  get flowId(): string {
    return this.props.flowId;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get logicOperator(): 'AND' | 'OR' {
    return this.props.logicOperator;
  }

  get conditions(): IfCondition[] {
    return this.props.conditions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateIfNodeProps,
    id?: UniqueEntityID,
  ): Result<IfNode> {
    // Validate required props
    if (!props.flowId) {
      return Result.fail("IfNode must have a flowId");
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail("IfNode must have a non-empty name");
    }

    // Create new if node
    const ifNode = new IfNode(
      {
        // Required props
        flowId: props.flowId,
        name: props.name,
        
        // Default values
        color: props.color || "#3b82f6",
        logicOperator: props.logicOperator || 'AND',
        conditions: props.conditions || [],

        // Set by System
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? new UniqueEntityID(),
    );

    return Result.ok(ifNode);
  }

  public update(props: UpdateIfNodeProps): Result<IfNode> {
    try {
      // Validate name if provided
      if (props.name !== undefined && props.name.trim().length === 0) {
        return Result.fail("IfNode name cannot be empty");
      }

      // Update props - only update properties that are explicitly passed
      const filteredProps = Object.entries(props).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      Object.assign(this.props, {
        ...filteredProps,
        updatedAt: new Date(),
      });

      return Result.ok(this);
    } catch (error) {
      console.error(error);
      return Result.fail(`Failed to update IfNode: ${error}`);
    }
  }

  public updateName(name: string): Result<IfNode> {
    return this.update({ name });
  }

  public updateColor(color: string): Result<IfNode> {
    return this.update({ color });
  }

  public updateLogicOperator(logicOperator: 'AND' | 'OR'): Result<IfNode> {
    return this.update({ logicOperator });
  }

  public updateConditions(conditions: IfCondition[]): Result<IfNode> {
    return this.update({ conditions });
  }
}