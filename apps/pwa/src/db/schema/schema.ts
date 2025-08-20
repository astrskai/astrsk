import { agents } from "@/db/schema/agents";
import { apiConnections } from "@/db/schema/api-connections";
import { assets } from "@/db/schema/assets";
import { backgrounds } from "@/db/schema/backgrounds";
import { cards } from "@/db/schema/cards";
import { characterCards } from "@/db/schema/character-cards";
import { dataStoresNodes } from "@/db/schema/data-store-nodes";
import { flows } from "@/db/schema/flows";
import { plotCards } from "@/db/schema/plot-cards";
import { sessions } from "@/db/schema/sessions";
import { turns } from "@/db/schema/turns";

export const Schema = {
  // Common
  assets,

  // API
  apiConnections,

  // Flow
  flows,
  agents,
  dataStoresNodes,

  // Card
  cards,
  characterCards,
  plotCards,

  // Session
  sessions,
  turns,
  backgrounds,
} as const;
