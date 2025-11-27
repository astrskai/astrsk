import { agents } from "@/db/schema/agents";
import { apiConnections } from "@/db/schema/api-connections";
import { assets } from "@/db/schema/assets";
import { backgrounds } from "@/db/schema/backgrounds";
import { cards } from "@/db/schema/cards";
import { characterCards } from "@/db/schema/character-cards";
import { characters } from "@/db/schema/characters"; // ✅ New
import { dataStoresNodes } from "@/db/schema/data-store-nodes";
import { flows } from "@/db/schema/flows";
import { generatedImages } from "@/db/schema/generated-images";
import { ifNodes } from "@/db/schema/if-nodes";
import { plotCards } from "@/db/schema/plot-cards";
import { scenarios } from "@/db/schema/scenarios"; // ✅ New
import { sessions } from "@/db/schema/sessions";
import { turns } from "@/db/schema/turns";
import { vibeSessions } from "@/db/schema/vibe-sessions";

export const Schema = {
  // Common
  assets,

  // API
  apiConnections,

  // Flow
  flows,
  agents,
  dataStoresNodes,
  ifNodes,

  // Card (Old - will be removed after migration)
  cards,
  characterCards,
  plotCards,

  // Card (New)
  characters,
  scenarios,

  // Session
  sessions,
  turns,
  backgrounds,
  generatedImages,
  
  // Vibe Session
  vibeSessions,
} as const;
