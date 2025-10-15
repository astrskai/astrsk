import { agents } from "@/schema/agents";
import { apiConnections } from "@/schema/api-connections";
import { assets } from "@/schema/assets";
import { backgrounds } from "@/schema/backgrounds";
import { cards } from "@/schema/cards";
import { characterCards } from "@/schema/character-cards";
import { dataStoresNodes } from "@/schema/data-store-nodes";
import { flows } from "@/schema/flows";
import { generatedImages } from "@/schema/generated-images";
import { ifNodes } from "@/schema/if-nodes";
import { plotCards } from "@/schema/plot-cards";
import { sessions } from "@/schema/sessions";
import { turns } from "@/schema/turns";
import { vibeSessions } from "@/schema/vibe-sessions";

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

  // Card
  cards,
  characterCards,
  plotCards,

  // Session
  sessions,
  turns,
  backgrounds,
  generatedImages,
  
  // Vibe Session
  vibeSessions,
} as const;
