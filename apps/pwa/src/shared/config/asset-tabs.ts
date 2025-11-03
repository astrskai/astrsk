import { TabConfig } from "@/widgets/list-page-header";

export type AssetType = "characters" | "plots" | "flows";

export const ASSET_TABS: TabConfig[] = [
  { label: "Characters", to: "/assets/characters", value: "characters" },
  { label: "Plots", to: "/assets/plots", value: "plots" },
  { label: "Flows", to: "/assets/flows", value: "flows" },
];
