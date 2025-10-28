import React from 'react';
import VibeCodingPanel from '@/features/vibe';
import { useCardPanelContext } from '@/features/card/panels/card-panel-provider';

interface CardVibePanelProps {
  cardId: string;
}

export const CardVibePanel: React.FC<CardVibePanelProps> = ({ cardId }) => {
  const { closePanel } = useCardPanelContext();
  
  // Handle closing the vibe panel tab
  const handleToggle = () => {
    closePanel("vibe");
  };

  // Use the existing vibe panel but configured for card context
  // Pass cardId as resourceId and specify resource type as 'card'
  return (
    <div className="h-full w-full">
      <VibeCodingPanel 
        onToggle={handleToggle} 
        resourceId={cardId}
        resourceType="card"
        isLocalPanel={true}
      />
    </div>
  );
};