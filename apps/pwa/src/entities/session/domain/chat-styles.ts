interface FontStyle {
  fontSize?: number | null;
  color?: string | null;
}

interface TextStyle {
  base?: FontStyle | null;
  italic?: FontStyle | null;
  bold?: FontStyle | null;
}

interface ChatBubbleStyle {
  backgroundColor?: string | null;
}

interface ChatStyle {
  // Font
  text?: TextStyle | null;

  // Chat bubble
  chatBubble?: ChatBubbleStyle | null;
}

interface ChatStyles {
  user?: ChatStyle | null;
  ai?: ChatStyle | null;
}

const defaultChatStyles: ChatStyles = {
  ai: {
    text: {
      base: { fontSize: 16, color: "#d4d4d4" },
      italic: { fontSize: 16, color: "#b59eff" },
      bold: { fontSize: 16, color: "#f1f1f1" },
    },
    chatBubble: {
      backgroundColor: "#313131",
    },
  },
  user: {
    text: {
      base: { fontSize: 16, color: "#64748b" },
      italic: { fontSize: 16, color: "#9372ff" },
      bold: { fontSize: 16, color: "#1b1b1b" },
    },
    chatBubble: {
      backgroundColor: "#e9f6fe",
    },
  },
};

export { defaultChatStyles };
export type { ChatBubbleStyle, ChatStyle, ChatStyles, FontStyle, TextStyle };
