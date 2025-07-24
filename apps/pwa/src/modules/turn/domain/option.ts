import { Guard } from "@/shared/core/guard";
import { Result } from "@/shared/core/result";
import { ValueObject } from "@/shared/domain";

export interface OptionProps {
  // Content
  content: string;
  tokenSize: number;
  variables?: object;

  // Translation
  translations: Map<string, string>;
}

export interface OptionJSON {
  content: string;
  tokenSize: number;
  variables?: object;
  translations: Record<string, string>;
}

export class Option extends ValueObject<OptionProps> {
  get content(): string {
    return this.props.content;
  }

  get tokenSize(): number {
    return this.props.tokenSize;
  }

  get variables(): object | undefined {
    return this.props.variables;
  }

  get translations(): Map<string, string> {
    return this.props.translations;
  }

  public static create(props: Partial<OptionProps>): Result<Option> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.content, argumentName: "content" },
      { argument: props.tokenSize, argumentName: "tokenSize" },
    ]);
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getError());
    }

    const propsWithDefaults: OptionProps = {
      content: props.content ?? "",
      tokenSize: props.tokenSize ?? 0,
      translations: props.translations ?? new Map<string, string>(),
      variables: props.variables ?? {},
    };
    const option = new Option(propsWithDefaults);
    return Result.ok(option);
  }

  public withContent(content: string): Result<Option> {
    return Option.create({ ...this.props, content, translations: new Map() });
  }

  public withTokenSize(tokenSize: number): Result<Option> {
    return Option.create({ ...this.props, tokenSize });
  }

  public withVariables(variables: object): Result<Option> {
    return Option.create({ ...this.props, variables });
  }

  public withTranslation(
    language: string,
    translation: string,
  ): Result<Option> {
    const newTranslations = new Map(this.props.translations);
    newTranslations.set(language, translation);
    return Option.create({ ...this.props, translations: newTranslations });
  }

  public toJSON(): OptionJSON {
    return {
      content: this.props.content,
      tokenSize: this.props.tokenSize,
      variables: this.props.variables,
      translations: Object.fromEntries(
        this.props.translations?.entries() ?? [],
      ),
    };
  }

  public static fromJSON(json: OptionJSON): Result<Option> {
    return Option.create({
      content: json.content,
      tokenSize: json.tokenSize,
      variables: json.variables,
      translations: new Map(Object.entries(json.translations)),
    });
  }
}
