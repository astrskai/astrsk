import { SchemaFieldType } from "@/entities/agent/domain/agent";
import { BasePanelProps } from "@/features/flow/flow-multi/types/panel";

export interface StructuredOutputPanelProps extends BasePanelProps {
  // No additional props needed - inherits all from BasePanelProps
}

export interface SchemaFieldItem {
  id: string;
  name: string;
  description: string;
  type: SchemaFieldType;
  required: boolean;
  array: boolean;
  enabled: boolean;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: string[];
}