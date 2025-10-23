import React from 'react';
import VibeCodingPanel from '@/features/vibe';
import { useFlowPanelContext } from '@/flow-multi/components/flow-panel-provider';
import { PANEL_TYPES } from '@/flow-multi/components/panel-types';

interface FlowVibePanelProps {
  flowId: string;
}

export const FlowVibePanel: React.FC<FlowVibePanelProps> = ({ flowId }) => {
  const { closePanel } = useFlowPanelContext();
  
  // Handle closing the vibe panel tab
  const handleToggle = () => {
    closePanel(PANEL_TYPES.VIBE);
  };

  // Use the existing vibe panel but configured for flow context
  // Pass flowId as resourceId and specify resource type as 'flow'
  return (
    <div className="h-full w-full">
      <VibeCodingPanel 
        onToggle={handleToggle} 
        resourceId={flowId}
        resourceType="flow"
        isLocalPanel={true}
      />
    </div>
  );
};