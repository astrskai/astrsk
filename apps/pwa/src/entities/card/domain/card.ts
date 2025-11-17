import { UniqueEntityID } from "@/shared/domain";

import { CharacterCard } from "@/entities/card/domain/character-card";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";

export const CardType = {
  Character: "character",
  Plot: "plot",         // ⚠️ Deprecated: Use 'Scenario' instead (kept for backward compatibility)
  Scenario: "scenario", // ✅ Preferred: Use this for new code
} as const;

export const FilterCardType = {
  ...CardType,
  All: "all",
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];

// Backward compatibility: Map 'plot' to 'scenario'
export const normalizeCardType = (type: CardType): CardType => {
  return type === "plot" ? "scenario" : type;
};

export interface CardProps {
  // Metadata
  title: string;
  iconAssetId?: UniqueEntityID;
  type: CardType;
  tags: string[];

  // Creator
  creator?: string;
  cardSummary?: string;
  version?: string;
  conceptualOrigin?: string;

  // Vibe Session Reference (AI Assistant)
  vibeSessionId?: string;

  // Image Generation
  imagePrompt?: string;

  // Set by System
  createdAt: Date;
  updatedAt: Date;
  tokenCount?: number;
}

export const CardPropsKeys = [
  "title",
  "iconAssetId",
  "type",
  "tags",
  "creator",
  "cardSummary",
  "version",
  "conceptualOrigin",
  "vibeSessionId",
  "imagePrompt",
  "createdAt",
  "updatedAt",
  "tokenCount",
];

export type CreateCardProps = Partial<CardProps>;

// Union type supporting both old and new card types
export type Card = CharacterCard | PlotCard | ScenarioCard;
