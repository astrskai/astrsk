export const TableName = {
  // Common
  Assets: "assets",

  // API
  ApiConnections: "api_connections",

  // Agent
  Agents: "agents",

  // Flow
  Flows: "flows",

  // Card
  Cards: "cards",
  CharacterCards: "character_cards",
  PlotCards: "plot_cards",

  // Session
  Sessions: "sessions",
  Turns: "turns",
  Backgrounds: "backgrounds",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
