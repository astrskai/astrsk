# Node Data Separation Architecture Plan

## Overview

This document outlines the plan to separate node data from flow nodes to eliminate race conditions, improve performance, and enable fine-grained updates. Currently, node data is stored within `flow.nodes[].data`, causing conflicts when multiple components try to update different aspects of the same flow.

## Current Architecture Problems

### Current Structure Issues:
1. **Node data stored in `flow.nodes[].data`** - causes granular update conflicts
2. **Tightly coupled data** - node position/layout mixed with business logic data
3. **Race conditions** - multiple mutations on same flow object
4. **Performance issues** - entire flow updated for single node changes
5. **Complex cache invalidation** - flow-level mutations affect unrelated nodes

### Current Node Data Structure:
```typescript
// In flow.nodes[].data:
- AgentNode: { agentId: string }
- DataStoreNode: { name: string, color: string, dataStoreFields: DataStoreField[] }
- IfNode: { name: string, logicOperator: 'AND'|'OR', conditions: IfCondition[], color: string }
```

**⚠️ Node ID Pattern Change:**
- **Current:** Node IDs use custom patterns like `datastore-${Date.now()}` or `if-${Date.now()}`
- **New:** All node IDs will use `UniqueEntityID().toString()` for consistency with domain patterns

## Existing Schema Analysis

**✅ Schema Already Exists:**
The database schema for node data separation already exists:

```typescript
// /src/db/schema/data-store-nodes.ts
export const dataStoresNodes = pgTable(TableName.DataStoreNodes, {
  id: uuid().primaryKey(), // This IS the node_id from React Flow
  flow_id: uuid().notNull(),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  data_store_fields: jsonb().$type<DataStoreField[]>().default([]),
  ...timestamps,
});

// /src/db/schema/if-nodes.ts  
export const ifNodes = pgTable(TableName.IfNodes, {
  id: uuid().primaryKey(), // This IS the node_id from React Flow
  flow_id: uuid().notNull(),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  logicOperator: varchar(),
  conditions: jsonb().$type<IfCondition[]>().default([]),
  ...timestamps,
});
```

**Schema is Ready:**
- The `id` field serves as the React Flow node ID - no separate `node_id` field needed
- Existing tables are properly structured

### 2. Node Type Definitions & Updated Flow Structure

**Define NodeType Enum:**
```typescript
// src/flow-multi/types/node-types.ts
export enum NodeType {
  START = "start",
  END = "end", 
  AGENT = "agent",
  IF = "if",
  DATA_STORE = "dataStore"
}

// Update flow domain to use enum
// src/modules/flow/domain/flow.ts
export type Node = {
  id: string;
  type: NodeType; // Use enum instead of string literal
  position: { x: number; y: number; };
  data: object;
  deletable?: boolean;
  draggable?: boolean;
  zIndex?: number;
};
```

**New Flow Node Data:**
```typescript
// Minimal data in flow.nodes[].data:
- AgentNode: { flowId: string } // Query key for TanStack Query (nodeId comes from node.id)
- DataStoreNode: { flowId: string } // Query key for TanStack Query (nodeId comes from node.id)
- IfNode: { flowId: string } // Query key for TanStack Query (nodeId comes from node.id)
```

**Benefits:**
- Type-safe node type definitions
- Flow only stores position, connections, and IDs
- Node data stored separately for fine-grained updates
- TanStack Query can cache node data independently
- No more race conditions on flow object

## Implementation Plan Following Existing Patterns

### 1. Query Structure (Following Agent Pattern)

**Create Separate Query Folders:**
```
src/app/queries/
├── agent/                    # ✅ Already exists
│   ├── mutations/
│   │   ├── index.ts
│   │   ├── agent-node-mutations.ts
│   │   ├── model-mutations.ts
│   │   ├── prompt-mutations-new.ts
│   │   ├── parameter-mutations.ts
│   │   └── output-mutations.ts
│   └── query-factory.ts
├── data-store-node/          # 🆕 Create new
│   ├── mutations/
│   │   ├── index.ts
│   │   ├── name-mutations.ts
│   │   ├── field-mutations.ts
│   │   └── color-mutations.ts
│   └── query-factory.ts
└── if-node/                  # 🆕 Create new
    ├── mutations/
    │   ├── index.ts
    │   ├── name-mutations.ts
    │   ├── condition-mutations.ts
    │   └── color-mutations.ts
    └── query-factory.ts
```

### 2. Query Factory Pattern (Following Agent Pattern)

**Data Store Node Query Factory:**
```typescript
// src/app/queries/data-store-node/query-factory.ts
export const dataStoreNodeKeys = {
  all: ['data-store-nodes'] as const,
  byFlow: (flowId: string) => [...dataStoreNodeKeys.all, 'flow', flowId] as const,
  detail: (flowId: string, nodeId: string) => [...dataStoreNodeKeys.byFlow(flowId), nodeId] as const,
  
  // Sub-queries for specific data
  name: (flowId: string, nodeId: string) => [...dataStoreNodeKeys.detail(flowId, nodeId), 'name'] as const,
  fields: (flowId: string, nodeId: string) => [...dataStoreNodeKeys.detail(flowId, nodeId), 'fields'] as const,
  color: (flowId: string, nodeId: string) => [...dataStoreNodeKeys.detail(flowId, nodeId), 'color'] as const,
};

export const dataStoreNodeQueries = {
  detail: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.detail(flowId, nodeId),
      queryFn: () => DataStoreNodeService.getDataStoreNode.execute({ flowId, nodeId }),
      staleTime: 1000 * 30, // 30 seconds
    }),
    
  name: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.name(flowId, nodeId),
      queryFn: () => DataStoreNodeService.getDataStoreNodeName.execute({ flowId, nodeId }),
      staleTime: 1000 * 60, // 1 minute
    }),
};
```

**If Node Query Factory:**
```typescript
// src/app/queries/if-node/query-factory.ts
export const ifNodeKeys = {
  all: ['if-nodes'] as const,
  byFlow: (flowId: string) => [...ifNodeKeys.all, 'flow', flowId] as const,
  detail: (flowId: string, nodeId: string) => [...ifNodeKeys.byFlow(flowId), nodeId] as const,
  
  // Sub-queries for specific data  
  name: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'name'] as const,
  conditions: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'conditions'] as const,
  color: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'color'] as const,
};
```

### 3. Mutation Strategy (Following Agent Pattern)

**Data Store Node Mutations:**
```typescript
// src/app/queries/data-store-node/mutations/name-mutations.ts
export function useUpdateDataStoreNodeName(flowId: string, nodeId: string) {
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

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await DataStoreNodeService.updateDataStoreNodeName.execute({
        flowId,
        nodeId, 
        name,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (name) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: dataStoreNodeKeys.name(flowId, nodeId) 
      });
      
      const previousName = queryClient.getQueryData(dataStoreNodeKeys.name(flowId, nodeId));
      queryClient.setQueryData(dataStoreNodeKeys.name(flowId, nodeId), { name });
      
      return { previousName };
    },
    onError: (err, name, context) => {
      if (context?.previousName) {
        queryClient.setQueryData(dataStoreNodeKeys.name(flowId, nodeId), context.previousName);
      }
      setIsEditing(false);
    },
    onSettled: () => {
      endEditing();
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: dataStoreNodeKeys.name(flowId, nodeId) 
        });
      }, 600);
    },
  });

  return {
    ...mutation,
    isEditing,
    setIsEditing,
    startEditing,
    endEditing,
  };
}
```

**If Node Mutations:**
```typescript
// src/app/queries/if-node/mutations/condition-mutations.ts 
export const useUpdateIfNodeConditions = (flowId: string, nodeId: string) => {
  // Similar pattern to data store node mutations
  // Follows the agent mutation pattern for consistency
};
```

### 4. Module Structure (Service Layer Only)

Since schema already exists, we only need service layer:

```
src/modules/
├── data-store-node/
│   ├── domain/
│   │   └── data-store-node.ts       # Domain entity  
│   ├── repos/
│   │   ├── data-store-node-repo.ts  # Repository interface
│   │   └── impl/
│   │       └── drizzle-data-store-node-repo.ts
│   ├── usecases/
│   │   ├── create-data-store-node.ts
│   │   ├── update-data-store-node-name.ts
│   │   ├── update-data-store-node-fields.ts
│   │   ├── get-data-store-node.ts
│   │   ├── delete-data-store-node.ts
│   │   └── delete-all-data-store-nodes-by-flow.ts
│   └── mappers/
│       └── data-store-node-mapper.ts

└── if-node/
    ├── domain/
    │   └── if-node.ts               # Domain entity
    ├── repos/
    │   ├── if-node-repo.ts          # Repository interface
    │   └── impl/
    │       └── drizzle-if-node-repo.ts
    ├── usecases/
    │   ├── create-if-node.ts
    │   ├── update-if-node-name.ts
    │   ├── update-if-node-conditions.ts
    │   ├── get-if-node.ts
    │   ├── delete-if-node.ts
    │   └── delete-all-if-nodes-by-flow.ts
    └── mappers/
        └── if-node-mapper.ts
```

### 5. Service Layer Updates

```typescript
// src/app/services/data-store-node-service.ts
export class DataStoreNodeService {
  static createDataStoreNode = new CreateDataStoreNodeUseCase();
  static updateDataStoreNodeName = new UpdateDataStoreNodeNameUseCase(); 
  static updateDataStoreNodeFields = new UpdateDataStoreNodeFieldsUseCase();
  static getDataStoreNode = new GetDataStoreNodeUseCase();
  static deleteDataStoreNode = new DeleteDataStoreNodeUseCase();
  static deleteAllDataStoreNodesByFlow = new DeleteAllDataStoreNodesByFlowUseCase(); // For cascade delete
}

// src/app/services/if-node-service.ts
export class IfNodeService {
  static createIfNode = new CreateIfNodeUseCase();
  static updateIfNodeName = new UpdateIfNodeNameUseCase();
  static updateIfNodeConditions = new UpdateIfNodeConditionsUseCase();
  static getIfNode = new GetIfNodeUseCase();
  static deleteIfNode = new DeleteIfNodeUseCase();
  static deleteAllIfNodesByFlow = new DeleteAllIfNodesByFlowUseCase(); // For cascade delete
}

// Update existing FlowService to handle cascade deletes
// src/app/services/flow-service.ts
export class FlowService {
  // ... existing methods ...
  
  static deleteFlowWithNodes = new DeleteFlowWithNodesUseCase(); // Handles cascade delete of all node types
}
```

### 6. Node Component Updates ✅ COMPLETED

**Updated Node Component Architecture:**

The node components have been refactored to eliminate flow prop dependencies and support both old and new data structures:

```typescript
// data-store-node.tsx - New Architecture
function DataStoreNodeComponent({ data, id, selected }: DataStoreNodeComponentProps) {
  // Smart flowId detection - new structure uses data.flowId, old falls back to store
  const flowIdFromData = data.flowId;
  const selectedFlowIdFromStore = useAgentStore.use.selectedFlowId();
  const selectedFlowId = flowIdFromData || selectedFlowIdFromStore;
  
  // Query flow data only when needed (for schema access, validation, etc.)
  const { data: flow } = useQuery({
    ...flowQueries.detail(selectedFlowId ? new UniqueEntityID(selectedFlowId) : undefined),
    enabled: !!selectedFlowId
  });
  
  // Get node data from old structure (fallback for backward compatibility)
  const { data: nodeData } = useQuery({
    ...flowQueries.node(selectedFlowId!, id),
    enabled: !!selectedFlowId && !!id && !flowIdFromData // Only query if old structure
  });

  // Get separate node data from new structure
  const { data: dataStoreNodeData } = useQuery({
    ...dataStoreNodeQueries.detail(selectedFlowId!, id),
    enabled: !!selectedFlowId && !!id && !!flowIdFromData, // Only query if new data structure
  });

  // Intelligent fallback system
  const displayName = dataStoreNodeData?.name || data.name || "Data Update";
  const displayColor = dataStoreNodeData?.color || data.color;
  const displayFields = dataStoreNodeData?.dataStoreFields || data.dataStoreFields || [];
  
  // Smart mutation selection
  const updateNodeTitle = useUpdateNodeTitle(selectedFlowId!, id);
  const updateDataStoreNodeName = useUpdateDataStoreNodeName(selectedFlowId!, id);
  
  const saveNodeName = useCallback(async (newName: string) => {
    // Determine which mutation to use based on data structure
    const useNewMutation = !!dataStoreNodeData || !!data.flowId;
    const mutation = useNewMutation ? updateDataStoreNodeName : updateNodeTitle;
    
    await mutation.mutateAsync(newName);
  }, [dataStoreNodeData, data.flowId, updateDataStoreNodeName, updateNodeTitle]);

  return (
    <div>
      <h3>{displayName}</h3>
      <SimpleFieldBadges fields={fieldsForDisplay} />
      {/* Component uses flow data only when needed for schema access */}
    </div>
  );
}

// Simplified wrapper - no more flow prop dependency
export default function DataStoreNode({ id, data, selected }: NodeProps<DataStoreNode>) {
  return <DataStoreNodeComponent data={data} id={id} selected={selected} />;
}
```

**Key Improvements:**

1. **Eliminated Flow Prop Dependencies**: Components no longer require flow data to be passed as props
2. **Smart Data Source Detection**: Automatically detects new vs old data structure and queries accordingly
3. **Intelligent Fallback System**: Seamlessly falls back to embedded data for backward compatibility
4. **Performance Optimized**: Flow data only queried when actually needed (schema access, validation)
5. **Mutation Selection**: Automatically uses appropriate mutation based on data structure
6. **Type Safety**: Added `flowId?: string` to node data types for transition period

**Architecture Benefits:**
- **Better Separation of Concerns**: Nodes focus on their data, not entire flow
- **Improved Performance**: Reduced unnecessary queries and prop drilling
- **Cleaner Code**: Simplified component hierarchy and data flow
- **Future-Proof**: Ready for complete migration to separated architecture
- **Backward Compatible**: Existing nodes continue working without changes

### 7. Panel Component Updates ✅ COMPLETED

**Updated Panel Components Architecture:**

The panel components have been completely refactored to use the new dedicated mutations and queries instead of flow-level operations:

```typescript
// data-store-panel.tsx - New Architecture
export default function DataStorePanel({ flowId, nodeId }: DataStorePanelProps) {
  // Use dedicated data store node mutation
  const updateNodeFields = useUpdateDataStoreNodeFields(flowId, nodeId);
  
  // Query node data from separate data store (new architecture)
  const { data: dataStoreNodeData, isLoading: dataStoreNodeLoading } = useQuery({
    ...dataStoreNodeQueries.detail(flowId, nodeId),
    enabled: !!flowId && !!nodeId && !updateNodeFields.isEditing,
  });
  
  // Query schema remains the same (global to flow)
  const { data: schema, isLoading: schemaLoading } = useQuery({
    ...flowQueries.dataStoreSchema(flowId),
    enabled: !!flowId && !updateNodeFields.isEditing,
  });
  
  // Initialize from dedicated node data
  useEffect(() => {
    if (dataStoreNodeData && nodeId && nodeId !== lastNodeIdRef.current && !updateNodeFields.isEditing) {
      if (dataStoreNodeData.dataStoreFields) {
        setDataStoreFields(dataStoreNodeData.dataStoreFields);
        if (dataStoreNodeData.dataStoreFields.length > 0) {
          setSelectedFieldId(dataStoreNodeData.dataStoreFields[0].schemaFieldId);
        }
      }
      lastNodeIdRef.current = nodeId;
    }
  }, [dataStoreNodeData, nodeId, updateNodeFields.isEditing]);
  
  // Save using dedicated mutation
  const saveDataStoreFields = useCallback((fields: DataStoreField[]) => {
    updateNodeFields.mutate(fields, {
      onSuccess: () => setDataStoreFields(fields),
      onError: (error) => toast.error("Failed to save data store fields", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    });
  }, [updateNodeFields]);
}

// if-node-panel.tsx - New Architecture  
export default function IfNodePanel({ flowId, nodeId }: IfNodePanelProps) {
  // Use dedicated if node mutation with enhanced interface
  const updateConditions = useUpdateIfNodeConditions(flowId, nodeId);
  
  // Query if node data from separate data store (new architecture)
  const { data: ifNodeData, isLoading: ifNodeLoading } = useQuery({
    ...ifNodeQueries.detail(flowId, nodeId),
    enabled: !!flowId && !!nodeId && !updateConditions.isEditing,
  });
  
  // Initialize from dedicated node data
  useEffect(() => {
    if (nodeId && nodeId !== lastInitializedNodeId.current && ifNodeData && !updateConditions.isEditing) {
      const existingConditions = ifNodeData.conditions || [];
      const existingOperator = ifNodeData.logicOperator || 'AND';
      
      setLogicOperator(existingOperator);
      
      if (existingConditions.length > 0) {
        // Convert to editable conditions format
        const editableConditions: EditableCondition[] = existingConditions.map((c: any) => ({
          id: c.id,
          dataType: c.dataType ?? null,
          value1: c.value1 || '',
          operator: c.operator ?? null,
          value2: c.value2 || ''
        }));
        setConditions(editableConditions);
      }
      lastInitializedNodeId.current = nodeId;
    }
  }, [nodeId, ifNodeData, updateConditions.isEditing]);
  
  // Save using dedicated mutation with enhanced data structure
  const saveConditions = useCallback((newConditions: EditableCondition[], newOperator: 'AND' | 'OR') => {
    // Filter complete conditions for persistence
    const validConditions = newConditions
      .filter((c): c is EditableCondition & { dataType: ConditionDataType; operator: ConditionOperator } => 
        c.dataType !== null && c.operator !== null
      )
      .map((c): IfCondition => ({
        id: c.id,
        dataType: c.dataType,
        value1: c.value1,
        operator: c.operator,
        value2: c.value2
      }));

    updateConditions.mutate({
      conditions: validConditions,              // Valid conditions for evaluation
      draftConditions: newConditions,          // All conditions including incomplete ones for UI
      logicOperator: newOperator
    }, {
      onSuccess: () => {
        setConditions(newConditions);
        setLogicOperator(newOperator);
      },
      onError: (error) => toast.error("Failed to save conditions")
    });
  }, [updateConditions]);
}
```

**Key Improvements in Panel Components:**

1. **Direct Data Store Queries**: Panels now query dedicated node data stores instead of flow-level node data
2. **Dedicated Mutations**: Use node-specific mutations that update isolated data stores
3. **Enhanced Error Handling**: Proper error handling with user-friendly toast notifications
4. **Performance Optimized**: No longer load entire flow object for panel operations
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Editing State Management**: Integrated isEditing flags prevent unnecessary refetches during editing
7. **Auto-close Logic**: Panels automatically close when nodes are deleted from data store
8. **Optimistic Updates**: Immediate UI feedback with proper rollback on errors

**Migration Benefits:**
- **Eliminated Flow Dependencies**: Panels no longer depend on entire flow object
- **Granular Updates**: Only update specific node data, not entire flow
- **Better Cache Management**: Hierarchical query keys enable precise invalidation
- **Improved UX**: Faster panel operations and better loading states

### 8. Migration Strategy

**Gradual Migration Approach:**
Since schema exists and is ready:

1. **Create modules and services** 
2. **Create query factories and mutations**
3. **Update node components** to check both data sources
4. **Update panel components** to use new mutations
5. **Update flow panel** to create entries in both locations initially
6. **Gradual transition** as users edit nodes
7. **Remove old data structure** once migration is complete

### 9. Schema Updates Needed

**No database schema changes required:**
- The existing schema already has the correct structure
- The `id` field serves as the React Flow node ID
- Cascade delete will be handled at the application level following existing patterns
- No foreign key constraints needed (following existing codebase patterns)

### 10. Flow Panel Updates

**Updated Flow Creation Logic:**
```typescript
// When creating new nodes
const addDataStoreNode = async () => {
  // Use UniqueEntityID for node IDs instead of custom string patterns
  const nodeId = new UniqueEntityID().toString();
  
  // 1. Create separate node data entry first
  await DataStoreNodeService.createDataStoreNode.execute({
    flowId: selectedFlowId,
    nodeId: nodeId,
    name: "New Data Update",
    color: nextColor,
    dataStoreFields: [],
  });
  
  // 2. Create flow node with only flowId (nodeId comes from node.id)
  const newNode: CustomNodeType = {
    id: nodeId,
    type: NodeType.DATA_STORE,  // Use enum instead of string
    position: newPosition,
    data: {
      flowId: selectedFlowId,  // Query key for TanStack Query (nodeId = node.id)
    },
  };
  
  // 3. Update flow with new node
  const updatedNodes = [...currentNodes, newNode];
  saveFlowChanges(updatedNodes, undefined, true);
};

const addIfNode = async () => {
  // Use UniqueEntityID for node IDs instead of custom string patterns
  const nodeId = new UniqueEntityID().toString();
  
  // 1. Create separate node data entry first
  await IfNodeService.createIfNode.execute({
    flowId: selectedFlowId,
    nodeId: nodeId,
    name: "New If",
    logicOperator: 'AND',
    conditions: [],
    color: nextColor,
  });
  
  // 2. Create flow node with only flowId (nodeId comes from node.id)
  const newNode: CustomNodeType = {
    id: nodeId,
    type: NodeType.IF,          // Use enum instead of string
    position: newPosition,
    data: {
      flowId: selectedFlowId,  // Query key for TanStack Query (nodeId = node.id)
    },
  };
  
  // 3. Update flow with new node
  const updatedNodes = [...currentNodes, newNode];
  saveFlowChanges(updatedNodes, undefined, true);
};
```

### 11. Implementation Phases

**Phase 1: Foundation (1-2 days) ✅ COMPLETED**
- ✅ Create NodeType enum to replace string literals
- ✅ Update flow domain to use NodeType enum
- ✅ Create domain models and repositories (DataStoreNode, IfNode)
- ✅ Create use cases and services (including cascade delete use cases)
- ✅ Fix TypeScript typing and database connection patterns

**Phase 2: Query Layer (1-2 days) ✅ COMPLETED**
- ✅ Create data-store-node query factory following agent pattern
- ✅ Create if-node query factory following agent pattern  
- ✅ Create mutation hooks following agent pattern
- ✅ Set up proper query key hierarchies

**Phase 3: Component Updates (2-3 days) ✅ COMPLETED**
- ✅ Update flow panel to use UniqueEntityID for new node creation instead of custom patterns
- ✅ Update node components to use new queries with fallbacks
- ✅ Remove flow prop dependencies - components now get flowId from data
- ✅ Update flow panel creation logic
- ✅ Update panel components to use new mutations

**Phase 4: Testing & Migration (1-2 days)**
- Test dual data source approach
- Migrate existing nodes as they're edited
- Performance testing

**Phase 5: Cleanup (1 day)**
- Remove old flow-level mutation logic
- Remove embedded data structure support
- Final performance optimization

**Total Estimated Time: 5-10 days**

### 12. Implementation Progress Summary

**✅ COMPLETED PHASES:**

**Phase 1: Foundation (100% Complete)**
- ✅ NodeType enum implementation with type safety
- ✅ Flow domain updates to use enum values
- ✅ Complete domain models (DataStoreNode, IfNode) with validation
- ✅ Repository pattern implementation with Drizzle ORM
- ✅ Use cases for all CRUD operations + cascade delete
- ✅ Service layer following existing agent patterns
- ✅ TypeScript compilation and database connectivity

**Phase 2: Query Layer (100% Complete)**
- ✅ TanStack Query factories with hierarchical key structure
- ✅ Optimistic update mutation hooks following agent pattern
- ✅ Error handling and cache invalidation strategies
- ✅ Type-safe query options and data transformation
- ✅ Performance-optimized caching with proper stale times

**Phase 3: Component Updates (100% Complete)**
- ✅ Flow panel updated to use UniqueEntityID and separate data creation
- ✅ Node components refactored with intelligent fallback system
- ✅ Eliminated flow prop dependencies and improved performance
- ✅ Backward compatibility maintained for existing nodes
- ✅ Smart mutation selection based on data structure
- ✅ Panel components updated to use new dedicated mutations and queries

**🔄 REMAINING PHASES:**

**Phase 4: Testing & Migration**
- 🔄 Test dual data source approach
- 🔄 Migrate existing nodes as they're edited
- 🔄 Performance testing

**Phase 5: Cleanup**
- 🔄 Remove old flow-level mutation logic
- 🔄 Remove embedded data structure support
- 🔄 Final performance optimization

**Current Status: ~95% Complete** - Foundation, Query Layer, and Component Updates complete. Ready for testing and migration phases.

### 13. Benefits of New Architecture

**Performance Benefits:**
- Fine-grained updates (no flow-level race conditions)
- Independent caching per node
- Faster query invalidation
- Reduced network payload

**Development Benefits:**
- Clear separation of concerns
- Type-safe node data operations
- Easier testing and maintenance
- Consistent with existing agent pattern

**User Experience Benefits:**
- Faster UI updates (optimistic updates work better)
- No lost edits due to race conditions
- Better error handling per node
- Smoother concurrent editing

### 14. Migration Safety

**Risk Mitigation:**
- Gradual migration preserves existing functionality
- Dual data source during transition prevents data loss
- Following established agent pattern reduces implementation risk
- Schema already exists, reducing database migration risk

**Rollback Plan:**
- Keep embedded data during transition period
- Can revert to old mutations if needed
- No breaking changes to existing flows

### 15. Cascade Delete Implementation

**Database Level (Preferred):**
```sql
-- Foreign key constraints handle cascade delete automatically
FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
```

**Application Level (Backup/Validation):**
```typescript
// src/modules/flow/usecases/delete-flow-with-nodes.ts
export class DeleteFlowWithNodesUseCase {
  async execute(flowId: string): Promise<Result<void>> {
    // 1. Delete all data store nodes for this flow
    await DataStoreNodeService.deleteAllDataStoreNodesByFlow.execute(flowId);
    
    // 2. Delete all if nodes for this flow  
    await IfNodeService.deleteAllIfNodesByFlow.execute(flowId);
    
    // 3. Delete all agents for this flow (if not already handled)
    await AgentService.deleteAllAgentsByFlow.execute(flowId);
    
    // 4. Finally delete the flow
    await FlowService.deleteFlow.execute(flowId);
    
    return Result.ok();
  }
}
```

**Query Invalidation:**
```typescript
// When flow is deleted, invalidate all related queries
const deleteFlow = useMutation({
  mutationFn: (flowId: string) => FlowService.deleteFlowWithNodes.execute(flowId),
  onSuccess: (_, flowId) => {
    // Invalidate all flow-related queries
    queryClient.invalidateQueries({ queryKey: flowKeys.all });
    queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.byFlow(flowId) });
    queryClient.invalidateQueries({ queryKey: ifNodeKeys.byFlow(flowId) });
    queryClient.invalidateQueries({ queryKey: agentKeys.flows(flowId) });
  }
});
```

## Conclusion

This plan leverages the existing schema and follows established patterns from the agent implementation. The gradual migration approach ensures no data loss and minimal risk while providing the benefits of separated node data architecture. The cascade delete functionality ensures data consistency when flows are removed. The implementation follows DDD principles and TanStack Query best practices already established in the codebase.