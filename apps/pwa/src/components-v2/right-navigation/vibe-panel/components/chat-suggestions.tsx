import React from 'react';
import { cn } from '@/shared/utils';

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
    <div className={cn("w-full grid grid-cols-2 gap-3", className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion.prompt)}
          className="h-24 px-4 py-3 bg-background-surface-4 rounded-2xl shadow-[0px_4px_6px_-2px_rgba(0,0,0,0.05)] shadow-lg outline outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-center gap-2 hover:bg-background-surface-5 transition-colors cursor-pointer"
        >
          <div className="self-stretch text-left text-text-primary text-sm font-semibold leading-tight">
            {suggestion.title}
          </div>
          <div className="self-stretch text-left text-text-primary text-xs font-normal">
            {suggestion.description}
          </div>
        </button>
      ))}
    </div>
  );
};