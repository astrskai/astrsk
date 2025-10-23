export interface ParameterPanelProps {
  flowId: string;
  agentId?: string;
}

export interface ParameterItem {
  id: string;
  name: string;
  enabled: boolean;
  value: any;
  default: any;
  type: string;
  description?: string;
}