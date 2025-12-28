import { Guard } from "@/shared/core/guard";
import { Result } from "@/shared/core/result";
import { ValueObject } from "@/shared/domain";
import type { CompressionSegment } from "@/entities/compression/domain/types";

export interface DataStoreSavedField {
  id: string; // DataStoreSchemaField.id
  name: string; // DataStoreSchemaField.name
  type: string; // DataStoreSchemaField.type
  value: string;
}

export interface OptionProps {
  // Content
  content: string;
  tokenSize: number;
  variables?: object;
  assetId?: string;

  // Data Store
  dataStore: DataStoreSavedField[];

  // Translation
  translations: Map<string, string>;

  // Compression (stored in first option of each turn)
  compressionSegments?: CompressionSegment[];
  compressedText?: string; // Pre-built compressed XML: <characterName><anchor1/><anchor2/>...</characterName>
}

export interface OptionJSON {
  content: string;
  tokenSize: number;
  variables?: object;
  assetId?: string;
  dataStore?: DataStoreSavedField[];
  translations: Record<string, string>;

  // Compression data (stored in first option of each turn)
  compressionSegments?: CompressionSegment[];
  compressedText?: string; // Pre-built compressed XML
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

  get dataStore(): DataStoreSavedField[] {
    return this.props.dataStore;
  }

  get assetId(): string | undefined {
    return this.props.assetId;
  }

  get compressionSegments(): CompressionSegment[] | undefined {
    return this.props.compressionSegments;
  }

  get compressedText(): string | undefined {
    return this.props.compressedText;
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
      dataStore: props.dataStore ?? [],
      assetId: props.assetId,
      compressionSegments: props.compressionSegments,
      compressedText: props.compressedText,
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

  public withDataStore(dataStore: DataStoreSavedField[]): Result<Option> {
    return Option.create({ ...this.props, dataStore });
  }

  public withTranslation(
    language: string,
    translation: string,
  ): Result<Option> {
    const newTranslations = new Map(this.props.translations);
    newTranslations.set(language, translation);
    return Option.create({ ...this.props, translations: newTranslations });
  }

  public withAssetId(assetId: string | undefined): Result<Option> {
    return Option.create({ ...this.props, assetId });
  }

  public toJSON(): OptionJSON {
    return {
      content: this.props.content,
      tokenSize: this.props.tokenSize,
      variables: this.props.variables,
      assetId: this.props.assetId,
      dataStore: this.props.dataStore,
      translations: Object.fromEntries(
        this.props.translations?.entries() ?? [],
      ),
      compressionSegments: this.props.compressionSegments,
      compressedText: this.props.compressedText,
    };
  }

  public static fromJSON(json: OptionJSON): Result<Option> {
    return Option.create({
      content: json.content,
      tokenSize: json.tokenSize,
      variables: json.variables,
      assetId: json.assetId,
      dataStore: json.dataStore ?? [],
      translations: new Map(Object.entries(json.translations)),
      compressionSegments: json.compressionSegments,
      compressedText: json.compressedText,
    });
  }
}
