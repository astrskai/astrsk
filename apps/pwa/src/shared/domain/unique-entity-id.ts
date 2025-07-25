import { registerCustom } from "superjson";
import { v7 as uuidv7 } from "uuid";

import { Identifier } from "@/shared/domain/identifier";

export class UniqueEntityID extends Identifier<string> {
  constructor(id?: string) {
    super(id ? id : uuidv7());
  }

  get [Symbol.toStringTag](): string {
    return "UniqueEntityID";
  }

  static isUniqueEntityID(obj: any): obj is UniqueEntityID {
    return (
      obj instanceof UniqueEntityID ||
      (obj && Object.prototype.toString.call(obj) === "[object UniqueEntityID]")
    );
  }
}

registerCustom<UniqueEntityID, string>(
  {
    isApplicable: (v): v is UniqueEntityID =>
      UniqueEntityID.isUniqueEntityID(v),
    serialize: (v) => v.toValue(),
    deserialize: (v) => new UniqueEntityID(v),
  },
  "UniqueEntityID",
);
