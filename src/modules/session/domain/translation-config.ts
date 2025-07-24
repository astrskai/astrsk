import { Result } from "@/shared/core/result";
import { ValueObject } from "@/shared/domain";

export interface TranslationConfigProps {
  displayLanguage: string;
  promptLanguage: string;
}

export interface TranslationConfigJSON {
  displayLanguage: string;
  promptLanguage: string;
}

export class TranslationConfig extends ValueObject<TranslationConfigProps> {
  get displayLanguage(): string {
    return this.props.displayLanguage;
  }

  get promptLanguage(): string {
    return this.props.promptLanguage;
  }

  public static create(
    props: TranslationConfigProps,
  ): Result<TranslationConfig> {
    const translationConfig = new TranslationConfig({
      displayLanguage: props.displayLanguage || "none",
      promptLanguage: props.promptLanguage || "none",
    });

    return Result.ok(translationConfig);
  }

  public withDisplayLanguage(
    displayLanguage: string,
  ): Result<TranslationConfig> {
    return TranslationConfig.create({
      ...this.props,
      displayLanguage,
    });
  }

  public withPromptLanguage(promptLanguage: string): Result<TranslationConfig> {
    return TranslationConfig.create({
      ...this.props,
      promptLanguage,
    });
  }

  public toJSON(): TranslationConfigJSON {
    return {
      displayLanguage: this.displayLanguage,
      promptLanguage: this.promptLanguage,
    };
  }

  public static fromJSON(json: TranslationConfigJSON): Result<TranslationConfig> {
    return TranslationConfig.create({
      displayLanguage: json.displayLanguage,
      promptLanguage: json.promptLanguage,
    });
  }
}
