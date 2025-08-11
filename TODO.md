# Flow Multi-Node System TODO List

## 1. Node Selection Menu Update
**File:** `apps/pwa/src/flow-multi/components/node-selection-menu.tsx`
- [ ] Update the node selection menu component to improve UI/UX
- [ ] Apply the updated menu on the + node button in the flow panel
- [ ] Ensure consistent styling with floating and dropdown variants
- [ ] Test both variants work correctly with the new design

## 2. Operator Type Selection Component Update
**File:** `apps/pwa/src/flow-multi/components/operator-dropdown.tsx`
- [ ] Review and update the operator dropdown component design
- [ ] Ensure the nested dropdown behavior is smooth
- [ ] Update styling to match the latest design requirements
- [ ] Test all data types (String, Number, Integer, Boolean) work correctly

## 3. Node Traversal Enhancement
**Context:** Node traversal logic needs to include if and data store nodes
- [ ] Identify current node traversal implementation
- [ ] Add if node to traversal logic
- [ ] Add data store node to traversal logic
- [ ] Ensure proper flow execution with these node types
- [ ] Test traversal with complex flows containing multiple node types

## 4. Number Error Display Fix
**Context:** When fields are added in if node and data store node
- [ ] Fix error display when adding new fields in if node
- [ ] Fix error display when adding new fields in data store node
- [ ] Ensure proper error numbering/indexing
- [ ] Test error display with multiple fields

## 5. Data Store Node Validation - Initial Value Type Match
**File:** `apps/pwa/src/flow-multi/panels/data-store/data-store-panel.tsx`
- [ ] Create validation to check initial value matches configured data type
- [ ] Display appropriate error message when types don't match
- [ ] Prevent saving invalid configurations
- [ ] Add type coercion where appropriate

## 6. If Node Validation - Value Type Match
**File:** `apps/pwa/src/flow-multi/panels/if-node/if-node-panel.tsx`
- [ ] Create validation to check input value matches selected condition's data type
- [ ] Validate value1 against the selected data type
- [ ] Validate value2 against the selected data type (when not unary operator)
- [ ] Display clear error messages for type mismatches
- [ ] Consider auto-conversion for compatible types

## 7. Data Store Field Usage Validation
**Context:** Detect unused fields across the flow
- [ ] Create validation to detect fields defined but never used in:
  - [ ] Prompt panels
  - [ ] Response design panels
  - [ ] Structured output panels
- [ ] Display warnings for unused fields
- [ ] Provide option to clean up unused fields

## 8. Data Store Schema Validation
**Context:** Schema fields not present in data store instances
- [ ] Create validation to detect schema fields not imported to data store nodes
- [ ] Display warnings for missing schema implementations
- [ ] Provide quick-fix to import missing fields
- [ ] Track schema field usage across all data store nodes

## 9. Replace Window-Based Communication
**Context:** Current node-to-flow-panel communication uses window object (unsafe)
- [ ] Identify all places using window-based communication
- [ ] Research alternative communication patterns:
  - [ ] React Context API
  - [ ] Event emitter pattern
  - [ ] Message bus pattern
  - [ ] Direct prop passing
- [ ] Implement chosen alternative
- [ ] Migrate all window-based communications
- [ ] Test communication reliability and performance

## Implementation Priority
1. **High Priority (Blocking Issues)**
   - Task 4: Number error display fix
   - Task 9: Replace unsafe window communication

2. **Medium Priority (Validation & Safety)**
   - Task 5: Data store initial value validation
   - Task 6: If node value type validation
   - Task 3: Node traversal enhancement

3. **Lower Priority (Enhancements)**
   - Task 1: Node selection menu update
   - Task 2: Operator dropdown update
   - Task 7: Unused field detection
   - Task 8: Schema validation

## Testing Requirements
- Unit tests for all validation functions
- Integration tests for node traversal
- E2E tests for critical user flows
- Performance tests for communication refactoring

## Notes
- All changes should maintain backwards compatibility
- Consider migration scripts for existing flows if data structure changes
- Document any breaking changes clearly
- Ensure all error messages are user-friendly and actionable