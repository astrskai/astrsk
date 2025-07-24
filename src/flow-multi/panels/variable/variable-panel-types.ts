export interface VariablePanelProps {
  flowId: string;
}

export interface VariableItem {
  id: string;
  name: string;
  value: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
}