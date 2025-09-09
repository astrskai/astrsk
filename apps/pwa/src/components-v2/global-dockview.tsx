import React, { useCallback, useState } from "react";
import { DockviewApi, DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from "dockview";
import CustomDockviewTab from "@/components-v2/dockview-default-tab";
import HiddenTab from "@/components-v2/dockview-hidden-tab";
import { PanelFocusAnimationWrapper } from "@/components-v2/dockview-panel-focus-animation";
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


// Panel component registry
const GLOBAL_DOCKVIEW_COMPONENTS = {
  "main-content": MainContentPanel,
};

const MAIN_CONTENT_ID = "main-content-panel";

interface GlobalDockViewProps {
  children: React.ReactNode;
}

export function GlobalDockView({ children }: GlobalDockViewProps) {
  const [api, setApi] = useState<DockviewApi | null>(null);

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
  }, [children]);


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