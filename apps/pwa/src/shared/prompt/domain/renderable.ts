import { Duration } from "dayjs/plugin/duration";

import { Result } from "@/shared/core";
import { MessageRole } from "@/shared/prompt/domain";

export interface Message {
  role: MessageRole;
  content: string;
}

export interface HistoryItem {
  char_id?: string;
  char_name?: string;
  content: string;
  variables?: Record<string, any>;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  example_dialog: string;
  entries: string[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  entries: string[];
}

export type RenderContext = {
  // Characters
  char?: Character;
  user?: Character;
  cast: {
    all?: Character[];
    active?: Character;
    inactive?: Character[];
  };

  // Scenario (extensions can add more top-level properties)
  scenario?: Scenario;

  // Session
  session: {
    char_entries?: string[];
    plot_entries?: string[];
    entries?: string[];
    scenario?: string;
    duration?: Duration;
    idle_duration?: Duration;
  };

  // History
  history?: HistoryItem[];

  // History count - total number of turns in session (efficient: uses turnIds.length)
  history_count?: number;

  // Toggle
  toggle?: {
    enabled: Map<string, boolean>;
    values: Map<string, string>;
  };

  // Model Response
  response?: string;

  // Data Store (for regeneration context)
  dataStore?: Array<{
    id: string;
    name: string;
    type: string;
    value: string;
  }>;
};

export type RenderContextWithVariables = RenderContext & object;

export const regexGetVariables = new RegExp("{{(.*?)}}", "g");

export interface Renderable {
  renderMessages(
    context: RenderContextWithVariables,
  ): Promise<Result<Message[]>>;
  renderPrompt(context: RenderContextWithVariables): Promise<Result<string>>;
  getVariables(): string[];
}
