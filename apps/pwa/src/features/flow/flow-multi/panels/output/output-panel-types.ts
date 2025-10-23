import { SchemaFieldType } from "@/modules/agent/domain/agent";

export interface OutputPanelProps {
  flowId: string;
  agentId?: string;
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