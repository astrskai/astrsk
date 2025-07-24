// Types for the compact prompt panel
export interface PromptPanelProps {
  flowId: string;
  agentId: string;
}

export interface PromptItem {
  id: string;
  label: string;
  enabled: boolean; // Controls whether message is active and included in preview/save
  content: string;
  role: "system" | "user" | "assistant";
  type?: "regular" | "history";
  // History-specific fields
  start?: number;
  end?: number;
  countFromEnd?: boolean; // If true, count from newest to oldest; if false, count from oldest to newest
}