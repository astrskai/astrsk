# astrsk Development Guidelines

Auto-generated from feature plans. Last updated: 2025-09-25

## Active Technologies
- TypeScript 5.x / React 18.x (PWA)
- TanStack Query v5 (Query/Mutation management)
- React Flow (Flow editor)
- Drizzle ORM (Database)
- Vite (Build tool)
- Vitest (Testing)

## Project Structure
```
apps/pwa/src/
├── app/
│   ├── queries/          # Query factories and mutations
│   │   ├── card/        # Card entity (reference implementation)
│   │   └── flow/        # Flow entity (being refactored)
│   └── services/        # Business logic services
├── flow-multi/          # Flow editor components
│   ├── nodes/          # Node components
│   ├── panels/         # Panel components
│   └── hooks/          # Custom hooks
└── modules/            # Domain entities
    ├── card/          # Card domain
    └── flow/          # Flow domain
```

## Current Feature: Flow Mutation Refactoring
**Branch**: 005-flow-test-i

### Objective
Migrate flow-related operations from direct service calls to mutation-based pattern following the successful card entity refactoring.

### Key Patterns to Follow

#### Query Factory Pattern (from card implementation)
```typescript
// Hierarchical query keys
export const flowKeys = {
  all: ['flows'],
  detail: (id) => ['flows', 'detail', id],
  // Sub-entity keys...
}

// Query options with proper caching
export const flowQueries = {
  detail: (id) => queryOptions({
    queryKey: flowKeys.detail(id),
    queryFn: async () => { /* ... */ },
    staleTime: 1000 * 10,
  })
}
```

#### Mutation Hook Pattern
```typescript
export const useUpdateFlowTitle = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title: string) => { /* ... */ },
    onMutate: async (title) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      // Update cache optimistically
    },
    onError: (err, variables, context) => {
      // Rollback on error
    },
    onSettled: async () => {
      // Optional: invalidate queries
    }
  });
};
```

### Entities to Refactor
1. **Flow**: Response template, panel layout, viewport
2. **Agent**: Create, update prompt/output, delete
3. **DataStore Node**: Create, update fields/data, delete
4. **If Node**: Create, update conditions/operator, delete

### Direct Service Calls to Replace
- `FlowService.*` → Flow mutations
- `AgentService.*` → Agent mutations  
- `DataStoreNodeService.*` → DataStore mutations
- `IfNodeService.*` → IfNode mutations

**Exception**: Export operations remain as direct service calls (no DB manipulation)

## Commands
```bash
# Development
pnpm dev:pwa           # Start PWA dev server

# Testing
pnpm test              # Run all tests
pnpm test src/app/queries/flow/mutations  # Test flow mutations

# Build
pnpm build:pwa         # Build PWA
```

## Code Style
- TypeScript strict mode required
- No `any` types without justification
- Follow existing patterns in card/ for consistency
- Test-first development (TDD)
- Comprehensive error handling with rollback

## Testing Requirements
For each mutation:
1. Unit test the mutation logic
2. Test optimistic updates
3. Test error rollback
4. Test cache invalidation
5. Integration test with service layer

## Recent Changes
- 005-flow-test-i: Implementing mutation-based pattern for flow entities
- Successfully refactored card entity as reference implementation
- Established query factory pattern for centralized key management

## Performance Guidelines
- Use optimistic updates for all mutations
- Implement granular cache invalidation
- Use WeakMap for select result caching
- Batch updates where possible

## Constitutional Principles
- **Code Reusability First**: Reuse existing patterns from card implementation
- **Single Source of Truth**: Query factory manages all cache keys
- **Test-Driven Development**: Write tests before implementation
- **Type Safety Everywhere**: Full TypeScript coverage

<!-- MANUAL ADDITIONS START -->
## Migration Status Tracking

### Completed
- [x] Card entity fully migrated to mutations
- [x] Flow query factory structure created
- [x] Partial flow mutations implemented

### In Progress
- [ ] Agent mutations
- [ ] DataStore node mutations
- [ ] If node mutations
- [ ] Complete test coverage

### Todo
- [ ] Remove deprecated direct service calls
- [ ] Update all flow panels to use mutations
- [ ] Performance benchmarking
<!-- MANUAL ADDITIONS END -->