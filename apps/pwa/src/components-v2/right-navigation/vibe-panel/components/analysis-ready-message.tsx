import React from "react";
import { SimpleMessage } from "../types";
import ReactMarkdown from "react-markdown";

interface AnalysisReadyMessageProps {
  message: SimpleMessage;
}

export const AnalysisReadyMessage: React.FC<AnalysisReadyMessageProps> = ({
  message,
}) => {
  return (
    <div className="self-stretch">
      <ReactMarkdown 
        className="prose prose-sm max-w-none text-sm text-text-primary [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-3 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-1 [&>ol]:mb-2 [&>ol]:list-decimal [&>ol]:pl-6"
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
};