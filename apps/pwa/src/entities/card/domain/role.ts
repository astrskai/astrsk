import { Result } from "@/shared/core";
import { UniqueEntityID, ValueObject } from "@/shared/domain";

export interface RoleProps {
  id: UniqueEntityID;
  name: string;
  description: string;
}

const defaultRoleProps: RoleProps = {
  id: new UniqueEntityID(),
  name: "",
  description: "",
};

interface RolePropsJSON {
  id: string;
  name: string;
  description: string;
}

export class Role extends ValueObject<RoleProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name || "";
  }

  get description(): string {
    return this.props.description || "";
  }

  public static create(props: Partial<RoleProps>): Result<Role> {
    if (!props.id) {
      props.id = new UniqueEntityID();
    }
    const roleProps = { ...defaultRoleProps, ...props };
    const role = new Role(roleProps);
    return Result.ok(role);
  }

  public withName(name: string): Result<Role> {
    return Role.create({ ...this.props, name });
  }

  public withDescription(description: string): Result<Role> {
    return Role.create({ ...this.props, description });
  }

  public toJSON(): RolePropsJSON {
    return {
      ...this.props,
      id: this.props.id.toString(),
    };
  }

  public static fromJSON(json: RolePropsJSON): Result<Role> {
    const role = Role.create({
      id: new UniqueEntityID(json.id),
      name: json.name,
      description: json.description,
    });
    return role;
  }
}
