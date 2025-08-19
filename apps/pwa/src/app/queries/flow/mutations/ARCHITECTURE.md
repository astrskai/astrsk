# Mutation Architecture - Avoiding Redundancy

## The Problem
We have overlapping mutations:
- `useUpdateNode` - Can update ANY part of a node
- Specific mutations - Update specific parts with extra features

## The Solution: Layered Architecture

### Layer 1: Core Mutations (Base Layer)
These handle the actual Flow update and save:

```typescript
// mutations.ts - GENERIC operations
useUpdateNode(flowId)        // Update any node data
useAddNode(flowId)           // Add any node type
useRemoveNode(flowId)        // Remove any node
useUpdateEdge(flowId)        // Update any edge
```

### Layer 2: Specialized Mutations (Feature Layer)
These ADD features on top of core mutations:

```typescript
// node-mutations.ts - Specialized for common operations
useUpdateNodePosition(flowId, nodeId)  // No edit mode, just convenience
useUpdateNodeLabel(flowId, nodeId)     // WITH edit mode for text field
useUpdateNodeColor(flowId, nodeId)     // No edit mode, just convenience

// These internally use useUpdateNode but add:
// 1. Edit mode for text fields
// 2. Better type safety
// 3. Simplified API
```

### Layer 3: Domain-Specific Mutations
These handle complex domain logic:

```typescript
// data-store-mutations.ts
useUpdateDataStoreSchemaField  // Updates schema, triggers field sync
useUpdateDataStoreNodeField    // Updates runtime values

// if-node-mutations.ts  
useUpdateIfNodeCondition       // Updates condition with validation
useAddIfNodeCondition          // Adds with ID generation
```

## Implementation Pattern

### Option 1: Composition (RECOMMENDED)
Specialized mutations use core mutations internally:

```typescript
export const useUpdateNodeLabel = (flowId: string, nodeId: string) => {
  const updateNode = useUpdateNode(flowId);
  const [isEditing, setIsEditing] = useState(false);
  // ... edit mode logic ...
  
  return {
    mutate: (label: string) => {
      startEditing();
      updateNode.mutate({ 
        nodeId, 
        data: { data: { label } } 
      });
    },
    isEditing,  // Extra feature!
    isPending: updateNode.isPending,
    isError: updateNode.isError,
  };
};
```

### Option 2: Direct Implementation
Each mutation independently implements the full logic:

```typescript
export const useUpdateNodeLabel = (flowId: string, nodeId: string) => {
  // Full implementation with edit mode
  // Duplicates some logic but more control
};
```

## When to Use Which?

### Use Core Mutations (`useUpdateNode`) when:
- Updating multiple properties at once
- Building generic components
- Don't need edit mode
- Need full flexibility

```typescript
// Good use of core mutation
updateNode.mutate({
  nodeId,
  data: {
    position: { x: 100, y: 200 },
    data: { color: 'blue', label: 'New' }
  }
});
```

### Use Specialized Mutations when:
- Updating a single property
- Need edit mode for text fields
- Want better type safety
- Building specific UI components

```typescript
// Good use of specialized mutation
const { mutate, isEditing } = useUpdateNodeLabel(flowId, nodeId);
mutate("New Label");  // Simple API, includes edit mode
```

### Use Domain Mutations when:
- Complex business logic involved
- Multiple related updates needed
- Domain-specific validation required

```typescript
// Good use of domain mutation
updateIfNodeCondition.mutate({
  conditionId,
  updates: { value1: "x", operator: ">", value2: "10" }
});
```

## Current Status

### ✅ Working
- Core mutations (just fixed)
- Domain mutations (DataStore, If node)

### ❌ To Implement
Instead of creating redundant mutations, we should:

1. **Keep core mutations generic** (DONE)
2. **Create convenience wrappers** for common operations:
   - `useUpdateNodePosition` - wrapper around useUpdateNode
   - `useUpdateNodeLabel` - wrapper with edit mode
   - `useUpdateNodeColor` - wrapper for simplicity

3. **Keep domain mutations separate** (DONE)
   - They handle complex logic specific to node types

## Example Implementation

```typescript
// node-mutations.ts - Using composition pattern

import { useUpdateNode } from '../mutations';

export const useUpdateNodePosition = (flowId: string, nodeId: string) => {
  const updateNode = useUpdateNode(flowId);
  
  return {
    mutate: (position: { x: number; y: number }) => 
      updateNode.mutate({ nodeId, data: { position } }),
    isPending: updateNode.isPending,
    isError: updateNode.isError,
    error: updateNode.error,
  };
};

export const useUpdateNodeLabel = (flowId: string, nodeId: string) => {
  const updateNode = useUpdateNode(flowId);
  // Note: updateNode already has edit mode!
  
  return {
    mutate: (label: string) => 
      updateNode.mutate({ nodeId, data: { data: { label } } }),
    isEditing: updateNode.isEditing,  // Pass through edit mode
    isPending: updateNode.isPending,
    isError: updateNode.isError,
    error: updateNode.error,
  };
};
```

## Benefits
1. **No code duplication** - Core logic in one place
2. **Flexible** - Can use generic or specific as needed  
3. **Type safe** - Specialized mutations have specific types
4. **Feature rich** - Edit mode only where needed
5. **Maintainable** - Changes to save logic in one place