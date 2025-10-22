import { Entry } from "@/modules/card/domain";

/**
 * Form values for card creation and editing
 * Used in card editing dialogs and stores
 */
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
