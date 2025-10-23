import React from "react";
import { cn } from "@/shared/lib";

interface ChatSuggestion {
  title: string;
  description: string;
  prompt: string;
}

interface ChatSuggestionsProps {
  suggestions: ChatSuggestion[];
  onSuggestionClick: (prompt: string) => void;
  className?: string;
}

export const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  className,
}) => {
  return (
    <div className={cn("grid w-full grid-cols-2 gap-3", className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion.prompt)}
          className="bg-background-surface-4 outline-border-normal hover:bg-background-surface-5 flex h-24 cursor-pointer flex-col items-center justify-start gap-2 rounded-2xl px-4 py-3 shadow-[0px_4px_6px_-2px_rgba(0,0,0,0.05)] shadow-lg outline outline-1 outline-offset-[-1px] transition-colors"
        >
          <div className="text-text-primary self-stretch text-left text-sm leading-tight font-semibold">
            {suggestion.title}
          </div>
          <div className="text-text-primary self-stretch text-left text-xs font-normal">
            {suggestion.description}
          </div>
        </button>
      ))}
    </div>
  );
};
