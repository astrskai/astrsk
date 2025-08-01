import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";

import { Agent } from "@/modules/agent/domain/agent";

type FocusablePanelType = "prompt" | "responseDesign";

interface AgentState {
  // Flow
  selectedFlowId: string | null;
  selectFlowId: (flowId: string | null) => Promise<void>;

  // Panel management functions (from FlowMultiStore)
  openAgentPanel: (agentId: string, panelType: string) => void;
  openStandalonePanel: (panelType: string) => void;
  setOpenAgentPanelFunction: (
    fn: (agentId: string, panelType: string) => void,
  ) => void;
  setOpenStandalonePanelFunction: (fn: (panelType: string) => void) => void;

  // Tab color management (from FlowMultiStore)
  updateAllTabColors: () => void;
  setUpdateAllTabColorsFunction: (fn: () => void) => void;
  updateAgentTabColors: (agentId: string, color: string) => void;
  setUpdateAgentTabColorsFunction: (
    fn: (agentId: string, color: string) => void,
  ) => void;

  // Tab title management
  updateAllTabTitles: () => void;
  setUpdateAllTabTitlesFunction: (fn: () => void) => void;

  // Panel visibility (from FlowMultiStore)
  panelVisibility: Record<string, boolean>;
  setPanelVisibility: (panel: string, visible: boolean) => void;

  // Focus tracking for variable insertion (from FlowMultiStore)
  focusedPanel: FocusablePanelType | null;
  setFocusedPanel: (panel: FocusablePanelType | null) => void;

  // Monaco editor cursor tracking for variable insertion (from FlowMultiStore)
  lastMonacoEditor: {
    agentId: string | null;
    panelId: string | null;
    editor: any;
    position: any;
  } | null;
  setLastMonacoEditor: (
    agentId: string | null,
    panelId: string | null,
    editor: any,
    position: any,
  ) => void;
  insertVariableAtLastCursor: (variableValue: string) => void;

  // Variable insertion method (from FlowMultiStore)
  insertVariableIntoFocusedPanel: (variableValue: string) => void;
  variableInsertionCallbacks: Record<
    FocusablePanelType,
    ((value: string) => void) | null
  >;
  registerVariableInsertionCallback: (
    panel: FocusablePanelType,
    callback: (value: string) => void,
  ) => void;
  unregisterVariableInsertionCallback: (panel: FocusablePanelType) => void;

  // TODO: remove unused states and actions
  // Preview
  previewSessionId: string | null;
  setPreviewSessionId: (previewSessionId: string | null) => void;

  // Agent update notifications for preview panel
  agentUpdateTimestamp: number;
  lastUpdatedAgentId: string | null;
  notifyAgentUpdate: (agentId: string) => void;

  // Agent sync to store
  syncAgentToSelectedFlow: (agentId: string, updatedAgent: Agent) => void;

  // Flow update notifications for flow panel
  flowUpdateTimestamp: number;
  notifyFlowUpdate: () => void;

  // Flow structure change notifications (agent create/delete, connection changes)
  flowStructureTimestamp: number;
  notifyFlowStructureChange: () => void;

  // Flow panel node/edge setters for direct updates
  flowPanelSetNodes: ((nodes: any[]) => void) | null;
  flowPanelSetEdges: ((edges: any[]) => void) | null;
  registerFlowPanelSetters: (
    setNodes: (nodes: any[]) => void,
    setEdges: (edges: any[]) => void,
  ) => void;
  unregisterFlowPanelSetters: () => void;
}

const useAgentStoreBase = create<AgentState>()(
  immer((set) => ({
    selectedFlowId: null,
    selectFlowId: async (flowId) => {
      return set((state) => {
        state.selectedFlowId = flowId;
      });
    },

    // Panel management functions (from FlowMultiStore)
    openAgentPanel: (agentId, panelType) => {
      // This is a placeholder that will be replaced by the actual function
    },
    openStandalonePanel: (panelType) => {
      // This is a placeholder that will be replaced by the actual function
    },
    setOpenAgentPanelFunction: (fn) =>
      set((state) => {
        state.openAgentPanel = fn;
      }),
    setOpenStandalonePanelFunction: (fn) =>
      set((state) => {
        state.openStandalonePanel = fn;
      }),

    // Tab color management (from FlowMultiStore)
    updateAllTabColors: () => {
      // This is a placeholder that will be replaced by the actual function
    },
    setUpdateAllTabColorsFunction: (fn) =>
      set((state) => {
        state.updateAllTabColors = fn;
      }),
    updateAgentTabColors: (agentId, color) => {
      // This is a placeholder that will be replaced by the actual function
    },
    setUpdateAgentTabColorsFunction: (fn) =>
      set((state) => {
        state.updateAgentTabColors = fn;
      }),

    // Tab title management
    updateAllTabTitles: () => {
      // This is a placeholder that will be replaced by the actual function
    },
    setUpdateAllTabTitlesFunction: (fn) =>
      set((state) => {
        state.updateAllTabTitles = fn;
      }),

    // Panel visibility (from FlowMultiStore)
    panelVisibility: {
      flow: true,
      prompt: true,
      parameter: true,
      responseDesign: false,
      variable: false,
      structuredOutput: true,
    },
    setPanelVisibility: (panel, visible) =>
      set((state) => {
        state.panelVisibility[panel] = visible;
      }),

    // Focus tracking for variable insertion (from FlowMultiStore)
    focusedPanel: null,
    setFocusedPanel: (panel) =>
      set((state) => {
        state.focusedPanel = panel;
      }),

    // Monaco editor cursor tracking (from FlowMultiStore)
    lastMonacoEditor: null,
    setLastMonacoEditor: (agentId, panelId, editor, position) =>
      set((state) => {
        state.lastMonacoEditor = {
          agentId,
          panelId,
          editor,
          position,
        };
      }),
    insertVariableAtLastCursor: (variableValue) =>
      set((state) => {
        const lastEditor = state.lastMonacoEditor;
        if (lastEditor && lastEditor.editor && lastEditor.position) {
          try {
            lastEditor.editor.executeEdits("variable-insert", [
              {
                range: {
                  startLineNumber: lastEditor.position.lineNumber,
                  startColumn: lastEditor.position.column,
                  endLineNumber: lastEditor.position.lineNumber,
                  endColumn: lastEditor.position.column,
                },
                text: variableValue,
              },
            ]);

            // Update cursor position after insertion
            const newPosition = {
              lineNumber: lastEditor.position.lineNumber,
              column: lastEditor.position.column + variableValue.length,
            };
            lastEditor.editor.setPosition(newPosition);
            lastEditor.editor.focus();

            // Update stored position
            state.lastMonacoEditor!.position = newPosition;
          } catch (error) {
            // Ignore errors
          }
        }
      }),

    // Variable insertion (from FlowMultiStore)
    variableInsertionCallbacks: {
      prompt: null,
      responseDesign: null,
    },
    registerVariableInsertionCallback: (panel, callback) =>
      set((state) => {
        state.variableInsertionCallbacks[panel] = callback;
      }),
    unregisterVariableInsertionCallback: (panel) =>
      set((state) => {
        state.variableInsertionCallbacks[panel] = null;
      }),
    insertVariableIntoFocusedPanel: (variableValue) =>
      set((state) => {
        const focusedPanel = state.focusedPanel;
        if (focusedPanel && state.variableInsertionCallbacks[focusedPanel]) {
          state.variableInsertionCallbacks[focusedPanel]!(variableValue);
        }
      }),

    previewSessionId: null,
    setPreviewSessionId: (previewSessionId) =>
      set((state) => {
        state.previewSessionId = previewSessionId;
      }),

    // Agent update notifications for preview panel
    agentUpdateTimestamp: 0,
    lastUpdatedAgentId: null,
    notifyAgentUpdate: (agentId) =>
      set((state) => {
        state.agentUpdateTimestamp = Date.now();
        state.lastUpdatedAgentId = agentId;
      }),

    // Agent sync to store - updates specific agent in selectedFlow
    syncAgentToSelectedFlow: (agentId, updatedAgent) =>
      set((state) => {
        if (state.selectedFlowId) {
          state.agentUpdateTimestamp = Date.now();
          state.lastUpdatedAgentId = agentId;
        }
      }),

    // Flow update notifications for flow panel
    flowUpdateTimestamp: 0,
    notifyFlowUpdate: () =>
      set((state) => {
        state.flowUpdateTimestamp = Date.now();
      }),

    // Flow structure change notifications (agent create/delete, connection changes)
    flowStructureTimestamp: 0,
    notifyFlowStructureChange: () =>
      set((state) => {
        state.flowStructureTimestamp = Date.now();
      }),

    // Flow panel node/edge setters for direct updates
    flowPanelSetNodes: null,
    flowPanelSetEdges: null,
    registerFlowPanelSetters: (setNodes, setEdges) =>
      set((state) => {
        state.flowPanelSetNodes = setNodes;
        state.flowPanelSetEdges = setEdges;
      }),
    unregisterFlowPanelSetters: () =>
      set((state) => {
        state.flowPanelSetNodes = null;
        state.flowPanelSetEdges = null;
      }),
  })),
);

export const useAgentStore = createSelectors(useAgentStoreBase);
