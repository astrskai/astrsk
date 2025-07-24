import { SchemaFieldType } from "@/modules/agent/domain/agent";
import { BasePanelProps } from "@/flow-multi/types/panel";

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