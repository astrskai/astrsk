export interface EntryPropsJSON {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

export interface LorebookJSON {
  entries: EntryPropsJSON[];
}
