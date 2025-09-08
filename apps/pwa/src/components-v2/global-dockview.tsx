import React, { useCallback, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from "dockview";
import CustomDockviewTab from "@/components-v2/dockview-default-tab";
import HiddenTab from "@/components-v2/dockview-hidden-tab";
import { PanelFocusAnimationWrapper } from "@/components-v2/dockview-panel-focus-animation";
import { VibeCodingPanel as VibeCodingPanelComponent } from "@/components-v2/right-navigation/vibe-panel";
import { useRightSidebarState } from "@/components-v2/top-bar";
import "./card/panels/card-panel-dockview.css";

// Main content panel component
const MainContentPanel: React.FC<IDockviewPanelProps> = ({ 
  api, 
  containerApi, 
  params 
}) => (
  <PanelFocusAnimationWrapper api={api} containerApi={containerApi}>
    <div className="h-full w-full">
      {params?.children}
    </div>
  </PanelFocusAnimationWrapper>
);

// Vibe coding panel component
const VibeCodingPanel: React.FC<IDockviewPanelProps> = ({ api, containerApi }) => {
  const rightSidebar = useRightSidebarState();
  
  const handleToggle = useCallback(() => {
    if (rightSidebar) {
      rightSidebar.setIsOpen(!rightSidebar.isOpen);
    }
  }, [rightSidebar]);

  return (
    <PanelFocusAnimationWrapper api={api} containerApi={containerApi}>
      <div className="h-full w-full">
        <VibeCodingPanelComponent onToggle={handleToggle} />
      </div>
    </PanelFocusAnimationWrapper>
  );
};

// Panel component registry
const GLOBAL_DOCKVIEW_COMPONENTS = {
  "main-content": MainContentPanel,
  "vibe-coding": VibeCodingPanel,
};

const MAIN_CONTENT_ID = "main-content-panel";
const VIBE_CODING_ID = "vibe-coding-panel";

interface GlobalDockViewProps {
  children: React.ReactNode;
}

export function GlobalDockView({ children }: GlobalDockViewProps) {
  const [api, setApi] = useState<DockviewApi | null>(null);
  const rightSidebar = useRightSidebarState();
  const isVibeCodingOpen = rightSidebar?.isOpen || false;

  // Handle dockview ready event
  const handleReady = useCallback((event: DockviewReadyEvent) => {
    const dockviewApi = event.api;
    setApi(dockviewApi);

    // Always create the main content panel first
    const mainPanel = dockviewApi.addPanel({
      id: MAIN_CONTENT_ID,
      component: "main-content",
      tabComponent: 'colored',
      title: "Main",
      params: { children },
    });

    // Make the main panel non-closeable by locking its group
    if (mainPanel?.group) {
      mainPanel.group.model.locked = true;
    }

    // Only add vibe coding panel if it's open
    if (isVibeCodingOpen) {
      addVibeCodingPanel(dockviewApi);
    }
  }, [children, isVibeCodingOpen]);

  const addVibeCodingPanel = useCallback((dockviewApi: DockviewApi) => {
    // Check if vibe coding panel already exists
    const existingPanel = dockviewApi.getPanel(VIBE_CODING_ID);
    if (existingPanel) {
      existingPanel.focus();
      return;
    }

    // Add vibe coding panel to the right with 30% width
    const containerWidth = dockviewApi.width;
    const vibePanelWidth = containerWidth > 0 ? Math.floor(containerWidth * 0.3) : 400;
    
    const vibeCodingPanel = dockviewApi.addPanel({
      id: VIBE_CODING_ID,
      component: "vibe-coding",
      tabComponent: 'hidden',
      title: "Vibe Coding",
      initialWidth: vibePanelWidth,
      params: {},
      position: {
        direction: 'right',
        referencePanel: MAIN_CONTENT_ID,
      },
    });

    // Lock the vibe coding panel's group to hide tabs
    if (vibeCodingPanel?.group) {
      vibeCodingPanel.group.model.locked = true;
    }
  }, []);

  const removeVibeCodingPanel = useCallback((dockviewApi: DockviewApi) => {
    const existingPanel = dockviewApi.getPanel(VIBE_CODING_ID);
    if (existingPanel) {
      dockviewApi.removePanel(existingPanel);
    }
  }, []);

  // Handle vibe coding panel visibility changes
  React.useEffect(() => {
    if (!api) return;

    if (isVibeCodingOpen) {
      addVibeCodingPanel(api);
    } else {
      removeVibeCodingPanel(api);
    }
  }, [api, isVibeCodingOpen, addVibeCodingPanel, removeVibeCodingPanel]);

  // Update main panel content when children change
  React.useEffect(() => {
    if (!api) return;

    const mainPanel = api.getPanel(MAIN_CONTENT_ID);
    if (mainPanel) {
      mainPanel.api.updateParameters({ children });
    }
  }, [api, children]);

  return (
    <div className="h-full w-full">
      <DockviewReact
        components={GLOBAL_DOCKVIEW_COMPONENTS}
        tabComponents={{ colored: CustomDockviewTab, hidden: HiddenTab }}
        onReady={handleReady}
        className="dockview-theme-abyss"
        disableFloatingGroups
        defaultRenderer="always"
        hideBorders={false}
      />
    </div>
  );
}