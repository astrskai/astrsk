import React, { useState, useEffect } from "react";
import { IDockviewPanelHeaderProps } from "dockview";
import { useQuery } from "@tanstack/react-query";
import { dataStoreNodeQueries } from "@/app/queries/data-store-node/query-factory";
import { ifNodeQueries } from "@/app/queries/if-node/query-factory";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";
import { getAgentHexColor } from "@/features/flow/utils/node-color-assignment";

type CustomTabParameters = {
  title?: string;
  backgroundColor?: string;
  agentColor?: string;
  agentInactive?: boolean;
  flowId?: string;
  nodeId?: string;
  panelType?: string;
};

const CustomDockviewTab = React.memo(
  (props: IDockviewPanelHeaderProps<CustomTabParameters>) => {
    const { api, containerApi, params } = props;
    const [isActive, setIsActive] = useState(api.isActive);
    const [isVisible, setIsVisible] = useState(api.isVisible);
    const [showFocusAnimation, setShowFocusAnimation] = useState(false);
    const [currentParams, setCurrentParams] = useState(params);

    // Extract panel information
    const flowId = params?.flowId || currentParams?.flowId;
    const nodeId = params?.nodeId || currentParams?.nodeId;
    const panelType = params?.panelType || currentParams?.panelType;

    // Query color data based on panel type and nodeId
    const { data: dataStoreNodeColor } = useQuery({
      ...dataStoreNodeQueries.color(nodeId!),
      enabled: !!(flowId && nodeId && panelType === "dataStore"),
    });

    const { data: ifNodeColor } = useQuery({
      ...ifNodeQueries.color(nodeId!),
      enabled: !!(flowId && nodeId && panelType === "ifNode"),
    });

    // Query agent data for agent panels
    const { data: agentData } = useQuery({
      queryKey: ["agent", nodeId],
      queryFn: async () => {
        if (!nodeId) return null;
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(nodeId),
        );
        return result.isSuccess ? result.getValue() : null;
      },
      enabled: !!(
        nodeId &&
        (panelType === "prompt" ||
          panelType === "parameter" ||
          panelType === "structuredOutput" ||
          panelType === "preview")
      ),
    });

    // Determine the color based on panel type
    const getNodeColor = (): string | undefined => {
      if (panelType === "dataStore") {
        return dataStoreNodeColor?.color;
      } else if (panelType === "ifNode") {
        return ifNodeColor?.color;
      } else if (agentData) {
        return getAgentHexColor(agentData);
      }
      return undefined;
    };

    // Listen for parameter changes
    useEffect(() => {
      const updateParams = () => {
        setCurrentParams(params);
      };

      // Set initial params
      updateParams();

      // Listen for parameter changes
      const disposable = api.onDidParametersChange?.(updateParams);

      return () => {
        disposable?.dispose?.();
      };
    }, [api, params]);

    // Listen for active state and visibility changes
    useEffect(() => {
      const updateActiveState = () => {
        const wasActive = isActive;
        const nowActive = api.isActive;
        setIsActive(nowActive);

        // Trigger focus animation when tab becomes active
        if (!wasActive && nowActive) {
          setShowFocusAnimation(true);
          // Remove animation class after animation completes (2 seconds)
          setTimeout(() => {
            setShowFocusAnimation(false);
          }, 2000);
        }
      };

      const updateVisibilityState = (event?: { isVisible: boolean }) => {
        setIsVisible(event?.isVisible ?? api.isVisible);
      };

      // Set initial state
      updateActiveState();
      updateVisibilityState();

      // Listen for panel focus and visibility changes
      const disposables = [
        api.onDidActiveChange(updateActiveState),
        containerApi.onDidActiveGroupChange(updateActiveState),
        api.onDidVisibilityChange?.(updateVisibilityState),
      ].filter(Boolean);

      return () => {
        disposables.forEach((d) => d?.dispose?.());
      };
    }, [api, containerApi, isActive]);

    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      const panel = containerApi.getPanel(api.id);
      if (panel) {
        containerApi.removePanel(panel);
      }
    };

    // Use custom parameters or fallback to defaults
    // Try params first, then currentParams, then api.title
    const displayTitle = params?.title || currentParams?.title || api.title;
    const customBgColor =
      params?.backgroundColor || currentParams?.backgroundColor;
    // Use queried color first, then fallback to parameter-based color for backward compatibility
    const agentColor =
      getNodeColor() || params?.agentColor || currentParams?.agentColor;
    const agentInactive = params?.agentInactive || currentParams?.agentInactive;

    // Helper function to convert hex to rgba with opacity
    const hexToRgba = (hex: string, opacity: number) => {
      const cleanHex = hex.replace("#", "");
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Determine background color based on visibility, active state and agent color
    const getBackgroundColor = () => {
      if (customBgColor) return customBgColor;
      if (agentColor) {
        if (isActive || isVisible) {
          // Active or visible state: use full color if agent is active, or 70% if agent is inactive
          return agentInactive ? hexToRgba(agentColor, 0.7) : agentColor;
        } else {
          // Not visible: use 70% if agent is active, or 50% if agent is inactive
          return agentInactive
            ? hexToRgba(agentColor, 0.5)
            : hexToRgba(agentColor, 0.7);
        }
      }
      return undefined; // Let CSS classes handle it
    };

    return (
      <div
        className={`border-border-default relative flex cursor-pointer items-center justify-between border-b px-3 py-2 transition-colors ${
          agentColor
            ? "" // Don't apply CSS classes when agent color is available
            : isActive || isVisible
              ? "bg-background-surface-2" // Active or visible
              : "bg-background-surface-1" // Not visible
        }`}
        onClick={() => api.setActive()}
        style={{
          backgroundColor: getBackgroundColor(),
        }}
      >
        {/* Focus animation overlay */}
        {showFocusAnimation && (
          <div className="animate-tab-focus pointer-events-none absolute inset-0 border-2 border-white" />
        )}
        <span
          className={`truncate ${
            agentColor && !agentInactive
              ? "text-text-contrast-text text-sm font-medium"
              : "text-text-primary text-sm font-medium"
          }`}
        >
          {displayTitle}
        </span>
        <button
          onClick={handleClose}
          className="ml-2 rounded p-1 transition-colors"
          title="Close panel"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={
              agentInactive
                ? "text-text-primary"
                : agentColor
                  ? "text-text-contrast-text"
                  : "text-text-primary"
            }
          >
            <path
              d="M9 3L3 9M3 3l6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  },
);

CustomDockviewTab.displayName = "CustomDockviewTab";

export default CustomDockviewTab;
