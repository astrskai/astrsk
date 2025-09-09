import React, { createContext, useContext, useCallback } from "react";
import { Card } from "@/modules/card/domain";
import { DockviewApi } from "dockview";
import type { IDockviewPanel, DockviewGroupPanel } from "dockview-core";
import { CardPanelVisibility } from "@/app/stores/card-ui-store";
import { extractCardPanelType } from "@/components-v2/card/utils/panel-id-utils";

interface CardPanelContextType {
  cardId: string;
  api: DockviewApi | null;
  panelVisibility: CardPanelVisibility;
  setPanelVisibility: (panel: keyof CardPanelVisibility, visible: boolean) => void;
  openPanel: (panelType: string) => void;
  closePanel: (panelType: string) => void;
  invalidateExternalQueries: () => Promise<void>;
}

const CardPanelContext = createContext<CardPanelContextType | null>(null);

export function useCardPanelContext() {
  const context = useContext(CardPanelContext);
  if (!context) {
    throw new Error("useCardPanelContext must be used within CardPanelProvider");
  }
  return context;
}

interface CardPanelProviderProps {
  children: React.ReactNode;
  cardId: string;
  api: DockviewApi | null;
  panelVisibility: CardPanelVisibility;
  setPanelVisibility: (panel: keyof CardPanelVisibility, visible: boolean) => void;
  invalidateExternalQueries: () => Promise<void>;
  card?: Card | null;
}

export function CardPanelProvider({
  children,
  cardId,
  api,
  panelVisibility,
  setPanelVisibility,
  invalidateExternalQueries,
  card,
}: CardPanelProviderProps) {
  const openPanel = useCallback(
    (panelType: string) => {
      if (!api) return;

      const panelId = `${panelType}-${cardId}`;
      
      // Check if panel already exists
      const existingPanel = api.getPanel(panelId);
      if (existingPanel) {
        // Panel is already open, focus on it
        existingPanel.focus();
        return;
      }

      // Also check for panels with different IDs but same type
      // This handles panels restored from saved layouts
      const allPanels = Object.values(api.panels);
      const existingPanelByType = allPanels.find((panel: IDockviewPanel) => {
        const pType = extractCardPanelType(panel.id, cardId);
        return pType === panelType && panel.params?.cardId === cardId;
      });
      
      if (existingPanelByType) {
        // Panel is already open with a different ID, focus on it
        existingPanelByType.focus();
        return;
      }

      // Determine panel title and handle type mapping
      let title = panelType;
      let actualPanelType = panelType;
      
      switch (panelType) {
        case "metadata":
          title = "Metadata";
          break;
        case "content":
          // Map "content" to the appropriate panel type based on card type
          if (card?.props.type === "plot") {
            actualPanelType = "plot-info";
            title = "Plot Info";
          } else {
            actualPanelType = "character-info";
            title = "Character Info";
          }
          break;
        case "lorebooks":
          title = "Lorebook";
          break;
        case "variables":
          title = "Variables";
          break;
        case "scenarios":
          title = "Scenarios";
          break;
        case "imageGenerator":
          title = "Image Generator";
          break;
      }

      // Check again with the actual panel type if it was mapped
      if (actualPanelType !== panelType) {
        const existingMappedPanel = allPanels.find((panel: IDockviewPanel) => {
          const pType = extractCardPanelType(panel.id, cardId);
          return pType === actualPanelType && panel.params?.cardId === cardId;
        });
        
        if (existingMappedPanel) {
          existingMappedPanel.focus();
          return;
        }
      }

      // Check if there are any panels besides the card panel
      const panels = api.panels;
      const hasOtherPanels = Object.values(panels).some((panel: IDockviewPanel) => panel.id !== 'card-panel-main');
      
      // Check current groups
      const groups = api.groups;
      
      // Use the actual panel type for the ID
      const actualPanelId = `${actualPanelType}-${cardId}`;
      
      // Final check before adding - check if panel with actualPanelId already exists
      const finalCheck = api.getPanel(actualPanelId);
      if (finalCheck) {
        finalCheck.focus();
        setPanelVisibility(panelType as keyof CardPanelVisibility, true);
        return;
      }
      
      // Add new panel
      if (hasOtherPanels) {
        // Find a non-card panel group to add to
        const nonCardGroup = groups.find((g: DockviewGroupPanel) => g.id !== '1' && !g.model?.locked);
        if (nonCardGroup && nonCardGroup.panels.length > 0) {
          // Add to the first non-card group
          api.addPanel({
            id: actualPanelId,
            component: actualPanelType,
            tabComponent: 'colored',
            title,
            params: { cardId },
            position: {
              referenceGroup: nonCardGroup,
            },
          });
        } else {
          // Fallback: open to the right of card panel with 25% width
          const containerWidth = api.width;
          const panelWidth = containerWidth > 0 ? Math.floor(containerWidth * 0.25) : 384;
          
          api.addPanel({
            id: actualPanelId,
            component: actualPanelType,
            tabComponent: 'colored',
            title,
            initialWidth: panelWidth,
            params: { cardId },
            position: {
              direction: 'right',
              referencePanel: 'card-panel-main',
            },
          });
        }
      } else {
        // If only card panel exists, open to the right of it with 25% width
        const containerWidth = api.width;
        const panelWidth = containerWidth > 0 ? Math.floor(containerWidth * 0.25) : 384;
        
        api.addPanel({
          id: actualPanelId,
          component: actualPanelType,
          tabComponent: 'colored',
          title,
          initialWidth: panelWidth,
          params: { cardId },
          position: {
            direction: 'right',
            referencePanel: 'card-panel-main',
          },
        });
      }

      // Update visibility state (use original panelType for visibility tracking)
      setPanelVisibility(panelType as keyof CardPanelVisibility, true);
    },
    [api, cardId, setPanelVisibility, card]
  );

  const closePanel = useCallback(
    (panelType: string) => {
      if (!api) return;

      // Map "content" to the appropriate panel type based on card type
      let actualPanelType = panelType;
      if (panelType === "content") {
        if (card?.props.type === "plot") {
          actualPanelType = "plot-info";
        } else {
          actualPanelType = "character-info";
        }
      }

      // Find and close all panels of this type for this card
      const allPanels = Object.values(api.panels);
      const panelsToClose = allPanels.filter((panel: IDockviewPanel) => {
        const pType = extractCardPanelType(panel.id, cardId);
        const panelCardId = panel.params?.cardId;
        return pType === actualPanelType && panelCardId === cardId;
      });

      panelsToClose.forEach((panel: IDockviewPanel) => {
        api.removePanel(panel);
      });

      // Update visibility state
      setPanelVisibility(panelType as keyof CardPanelVisibility, false);
    },
    [api, cardId, setPanelVisibility, card]
  );

  const contextValue: CardPanelContextType = {
    cardId,
    api,
    panelVisibility,
    setPanelVisibility,
    openPanel,
    closePanel,
    invalidateExternalQueries,
  };

  return (
    <CardPanelContext.Provider value={contextValue}>
      {children}
    </CardPanelContext.Provider>
  );
}