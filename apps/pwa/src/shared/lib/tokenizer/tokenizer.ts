"use client";

import { TokenizerType } from "@/shared/task/domain/prompt-and-model";
import { OpenAITokenizer } from "@/shared/lib/tokenizer/openai-tokenizer";

export interface Tokenizer {
  encode(text: string): number[];
  decode(tokenIds: number[]): string;
}

export const getTokenizer = async (
  tokenizerType: TokenizerType = TokenizerType.OpenAI,
) => {
  return OpenAITokenizer.instance;
};
