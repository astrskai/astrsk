# TanStack Query Patterns & Best Practices

> **Official Documentation**: [TanStack Query v5](https://tanstack.com/query/latest)

Complete guide for using TanStack Query v5 in the astrsk project.

Last updated: 2025-10-24

---

## Table of Contents

- [Overview](#overview)
- [Query Factory Pattern](#query-factory-pattern)
- [Mutation Hook Pattern](#mutation-hook-pattern)
- [Optimistic Updates](#optimistic-updates)
- [Cache Invalidation](#cache-invalidation)
- [Race Condition Handling](#race-condition-handling)
- [Performance Optimizations](#performance-optimizations)
- [Testing Guidelines](#testing-guidelines)
- [Reference Implementations](#reference-implementations)

---

## Overview

TanStack Query v5 is our primary tool for **server state management**. It provides:

- ✅ **Automatic caching** with smart invalidation
- ✅ **Optimistic updates** for instant UI feedback
- ✅ **Request deduplication** (prevents redundant fetches)
- ✅ **Background refetching** (keep data fresh)
- ✅ **Type-safe query keys** (hierarchical structure)

**Philosophy**:
- Queries for **reading** data (GET)
- Mutations for **writing** data (POST/PUT/DELETE)
- Query factories for **centralized key management**

---

## Query Factory Pattern

### Problem

Without a query factory, cache keys are scattered and hard to manage:

```typescript
// ❌ BAD: Keys scattered across components
useQuery({ queryKey: ['flows', flowId] })
useQuery({ queryKey: ['flows', 'detail', flowId] })
useQuery({ queryKey: ['flow', flowId, 'nodes'] })  // Typo! Should be 'flows'

// Invalidation is error-prone
queryClient.invalidateQueries({ queryKey: ['flows', flowId] })  // Misses other variations
```

### Solution: Hierarchical Query Factory

**Centralized, type-safe query key management**:

```typescript
// app/queries/flow/query-factory.ts
export const flowKeys = {
  all: ['flows'] as const,
  lists: () => [...flowKeys.all, 'list'] as const,
  list: (filters?: FlowFilters) => [...flowKeys.lists(), { filters }] as const,
  details: () => [...flowKeys.all, 'detail'] as const,
  detail: (id: string) => [...flowKeys.details(), id] as const,
  nodes: (flowId: string) => [...flowKeys.detail(flowId), 'nodes'] as const,
  node: (flowId: string, nodeId: string) => [...flowKeys.nodes(flowId), nodeId] as const,
}

export const flowQueries = {
  detail: (id: string) => queryOptions({
    queryKey: flowKeys.detail(id),
    queryFn: async () => {
      const flow = await FlowService.getById(id);
      if (!flow) throw new Error('Flow not found');
      return flow;
    },
    staleTime: 1000 * 10, // 10 seconds
  }),

  nodes: (flowId: string) => queryOptions({
    queryKey: flowKeys.nodes(flowId),
    queryFn: async () => FlowService.getNodes(flowId),
    staleTime: 1000 * 5, // 5 seconds
  }),
}
```

### Usage in Components

```typescript
import { useQuery } from '@tanstack/react-query';
import { flowQueries } from '@/app/queries/flow/query-factory';

const FlowEditor = ({ flowId }: { flowId: string }) => {
  // ✅ GOOD: Type-safe, centralized
  const { data: flow, isLoading, error } = useQuery(flowQueries.detail(flowId));
  const { data: nodes } = useQuery(flowQueries.nodes(flowId));

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{flow.name}</div>;
};
```

### Benefits

- ✅ **Single source of truth** for all query keys
- ✅ **Type-safe** (TypeScript autocomplete)
- ✅ **Easy invalidation** (invalidate all flows, specific flow, etc.)
- ✅ **Hierarchy** (flows → detail → nodes → node)
- ✅ **No typos** (keys defined once)

---

## Mutation Hook Pattern

### Standard Mutation with Optimistic Updates

```typescript
// app/queries/flow/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { flowKeys } from './query-factory';
import { FlowService } from '@/app/services/flow-service';

export const useUpdateFlowTitle = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      return FlowService.updateTitle(flowId, title);
    },

    onMutate: async (title) => {
      // 1. Cancel outgoing queries (prevent race conditions)
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      // 2. Snapshot previous value for rollback
      const previous = queryClient.getQueryData(flowKeys.detail(flowId));

      // 3. Optimistically update cache
      queryClient.setQueryData(flowKeys.detail(flowId), (old: Flow) => ({
        ...old,
        title,
      }));

      // 4. Return context for error handler
      return { previous };
    },

    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previous) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previous);
      }
    },

    onSettled: async () => {
      // Refetch to ensure sync with server
      await queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) });
    }
  });
};
```

### Usage in Components

```typescript
import { useUpdateFlowTitle } from '@/app/queries/flow/mutations';

const FlowHeader = ({ flowId }: { flowId: string }) => {
  const { data: flow } = useQuery(flowQueries.detail(flowId));
  const updateTitle = useUpdateFlowTitle(flowId);

  const handleTitleChange = (newTitle: string) => {
    updateTitle.mutate(newTitle, {
      onSuccess: () => {
        toast.success('Title updated!');
      },
      onError: (error) => {
        toast.error(`Failed: ${error.message}`);
      }
    });
  };

  return (
    <input
      value={flow.title}
      onChange={(e) => handleTitleChange(e.target.value)}
      disabled={updateTitle.isPending}
    />
  );
};
```

---

## Optimistic Updates

### Why Optimistic Updates?

**Without optimistic updates**:
1. User clicks → UI shows loading spinner
2. Wait for server response (200-500ms)
3. UI updates

**With optimistic updates**:
1. User clicks → UI updates **immediately**
2. Server request in background
3. On error → rollback to previous state

Result: **Instant feedback**, better UX.

### Complete Example: Update Node Position

```typescript
export const useUpdateNodePosition = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, position }: { nodeId: string; position: { x: number; y: number } }) => {
      return FlowService.updateNodePosition(flowId, nodeId, position);
    },

    onMutate: async ({ nodeId, position }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: flowKeys.nodes(flowId) });

      // Snapshot
      const previousNodes = queryClient.getQueryData(flowKeys.nodes(flowId));

      // Optimistic update
      queryClient.setQueryData(flowKeys.nodes(flowId), (old: Node[]) =>
        old.map(node =>
          node.id === nodeId
            ? { ...node, position }
            : node
        )
      );

      return { previousNodes };
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousNodes) {
        queryClient.setQueryData(flowKeys.nodes(flowId), context.previousNodes);
      }
      toast.error('Failed to update node position');
    },

    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) });
    }
  });
};
```

---

## Cache Invalidation

### Granular Invalidation Strategies

**Principle**: Invalidate **only what changed**, not everything.

#### 1. Invalidate Specific Query

```typescript
// Only refetch this specific flow
await queryClient.invalidateQueries({
  queryKey: flowKeys.detail(flowId)
});
```

#### 2. Invalidate All Queries in Hierarchy

```typescript
// Refetch ALL flow-related queries
await queryClient.invalidateQueries({
  queryKey: flowKeys.all
});

// Refetch all flow details (but not lists)
await queryClient.invalidateQueries({
  queryKey: flowKeys.details()
});
```

#### 3. Invalidate with Predicate

```typescript
// Invalidate all queries containing this flowId
await queryClient.invalidateQueries({
  predicate: (query) => {
    const [resource, type, id] = query.queryKey;
    return resource === 'flows' && id === flowId;
  }
});
```

#### 4. Remove Queries (After Delete)

```typescript
// After deleting a flow, remove it from cache
queryClient.removeQueries({ queryKey: flowKeys.detail(flowId) });
queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
```

### Invalidation Utilities

Create reusable invalidation helpers:

```typescript
// app/queries/flow/invalidators.ts
export const invalidateFlow = async (queryClient: QueryClient, flowId: string) => {
  await queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) });
};

export const invalidateFlowNodes = async (queryClient: QueryClient, flowId: string) => {
  await queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) });
};

export const invalidateAllFlows = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: flowKeys.all });
};
```

---

## Race Condition Handling

### Problem: Editing Text Fields

When a user edits a text field (e.g., flow title, node description):
1. User types → component auto-saves
2. Auto-save triggers query invalidation
3. Query refetches → **overwrites what user is typing**

### Solution: Edit Mode with `enabled` Option

**Pause query subscription while editing**:

```typescript
const FlowTitleEditor = ({ flowId }: { flowId: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState('');

  // Pause query while editing
  const { data: flow } = useQuery({
    ...flowQueries.detail(flowId),
    enabled: !isEditing, // ⭐ Key: pause query during edit
  });

  const updateTitle = useUpdateFlowTitle(flowId);

  // Initialize local state when not editing
  useEffect(() => {
    if (!isEditing && flow) {
      setLocalTitle(flow.title);
    }
  }, [flow, isEditing]);

  // Debounced save
  const debouncedSave = useMemo(
    () => debounce((title: string) => {
      updateTitle.mutate(title, {
        onSettled: () => setIsEditing(false), // Re-enable query
      });
    }, 500),
    [updateTitle]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    debouncedSave(newTitle);
  };

  return (
    <input
      value={localTitle}
      onChange={handleChange}
      disabled={updateTitle.isPending}
    />
  );
};
```

### Alternative Approaches

#### Using `placeholderData`

Keep previous data during refetch:

```typescript
const { data: flow } = useQuery({
  ...flowQueries.detail(flowId),
  placeholderData: (previousData) => previousData,
});
```

#### Using `refetchOnWindowFocus`

Prevent refetch on focus during edit:

```typescript
const { data: flow } = useQuery({
  ...flowQueries.detail(flowId),
  enabled: !isEditing,
  refetchOnWindowFocus: !isEditing,
  refetchOnReconnect: !isEditing,
});
```

### Complete Edit Mode Hook

```typescript
// shared/hooks/use-edit-mode.ts
export const useEditMode = <T>(
  query: UseQueryResult<T>,
  updateMutation: UseMutationResult<void, Error, T>,
  extractValue: (data: T) => string,
  debounceMs = 500
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (!isEditing && query.data) {
      setLocalValue(extractValue(query.data));
    }
  }, [query.data, isEditing, extractValue]);

  const debouncedSave = useMemo(
    () => debounce((value: string) => {
      updateMutation.mutate(value as any, {
        onSettled: () => setIsEditing(false),
      });
    }, debounceMs),
    [updateMutation, debounceMs]
  );

  const handleChange = (value: string) => {
    setIsEditing(true);
    setLocalValue(value);
    debouncedSave(value);
  };

  return {
    isEditing,
    localValue,
    handleChange,
    isPending: updateMutation.isPending,
  };
};
```

---

## Performance Optimizations

### 1. Use `select` to Transform Data

Prevent unnecessary re-renders by selecting only what you need:

```typescript
const { data: flowName } = useQuery({
  ...flowQueries.detail(flowId),
  select: (flow) => flow.name, // ⭐ Only re-render when name changes
});
```

### 2. Use `staleTime` to Reduce Refetches

```typescript
export const flowQueries = {
  detail: (id: string) => queryOptions({
    queryKey: flowKeys.detail(id),
    queryFn: async () => FlowService.getById(id),
    staleTime: 1000 * 60, // ⭐ 1 minute (don't refetch if data is fresh)
  })
}
```

### 3. Use `gcTime` (formerly `cacheTime`) for Memory

```typescript
export const flowQueries = {
  list: (filters?: FlowFilters) => queryOptions({
    queryKey: flowKeys.list(filters),
    queryFn: async () => FlowService.getAll(filters),
    gcTime: 1000 * 60 * 5, // ⭐ 5 minutes (keep in cache even if unused)
  })
}
```

### 4. Use `placeholderData` for Instant UI

Show previous data while fetching new data:

```typescript
const { data: flows } = useQuery({
  ...flowQueries.list(filters),
  placeholderData: (previousData) => previousData, // ⭐ No loading state on refetch
});
```

### 5. Batch Invalidations

```typescript
// ❌ BAD: Multiple invalidations (triggers multiple refetches)
await queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) });
await queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) });
await queryClient.invalidateQueries({ queryKey: flowKeys.lists() });

// ✅ GOOD: Batch invalidations
await Promise.all([
  queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
  queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
  queryClient.invalidateQueries({ queryKey: flowKeys.lists() }),
]);
```

### 6. Use `structuralSharing` (enabled by default)

TanStack Query automatically shares unchanged data to prevent re-renders:

```typescript
// If API returns same data, components won't re-render
// This is enabled by default, no action needed
```

---

## Testing Guidelines

### Testing Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { flowQueries } from '@/app/queries/flow/query-factory';

describe('flowQueries.detail', () => {
  it('should fetch flow by id', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useQuery(flowQueries.detail('flow-123')),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'flow-123', name: 'Test Flow' });
  });
});
```

### Testing Mutations

```typescript
describe('useUpdateFlowTitle', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should update title optimistically', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Seed cache with initial data
    queryClient.setQueryData(flowKeys.detail('flow-123'), {
      id: 'flow-123',
      title: 'Old Title'
    });

    const { result } = renderHook(
      () => useUpdateFlowTitle('flow-123'),
      { wrapper }
    );

    // Trigger mutation
    result.current.mutate('New Title');

    // Check optimistic update
    const cachedData = queryClient.getQueryData(flowKeys.detail('flow-123'));
    expect(cachedData.title).toBe('New Title');
  });

  it('should rollback on error', async () => {
    // Mock service to fail
    vi.spyOn(FlowService, 'updateTitle').mockRejectedValue(new Error('Network error'));

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    queryClient.setQueryData(flowKeys.detail('flow-123'), {
      id: 'flow-123',
      title: 'Old Title'
    });

    const { result } = renderHook(
      () => useUpdateFlowTitle('flow-123'),
      { wrapper }
    );

    result.current.mutate('New Title');

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check rollback
    const cachedData = queryClient.getQueryData(flowKeys.detail('flow-123'));
    expect(cachedData.title).toBe('Old Title'); // Rolled back
  });
});
```

### Testing Cache Invalidation

```typescript
it('should invalidate flow queries after update', async () => {
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const { result } = renderHook(
    () => useUpdateFlowTitle('flow-123'),
    { wrapper }
  );

  result.current.mutate('New Title');

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: flowKeys.detail('flow-123')
  });
});
```

---

## Reference Implementations

### Complete Reference: Card Entity

**Location**: `apps/pwa/src/app/queries/card/`

```
card/
├── query-factory.ts      # ✅ Hierarchical query keys + queryOptions
├── mutations.ts          # ✅ Ready-to-use mutation hooks
├── invalidators.ts       # ✅ Cache invalidation utilities
└── index.ts             # ✅ Public API (barrel export)
```

**Features**:
- ✅ Complete query factory with hierarchical keys
- ✅ Mutation hooks with optimistic updates
- ✅ Rollback on error
- ✅ Granular cache invalidation
- ✅ Full TypeScript support
- ✅ Comprehensive tests

### Flow Entity (In Progress)

**Location**: `apps/pwa/src/app/queries/flow/`

**See**: [apps/pwa/src/app/queries/flow/README.md](./apps/pwa/src/app/queries/flow/README.md) for:
- Edit mode pattern (race condition prevention)
- Batch operations
- Complex invalidation scenarios
- `withEditMode` option for mutation hooks

---

## Common Patterns

### Pattern 1: Create Entity

```typescript
export const useCreateFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFlowInput) => {
      return FlowService.create(data);
    },
    onSuccess: (newFlow) => {
      // Add to list cache optimistically
      queryClient.setQueryData(flowKeys.lists(), (old: Flow[] = []) => [
        newFlow,
        ...old,
      ]);

      // Set detail cache
      queryClient.setQueryData(flowKeys.detail(newFlow.id), newFlow);
    },
  });
};
```

### Pattern 2: Delete Entity

```typescript
export const useDeleteFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      return FlowService.delete(flowId);
    },
    onSuccess: (_, flowId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: flowKeys.detail(flowId) });

      // Update lists
      queryClient.setQueryData(flowKeys.lists(), (old: Flow[] = []) =>
        old.filter(flow => flow.id !== flowId)
      );
    },
  });
};
```

### Pattern 3: Dependent Queries

```typescript
const FlowNodes = ({ flowId }: { flowId: string }) => {
  // First, fetch flow
  const { data: flow } = useQuery(flowQueries.detail(flowId));

  // Then, fetch nodes (only if flow exists)
  const { data: nodes } = useQuery({
    ...flowQueries.nodes(flowId),
    enabled: !!flow, // ⭐ Dependent query
  });

  return <div>{nodes?.length} nodes</div>;
};
```

### Pattern 4: Parallel Queries

```typescript
const FlowDashboard = ({ flowId }: { flowId: string }) => {
  const queries = useQueries({
    queries: [
      flowQueries.detail(flowId),
      flowQueries.nodes(flowId),
      flowQueries.metadata(flowId),
    ],
  });

  const [flowQuery, nodesQuery, metadataQuery] = queries;

  if (queries.some(q => q.isLoading)) return <Spinner />;

  return <div>...</div>;
};
```

---

## Best Practices Summary

### ✅ DO

- ✅ Use query factories for centralized key management
- ✅ Implement optimistic updates for instant feedback
- ✅ Always handle rollback in `onError`
- ✅ Use granular cache invalidation
- ✅ Use `enabled` option for dependent queries
- ✅ Use `select` to optimize re-renders
- ✅ Set appropriate `staleTime` and `gcTime`
- ✅ Test mutations (optimistic updates, rollback, invalidation)
- ✅ Follow card entity as reference implementation

### ❌ DON'T

- ❌ Scatter query keys across components
- ❌ Forget to cancel queries in `onMutate`
- ❌ Skip rollback handling
- ❌ Invalidate everything (use granular invalidation)
- ❌ Use queries for mutations (POST/PUT/DELETE)
- ❌ Ignore race conditions in text fields
- ❌ Forget to test error scenarios

---

## Additional Resources

**Official Documentation**:
- [TanStack Query v5 Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

**Project Documentation**:
- [Flow Query README](./apps/pwa/src/app/queries/flow/README.md) - Edit mode, race conditions
- [Card Implementation](./apps/pwa/src/app/queries/card/) - Reference implementation
- [FSD.md](./FSD.md) - Architecture guidelines

---

**Back to**: [CLAUDE.md](./CLAUDE.md) - Project guidelines
