import { Guard, Result } from "@/shared/core";
import { Entity, UniqueEntityID } from "@/shared/domain";
import {
  CreatePromptBlockProps,
  Message,
  MessageRole,
  PromptBlockProps,
  PromptBlockType,
  regexGetVariables,
  Renderable,
  RenderContextWithVariables,
} from "@/shared/prompt/domain";
import { formatFail } from "@/shared/lib";
import { TemplateRenderer } from "@/shared/lib/template-renderer";

export type CreatePlainBlockProps = CreatePromptBlockProps;
export type UpdatePlainBlockProps = CreatePlainBlockProps;

export class PlainBlock extends Entity<PromptBlockProps> implements Renderable {
  get name(): string {
    return this.props.name;
  }

  get type(): PromptBlockType {
    return this.props.type;
  }

  get template(): string | undefined {
    return this.props.template;
  }

  get isDeleteUnnecessaryCharacters(): boolean | undefined {
    return this.props.isDeleteUnnecessaryCharacters;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreatePlainBlockProps,
    id?: UniqueEntityID,
  ): Result<PlainBlock> {
    const requiredGuard = Guard.hasRequiredProps(props, ["name"]);
    if (requiredGuard.isFailure) {
      return formatFail(
        "Failed to create PlainBlock",
        requiredGuard.getError(),
      );
    }

    const plainBlock = new PlainBlock(
      {
        // Default values for required props
        name: "",
        template: "",
        isDeleteUnnecessaryCharacters: false,

        // Spread input props
        ...props,

        // Fixed values & Set by system
        type: PromptBlockType.Plain,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? new UniqueEntityID(),
    );

    return Result.ok<PlainBlock>(plainBlock);
  }

  public update(props: UpdatePlainBlockProps): Result<void> {
    try {
      Object.assign(this.props, props);
      this.props.updatedAt = new Date();
      return Result.ok<void>();
    } catch (error) {
      return formatFail("Failed to update PlainBlock", error);
    }
  }

  public async renderMessages(
    context: RenderContextWithVariables,
  ): Promise<Result<Message[]>> {
    const requiredGuard = Guard.hasRequiredProps(this.props, ["template"]);
    if (requiredGuard.isFailure) {
      return formatFail("Failed to render messages", requiredGuard.getError());
    }

    const message = {
      role: MessageRole.System,
      content: await TemplateRenderer.render(
        this.props.template ?? "",
        context,
        {
          isDeleteUnnecessaryCharacters:
            this.props.isDeleteUnnecessaryCharacters,
        },
      ),
    };

    return Promise.resolve(Result.ok<Message[]>([message]));
  }

  public async renderPrompt(
    context: RenderContextWithVariables,
  ): Promise<Result<string>> {
    const requiredGuard = Guard.hasRequiredProps(this.props, ["template"]);
    if (requiredGuard.isFailure) {
      return formatFail("Failed to render prompt", requiredGuard.getError());
    }

    const prompt = await TemplateRenderer.render(
      this.props.template ?? "",
      context,
      {
        isDeleteUnnecessaryCharacters: this.props.isDeleteUnnecessaryCharacters,
      },
    );

    return Promise.resolve(Result.ok<string>(prompt));
  }

  public getVariables(): string[] {
    const template = this.props.template ?? "";
    const variables = Array.from(template.matchAll(regexGetVariables));
    return variables?.map((matched) => matched[1].trim()) ?? [];
  }

  // TODO: remove this method
  public toJSON() {
    return {
      ...this.props,
      id: this.id.toValue(),
    };
  }

  // TODO: remove this method
  public static fromJSON(json: any): Result<PlainBlock> {
    try {
      const props: PromptBlockProps = {
        name: json.name,

        template: json.template,
        isDeleteUnnecessaryCharacters: json.isDeleteUnnecessaryCharacters,

        type: json.type,
        createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
        updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
      };

      const plainBlock = new PlainBlock(props, new UniqueEntityID(json.id));

      return Result.ok<PlainBlock>(plainBlock);
    } catch (error) {
      console.error("Error creating PlainBlock from JSON:", error);
      return formatFail("Failed to create PlainBlock from JSON", error);
    }
  }
}
