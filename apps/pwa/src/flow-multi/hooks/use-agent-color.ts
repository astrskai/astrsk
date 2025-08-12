import { useMemo } from 'react';
import { Agent } from '@/modules/agent/domain';
import { Flow } from '@/modules/flow/domain';
import { getAgentHexColor, getAgentOpacity } from '../utils/agent-color-assignment';
import { DEFAULT_AGENT_COLOR, DEFAULT_AGENT_OPACITY } from '../constants/colors';

interface UseAgentColorProps {
  agent: Agent | null;
  flow?: Flow | null;
  /** Override the default opacity calculation */
  opacity?: number;
  /** Whether to include alpha channel in the color */
  withAlpha?: boolean;
  /** Whether all connected agents in the flow are valid */
  isFlowValid?: boolean;
}

interface UseAgentColorReturn {
  /** The agent's hex color (e.g., '#6366F1') */
  hexColor: string;
  /** The agent's color with opacity as rgba string */
  rgbaColor: string;
  /** The opacity value (0-1) */
  opacity: number;
  /** Whether the agent is disconnected */
  isDisconnected: boolean;
}

/**
 * Hook for managing agent colors consistently across panels
 * Centralizes color retrieval and opacity calculations
 */
export function useAgentColor({ 
  agent, 
  flow,
  opacity: overrideOpacity,
  withAlpha = true,
  isFlowValid = true
}: UseAgentColorProps): UseAgentColorReturn {
  return useMemo(() => {
    if (!agent) {
      return {
        hexColor: DEFAULT_AGENT_COLOR,
        rgbaColor: hexToRgba(DEFAULT_AGENT_COLOR, DEFAULT_AGENT_OPACITY),
        opacity: DEFAULT_AGENT_OPACITY,
        isDisconnected: true,
      };
    }

    // Get the agent's hex color
    const hexColor = getAgentHexColor(agent);
    
    // Get opacity based on connection state and flow validity (unless overridden)
    // If flow is not provided, use default opacity
    const calculatedOpacity = flow ? getAgentOpacity(agent, flow, isFlowValid) : DEFAULT_AGENT_OPACITY;
    const opacity = overrideOpacity ?? calculatedOpacity;
    const isDisconnected = opacity < 1;
    

    // Convert hex to rgba if needed
    let rgbaColor = hexColor;
    if (withAlpha) {
      // Convert hex to rgba
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    return {
      hexColor,
      rgbaColor,
      opacity,
      isDisconnected,
    };
  }, [agent, flow, overrideOpacity, withAlpha, isFlowValid]);
}

/**
 * Utility function to convert hex color to rgba
 * Exported for cases where the hook can't be used
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get CSS variables for an agent color
 * Useful for applying colors via CSS custom properties
 */
export function getAgentColorCssVars(agent: Agent | null, flow?: Flow | null): Record<string, string> {
  if (!agent) {
    const r = parseInt(DEFAULT_AGENT_COLOR.slice(1, 3), 16);
    const g = parseInt(DEFAULT_AGENT_COLOR.slice(3, 5), 16);
    const b = parseInt(DEFAULT_AGENT_COLOR.slice(5, 7), 16);
    
    return {
      '--agent-color': DEFAULT_AGENT_COLOR,
      '--agent-color-rgb': `${r}, ${g}, ${b}`,
      '--agent-color-opacity': DEFAULT_AGENT_OPACITY.toString(),
    };
  }

  const hexColor = getAgentHexColor(agent);
  const opacity = flow ? getAgentOpacity(agent, flow) : DEFAULT_AGENT_OPACITY;
  
  // Extract RGB values
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  return {
    '--agent-color': hexColor,
    '--agent-color-rgb': `${r}, ${g}, ${b}`,
    '--agent-color-opacity': opacity.toString(),
  };
}

/**
 * Calculate text color based on background luminance
 * @param hexColor Background color in hex format
 * @returns 'light' or 'dark' for text color
 */
export function getContrastTextColor(hexColor: string): 'light' | 'dark' {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'dark' : 'light';
}