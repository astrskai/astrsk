import React, { useState, KeyboardEvent } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib";

import { useModelStore, LANGUAGE_MODELS } from "@/shared/stores/model-store";

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
  const [prompt, setPrompt] = useState("");

  // Use global model store instead of local state
  const selectedModel = useModelStore.use.selectedLanguageModel();
  const setSelectedModel = useModelStore.use.setSelectedLanguageModel();

  const handleSend = () => {
    if (prompt.trim() && !isProcessing && hasResource) {
      onSendMessage(prompt.trim(), selectedModel);
      setPrompt("");
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
      prompt: "Add an inventory system to track items in my flow",
    },
    {
      title: "Character Replies",
      description: "Make a short flow where characters talk back",
      prompt:
        "Create a conversational flow where characters can reply to each other",
    },
    {
      title: "Adventure Story",
      description: "Start a flow that builds an adventure tale",
      prompt: "Build an adventure story flow with branching narrative paths",
    },
    {
      title: "Data Collection",
      description: "Set up forms to collect user information",
      prompt: "Add data collection forms to gather user input and preferences",
    },
  ];

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
        <label className="text-text-primary text-xs font-medium">Model</label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="bg-background-surface-0 border-border-normal h-9">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_FLASH}>
              Gemini 2.5 Flash
            </SelectItem>
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_PRO}>
              Gemini 2.5 Pro
            </SelectItem>
            <SelectItem value={LANGUAGE_MODELS.GEMINI_2_5_FLASH_LITE}>
              Gemini 2.5 Flash Lite
            </SelectItem>
            <SelectItem value={LANGUAGE_MODELS.DEEPSEEK_V3}>
              DeepSeek Chat v3.1
            </SelectItem>
            <SelectItem value={LANGUAGE_MODELS.DEEPSEEK_V3_0324}>
              DeepSeek Chat v3 (0324)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Input Box */}
      <div className="bg-background-surface-3 flex min-h-14 items-end gap-4 self-stretch rounded-[28px] p-2 outline outline-1 outline-offset-[-1px] outline-zinc-100/30">
        <div className="flex-1 pr-2 pl-4">
          <TextareaAutosize
            maxRows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask and/or build anything"
            disabled={!hasResource}
            className={cn(
              "no-resizer w-full rounded-none border-0 bg-transparent p-0 pt-[4.8px] outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
              "h-[25.6px] min-h-[25.6px]",
              "text-[16px] leading-[1.6] font-normal",
              "text-text-primary placeholder:text-text-placeholder resize-none",
            )}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!prompt.trim() || isProcessing || !hasResource}
          className="bg-background-surface-4 flex h-10 cursor-pointer items-center justify-center rounded-[20px] px-4 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="text-text-primary min-h-4 min-w-4 animate-spin" />
          ) : (
            <Send className="text-text-primary min-h-4 min-w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
