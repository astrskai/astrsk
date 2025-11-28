"use client";

import { OpenAITokenizer } from "@/shared/lib/tokenizer/openai-tokenizer";

export interface Tokenizer {
  encode(text: string): number[];
  decode(tokenIds: number[]): string;
}

export function getTokenizer(): Tokenizer {
  return OpenAITokenizer.instance;
}
