import { useMemo } from 'react';
import { UniqueEntityID } from '@/shared/domain';
import { useCard } from '@/app/hooks/use-card';
import { useAsset } from '@/app/hooks/use-asset';
import { CharacterCard } from '@/modules/card/domain';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@/app/queries/session-queries';
import { turnQueries } from '@/app/queries/turn-queries';

interface UseEnhancedImagePromptParams {
  content: string | undefined;
  characterCardId?: UniqueEntityID;
  sessionId?: UniqueEntityID;
  messageId?: UniqueEntityID;
  turnId?: UniqueEntityID;
}

interface EnhancedImagePromptResult {
  prompt: string;
  characterImageUrl?: string;
}

export const useEnhancedImagePrompt = ({
  content,
  characterCardId,
  sessionId,
  messageId,
}: UseEnhancedImagePromptParams): EnhancedImagePromptResult => {
  // Get character card if available
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  
  // Get character image URL if available
  const [characterImageUrl] = useAsset(characterCard?.props.iconAssetId);
  
  // Get session to find previous message
  const { data: session } = useQuery({
    ...sessionQueries.detail(sessionId || new UniqueEntityID()),
    enabled: !!sessionId,
  });
  
  // Find the index of current message and get previous message
  const previousMessageId = useMemo(() => {
    if (!session || !messageId || !session.turnIds || session.turnIds.length === 0) {
      return undefined;
    }
    
    const currentIndex = session.turnIds.findIndex((id: UniqueEntityID) => id.equals(messageId));
    if (currentIndex > 0 && currentIndex < session.turnIds.length) {
      return session.turnIds[currentIndex - 1];
    }
    return undefined;
  }, [session, messageId]);
  
  // Get previous message content
  const { data: previousMessage } = useQuery({
    ...turnQueries.detail(previousMessageId || new UniqueEntityID()),
    enabled: !!previousMessageId,
  });
  
  // Build enhanced prompt
  const enhancedPrompt = useMemo(() => {
    if (!content) return '';
    
    let prompt = '';
    
    // Add character context if available
    if (characterCard) {
      const characterName = characterCard.props.name || 'Character';
      const characterDescription = characterCard.props.description || '';
      
      if (characterDescription) {
        prompt += `Character: ${characterName}\n`;
        prompt += `Description: ${characterDescription}\n\n`;
      }
    }
    
    // Add previous message context if available
    if (previousMessage && previousMessage.options && previousMessage.options.length > 0) {
      const selectedIndex = previousMessage.selectedOptionIndex || 0;
      const prevOption = previousMessage.options[selectedIndex];
      if (prevOption && prevOption.content) {
        const prevContent = prevOption.content;
        prompt += `Previous message: ${prevContent.slice(0, 200)}...\n\n`;
      }
    }
    
    // Add the main content
    prompt += `Current scene: ${content}`;
    
    // Add some artistic direction
    prompt += '\n\nStyle: cinematic, detailed, high quality';
    
    // If we have a character image, add visual consistency note
    if (characterImageUrl) {
      prompt += '\nMaintain visual consistency with the character appearance.';
    }
    
    return prompt;
  }, [content, characterCard, previousMessage, characterImageUrl]);
  
  return {
    prompt: enhancedPrompt,
    characterImageUrl: characterImageUrl || undefined,
  };
};