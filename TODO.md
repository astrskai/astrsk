# Flow Multi-Node System TODO List

## 1. Node Selection Menu Update
**File:** `apps/pwa/src/flow-multi/components/node-selection-menu.tsx`
- [x] Update the node selection menu component to improve UI/UX
- [x] Apply the updated menu on the + node button in the flow panel
- [x] Ensure consistent styling with floating and dropdown variants
- [x] Test both variants work correctly with the new design
**Status:** ✅ COMPLETED
- Implemented unified design for both dropdown and floating variants
- Set fixed dimensions: width 117px, button height 31px
- Added slide-in-from-left animation for floating variant
- Applied to + Nodes button with center alignment

## 2. Operator Type Selection Component Update
**File:** `apps/pwa/src/flow-multi/components/operator-combobox.tsx`
- [x] Create unified operator combobox component combining data type and operator selection
- [x] Implement proper icons for each data type (CaseUpper for String, Hash for Number, Integer icon, ToggleRight for Boolean)
- [x] Update styling to match compact design specifications
- [x] Apply to if-node-panel with appropriate width
**Status:** ✅ COMPLETED
- Created new operator-combobox.tsx with unified dropdown design
- Used proper Lucide React icons for data types
- Implemented expandable sections for operators under each data type
- Applied compact styling with text truncation for long operator names

## 3. Node Traversal Enhancement
**Context:** Node traversal logic needs to include if and data store nodes
- [x] Identify current node traversal implementation
- [x] Add if node to traversal logic
- [x] Add data store node to traversal logic
- [x] Ensure proper flow execution with these node types
- [x] Test traversal with complex flows containing multiple node types
**Status:** ✅ COMPLETED
- Updated flow-traversal.ts to handle 'if' and 'dataStore' nodes alongside 'agent' nodes
- Renamed interfaces to ProcessNodePosition for clarity
- Maintained backward compatibility with agentPositions for existing code
- Fixed TypeScript errors in flow-panel.tsx with proper type assertions

## 4. Number Error Display Fix
**Context:** When fields are added in if node and data store node
- [x] Fix error display when adding new fields in if node
- [x] Fix error display when adding new fields in data store node
- [x] Ensure proper error numbering/indexing
- [x] Test error display with multiple fields
**Status:** ✅ COMPLETED
- Fixed if-node to check for valid conditions (must have value1 filled)
- Fixed data-store-node to check flow's dataStoreSchema for fields
- Error borders now only show when there are no valid conditions/fields

## 5. Data Store Node Validation - Initial Value Type Match
**File:** `apps/pwa/src/app/hooks/use-flow-validation.tsx`
- [x] Create validation to check initial value matches configured data type
- [x] Display appropriate error message when types don't match
- [x] Validate number, integer, boolean, and string types
- [x] Add comprehensive data store node validation
**Status:** ✅ COMPLETED
- Implemented type validation for all data store fields
- Added validation that at least one field must exist in schema
- Validates integer vs decimal numbers correctly

## 6. Data Store Panel Validation
**File:** `apps/pwa/src/flow-multi/panels/data-store/data-store-panel.tsx`
- [ ] Add validation in the panel UI to check field values match their data types
- [ ] Show error indicators on fields with type mismatches
- [ ] Prevent saving when validation errors exist
- [ ] Display clear error messages below each field
- [ ] Support real-time validation as user types

## 7. If Node Panel Validation
**File:** `apps/pwa/src/flow-multi/panels/if-node/if-node-panel.tsx`
- [ ] Add validation in the panel UI for condition values
- [ ] Validate value1 matches the selected operator's data type
- [ ] Validate value2 matches the data type (when not unary operator)
- [ ] Show error indicators on invalid conditions
- [ ] Display clear error messages for type mismatches
- [ ] Prevent saving invalid conditions
- [ ] Consider auto-conversion for compatible types

## 8. Data Store Field Usage Validation
**Context:** Detect unused fields across the flow
- [ ] Create validation to detect fields defined but never used in:
  - [ ] Prompt panels
  - [ ] Response design panels
  - [ ] Structured output panels
- [ ] Display warnings for unused fields
- [ ] Provide option to clean up unused fields

## 9. Data Store Schema Validation
**Context:** Schema fields not present in data store instances
- [x] Create validation to detect schema fields not imported to data store nodes
- [x] Display warnings for missing schema implementations
- [x] Track schema field usage across all data store nodes
**Status:** ✅ COMPLETED
- Validation checks if data store fields reference valid schema fields
- Warns when schema fields are not configured in data store

## 10. Replace Window-Based Communication
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

## 11. If Node Panel - None State for Conditions
**File:** `apps/pwa/src/flow-multi/panels/if-node/if-node-panel.tsx`
- [x] Add support for "none" state in condition operators
- [x] Show "Select" placeholder text when no operator is selected
- [x] Update validation to handle none/unselected state
- [x] Ensure new conditions start with none state
- [x] Update UI to clearly indicate when selection is required
**Status:** ✅ COMPLETED
- Modified operator-combobox to support null dataType and operator values
- Shows "Select" placeholder when no operator is selected
- New conditions start with null operator/dataType
- Validation requires operator and dataType to be set for valid conditions

## 12. Flow Validation and Node Opacity
**Files:** Multiple node files and validation hooks
- [x] Implement comprehensive flow validation for all node types
- [x] Add opacity changes based on connection state
- [x] Add opacity changes based on flow validity
- [x] Apply to agent, if, and data store nodes
**Status:** ✅ COMPLETED
- All nodes now show 70% opacity when disconnected or flow is invalid
- Full opacity only when connected AND flow is valid
- Consistent visual feedback across all node types

## Implementation Priority
1. **High Priority (UI Validation)**
   - Task 6: Data Store Panel Validation
   - Task 7: If Node Panel Validation
   - Task 11: If Node Panel - None State for Conditions

2. **Medium Priority (System Improvements)**
   - Task 10: Replace unsafe window communication
   - Task 8: Data Store Field Usage Validation

3. **Completed Tasks**
   - ✅ Task 1: Node selection menu update
   - ✅ Task 2: Operator dropdown update
   - ✅ Task 3: Node traversal enhancement
   - ✅ Task 4: Number error display fix
   - ✅ Task 5: Data store initial value validation (in useFlowValidation)
   - ✅ Task 9: Data Store Schema Validation
   - ✅ Task 11: If Node Panel - None State for Conditions
   - ✅ Task 12: Flow Validation and Node Opacity

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