import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components-v2/ui/button';
import { Input } from '@/components-v2/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components-v2/ui/select';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ChatSuggestions } from './chat-suggestions';
import { useModelStore, LANGUAGE_MODELS } from '@/app/stores/model-store';

interface ChatInputProps {
  onSendMessage: (message: string, modelId?: string) => void;
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
  
  // Use global model store instead of local state
  const selectedModel = useModelStore.use.selectedLanguageModel();
  const setSelectedModel = useModelStore.use.setSelectedLanguageModel();

  const handleSend = () => {
    
    if (prompt.trim() && !isProcessing && hasResource) {
      onSendMessage(prompt.trim(), selectedModel);
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
      
      {/* Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-text-primary">Model</label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-9 bg-background-surface-0 border-border-normal">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_FLASH}>Gemini 2.5 Flash</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_PRO}>Gemini 2.5 Pro</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_FLASH_LITE}>Gemini 2.5 Flash Lite</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.CLAUDE_SONNET_4}>Claude Sonnet 4</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.GPT_5_CHAT_LATEST}>GPT-5 Chat Latest</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.DEEPSEEK_V3}>DeepSeek V3</SelectItem>
            <SelectItem value={LANGUAGE_MODELS.DEEPSEEK_R1}>DeepSeek R1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Input Box */}
      <div className="self-stretch min-h-14 p-2 bg-background-surface-3 rounded-[28px] outline outline-1 outline-offset-[-1px] outline-zinc-100/30 flex items-end gap-4">
        <div className="flex-1 pl-4 pr-2">
          <TextareaAutosize
            maxRows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask, build anything about flow"
            disabled={!hasResource}
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
          className="h-10 px-4 py-1 bg-background-surface-4 rounded-[20px] flex justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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