export const TableName = {
  // Common
  Assets: "assets",

  // API
  ApiConnections: "api_connections",

  // Flow
  Flows: "flows",
  Agents: "agents",
  DataStoreNodes: "data_store_nodes",
  IfNodes: "if_nodes",

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
