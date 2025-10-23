import { Result } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import {
  CreatePlainPromptMessageProps,
  PlainPromptMessage,
  UpdatePlainPromptMessageProps,
  HistoryPromptMessage,
} from "@/modules/agent/domain";

export type CreatePromptMessageProps = CreatePlainPromptMessageProps & {
  enabled?: boolean;
};

export type UpdatePromptMessageProps = UpdatePlainPromptMessageProps;

export type PromptMessage = PlainPromptMessage | HistoryPromptMessage;

export const PromptMessageType = {
  Plain: "plain",
  History: "history",
} as const;

export type PromptMessageType =
  (typeof PromptMessageType)[keyof typeof PromptMessageType];

export interface PromptMessageProps {
  // Set by System
  type: PromptMessageType;
  enabled?: boolean; // Controls whether message is active/enabled, defaults to true
  createdAt: Date;
  updatedAt?: Date;
}

export function parsePromptMessage(doc: any): Result<PromptMessage> {
  try {
    let doc_type;
    if (
      !(
        doc instanceof PlainPromptMessage || doc instanceof HistoryPromptMessage
      )
    ) {
      doc_type = doc.type;
    } else {
      doc_type = doc.props.type;
    }
    switch (doc_type) {
      case PromptMessageType.Plain:
        return PlainPromptMessage.fromJSON(doc);
      case PromptMessageType.History:
        return HistoryPromptMessage.fromJSON(doc);
      default:
        return formatFail("Unknown prompt message type", doc_type);
    }
  } catch (error) {
    return formatFail("Failed to parse prompt message", error);
  }
}
