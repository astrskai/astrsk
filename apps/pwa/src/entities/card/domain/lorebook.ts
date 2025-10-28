import { Result } from "@/shared/core";
import { ValueObject } from "@/shared/domain";

import { Entry } from "@/entities/card/domain/entry";

export interface LorebookProps {
  entries: Entry[];
}

const defaultLorebookProps: LorebookProps = {
  entries: [],
};

export interface LorebookJSON {
  entries: ReturnType<Entry["toJSON"]>[];
}

export type SearchEntriesQuery = {
  // Pagination
  limit?: number;
  offset?: number;

  // Search
  keyword?: string;
};

export class Lorebook extends ValueObject<LorebookProps> {
  get entries(): Entry[] {
    return this.props.entries;
  }

  public static create(props: Partial<LorebookProps>): Result<Lorebook> {
    const lorebookProps = { ...defaultLorebookProps, ...props };
    const lorebook = new Lorebook(lorebookProps);
    return Result.ok(lorebook);
  }

  public withEntries(entries: Entry[]): Result<Lorebook> {
    // TODO: clone entries (https://github.com/harpychat/h2o-app-nextjs/pull/50#discussion_r1830264675)
    return Lorebook.create({ ...this.props, entries });
  }

  public searchEntries(query: SearchEntriesQuery): Result<Entry[]> {
    let filteredEntries = this.props.entries;

    if (query.keyword) {
      const lowercaseKeyword = query.keyword.toLowerCase();
      filteredEntries = filteredEntries.filter(
        (entry) =>
          entry.props.name?.toLowerCase().includes(lowercaseKeyword) ||
          entry.props.keys.some((key) =>
            key.toLowerCase().includes(lowercaseKeyword),
          ) ||
          entry.props.content.toLowerCase().includes(lowercaseKeyword),
      );
    }

    if (query.offset) {
      filteredEntries = filteredEntries.slice(query.offset);
    }

    if (query.limit) {
      filteredEntries = filteredEntries.slice(0, query.limit);
    }

    return Result.ok<Entry[]>(filteredEntries);
  }

  public scanHistory(history: string[]): Result<Entry[]> {
    const activatedEntries = this.props.entries.filter((entry) => {
      if (!entry.props.enabled) return false;

      const historyToScan = history.slice(0, entry.props.recallRange);
      return entry.props.keys.some((key) =>
        historyToScan.some((message) =>
          message.toLowerCase().includes(key.toLowerCase()),
        ),
      );
    });

    return Result.ok<Entry[]>(activatedEntries);
  }

  public toJSON(): LorebookJSON {
    return {
      entries: this.props.entries.map((entry) => entry.toJSON()),
    };
  }

  public static fromJSON(json: LorebookJSON): Result<Lorebook> {
    const entries = json.entries.map((entry) =>
      Entry.fromJSON(entry).getValue(),
    );
    const lorebook = new Lorebook({ entries });
    return Result.ok(lorebook);
  }
}
