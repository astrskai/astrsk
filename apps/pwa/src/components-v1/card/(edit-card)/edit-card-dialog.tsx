// TODO: remove this file

import { UseFormGetValues, UseFormTrigger } from "react-hook-form";

import { Entry } from "@/modules/card/domain";
import { Card } from "@/modules/card/domain/card";

export interface CardStore {
  // States
  isOpenEditCardDialog: () => boolean;
  selectedCard: () => Card | null;
  getFormValues: () => UseFormGetValues<CardFormValues> | null;
  isFormDirty: () => boolean;
  onSave: () => (() => Promise<boolean>) | null;
  tokenCount: () => number;
  trigger: () => UseFormTrigger<CardFormValues> | null;
  invalidItemIds: () => string[];

  // Actions
  setIsOpenEditCardDialog: () => (isOpen: boolean) => void;
  selectCard: () => (card: Card | null) => void;
  setGetFormValues: () => (
    getValues: UseFormGetValues<CardFormValues> | null,
  ) => void;
  setIsFormDirty: () => (isDirty: boolean) => void;
  setOnSave: () => (onSave: (() => Promise<boolean>) | null) => void;
  setTokenCount: () => (tokenCount: number) => void;
  setTrigger: () => (trigger: UseFormTrigger<CardFormValues> | null) => void;
  setInvalidItemIds: () => (invalidItemIds: string[]) => void;
}

export type CardFormValues = {
  // Metadata
  title: string;
  newIcon?: FileList;
  iconAssetId?: string;
  tags: string[];

  // Creator
  creator?: string;
  cardSummary?: string;
  version?: string;
  conceptualOrigin?: string;

  // For Character
  name?: string;
  description?: string;
  exampleDialogue?: string;

  // For Plot
  scenario?: string;
  firstMessages?: string[];

  // For Character, Plot
  entries?: Entry[];
};
