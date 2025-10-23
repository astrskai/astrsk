import {
  CreatePromptBlockProps as SharedCreateBlockProps,
  UpdatePromptBlockProps as SharedUpdateBlockProps,
} from "@/shared/prompt/domain";

import { PlainBlock } from "@/entities/agent/domain";

export type CreateBlockProps = SharedCreateBlockProps;
export type UpdateBlockProps = SharedUpdateBlockProps;

export type PromptBlock = PlainBlock;
