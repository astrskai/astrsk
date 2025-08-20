# Flow Panel Migration to Efficient Query System

## Overview
Migrate the flow-panel.tsx to use granular queries similar to the agent node implementation. This will improve performance by only fetching the specific fields needed and preventing unnecessary re-renders.

## Current State Analysis

### Data Currently Used from Flow
The flow panel currently uses the following fields from the flow object:
1. **name** - For displaying and editing the flow title
2. **nodes** - For rendering and managing flow nodes  
3. **edges** - For rendering and managing connections
4. **viewport** - For saving viewport state
5. **agentIds** - For checking existing agents
6. **id** - For invalidation and references
7. **responseTemplate** - Potentially used in other panels
8. **dataStoreSchema** - Used in data store nodes

### Current Issues
1. Loading the entire flow object when only specific fields are needed
2. Full flow query invalidation causes all components to re-render
3. No granular control over which fields trigger updates
4. Potential race conditions when multiple panels update the same flow

## Migration Plan

### Phase 1: Create Granular Use Cases and Repository Methods

#### 1.1 Create Use Cases in `/src/modules/flow/usecases/`
```
- get-flow-name.ts          // Get only the flow name
- get-flow-nodes.ts         // Get nodes array
- get-flow-edges.ts         // Get edges array  
- get-flow-viewport.ts      // Get viewport settings
- get-flow-agent-ids.ts     // Get agent IDs list
- update-flow-name.ts       // Update flow name directly in DB
- update-flow-nodes.ts      // Update nodes array directly in DB
- update-flow-edges.ts      // Update edges array directly in DB
- update-flow-viewport.ts   // Update viewport directly in DB
```

#### 1.2 Create Repository Methods in `/src/modules/flow/repos/flow-drizzle-repository.ts`
```typescript
// Add new granular update methods:
- getFlowName(flowId: string): Promise<string | null>
- getFlowNodes(flowId: string): Promise<FlowNode[]>
- getFlowEdges(flowId: string): Promise<FlowEdge[]>
- getFlowViewport(flowId: string): Promise<FlowViewport | null>
- getFlowAgentIds(flowId: string): Promise<UniqueEntityID[]>

// Granular updates - each updates only its specific column in DB
- updateFlowName(flowId: string, name: string): Promise<void>
- updateFlowNodes(flowId: string, nodes: FlowNode[]): Promise<void>
- updateFlowEdges(flowId: string, edges: FlowEdge[]): Promise<void>
- updateFlowViewport(flowId: string, viewport: FlowViewport): Promise<void>
```

### Phase 2: Use Existing Flow Query Factory

The flow query factory already exists at `/src/app/queries/flow/query-factory.ts` with comprehensive key management and query options. We'll use the existing keys:
- `flowKeys.metadata(id)` - For flow name
- `flowKeys.nodes(id)` - For nodes array
- `flowKeys.edges(id)` - For edges array
- `flowKeys.graph(id)` - For nodes and edges together
- `flowKeys.uiViewport(id)` - For viewport
- `flowKeys.agents(id)` - For agent IDs

Note: Response template and data store schema are NOT needed in flow panel - they're managed by their respective panels

#### 2.1 Add Missing Query for Agent IDs
The existing flow query factory already has most queries we need. We just need to add a query for agent IDs:

```typescript
// Add to /src/app/queries/flow/query-factory.ts

// In flowQueries object, add:
agents: (id: string) =>
  queryOptions({
    queryKey: flowKeys.agents(id),
    queryFn: async () => {
      const flowOrError = await FlowService.getFlow.execute(
        new UniqueEntityID(id)
      );
      if (flowOrError.isFailure) return [];
      
      return flowOrError.getValue().agentIds || [];
    },
    staleTime: 1000 * 30,
  }),
```

### Phase 3: Create Mutations with isEditing Flags

#### 3.1 Create flow-mutations.ts
```typescript
// /src/app/queries/flow/mutations/flow-mutations.ts

import { flowKeys } from "../query-factory";

export function useUpdateFlowName(flowId: string) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editTimeoutRef = useRef<NodeJS.Timeout>();
  
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
  }, []);
  
  const endEditing = useCallback(() => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await FlowService.updateFlowName.execute({ flowId, name });
      if (result.isFailure) throw new Error(result.getError());
    },
    onMutate: () => startEditing(),
    onSuccess: () => {
      endEditing();
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.metadata(flowId)
      });
    },
    onError: () => setIsEditing(false),
  });
}

export function useUpdateFlowNodesAndEdges(flowId: string) {
  // Similar structure with isEditing flag
  // Invalidates both nodes and edges queries
}

export function useUpdateFlowViewport(flowId: string) {
  // Similar structure but without isEditing (viewport updates don't affect UI state)
}
```

### Phase 4: Update Flow Panel Component

#### 4.1 Replace Single Flow Query
```typescript
// Before:
const { data: flow } = useQuery({
  ...flowQueries.detail(flowUniqueId),
});

// After:
const { data: metadata } = useQuery({
  ...flowQueries.metadata(flowId),
  enabled: !!flowId,
});

const { data: graph } = useQuery({
  ...flowQueries.graph(flowId),
  enabled: !!flowId && !updateNodesAndEdges.isEditing,
});

const { data: viewport } = useQuery({
  ...flowQueries.uiViewport(flowId),
  enabled: !!flowId,
});

const { data: agentIds } = useQuery({
  ...flowQueries.agents(flowId),
  enabled: !!flowId,
});
```

#### 4.2 Update Title Editing
```typescript
// Use mutation instead of direct service call
const updateNameMutation = useUpdateFlowName(flowId);

const handleSaveTitle = useCallback(async () => {
  if (editedTitle === metadata?.name) {
    setIsEditingTitle(false);
    return;
  }
  
  updateNameMutation.mutate(editedTitle);
  setIsEditingTitle(false);
}, [editedTitle, metadata?.name, updateNameMutation]);
```

#### 4.3 Update Nodes/Edges Saving
```typescript
const updateNodesAndEdges = useUpdateFlowNodesAndEdges(flowId);

const saveFlowChanges = useCallback(async (
  updatedNodes: CustomNodeType[], 
  updatedEdges: CustomEdgeType[], 
  isStructuralChange: boolean = false
) => {
  // Filter invalid edges
  const nodeIds = new Set(updatedNodes.map(n => n.id));
  const validEdges = updatedEdges.filter(edge => 
    edge.source && edge.target && 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  
  // Use mutation
  updateNodesAndEdges.mutate({ nodes: updatedNodes, edges: validEdges });
  
  // Handle structural changes if needed
  if (isStructuralChange) {
    // Additional invalidations for agent queries etc.
  }
}, [updateNodesAndEdges]);
```

### Phase 5: Optimize Re-renders

#### 5.1 Add Sync Prevention
Similar to prompt panel, prevent syncing during edits:
```typescript
useEffect(() => {
  // Don't sync while editing to prevent feedback loops
  if (updateNodesAndEdges.isEditing) {
    return;
  }
  
  if (graph) {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }
}, [graph, updateNodesAndEdges.isEditing]);
```

#### 5.2 Memoize Heavy Computations
```typescript
const agentColorAssignments = useMemo(() => {
  if (!nodes || !agentIds) return new Map();
  // Calculate color assignments
}, [nodes, agentIds]);
```

### Phase 6: Handle Agent Operations

#### 6.1 Create Agent Batch Operations
For operations that affect multiple agents (like copying, creating):
```typescript
export function useCreateAgentInFlow(flowId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      // Create agent
      const agent = await AgentService.createAgent.execute(agentData);
      
      // Update flow's agent IDs
      await FlowService.addAgentToFlow.execute({ flowId, agentId: agent.id });
      
      return agent;
    },
    onSuccess: (agent) => {
      // Invalidate specific queries
      queryClient.invalidateQueries({ 
        queryKey: [...flowKeys.all(), "agentIds", flowId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...agentKeys.all(), "detail", agent.id] 
      });
    },
  });
}
```

### Phase 7: Testing & Validation

#### 7.1 Test Cases
- [ ] Flow name editing works without jittering
- [ ] Node/edge updates don't cause full re-renders
- [ ] Viewport changes save correctly
- [ ] Agent creation/deletion updates UI properly
- [ ] Cross-tab synchronization works
- [ ] No infinite update loops
- [ ] Performance improvement measurable

#### 7.2 Performance Metrics
- Measure query execution time before/after
- Count number of re-renders on common operations
- Check network request reduction

## Implementation Order

1. **Week 1**: Create use cases and repository methods
2. **Week 2**: Implement granular queries and mutations
3. **Week 3**: Update flow panel component
4. **Week 4**: Testing and optimization

## Missing Functionalities to Address

### 1. Agent Operations (Currently using AgentService directly)
- **Copy Agent**: `AgentService.cloneAgent.execute()` - Creates a duplicate agent
- **Create Agent**: `AgentService.saveAgent.execute()` - Creates new agent
- **Delete Agent**: `AgentService.deleteAgent.execute()` - Removes agent
- **Get Agent for validation**: `AgentService.getAgent.execute()` - Check if agent exists

**Note**: These might stay as direct service calls since they're agent operations, not flow operations

### 2. Color Assignment Helper
- `getNextAvailableColor(flow)` - Needs access to:
  - `flow.agentIds` - List of all agent IDs in flow
  - `flow.props.nodes` - To check colors of non-agent nodes (if, dataStore)
  - Loads all agents to check their colors

**Solution**: Create a dedicated query for color assignment data or keep using flow.detail for this specific case

### 3. Session Preview Selection
- Uses `sessionQueries.list({})` to get all sessions
- Filters sessions by `flowId`
- Sets preview session ID for variable/preview panels

**Note**: This is already properly implemented with React Query

### 4. Node/Edge Operations (Local to component)
- Copy node
- Delete node  
- Add agent/if/dataStore nodes
- These modify local state then save via mutations

### 5. Flow Validation State
- Currently not used but exists in query factory
- `flowKeys.validation(id)` - readyState and validation issues
- Might be needed for future validation features

### 6. Sync and Hash Management
- Complex sync logic with external data
- Hash-based change detection
- Position preservation during sync
- Handles race conditions between local and external updates

**Important**: This sync logic needs careful handling during migration to prevent data loss

## Benefits

1. **Performance**: Only fetch and update what's needed
2. **Reduced Re-renders**: Components only update when their specific data changes
3. **Better UX**: No jittering during edits
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add new granular queries as needed

## Risks & Mitigations

### Risk 1: Breaking Changes
**Mitigation**: Keep old queries temporarily, migrate incrementally

### Risk 2: Increased Complexity
**Mitigation**: Good documentation and consistent patterns

### Risk 3: Cache Inconsistency
**Mitigation**: Careful invalidation strategy and testing

## Notes

- Follow the same patterns established in agent node migration
- Use `isEditing` flags consistently to prevent UI jittering
- Consider creating a shared hook for common patterns
- Document query key structure for team understanding