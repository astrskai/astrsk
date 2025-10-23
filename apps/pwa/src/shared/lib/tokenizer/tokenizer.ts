"use client";

import { TokenizerType } from "@/shared/task/domain/prompt-and-model";

export interface Tokenizer {
  encode(text: string): number[];
  decode(tokenIds: number[]): string;
}

export const getTokenizer = async (
  tokenizerType: TokenizerType = TokenizerType.OpenAI,
) => {
  const tokenizer = (await import("@/shared/lib/tokenizer/openai-tokenizer"))
    .OpenAITokenizer.instance;
  return tokenizer;
};
