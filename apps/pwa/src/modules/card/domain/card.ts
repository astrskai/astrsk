import { UniqueEntityID } from "@/shared/domain";

import { CharacterCard } from "@/modules/card/domain/character-card";
import { PlotCard } from "@/modules/card/domain/plot-card";

export const CardType = {
  Character: "character",
  Plot: "plot",
} as const;

export const FilterCardType = {
  ...CardType,
  All: "all",
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];

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
  
  // AI Assistant Panel State
  isCodingPanelOpen?: boolean;

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
  "isCodingPanelOpen",
  "createdAt",
  "updatedAt",
  "tokenCount",
];

export type CreateCardProps = Partial<CardProps>;

export type Card = CharacterCard | PlotCard;
