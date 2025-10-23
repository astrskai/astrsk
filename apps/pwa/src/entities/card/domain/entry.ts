import { Result } from "@/shared/core";
import { UniqueEntityID, ValueObject } from "@/shared/domain";

export interface EntryProps {
  id: UniqueEntityID;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

const defaultEntryProps: EntryProps = {
  id: new UniqueEntityID(),
  name: "",
  enabled: true,
  keys: [],
  recallRange: 2,
  content: "",
};

interface EntryPropsJSON {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

export class Entry extends ValueObject<EntryProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name || "";
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get keys(): string[] {
    return this.props.keys;
  }

  get recallRange(): number {
    return this.props.recallRange;
  }

  get content(): string {
    return this.props.content;
  }

  public static create(props: Partial<EntryProps>): Result<Entry> {
    // TODO: validation and handling fail (https://github.com/harpychat/h2o-app-nextjs/pull/50#discussion_r1830262382)
    const entryProps = {
      ...defaultEntryProps,
      ...props,
      id: props.id || new UniqueEntityID(),
    };
    const entry = new Entry(entryProps);
    return Result.ok(entry);
  }

  public withName(name: string): Result<Entry> {
    return Entry.create({ ...this.props, name });
  }

  public withEnabled(enabled: boolean): Result<Entry> {
    return Entry.create({ ...this.props, enabled });
  }

  public withKeys(keys: string[]): Result<Entry> {
    return Entry.create({ ...this.props, keys });
  }

  public withRecallRange(recallRange: number): Result<Entry> {
    return Entry.create({ ...this.props, recallRange });
  }

  public withContent(content: string): Result<Entry> {
    return Entry.create({ ...this.props, content });
  }

  // TODO: make mapper
  public toJSON(): EntryPropsJSON {
    return {
      ...this.props,
      id: this.props.id.toString(),
    };
  }

  // TODO: make mapper
  public static fromJSON(json: EntryPropsJSON): Result<Entry> {
    if (!json.name) {
      json.name = json.keys.join(",");
    }
    const entry = Entry.create({
      id: new UniqueEntityID(json.id),
      name: json.name ?? "",
      enabled: json.enabled ?? true,
      keys: json.keys ?? [],
      recallRange: json.recallRange ?? 2,
      content: json.content ?? "",
    });
    return entry;
  }
}
