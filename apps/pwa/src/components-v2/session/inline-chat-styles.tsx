import {
  ChatBubbleStyle,
  ChatStyle,
  ChatStyles,
  FontStyle,
  TextStyle,
} from "@/modules/session/domain/chat-styles";

const renderFontStyle = (style: FontStyle) => {
  const props: string[] = [];
  if (style.fontSize) {
    props.push(`font-size: ${style.fontSize}px;`);
  }
  if (style.color) {
    props.push(`color: ${style.color};`);
  }
  return props.join("\n");
};

const renderTextStyle = (style: TextStyle) => {
  const props: string[] = [];
  if (style.base) {
    props.push(renderFontStyle(style.base));
  }
  if (style.italic) {
    props.push(`em, i {`);
    props.push(renderFontStyle(style.italic));
    props.push(`}`);
  }
  if (style.bold) {
    props.push(`strong, b {`);
    props.push(renderFontStyle(style.bold));
    props.push(`}`);
  }
  return props.join("\n");
};

const renderChatBubbleStyle = (style: ChatBubbleStyle) => {
  const props: string[] = [];
  if (style.backgroundColor) {
    props.push(`background-color: ${style.backgroundColor};`);
  }
  return props.join("\n");
};

const renderChatStyle = (style?: ChatStyle | null) => {
  const props: string[] = [];
  if (style?.text) {
    props.push(`.chat-style-text {`);
    props.push(renderTextStyle(style.text));
    props.push(`}`);
  }
  if (style?.chatBubble) {
    props.push(`.chat-style-chat-bubble {`);
    props.push(renderChatBubbleStyle(style.chatBubble));
    props.push(`}`);
  }
  return props.join("\n");
};

const renderButtonStyle = (style?: FontStyle | null) => {
  const props: string[] = [];
  props.push(`.message-buttons, textarea {`);
  if (style?.fontSize) {
    props.push(`font-size: ${style.fontSize}px;`);
  }
  if (style?.color) {
    props.push(`color: ${style.color};`);
  }
  props.push(`}`);
  return props.join("\n");
};

const InlineChatStyles = ({
  container = "",
  chatStyles,
}: {
  container?: string;
  chatStyles?: ChatStyles;
}) => {
  return (
    <style>
      {`
${container} .user-chat-style {
${renderChatStyle(chatStyles?.user)}
${renderButtonStyle(chatStyles?.user?.text?.base)}
}
${container} .ai-chat-style {
${renderChatStyle(chatStyles?.ai)}
${renderButtonStyle(chatStyles?.ai?.text?.base)}
}`}
    </style>
  );
};

export { InlineChatStyles };
