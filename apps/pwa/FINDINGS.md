# FINDINGS.md

- Editing text should use debounce but element save should use queue.
- FlowPanelProvider acts as central communication hub for all panel interactions.
- Panels get flowId through FlowPanelProvider context instead of direct Dockview params.
- FlowPanelProvider enables inter-panel communication while Dockview params are isolated per panel.
- FlowPanelProvider has unnecessary complexity and duplicates functionality already in AgentStore and React Query.
- Panels don't actually use flow prop from FlowPanelProvider and fetch their own flow data instead.
- Agent color management should be handled by individual components not centralized in FlowPanelProvider.
- Panel opening functions can be consolidated from openPanel and openStandalonePanel to just openPanel with optional agentId.
- notifyFlowStructureChange function is redundant since invalidation should happen directly after save operations.
- Panel open checking functions can be unified into isPanelOpen with optional agentId parameter.
- Panel types are scattered with magic strings instead of using centralized PANEL_TYPES constants.