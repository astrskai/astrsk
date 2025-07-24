import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';

export const usePanelFocusAnimation = (api: IDockviewPanelProps['api'], containerApi: IDockviewPanelProps['containerApi']) => {
  const [isActive, setIsActive] = useState(api.isActive);
  const [showFocusAnimation, setShowFocusAnimation] = useState(false);

  useEffect(() => {
    const updateActiveState = () => {
      const wasActive = isActive;
      const nowActive = api.isActive;
      setIsActive(nowActive);
      
      // Trigger focus animation when panel becomes active
      if (!wasActive && nowActive) {
        setShowFocusAnimation(true);
        // Remove animation class after animation completes (2 seconds)
        setTimeout(() => {
          setShowFocusAnimation(false);
        }, 2000);
      }
    };

    // Set initial state
    updateActiveState();

    // Listen for panel focus changes
    const disposables = [
      api.onDidActiveChange(updateActiveState),
      containerApi.onDidActiveGroupChange(updateActiveState),
    ];

    return () => {
      disposables.forEach(d => d?.dispose?.());
    };
  }, [api, containerApi, isActive]);

  return { isActive, showFocusAnimation };
};

interface PanelFocusAnimationWrapperProps {
  api: IDockviewPanelProps['api'];
  containerApi: IDockviewPanelProps['containerApi'];
  children: React.ReactNode;
}

export const PanelFocusAnimationWrapper: React.FC<PanelFocusAnimationWrapperProps> = ({ 
  api, 
  containerApi, 
  children 
}) => {
  const { showFocusAnimation } = usePanelFocusAnimation(api, containerApi);

  return (
    <div className="relative w-full h-full">
      {/* Focus animation overlay - inset to avoid sash interference */}
      {showFocusAnimation && (
        <div className="absolute inset-1 border-2 border-white animate-tab-focus pointer-events-none z-[1000]" />
      )}
      {children}
    </div>
  );
};