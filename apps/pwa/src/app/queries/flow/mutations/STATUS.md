# Mutation Implementation Status

## Quick Status Overview

| Category | File | Status | Priority |
|----------|------|--------|----------|
| **Core Mutations** | `mutations.ts` | 🔴 Has placeholders | HIGH |
| **Node Operations** | `node-mutations.ts` | ❌ Not created | HIGH |
| **Agent Operations** | `agent-mutations.ts` | ❌ Not created | MEDIUM |
| **DataStore Operations** | `data-store-mutations.ts` | ✅ Complete | DONE |
| **If Node Operations** | `if-node-mutations.ts` | ✅ Complete | DONE |

## Detailed Implementation Status

### 🔴 Core Mutations (`../mutations.ts`)
Currently all throw "not implemented" errors. Need real implementation.

| Mutation | Current State | What It Should Do |
|----------|---------------|-------------------|
| `useUpdateNode` | 🔴 Throws error | Update any node data |
| `useAddNode` | 🔴 Throws error | Add new node to flow |
| `useRemoveNode` | 🔴 Throws error | Remove node and its edges |
| `useUpdateEdge` | 🔴 Throws error | Update edge properties |
| `useUpdateMetadata` | 🔴 Throws error | Update flow name/description |
| `useUpdateResponseTemplate` | 🔴 Throws error | Update response template |

**Fix Required:**
```typescript
// Replace this:
throw new Error("updateNode service not implemented yet");

// With this pattern:
const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
const updatedFlow = flow.update({ /* changes */ });
const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
return saveResult.getValue();
```

### ❌ Node Mutations (`node-mutations.ts`) - TO CREATE

| Mutation | Edit Mode? | Purpose |
|----------|------------|---------|
| `useUpdateNodePosition` | ❌ No | Move node on canvas |
| `useUpdateNodeLabel` | ✅ Yes | Change node display name |
| `useUpdateNodeColor` | ❌ No | Change node color/theme |
| `useUpdateNodeSize` | ❌ No | Resize node |
| `useBatchUpdateNodePositions` | ❌ No | Move multiple nodes |

### ❌ Agent Mutations (`agent-mutations.ts`) - TO CREATE

| Mutation | Edit Mode? | Purpose |
|----------|------------|---------|
| `useUpdateAgentReference` | ❌ No | Change which agent this node uses |
| `useUpdateAgentPrompt` | ✅ Yes | Override agent prompt |
| `useUpdateAgentModel` | ❌ No | Override model selection |
| `useUpdateAgentTemperature` | ❌ No | Override temperature |
| `useUpdateAgentMaxTokens` | ❌ No | Override max tokens |

### ✅ DataStore Mutations (`data-store-mutations.ts`) - COMPLETE

#### Schema Operations
| Mutation | Status | Edit Mode? |
|----------|--------|------------|
| `useUpdateDataStoreSchemaField` | ✅ | Yes |
| `useAddDataStoreSchemaField` | ✅ | No |
| `useRemoveDataStoreSchemaField` | ✅ | No |
| `useReorderDataStoreSchemaFields` | ✅ | No |

#### Node Field Operations
| Mutation | Status | Edit Mode? |
|----------|--------|------------|
| `useUpdateDataStoreNodeField` | ✅ | Yes |
| `useAddDataStoreNodeField` | ✅ | No |
| `useRemoveDataStoreNodeField` | ✅ | No |
| `useReorderDataStoreNodeFields` | ✅ | No |

### ✅ If Node Mutations (`if-node-mutations.ts`) - COMPLETE

| Mutation | Status | Edit Mode? |
|----------|--------|------------|
| `useUpdateIfNodeOperator` | ✅ | No |
| `useUpdateIfNodeCondition` | ✅ | Yes (value1/value2) |
| `useAddIfNodeCondition` | ✅ | No |
| `useRemoveIfNodeCondition` | ✅ | No |
| `useReorderIfNodeConditions` | ✅ | No |
| `useUpdateIfNodeMetadata` | ✅ | Yes (label) |

## Implementation Priority

### 🚨 Priority 1: Fix Core Mutations
These are blocking everything else:
1. Fix `useUpdateNode` in `mutations.ts`
2. Fix `useAddNode` in `mutations.ts`
3. Fix `useRemoveNode` in `mutations.ts`
4. Fix `useUpdateMetadata` in `mutations.ts`
5. Fix `useUpdateResponseTemplate` in `mutations.ts`
6. Fix `useUpdateEdge` in `mutations.ts`

### 📌 Priority 2: Create Node Mutations
Basic node operations needed for flow editor:
1. Create `node-mutations.ts`
2. Implement position updates
3. Implement label/color updates
4. Implement batch position updates

### 📋 Priority 3: Create Agent Mutations
Agent-specific features:
1. Create `agent-mutations.ts`
2. Implement agent reference updates
3. Implement override mutations

## Quick Implementation Template

### For Mutations WITH Edit Mode (text fields):
```typescript
export const useUpdateSomething = (flowId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();
  
  // ... debounce logic ...
  
  const mutation = useMutation({
    mutationFn: async (value: string) => {
      // Get flow, update, save
    },
    onMutate: async () => {
      startEditing(); // IMPORTANT!
      // ... optimistic update ...
    },
    onSettled: async (data, error) => {
      if (!error) endEditing(); // IMPORTANT!
      // ... invalidation ...
    }
  });
  
  return {
    mutate: mutation.mutate,
    isEditing, // ALWAYS PRESENT!
    // ... other properties
  };
};
```

### For Mutations WITHOUT Edit Mode:
```typescript
export const useUpdateSomething = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (value: any) => {
      // Get flow, update, save
    },
    onMutate: async () => {
      // ... optimistic update ...
    },
    onSettled: async () => {
      // ... invalidation ...
    }
  });
};
```

## Testing Checklist

Before marking a mutation as complete:
- [ ] Mutation updates the flow correctly
- [ ] Optimistic update shows immediately
- [ ] Error rolls back to previous state
- [ ] Success invalidates correct queries
- [ ] Text fields have edit mode with 500ms debounce
- [ ] TypeScript types are fully type-safe
- [ ] No optional `isEditing` for text field mutations