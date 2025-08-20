# Flow Query Utilities

Organized utilities for managing flow queries with TanStack Query.

## Structure

```
flow/
├── invalidators.ts       # Cache invalidation utilities
├── optimistic-updates.ts # Optimistic update utilities
├── batch-operations.ts   # Common operation patterns
├── mutations.ts          # Ready-to-use mutation hooks
└── index.ts             # Exports everything
```

## Usage Examples

### 1. Using Invalidators

```typescript
import { invalidateFlowNodes, invalidateFlowNode } from '@/app/queries/flow';
// or
import { invalidators } from '@/app/queries/flow';

// Invalidate all nodes in a flow
await invalidateFlowNodes(queryClient, flowId);

// Invalidate specific node
await invalidateFlowNode(queryClient, flowId, nodeId);

// Using namespace import
await invalidators.invalidateFlowMetadata(queryClient, flowId);
```

### 2. Using Optimistic Updates

```typescript
import { updateNode, addNode } from '@/app/queries/flow';
// or
import { optimisticUpdates } from '@/app/queries/flow';

// Update a node optimistically
updateNode(queryClient, flowId, nodeId, (node) => ({
  ...node,
  data: { ...node.data, label: 'New Label' }
}));

// Add a node optimistically
addNode(queryClient, flowId, newNode);

// Using namespace import
optimisticUpdates.updateMetadata(queryClient, flowId, { name: 'New Name' });
```

### 3. Using Batch Operations

```typescript
import { afterAddNode, afterRemoveNode } from '@/app/queries/flow';
// or
import { batchOperations } from '@/app/queries/flow';

// After adding a node (invalidates nodes and validation)
await afterAddNode(queryClient, flowId);

// After removing a node (invalidates graph, validation, and removes queries)
await afterRemoveNode(queryClient, flowId, nodeId);

// Using namespace import
await batchOperations.afterUpdateDataStoreSchema(queryClient, flowId);
```

### 4. Using Mutation Hooks (Recommended)

#### Basic Usage (for non-text fields)

```typescript
import { useFlowMutations } from '@/app/queries/flow';

const FlowEditor = () => {
  const flowId = useFlowId();
  const { 
    updateNode, 
    addNode, 
    removeNode,
    updateMetadata,
    updateResponseTemplate 
  } = useFlowMutations(flowId);

  // Update node with automatic optimistic update and invalidation
  const handleNodeUpdate = (nodeId: string, changes: Partial<Node>) => {
    updateNode.mutate({ nodeId, data: changes });
  };

  // Add node
  const handleAddNode = (node: Node) => {
    addNode.mutate(node);
  };

  // Update metadata
  const handleNameChange = (name: string) => {
    updateMetadata.mutate({ name });
  };

  // Check mutation status
  if (updateNode.isPending) {
    // Show loading state
  }

  if (updateNode.isError) {
    // Show error state
  }
};
```

#### With Edit Mode (for text fields) - NEW!

```typescript
import { useFlowMutations } from '@/app/queries/flow';
import { useQuery } from '@tanstack/react-query';
import { flowQueries } from '@/app/queries/flow/query-factory';

const TextFieldEditor = () => {
  const flowId = useFlowId();
  
  // Enable edit mode for text field mutations
  const mutations = useFlowMutations(flowId, { withEditMode: true });
  
  // Use isEditing state to pause query subscription
  const { data: node } = useQuery({
    ...flowQueries.node(flowId, nodeId),
    enabled: !mutations.updateNode.isEditing, // Pause while editing!
  });
  
  // Handle text input changes
  const handleDescriptionChange = (value: string) => {
    // This will:
    // 1. Set isEditing = true
    // 2. Do optimistic update
    // 3. Save to database
    // 4. After 500ms of no activity, set isEditing = false
    mutations.updateNode.mutate({ 
      nodeId, 
      data: { description: value } 
    });
  };
  
  return (
    <textarea
      value={localValue}
      onChange={(e) => handleDescriptionChange(e.target.value)}
      disabled={mutations.updateNode.isPending}
    />
  );
};
```

### 5. Manual Cache Management

```typescript
import { flowKeys } from '@/app/queries/flow-query-factory';
import { optimisticUpdates, invalidators } from '@/app/queries/flow';

// Manual optimistic update + invalidation pattern
const updateNodeManually = async (nodeId: string, changes: Partial<Node>) => {
  // 1. Optimistic update
  optimisticUpdates.updateNode(queryClient, flowId, nodeId, (node) => ({
    ...node,
    ...changes
  }));

  try {
    // 2. API call
    await FlowService.updateNode(flowId, nodeId, changes);
    
    // 3. Invalidate to sync with server
    await invalidators.invalidateFlowNode(queryClient, flowId, nodeId);
  } catch (error) {
    // 4. On error, invalidate to rollback
    await invalidators.invalidateFlow(queryClient, flowId);
    throw error;
  }
};
```

## Key Principles

1. **Granular Updates**: Update only what changed, not the entire flow
2. **Optimistic UI**: Show changes immediately, rollback on error
3. **Smart Invalidation**: Only refetch affected queries
4. **Type Safety**: Full TypeScript support throughout

## When to Use Each Utility

- **Invalidators**: After successful mutations to sync with server
- **Optimistic Updates**: For immediate UI feedback during mutations
- **Batch Operations**: For common patterns (e.g., node removal affects edges)
- **Mutation Hooks**: Complete solution with all patterns built-in (recommended)

## Handling Race Conditions with Edit Mode

When building components that allow real-time editing (like text inputs for descriptions, prompts, etc.), you may encounter race conditions where:
1. User types → component saves → triggers invalidation
2. The same component refetches due to invalidation
3. The refetched data overwrites what the user is currently typing

### Solution: Edit Mode with TanStack Query's Native Features

TanStack Query provides several native options to handle this elegantly:

#### 1. **Using `enabled` Option (Recommended)**

Pause the query subscription while editing:

```typescript
const [isEditing, setIsEditing] = useState(false);
const [localValue, setLocalValue] = useState('');

const { data: node } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  enabled: !isEditing, // Pause query while editing
});

// Initialize local state when not editing
useEffect(() => {
  if (!isEditing && node) {
    setLocalValue(node.data.description);
  }
}, [node, isEditing]);

// Handle input changes
const handleChange = (value: string) => {
  setIsEditing(true);
  setLocalValue(value);
  debouncedSave(value);
};

// Save with debounce
const debouncedSave = debounce((value: string) => {
  updateNode(nodeId, { description: value }).then(() => {
    setIsEditing(false); // Re-enable query after save
  });
}, 500);
```

#### 2. **Using `notifyOnChangeProps`**

Control when the component re-renders:

```typescript
const { data: node } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  notifyOnChangeProps: isEditing ? [] : 'all', // No re-renders while editing
});
```

#### 3. **Using `placeholderData`**

Keep previous data during updates:

```typescript
const { data: node } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  placeholderData: (previousData) => previousData, // Keep old data during refetch
});
```

#### 4. **Using `select` with Memoization**

Freeze data while editing:

```typescript
const lastGoodData = useRef(null);

const { data: node } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  select: (data) => {
    if (isEditing) return lastGoodData.current; // Return frozen data
    lastGoodData.current = data;
    return data;
  },
});
```

#### 5. **Combining with `refetchOnWindowFocus`**

Prevent unwanted refetches:

```typescript
const { data: node } = useQuery({
  ...flowQueries.node(flowId, nodeId),
  enabled: !isEditing,
  refetchOnWindowFocus: !isEditing, // Don't refetch on focus while editing
  refetchOnReconnect: !isEditing,   // Don't refetch on reconnect while editing
});
```

### Why This Works

- **Invalidation still happens** → Other components see the updates
- **The editing component ignores updates** → No race condition
- **After save completes** → Component re-subscribes to get latest data
- **Uses TanStack Query's native features** → No custom workarounds needed

### Best Practices

1. **For text inputs** (descriptions, prompts, messages):
   - Use the `enabled: !isEditing` pattern
   - Maintain local state during editing
   - Re-enable query after save completes

2. **For dropdowns/toggles**:
   - Use normal invalidation patterns
   - These don't have race condition issues

3. **For complex forms**:
   - Consider using a form library (react-hook-form)
   - Save all changes at once on form submit
   - Use edit mode for the entire form

## Important Notes

⚠️ **Service Implementation Required**: The mutation hooks have placeholder errors because granular Flow services don't exist yet. You'll need to implement:
- `FlowService.updateNode(flowId, nodeId, data)`
- `FlowService.updateMetadata(flowId, metadata)`
- `FlowService.updateEdge(flowId, edgeId, data)`
- etc.

Until then, you can use the optimistic updates and invalidators manually with your existing `FlowService.updateFlow()` method.