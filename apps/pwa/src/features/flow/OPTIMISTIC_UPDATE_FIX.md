# Optimistic Update Race Condition Fix

## Problem Summary
When updating if-node conditions, the data was being lost when creating new nodes. This was caused by a race condition between optimistic updates and server refetches.

## Root Cause Analysis

### The Problem Flow:
1. **Local state becomes stale**: When if-node conditions are updated via granular mutation, the local React Flow state (`nodes` state) doesn't get updated - only the React Query cache does.

2. **Optimistic update works correctly**: The if-node mutation properly updates the flow detail cache with the new conditions using optimistic updates.

3. **Immediate refetch overwrites the fix**: When we invalidated the flow detail query with `refetchType: 'active'`, it immediately refetched from the server.

4. **Server returns stale data**: The server query returns data without the conditions because:
   - The database write may not have completed yet (async operation)
   - Or the server query doesn't properly include the just-updated node data

5. **Node creation uses stale data**: When creating new nodes, the code reads from the flow cache which now has stale data (no conditions) because the refetch overwrote the optimistic update.

6. **Stale data gets persisted**: The node creation saves this stale data back to the server, permanently losing the conditions.

## The Solution

Changed the if-node mutation's invalidation strategy:
```typescript
// Before - immediately refetched and overwrote optimistic update
queryClient.invalidateQueries({ 
  queryKey: flowKeys.detail(flowId),
  refetchType: 'active' // ❌ This was the problem
});

// After - preserves optimistic update
queryClient.invalidateQueries({ 
  queryKey: flowKeys.detail(flowId),
  refetchType: 'none' // ✅ Mark as stale but don't refetch
});
```

## Why This Works

1. **Optimistic updates persist**: The optimistically updated data stays in the cache instead of being immediately overwritten.

2. **Client has the latest data**: After a mutation, the client's optimistic update is more accurate than what the server would return immediately.

3. **Subsequent operations use correct data**: When creating nodes or performing other operations, they read from the cache which has the correct, optimistically updated data.

4. **Natural refetch later**: The cache is marked as stale, so it will refetch naturally later when needed (e.g., on component remount or manual refresh).

## Key Lessons

1. **Don't always trust "fresh" server data**: Immediately after a mutation, the server might not have the latest data due to async processing or database write delays.

2. **Optimistic updates need protection**: Be careful about invalidating queries immediately after optimistic updates - you might overwrite the correct data with stale server data.

3. **Local state vs Query cache**: When using React Query with local state management (like React Flow), ensure operations read from the query cache (source of truth) rather than potentially stale local state.

4. **Race conditions in distributed systems**: This is a classic distributed systems problem where the client temporarily has more accurate data than the server.

## Implementation Checklist

- [x] If-node mutations use optimistic updates
- [x] Flow detail query is marked stale but not immediately refetched
- [x] Node creation reads from flow query cache, not local state
- [x] All node creation methods (agent, dataStore, if-node) use latest cache data
- [x] Save operations preserve all node data including conditions

## Related Files Modified

1. `/src/app/queries/flow/mutations/if-node-mutations.ts` - Changed invalidation strategy
2. `/src/flow-multi/panels/flow-panel.tsx` - Fixed node creation to use query cache
3. `/src/app/queries/flow/mutations/nodes-edges-mutations.ts` - Added flow detail invalidation
4. `/src/app/queries/flow/query-factory.ts` - Fixed query key structure