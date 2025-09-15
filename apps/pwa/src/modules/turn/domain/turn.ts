import { Guard, Result } from "@/shared/core";
import { Entity, UniqueEntityID } from "@/shared/domain";

import { DataStoreSavedField, Option } from "@/modules/turn/domain/option";

export interface TurnProps {
  // Session
  sessionId: UniqueEntityID;

  // Character
  characterCardId?: UniqueEntityID;
  characterName?: string;

  // Options
  options: Option[];
  selectedOptionIndex: number;

  // Set by System
  createdAt: Date;
  updatedAt: Date;
}

type CreateTurnProps = Partial<TurnProps>;

export class Turn extends Entity<TurnProps> {
  get sessionId(): UniqueEntityID {
    return this.props.sessionId;
  }

  get characterCardId(): UniqueEntityID | undefined {
    return this.props.characterCardId;
  }

  get characterName(): string | undefined {
    return this.props.characterName;
  }

  get options(): Option[] {
    return this.props.options;
  }

  get selectedOption(): Option {
    return this.props.options[this.props.selectedOptionIndex];
  }

  get selectedOptionIndex(): number {
    return this.props.selectedOptionIndex;
  }

  get content(): string {
    return this.selectedOption.content;
  }

  get variables(): object | undefined {
    return this.selectedOption.variables;
  }

  get tokenSize(): number {
    return this.selectedOption.tokenSize;
  }

  get translations(): Map<string, string> {
    return this.selectedOption.translations;
  }

  get dataStore(): DataStoreSavedField[] {
    return this.selectedOption.dataStore;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateTurnProps,
    id?: UniqueEntityID,
  ): Result<Turn> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.sessionId, argumentName: "sessionId" },
      { argument: props.options, argumentName: "options" },
    ]);
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getError());
    }

    const defaultProps: TurnProps = {
      sessionId: props.sessionId || new UniqueEntityID(),
      characterCardId: props.characterCardId,
      characterName: props.characterName,
      options: props.options || [],
      selectedOptionIndex: props.selectedOptionIndex || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
    const turn = new Turn(defaultProps, id);
    return Result.ok(turn);
  }

  public setContent(content: string): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withContent(content)
      .getValue();
  }

  public setTokenSize(tokenSize: number): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withTokenSize(tokenSize)
      .getValue();
  }

  public setVariables(variables: object): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withVariables(variables)
      .getValue();
  }

  public setTranslation(language: string, translation: string): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withTranslation(language, translation)
      .getValue();
  }

  public setDataStore(dataStore: DataStoreSavedField[]): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withDataStore(dataStore)
      .getValue();
  }

  public setAssetId(assetId: string | undefined): void {
    this.options[this.props.selectedOptionIndex] = this.selectedOption
      .withAssetId(assetId)
      .getValue();
  }

  public addOption(option: Option): void {
    this.props.options.push(option);
    this.props.selectedOptionIndex = this.props.options.length - 1;
  }

  public hasPrevOption(): boolean {
    return this.props.selectedOptionIndex > 0;
  }

  public prevOption(): void {
    if (this.props.selectedOptionIndex > 0) {
      this.props.selectedOptionIndex -= 1;
    }
  }

  public hasNextOption(): boolean {
    return this.props.selectedOptionIndex < this.props.options.length - 1;
  }

  public nextOption(): void {
    if (this.props.selectedOptionIndex < this.props.options.length - 1) {
      this.props.selectedOptionIndex += 1;
    }
  }
}
