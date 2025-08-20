# Flow Mutations Implementation Plan

## Overview
This document outlines the complete mutation system architecture and implementation status for the Flow editor.

## Architecture

### File Structure
```
queries/flow/
├── query-factory.ts           # Query key factory for all flow queries
├── mutations/                 # Mutation hooks organized by domain
│   ├── index.ts               # Main export file
│   ├── node-mutations.ts      # General node operations (position, label, color)
│   ├── agent-mutations.ts     # Agent-specific operations
│   ├── data-store-mutations.ts # DataStore node operations ✅
│   └── if-node-mutations.ts   # If node operations ✅
├── mutations.ts               # Core flow mutations (nodes, edges, metadata)
├── optimistic-updates.ts      # Optimistic update utilities
├── batch-operations.ts        # Batch invalidation patterns
├── invalidators.ts            # Granular cache invalidation
└── debounced-mutations.ts     # Debounced versions for frequent updates
```

## Implementation Status

### ✅ Completed

#### 1. Core Infrastructure
- [x] Query factory with hierarchical keys
- [x] Optimistic update utilities
- [x] Batch operation patterns
- [x] Invalidation utilities
- [x] Edit mode pattern for text fields (prevents race conditions)

#### 2. DataStore Mutations (`data-store-mutations.ts`)
- [x] **Schema Operations**
  - `useUpdateDataStoreSchemaField` - Update field properties (name, type, initialValue)
  - `useAddDataStoreSchemaField` - Add new schema field
  - `useRemoveDataStoreSchemaField` - Remove schema field
  - `useReorderDataStoreSchemaFields` - Reorder schema fields

- [x] **Node Field Operations**
  - `useUpdateDataStoreNodeField` - Update runtime field values/logic
  - `useAddDataStoreNodeField` - Add field to node
  - `useRemoveDataStoreNodeField` - Remove field from node
  - `useReorderDataStoreNodeFields` - Reorder node fields

#### 3. If Node Mutations (`if-node-mutations.ts`)
- [x] `useUpdateIfNodeOperator` - Update AND/OR logic operator
- [x] `useUpdateIfNodeCondition` - Update condition (with edit mode for value1/value2)
- [x] `useAddIfNodeCondition` - Add new condition
- [x] `useRemoveIfNodeCondition` - Remove condition
- [x] `useReorderIfNodeConditions` - Reorder conditions
- [x] `useUpdateIfNodeMetadata` - Update label/color

### 🚧 To Implement

#### 1. Node Mutations (`node-mutations.ts`)
```typescript
// General node operations that apply to all node types

export const useUpdateNodePosition = (flowId: string, nodeId: string)
// Updates node x,y position
// No edit mode needed (not a text field)

export const useUpdateNodeLabel = (flowId: string, nodeId: string)
// Updates node label
// Needs edit mode (text field)

export const useUpdateNodeColor = (flowId: string, nodeId: string)
// Updates node color/theme
// No edit mode needed

export const useUpdateNodeSize = (flowId: string, nodeId: string)
// Updates node width/height if applicable
// No edit mode needed

export const useBatchUpdateNodePositions = (flowId: string)
// Updates multiple node positions at once (for layout operations)
// Used when auto-arranging nodes
```

#### 2. Agent Mutations (`agent-mutations.ts`)
```typescript
// Agent-specific operations

export const useUpdateAgentReference = (flowId: string, nodeId: string)
// Updates the agent ID that this node references
// No edit mode needed

export const useUpdateAgentPrompt = (flowId: string, nodeId: string)
// Updates agent-specific prompt override
// Needs edit mode (text field)

export const useUpdateAgentModel = (flowId: string, nodeId: string)
// Updates agent model override
// No edit mode needed

export const useUpdateAgentTemperature = (flowId: string, nodeId: string)
// Updates agent temperature override
// No edit mode needed

export const useUpdateAgentMaxTokens = (flowId: string, nodeId: string)
// Updates agent max tokens override
// No edit mode needed
```

#### 3. Core Flow Mutations (`mutations.ts`) - Currently Placeholder
```typescript
// Need to implement actual service calls instead of throwing errors

export const useUpdateNode = (flowId: string)
// Currently throws "not implemented"
// Should use FlowService.saveFlow with optimistic updates

export const useAddNode = (flowId: string)
// Currently throws "not implemented"
// Should add node and save flow

export const useRemoveNode = (flowId: string)
// Currently throws "not implemented"
// Should remove node and connected edges

export const useUpdateEdge = (flowId: string)
// Currently throws "not implemented"
// Should update edge properties

export const useUpdateMetadata = (flowId: string)
// Currently throws "not implemented"
// Should update flow name/description

export const useUpdateResponseTemplate = (flowId: string)
// Currently throws "not implemented"
// Should update response template
```

## Implementation Guide

### Step 1: Fix Core Mutations
Replace placeholder errors in `mutations.ts` with actual implementation using `FlowService.saveFlow`:

```typescript
// Example fix for useUpdateNode
mutationFn: async ({ nodeId, data }) => {
  const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
  if (!flow) throw new Error("Flow not found");
  
  const nodes = [...flow.props.nodes];
  const nodeIndex = nodes.findIndex(n => n.id === nodeId);
  if (nodeIndex === -1) throw new Error("Node not found");
  
  nodes[nodeIndex] = { ...nodes[nodeIndex], ...data };
  
  const updatedFlow = flow.update({ nodes });
  if (updatedFlow.isFailure) {
    throw new Error(updatedFlow.getError());
  }
  
  const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
  if (saveResult.isFailure) {
    throw new Error(saveResult.getError());
  }
  
  return saveResult.getValue();
}
```

### Step 2: Create Node Mutations File
Create `mutations/node-mutations.ts` with general node operations.

### Step 3: Create Agent Mutations File
Create `mutations/agent-mutations.ts` with agent-specific operations.

### Step 4: Update Exports
Update `mutations/index.ts` to export all mutation files:

```typescript
export * from './node-mutations';
export * from './agent-mutations';
export * from './data-store-mutations';
export * from './if-node-mutations';
```

## Usage Patterns

### Basic Mutation Usage
```typescript
const { mutate, isEditing } = useUpdateNodeLabel(flowId, nodeId);

// In component
<input 
  onChange={(e) => mutate(e.target.value)}
  disabled={isPending}
/>

// Use isEditing to pause query subscription
const { data } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  enabled: !isEditing // Pause while editing
});
```

### Batch Operations
```typescript
const batchUpdate = useBatchUpdateNodePositions(flowId);

// Update multiple nodes at once
batchUpdate.mutate([
  { nodeId: 'node1', position: { x: 100, y: 100 } },
  { nodeId: 'node2', position: { x: 200, y: 200 } }
]);
```

### With Optimistic Updates
All mutations automatically handle:
1. Optimistic updates for instant UI feedback
2. Rollback on error
3. Cache invalidation after success
4. Edit mode for text fields (500ms debounce)

## Testing Checklist

### For Each Mutation
- [ ] Optimistic update works immediately
- [ ] Error rollback restores previous state
- [ ] Success invalidates correct queries
- [ ] Edit mode prevents race conditions (text fields only)
- [ ] TypeScript types are fully type-safe
- [ ] No optional `isEditing` - always present when needed

### Integration Tests
- [ ] Multiple mutations can run concurrently
- [ ] Edit mode properly debounces across multiple edits
- [ ] Cache stays consistent after errors
- [ ] Validation updates after structural changes

## Common Patterns

### Text Field with Edit Mode
```typescript
// Always has isEditing, TypeScript knows it exists
const { mutate, isEditing } = useUpdateSomeTextField(flowId);

// Use in query
const { data } = useQuery({
  ...query,
  enabled: !isEditing
});
```

### Non-Text Field (No Edit Mode)
```typescript
// No isEditing needed
const { mutate } = useUpdateNodeColor(flowId, nodeId);

// Query doesn't need enabled flag
const { data } = useQuery(query);
```

### Error Handling
```typescript
const { mutate, isError, error } = useSomeMutation(flowId);

if (isError) {
  console.error('Mutation failed:', error);
  // Show user-friendly error
}
```

## Notes

1. **All mutations use `FlowService.saveFlow`** - We save the entire flow until granular APIs exist
2. **Edit mode is only for text fields** - Prevents typing race conditions
3. **Order is tracked by array position** - No separate order field needed
4. **IDs are required** - All array items (fields, conditions) must have unique IDs
5. **Optimistic updates are automatic** - Every mutation does optimistic updates

## Migration Path

When granular APIs become available:
1. Replace `FlowService.saveFlow` calls with specific endpoints
2. Update error handling for new API responses
3. Optimistic updates and cache invalidation stay the same
4. Edit mode pattern remains unchanged