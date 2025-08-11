# Flow System Implementation Plan

## Overview
Implementation of new node types (Data Store, If Node) and panels (Global Schema, Data Fields, If Node Panel) for the flow system.

## Phase 1: Foundation (Priority 1)
### 1.1 Node Type Definitions
- [ ] Add DataStoreNode and IfNode type definitions
- [ ] Update CustomNodeType union
- [ ] Add node data interfaces

### 1.2 Node Components
- [ ] Create DataStoreNode component
  - Title field
  - Edit button
  - Variables list display
  - Input/output handles
- [ ] Create IfNode component
  - Title field
  - Edit button
  - One input handle
  - Two output handles (True/False)
  - Color-coded outputs

## Phase 2: Panel System (Priority 2)
### 2.1 Data Fields Panel
- [ ] Create panel component structure
- [ ] Left column: Fields list
  - Add field button
  - Field items with name/type
  - Delete buttons
  - Selection state
- [ ] Right column: Logic editor
  - Monaco editor integration
  - Variable reference support
  - Expression validation

### 2.2 If Node Panel
- [ ] Create panel component
- [ ] Logic operator dropdown (AND/OR)
- [ ] Condition rows
  - Value1 field
  - Operator dropdown
  - Value2 field
  - Delete button
- [ ] Add condition button
- [ ] Logic operator labels

### 2.3 Global Schema Panel
- [ ] Create flow-level panel
- [ ] Reuse Output Panel structure
- [ ] Left column: Schema fields list
- [ ] Right column: Field configuration
- [ ] Integration with flow context

## Phase 3: Data Management (Priority 3)
### 3.1 Variable System
- [ ] Create variable reference system
- [ ] Variable naming convention: {{datastore.fieldname}}
- [ ] Variable resolver utility
- [ ] Variable autocomplete support

### 3.2 State Management
- [ ] Add Data Store node state to flow
- [ ] Add If Node condition state
- [ ] Global schema state management
- [ ] Panel state persistence

## Phase 4: Integration (Priority 4)
### 4.1 Flow Validation
- [ ] Add validation for Data Store nodes
- [ ] Add validation for If nodes
- [ ] Validate variable references
- [ ] Check conditional logic

### 4.2 Preview System
- [ ] Update preview generator for Data Store variables
- [ ] Handle conditional flow paths
- [ ] Show variable values in preview

## Phase 5: Testing & Polish (Priority 5)
### 5.1 Testing
- [ ] Unit tests for new nodes
- [ ] Panel interaction tests
- [ ] Variable reference tests
- [ ] Flow execution tests

### 5.2 UI Polish
- [ ] Animations and transitions
- [ ] Error states
- [ ] Loading states
- [ ] Empty states

## File Structure
```
flow-multi/
├── nodes/
│   ├── data-store-node.tsx      # New
│   ├── if-node.tsx               # New
│   └── index.ts                  # Update
├── panels/
│   ├── data-fields/              # New
│   │   ├── data-fields-panel.tsx
│   │   └── data-fields-types.ts
│   ├── if-node/                  # New
│   │   ├── if-node-panel.tsx
│   │   └── if-node-types.ts
│   └── global-schema/            # New
│       ├── global-schema-panel.tsx
│       └── global-schema-types.ts
├── types/
│   └── node-types.ts             # New
└── utils/
    └── variable-resolver.ts      # New
```

## Implementation Order
1. Node type definitions
2. DataStoreNode component
3. IfNode component
4. Data Fields Panel
5. If Node Panel
6. Global Schema Panel
7. Variable system
8. Integration and validation
9. Testing
10. Polish

## Dependencies
- Existing: @xyflow/react, Monaco Editor, Radix UI
- No new dependencies required

## Timeline Estimate
- Phase 1: 2 days
- Phase 2: 3 days
- Phase 3: 2 days
- Phase 4: 2 days
- Phase 5: 1 day
- **Total: ~10 days**