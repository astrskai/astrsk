import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components-v2/ui/button';
import { Input } from '@/components-v2/ui/input';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ChatSuggestions } from './chat-suggestions';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  hasResource?: boolean;
  hasMessages?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing = false,
  hasResource = false,
  hasMessages = false,
  className,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSend = () => {
    
    if (prompt.trim() && !isProcessing && hasResource) {
      console.log('✅ [CHAT-INPUT] Calling onSendMessage with:', prompt.trim());
      onSendMessage(prompt.trim());
      setPrompt('');
    } else {
      console.log('❌ [CHAT-INPUT] Not sending message due to failed conditions:', {
        hasPrompt: !!prompt.trim(),
        notProcessing: !isProcessing,
        hasResource
      });
    }
  };

  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
  };

  // Default suggestions - you can make these props later if needed
  const suggestions = [
    {
      title: "Add Inventory",
      description: "Create an inventory system inside your flow",
      prompt: "Add an inventory system to track items in my flow"
    },
    {
      title: "Character Replies",
      description: "Make a short flow where characters talk back",
      prompt: "Create a conversational flow where characters can reply to each other"
    },
    {
      title: "Adventure Story",
      description: "Start a flow that builds an adventure tale",
      prompt: "Build an adventure story flow with branching narrative paths"
    },
    {
      title: "Data Collection",
      description: "Set up forms to collect user information",
      prompt: "Add data collection forms to gather user input and preferences"
    }
  ];

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Suggestions */}
      {/* {!hasMessages && hasResource && (
        <ChatSuggestions 
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )} */}
      
      {/* Input Box */}
      <div className="self-stretch min-h-14 p-2 bg-background-surface-2 rounded-[28px] outline outline-1 outline-offset-[-1px] outline-zinc-100/30 flex items-end gap-4">
        <div className="flex-1 pl-4 pr-2">
          <TextareaAutosize
            maxRows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask, build anything about flow"
            disabled={isProcessing || !hasResource}
            className={cn(
              "w-full p-0 pt-[4.8px] border-0 outline-0 bg-transparent rounded-none no-resizer",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
              "h-[25.6px] min-h-[25.6px]",
              "text-[16px] leading-[1.6] font-normal",
              "text-text-primary placeholder:text-text-placeholder resize-none"
            )}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={!prompt.trim() || isProcessing || !hasResource}
          className="h-10 px-4 py-1 bg-background-surface-3 rounded-[20px] flex justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <Loader2 className="min-w-4 min-h-4 text-text-primary animate-spin" />
          ) : (
            <Send className="min-w-4 min-h-4 text-text-primary" />
          )}
        </button>
      </div>
    </div>
  );
};