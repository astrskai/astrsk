export interface DataStoreSavedField {
  id: string; // DataStoreSchemaField.id
  name: string; // DataStoreSchemaField.name
  type: string; // DataStoreSchemaField.type
  value: string;
}

export interface OptionJSON {
  content: string;
  tokenSize: number;
  variables?: object;
  assetId?: string;
  dataStore?: DataStoreSavedField[];
  translations: Record<string, string>;
}
