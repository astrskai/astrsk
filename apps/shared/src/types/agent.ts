export enum SchemaFieldType {
  String = "string",
  Integer = "integer",
  Number = "number",
  Boolean = "boolean",
  Enum = "enum",
}

export enum ModelTier {
  Light = "light",
  Heavy = "heavy",
}

export type SchemaField = {
  name: string;
  description?: string;
  required: boolean;
  array: boolean;
  type: SchemaFieldType;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maximum?: number;
  exclusiveMaximum?: boolean;
  pattern?: string;
  enum?: string[];
  multipleOf?: number;
};
