import { Result } from "@/shared/core";
import {
  PlainBlock,
  UpdatePlainBlockProps,
} from "@/shared/prompt/domain";
import { formatFail, PartialOmit } from "@/shared/utils";

export const PromptBlockType = {
  Plain: "plain",
} as const;

export type PromptBlockType =
  (typeof PromptBlockType)[keyof typeof PromptBlockType];

export const MessageRole = {
  System: "system",
  User: "user",
  Assistant: "assistant",
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export interface PromptBlockProps {
  // Metadata
  name: string;

  // Common
  template?: string;
  isDeleteUnnecessaryCharacters?: boolean; // TODO: rename property

  // Set by System
  type: PromptBlockType;
  createdAt: Date;
  updatedAt: Date;
}

export const PromptBlockPropsKeys = [
  "name",
  "template",
  "isDeleteUnnecessaryCharacters",
  "type",
  "createdAt",
  "updatedAt",
];

export type CreatePromptBlockProps = PartialOmit<PromptBlockProps, "type">;

export type UpdatePromptBlockProps =
  | UpdatePlainBlockProps;

export type PromptBlock = PlainBlock;

export function isPlainBlock(block: PromptBlock): block is PlainBlock {
  return block.type === PromptBlockType.Plain;
}

export function parsePromptBlock(doc: any): Result<PromptBlock> {
  try {
    switch (doc.type) {
      case PromptBlockType.Plain:
        return PlainBlock.fromJSON(doc);

      default:
        return formatFail("Unknown prompt block type", doc.type);
    }
  } catch (error) {
    return formatFail("Failed to parse prompt block", error);
  }
}
