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

  // Card (Old - kept as backup for recovery tool)
  Cards: "cards",
  CharacterCards: "character_cards",
  PlotCards: "plot_cards",

  // Card (New)
  Characters: "characters",
  Scenarios: "scenarios",

  // Session
  Sessions: "sessions",
  Turns: "turns",
  Backgrounds: "backgrounds",
  GeneratedImages: "generated_images",
  
  // Vibe Session
  VibeSessions: "vibe_sessions",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
