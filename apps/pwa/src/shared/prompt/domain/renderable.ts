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

export type RenderContext = {
  // Characters
  char?: Character;
  user?: Character;
  cast: {
    all?: Character[];
    active?: Character;
    inactive?: Character[];
  };

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

  // Toggle
  toggle?: {
    enabled: Map<string, boolean>;
    values: Map<string, string>;
  };

  // Model Response
  response?: string;
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
