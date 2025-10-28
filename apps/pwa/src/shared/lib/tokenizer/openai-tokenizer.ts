"use client";

import { getEncoding } from "js-tiktoken";

import { Tokenizer } from "@/shared/lib/tokenizer/tokenizer";

export class OpenAITokenizer implements Tokenizer {
  private static _instance: OpenAITokenizer;
  private _tokenizer;

  private constructor() {
    this._tokenizer = getEncoding("cl100k_base");
  }

  public static get instance(): OpenAITokenizer {
    if (!OpenAITokenizer._instance) {
      OpenAITokenizer._instance = new OpenAITokenizer();
    }
    return OpenAITokenizer._instance;
  }

  encode(text: string): number[] {
    return this._tokenizer.encode(text);
  }

  decode(tokenIds: number[]): string {
    return this._tokenizer.decode(tokenIds);
  }
}
