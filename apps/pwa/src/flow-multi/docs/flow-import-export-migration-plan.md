# Flow Import/Export Migration Plan

## Overview

This document outlines the plan to update flow import/export functionality to support the new data store node and if node architecture. The current implementation only exports flow-level data (nodes, edges, agents) but doesn't handle the separated node data that's now stored in dedicated tables.

## Current Architecture Analysis

### Current Export Implementation Issues:
1. **Missing Node Data**: Only exports `flow.nodes[]` and `flow.edges[]` but not separate data store node and if node data
2. **Agent-Only Support**: Current export focuses only on agents via `flow.agentIds`
3. **Edge ID Patterns**: Uses simple patterns like `source-target` or `agent-to-end` which can cause conflicts
4. **No Node Type Awareness**: Doesn't handle different node types during export/import

### Current Import Implementation Issues:
1. **Agent ID Remapping**: Only remaps agent IDs in nodes and edges, ignoring new node types
2. **Missing Data Creation**: Doesn't create  in separate node data tables
3. **Edge ID Conflicts**: Simple edge ID patteentriesrns can lead to duplicate IDs
4. **No Cascade Handling**: Doesn't handle relationships between flow and separated node data

### Current Export Structure:
```json
{
  "name": "Flow Name",
  "description": "Flow Description", 
  "nodes": [
    { "id": "start", "type": "start", "position": {...}, "data": {} },
    { "id": "agent-123", "type": "agent", "position": {...}, "data": {} },
    { "id": "datastore-456", "type": "dataStore", "position": {...}, "data": {...} },
    { "id": "if-789", "type": "if", "position": {...}, "data": {...} }
  ],
  "edges": [...],
  "responseTemplate": "...",
  "agents": {
    "agent-123": { /* agent data */ }
  }
}
```

**Problems:**
- ❌ Data store node data in `nodes[].data` is incomplete and will be lost
- ❌ If node data in `nodes[].data` is incomplete and will be lost
- ❌ No separate tables data included
- ❌ Edge IDs use weak patterns that can conflict

## Target Architecture

### New Export Structure:
```json
{
  "version": "2.0",
  "flow": {
    "name": "Flow Name",
    "description": "Flow Description",
    "nodes": [
      { "id": "node-uuid-1", "type": "start", "position": {...}, "data": {} },
      { "id": "node-uuid-2", "type": "agent", "position": {...}, "data": { "flowId": "flow-uuid" } },
      { "id": "node-uuid-3", "type": "dataStore", "position": {...}, "data": { "flowId": "flow-uuid" } },
      { "id": "node-uuid-4", "type": "if", "position": {...}, "data": { "flowId": "flow-uuid" } }
    ],
    "edges": [
      { "id": "edge-uuid-1", "source": "node-uuid-1", "target": "node-uuid-2", "sourceHandle": null, "targetHandle": null },
      { "id": "edge-uuid-2", "source": "node-uuid-2", "target": "node-uuid-3", "sourceHandle": null, "targetHandle": null },
      { "id": "edge-uuid-3", "source": "node-uuid-4", "target": "node-uuid-3", "sourceHandle": "true", "targetHandle": null }
    ],
    "responseTemplate": "...",
    "dataStoreSchema": { /* schema data */ },
    "panelStructure": { /* panel layout */ },
    "viewport": { /* viewport state */ }
  },
  "agents": {
    "node-uuid-2": { /* complete agent data */ }
  },
  "dataStoreNodes": {
    "node-uuid-3": { 
      "name": "User Data",
      "color": "#3b82f6",
      "dataStoreFields": [
        { "id": "field-uuid-1", "schemaFieldId": "schema-field-1", "value": "default", "logic": "" }
      ]
    }
  },
  "ifNodes": {
    "node-uuid-4": {
      "name": "Check Age",
      "color": "#ef4444", 
      "logicOperator": "AND",
      "conditions": [
        { "id": "condition-uuid-1", "dataType": "number", "value1": "age", "operator": "greater_than", "value2": "18" }
      ]
    }
  }
}
```

**Benefits:**
- ✅ Complete node data preservation
- ✅ UUID-based IDs prevent conflicts  
- ✅ Versioned format for future migrations
- ✅ All relationships preserved
- ✅ Schema and layout data included

## Implementation Plan

### Phase 1: Enhanced Export Service

Create a new export service that collects all flow-related data:

```typescript
// src/modules/flow/usecases/export-flow-with-nodes.ts
export class ExportFlowWithNodes implements UseCase<UniqueEntityID, Result<File>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private loadIfNodeRepo: LoadIfNodeRepo,
  ) {}

  async execute(flowId: UniqueEntityID): Promise<Result<File>> {
    try {
      // 1. Get flow data
      const flowResult = await this.loadFlowRepo.getFlowById(flowId);
      if (flowResult.isFailure) return Result.fail(flowResult.getError());
      const flow = flowResult.getValue();

      // 2. Collect all node data by type
      const agents: Record<string, any> = {};
      const dataStoreNodes: Record<string, any> = {};
      const ifNodes: Record<string, any> = {};

      for (const node of flow.props.nodes) {
        switch (node.type) {
          case NodeType.AGENT:
            const agentId = node.data.agentId || node.id;
            const agentResult = await this.loadAgentRepo.getAgentById(new UniqueEntityID(agentId));
            if (agentResult.isSuccess) {
              agents[node.id] = agentResult.getValue().toJSON();
            }
            break;

          case NodeType.DATA_STORE:
            const dataStoreResult = await this.loadDataStoreNodeRepo.getDataStoreNodeById(
              flowId.toString(), 
              node.id
            );
            if (dataStoreResult.isSuccess) {
              dataStoreNodes[node.id] = dataStoreResult.getValue().toJSON();
            }
            break;

          case NodeType.IF:
            const ifNodeResult = await this.loadIfNodeRepo.getIfNodeById(
              flowId.toString(), 
              node.id
            );
            if (ifNodeResult.isSuccess) {
              ifNodes[node.id] = ifNodeResult.getValue().toJSON();
            }
            break;
        }
      }

      // 3. Create comprehensive export structure
      const exportData = {
        version: "2.0",
        flow: flow.toJSON(),
        agents,
        dataStoreNodes,
        ifNodes,
        exportedAt: new Date().toISOString(),
        exportedBy: "astrsk-v2.3.0"
      };

      // 4. Create file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], `${flow.props.name}.json`, {
        type: "application/json",
      });

      return Result.ok(file);
    } catch (error) {
      return Result.fail(`Failed to export flow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
```

### Phase 2: Enhanced Import Service with Node ID Remapping

Create a new import service that handles node data creation and proper ID remapping:

```typescript
// src/modules/flow/usecases/import-flow-with-nodes.ts
export class ImportFlowWithNodes implements UseCase<ImportCommand, Result<Flow>> {
  constructor(
    private saveFlowRepo: SaveFlowRepo,
    private saveAgentRepo: SaveAgentRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  async execute({ file, agentModelOverrides }: ImportCommand): Promise<Result<Flow>> {
    try {
      // 1. Parse and validate file
      const text = await readFileToString(file);
      let parsedData = JSON.parse(text);

      // 2. Handle different formats
      if (this.isSillyTavernPrompt(parsedData)) {
        parsedData = this.convertSillyTavernPrompt(parsedData, file.name);
      }

      if (this.isLegacyFormat(parsedData)) {
        parsedData = this.convertLegacyFormat(parsedData);
      }

      // 3. Create node ID mapping for all node types
      const nodeIdMap = new Map<string, string>();
      const agentIdMap = new Map<string, string>();
      
      const { flow: flowData, agents, dataStoreNodes, ifNodes } = parsedData;

      // Generate new UUIDs for all nodes to prevent conflicts
      for (const node of flowData.nodes) {
        const newNodeId = new UniqueEntityID().toString();
        nodeIdMap.set(node.id, newNodeId);
        
        // For agent nodes, also track agent ID mapping
        if (node.type === NodeType.AGENT) {
          const oldAgentId = node.data?.agentId || node.id;
          agentIdMap.set(oldAgentId, newNodeId);
        }
      }

      // 4. Import agents with new IDs
      for (const [oldNodeId, agentData] of Object.entries(agents || {})) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        let agent = Agent.fromJSON(agentData);
        if (agent.isFailure) continue;

        // Apply model overrides if provided
        if (agentModelOverrides && agentModelOverrides.has(oldNodeId)) {
          const override = agentModelOverrides.get(oldNodeId);
          const updateResult = agent.getValue().update({
            apiSource: override.apiSource as ApiSource,
            modelId: override.modelId,
            modelName: override.modelName,
          });
          if (updateResult.isSuccess) {
            agent = updateResult;
          }
        }

        // Save with new ID
        const agentWithNewId = new Agent(agent.getValue().props, new UniqueEntityID(newNodeId));
        await this.saveAgentRepo.saveAgent(agentWithNewId);
      }

      // 5. Import data store nodes with new IDs  
      const newFlowId = new UniqueEntityID().toString();
      
      for (const [oldNodeId, nodeData] of Object.entries(dataStoreNodes || {})) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        const dataStoreNode = DataStoreNode.create({
          flowId: newFlowId,
          name: nodeData.name,
          color: nodeData.color,
          dataStoreFields: nodeData.dataStoreFields || [],
        }, new UniqueEntityID(newNodeId));

        if (dataStoreNode.isSuccess) {
          await this.saveDataStoreNodeRepo.saveDataStoreNode(dataStoreNode.getValue());
        }
      }

      // 6. Import if nodes with new IDs
      for (const [oldNodeId, nodeData] of Object.entries(ifNodes || {})) {
        const newNodeId = nodeIdMap.get(oldNodeId);
        if (!newNodeId) continue;

        const ifNode = IfNode.create({
          flowId: newFlowId,
          name: nodeData.name,
          color: nodeData.color,
          logicOperator: nodeData.logicOperator,
          conditions: nodeData.conditions || [],
        }, new UniqueEntityID(newNodeId));

        if (ifNode.isSuccess) {
          await this.saveIfNodeRepo.saveIfNode(ifNode.getValue());
        }
      }

      // 7. Update flow nodes and edges with new IDs
      const newNodes = flowData.nodes.map(node => ({
        ...node,
        id: nodeIdMap.get(node.id) || node.id,
        data: node.type === NodeType.AGENT 
          ? { flowId: newFlowId }
          : node.type === NodeType.DATA_STORE || node.type === NodeType.IF
            ? { flowId: newFlowId }
            : node.data
      }));

      const newEdges = this.remapEdgeIds(flowData.edges, nodeIdMap);

      // 8. Create and save flow
      const flow = Flow.create({
        ...flowData,
        nodes: newNodes,
        edges: newEdges,
      }, new UniqueEntityID(newFlowId));

      if (flow.isFailure) {
        return Result.fail(flow.getError());
      }

      const savedFlow = await this.saveFlowRepo.saveFlow(flow.getValue());
      return savedFlow;

    } catch (error) {
      return Result.fail(`Failed to import flow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private remapEdgeIds(edges: any[], nodeIdMap: Map<string, string>): any[] {
    return edges.map(edge => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      
      // Generate new edge ID to prevent conflicts
      const newEdgeId = new UniqueEntityID().toString();
      
      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });
  }

  private isLegacyFormat(data: any): boolean {
    return !data.version && data.agents && !data.dataStoreNodes && !data.ifNodes;
  }

  private convertLegacyFormat(data: any): any {
    // Convert old format to new format
    return {
      version: "2.0",
      flow: {
        ...data,
        agents: undefined, // Remove agents from flow level
      },
      agents: data.agents || {},
      dataStoreNodes: {},
      ifNodes: {},
    };
  }
}
```

### Phase 3: Service Layer Updates

Update the service layer to use the new import/export services:

```typescript
// src/app/services/flow-service.ts
export class FlowService {
  // ... existing methods ...

  // Enhanced export with all node data
  static exportFlowWithNodes = new ExportFlowWithNodes(
    new DrizzleFlowRepo(),
    new DrizzleAgentRepo(),
    new DrizzleDataStoreNodeRepo(),
    new DrizzleIfNodeRepo()
  );

  // Enhanced import with node data creation
  static importFlowWithNodes = new ImportFlowWithNodes(
    new DrizzleFlowRepo(),
    new DrizzleAgentRepo(),
    new DrizzleDataStoreNodeRepo(),
    new DrizzleIfNodeRepo()
  );

  // Legacy support - delegates to enhanced versions
  static exportFlowToFile = FlowService.exportFlowWithNodes;
  static importFlowFromFile = FlowService.importFlowWithNodes;
}
```

### Phase 4: Query Mutations

Create mutations that use the new services:

```typescript
// src/app/queries/flow/mutations/import-export-mutations.ts
export function useExportFlow(flowId: string) {
  return useMutation({
    mutationFn: async () => {
      const result = await FlowService.exportFlowWithNodes.execute(new UniqueEntityID(flowId));
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return result.getValue();
    },
    onSuccess: (file) => {
      // Trigger file download
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

export function useImportFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, agentModelOverrides }: { 
      file: File; 
      agentModelOverrides?: Map<string, any> 
    }) => {
      const result = await FlowService.importFlowWithNodes.execute({ file, agentModelOverrides });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return result.getValue();
    },
    onSuccess: (flow) => {
      // Invalidate flow queries to show new flow
      queryClient.invalidateQueries({ queryKey: flowKeys.all });
      
      // Navigate to the new flow
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState(null, '', `/flow/${flow.id.toString()}`);
      }
    },
  });
}
```

### Phase 5: Component Updates

Update the existing import/export components to use the new mutations:

```typescript
// src/components-v2/flow/components/flow-import-dialog.tsx
export function FlowImportDialog({ open, onOpenChange }: FlowImportDialogProps) {
  const importFlow = useImportFlow();
  
  const handleImport = async (file: File, modelOverrides?: Map<string, any>) => {
    try {
      await importFlow.mutateAsync({ file, agentModelOverrides: modelOverrides });
      onOpenChange(false);
      toast.success("Flow imported successfully");
    } catch (error) {
      toast.error("Failed to import flow", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // ... rest of component
}
```

```typescript
// Update flow list actions to use new export
export function FlowListActions({ flowId }: { flowId: string }) {
  const exportFlow = useExportFlow(flowId);
  
  const handleExport = () => {
    exportFlow.mutate();
  };

  return (
    <Button onClick={handleExport} disabled={exportFlow.isPending}>
      {exportFlow.isPending ? "Exporting..." : "Export"}
    </Button>
  );
}
```

### Phase 6: Edge ID Improvement

Implement a robust edge ID generation system:

```typescript
// src/flow-multi/utils/edge-id-generator.ts
export class EdgeIdGenerator {
  static generate(source: string, target: string, sourceHandle?: string, targetHandle?: string): string {
    // Use UUID for guaranteed uniqueness
    const uuid = new UniqueEntityID().toString();
    
    // Optional: Include source/target info for debugging (not for uniqueness)
    const debugInfo = sourceHandle 
      ? `${source}:${sourceHandle}-${target}:${targetHandle || 'default'}`
      : `${source}-${target}`;
    
    return `edge-${uuid}`;
  }

  static generateBatch(edges: Array<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>): Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }> {
    return edges.map(edge => ({
      ...edge,
      id: this.generate(edge.source, edge.target, edge.sourceHandle, edge.targetHandle),
    }));
  }
}
```

### Phase 7: Migration Strategy

**Backward Compatibility:**
1. Support both old and new export formats during import
2. Always export in new format
3. Migrate existing flows on first export
4. Provide clear error messages for unsupported formats

**Testing Plan:**
1. Test export/import with various flow configurations
2. Test legacy format conversion
3. Test edge case scenarios (empty flows, complex flows)
4. Performance testing with large flows
5. Verify data integrity after import

**Rollout Plan:**
1. Deploy new services with feature flag
2. Update export to use new format
3. Test import compatibility
4. Enable by default
5. Remove legacy export after verification

## Error Handling and Edge Cases

### Import Error Scenarios:
1. **Missing Node Data**: If separate node data is missing, create with defaults
2. **Invalid Node Types**: Skip unknown node types with warning
3. **Broken References**: Remove edges pointing to non-existent nodes
4. **Duplicate IDs**: Always generate new IDs to prevent conflicts
5. **Schema Mismatches**: Migrate or reset to compatible schema

### Export Error Scenarios:
1. **Missing Permissions**: Handle repository access failures gracefully
2. **Large Files**: Implement streaming for very large flows
3. **Corrupted Data**: Validate data before export and skip corrupted entries

### Recovery Mechanisms:
1. **Partial Import**: Allow importing with some failures, report issues
2. **Validation**: Pre-validate import file before processing
3. **Backup**: Create automatic backup before destructive operations
4. **Logging**: Comprehensive error logging for debugging

## Benefits of New Architecture

### Data Integrity:
- ✅ Complete flow recreation with all node data
- ✅ Proper relationship preservation
- ✅ UUID-based IDs prevent conflicts
- ✅ Version tracking for future migrations

### Performance:
- ✅ Efficient data collection using existing repositories  
- ✅ Batch operations for multiple nodes
- ✅ Minimal database queries through proper caching

### Maintainability:
- ✅ Follows existing domain patterns
- ✅ Clear separation of concerns
- ✅ Type-safe implementations
- ✅ Comprehensive error handling

### User Experience:
- ✅ Faster import/export operations
- ✅ Better error messages and recovery
- ✅ Support for complex flow structures
- ✅ Backward compatibility with existing files

## Conclusion

This migration plan addresses the critical issues with the current import/export system while maintaining backward compatibility and following established architectural patterns. The new system will properly handle all node types, prevent ID conflicts, and ensure complete data preservation during flow import/export operations.

The implementation follows the existing domain-driven design patterns and leverages the separated node data architecture to provide a robust, scalable solution for flow migration scenarios.