export interface FontStyle {
  fontSize?: number | null;
  color?: string | null;
}

export interface TextStyle {
  base?: FontStyle | null;
  italic?: FontStyle | null;
  bold?: FontStyle | null;
}

export interface ChatBubbleStyle {
  backgroundColor?: string | null;
}

export interface ChatStyle {
  // Font
  text?: TextStyle | null;

  // Chat bubble
  chatBubble?: ChatBubbleStyle | null;
}

export interface ChatStyles {
  user?: ChatStyle | null;
  ai?: ChatStyle | null;
}

export interface TranslationConfigJSON {
  displayLanguage: string;
  promptLanguage: string;
}

export interface CardListItemJson {
  id: string;
  type: string;
  enabled: boolean;
}
