import { Result } from "@/shared/core/result";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { PartialOmit } from "@/shared/lib";
import { DataStoreField } from "@/modules/flow/domain/flow";

export interface DataStoreNodeProps {
  flowId: string;
  name: string;
  color: string;
  dataStoreFields: DataStoreField[];

  // Set by System
  createdAt: Date;
  updatedAt?: Date;
}

export type CreateDataStoreNodeProps = PartialOmit<
  DataStoreNodeProps,
  "createdAt" | "updatedAt"
>;
export type UpdateDataStoreNodeProps = Partial<CreateDataStoreNodeProps>;

export class DataStoreNode extends AggregateRoot<DataStoreNodeProps> {
  get flowId(): string {
    return this.props.flowId;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get dataStoreFields(): DataStoreField[] {
    return this.props.dataStoreFields;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateDataStoreNodeProps,
    id?: UniqueEntityID,
  ): Result<DataStoreNode> {
    // Validate required props
    if (!props.flowId) {
      return Result.fail("DataStoreNode must have a flowId");
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail("DataStoreNode must have a non-empty name");
    }

    // Create new data store node
    const dataStoreNode = new DataStoreNode(
      {
        // Required props
        flowId: props.flowId,
        name: props.name,

        // Default values
        color: props.color || "#3b82f6",
        dataStoreFields: props.dataStoreFields || [],

        // Set by System
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? new UniqueEntityID(),
    );

    return Result.ok(dataStoreNode);
  }

  public update(props: UpdateDataStoreNodeProps): Result<DataStoreNode> {
    try {
      // Validate name if provided
      if (props.name !== undefined && props.name.trim().length === 0) {
        return Result.fail("DataStoreNode name cannot be empty");
      }

      // Update props - only update properties that are explicitly passed
      const filteredProps = Object.entries(props).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as any,
      );

      Object.assign(this.props, {
        ...filteredProps,
        updatedAt: new Date(),
      });

      return Result.ok(this);
    } catch (error) {
      console.error(error);
      return Result.fail(`Failed to update DataStoreNode: ${error}`);
    }
  }

  public updateName(name: string): Result<DataStoreNode> {
    return this.update({ name });
  }

  public updateColor(color: string): Result<DataStoreNode> {
    return this.update({ color });
  }

  public updateFields(
    dataStoreFields: DataStoreField[],
  ): Result<DataStoreNode> {
    return this.update({ dataStoreFields });
  }
}
