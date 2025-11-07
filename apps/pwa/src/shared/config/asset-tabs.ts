import { TabConfig } from "@/widgets/list-page-header";

export type AssetType = "character" | "scenario" | "workflow";

export const ASSET_TABS: TabConfig[] = [
  { label: "Character", to: "/assets/characters", value: "character" },
  { label: "Scenario", to: "/assets/scenarios", value: "scenario" },
  { label: "Workflow", to: "/assets/flows", value: "workflow" },
];
