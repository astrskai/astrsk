# Technical Requirements Document: Trigger System Refactor

**Project**: astrsk PWA - Trigger System Enhancement
**Version**: 4.0
**Date**: 2025-10-31
**Status**: Ready for Implementation

---

## 1. Executive Summary

This document outlines the technical requirements for enhancing the astrsk trigger system to support three distinct trigger types (Character, User, Plot) with separate response formats and execution contexts. The system will enable Plot cards to actively trigger during session playback, provide visual distinction between trigger types, and implement connectivity-based asset validation.

### Key Architectural Principle

**All flows contain 6 permanent nodes**: 3 START nodes (Character, User, Plot) and 3 END nodes (Character, User, Plot).

**Trigger activation is determined by connectivity**, not node existence:
- If Character START → Character END path exists: Character trigger active
- If User START → User END path exists: User trigger active
- If Plot START → Plot END path exists: Plot trigger active
- Disconnected paths = inactive triggers (no execution)

### Project Goals
1. Enable Plot cards to trigger actively during session execution
2. Provide 3 permanent START/END node pairs with visual distinction
3. Add plot-specific variables to the Variable Panel
4. Implement connectivity-based asset filtering in session creation

---

## 2. Business Requirements

### BR-1: Plot Triggering in Play Mode
**Description**: Enable Plot cards to actively trigger during session playback, allowing plot narration and scene control to execute as part of the flow.

**Current State**: Plot cards are passive data; only Character cards can trigger via AGENT nodes.

**Future State**: Plot START nodes can trigger plot-specific generation through AGENT nodes, with plot card data available as execution context.

### BR-2: Separate Trigger Start Points
**Description**: Distinguish trigger mechanisms for Character (AI), User, and Plot nodes in the flow editor with clear visual separation and card selection.

**Current State**: Single generic START node without type distinction.

**Future State**: Three START node types (Character START, User START, Plot START) with:
- Unique visual styling (colors, icons)
- Card selector dropdowns
- Clear descriptions of purpose

### BR-3: Asset-Centric Variable Management
**Description**: Add plot-specific variables to the existing Variable Panel without restructuring the current tab system.

**Current State**: Variable Panel supports character and session variables only.

**Future State**: Variable Panel includes plot variables (plot.id, plot.name, plot.description, plot.entries) grouped appropriately in existing tabs.

### BR-4: Flow-Based Asset Filtering
**Description**: Session creation must validate and restrict card selection based on the connectivity between START and END nodes in the selected flow.

**Current State**: Session creation allows any card selection regardless of flow structure.

**Future State**: Every flow contains 3 START nodes (Character, User, Plot) and 3 END nodes (Character, User, Plot). Session creation analyzes flow connectivity:
- If Plot START → Plot END path exists: Plot card required
- If Plot START → Plot END path does NOT exist: No plot card needed
- Same logic applies to Character START → Character END and User START → User END
- Conditionally displays/hides card selection steps based on active paths

---

## 3. Technical Architecture

### 3.1 System Overview

The trigger system consists of three layers:

**Trigger Layer**: START nodes define trigger context and card selection (3 START nodes always present)
**Processing Layer**: AGENT, IF, and DATA_STORE nodes process flow logic
**Format Layer**: END nodes define response format and template selection (3 END nodes always present)

**Important**: Every flow ALWAYS contains:
- 3 START nodes (Character START, User START, Plot START)
- 3 END nodes (Character END, User END, Plot END)

Execution paths are determined by **connectivity**, not node existence. A disconnected START→END pair means that trigger type is inactive for the flow.

### 3.2 Core Components

#### 3.2.1 START Node Types

Three START node types define trigger contexts:

**Character START**
- **Purpose**: AI-controlled character agents in the scene
- **Visual**: Green theme (border: #2e7d32, background: #c8e6c9)
- **Icon**: 👤
- **Card Type**: Character cards
- **Execution Context**: Character generation with AI personality

**User START**
- **Purpose**: The character controlled by the user in a roleplay
- **Visual**: Blue theme (border: #1565c0, background: #90caf9)
- **Icon**: 🙋
- **Card Type**: Character cards (user-controlled)
- **Execution Context**: User action processing

**Plot START**
- **Purpose**: The plot controlling the scene, etc.
- **Visual**: Orange theme (border: #d84315, background: #ffccbc)
- **Icon**: 📖
- **Card Type**: Plot cards
- **Execution Context**: Plot narration and scene control

#### 3.2.2 END Node Types

Three END node types define response formats:

**Character END**
- **Purpose**: Dialogue format for character responses
- **Visual**: Green theme (matches Character START)
- **Icon**: 💬
- **Template Field**: `responseTemplate` (existing)
- **Default Format**: Character name, dialogue, emotion, action

**User END**
- **Purpose**: Action format for user responses
- **Visual**: Blue theme (matches User START)
- **Icon**: ⚡
- **Template Field**: `responseTemplateUser` (new)
- **Default Format**: User input, system feedback

**Plot END**
- **Purpose**: Narration format for plot/scene descriptions
- **Visual**: Orange theme (matches Plot START)
- **Icon**: 📜
- **Template Field**: `responseTemplatePlot` (new)
- **Default Format**: Plot title, narration, scene description, lorebook

### 3.3 Data Structure Changes

#### 3.3.1 Flow Entity Updates

**Add to FlowProps interface**:
- `responseTemplateUser?: string` - Template for User END nodes
- `responseTemplatePlot?: string` - Template for Plot END nodes

**Note**: Existing `responseTemplate` remains for Character END (backward compatible).

#### 3.3.2 START Node Data

**StartNodeData interface**:
- `type: "start"` - Node type identifier
- `startType: StartNodeType` - Enum: CHARACTER | USER | PLOT
- `selectedCardId?: UniqueEntityID` - Card selected in dropdown
- `label: string` - Display label
- `agentId: string` - Internal identifier

#### 3.3.3 END Node Data

**EndNodeData interface**:
- `type: "end"` - Node type identifier
- `endType: EndNodeType` - Enum: CHARACTER | USER | PLOT
- `label: string` - Display label
- `agentId: string` - Internal identifier

---

## 4. Feature Specifications

### 4.1 START Node Implementation

#### 4.1.1 Visual Design Requirements

**Dimensions**: 224px width (w-56)
**Border**: 2px solid with type-specific color
**Border Radius**: 12px
**Padding**: 12px internal spacing

**Color Schemes**:
- Character: Green (#2e7d32 border, #c8e6c9 background)
- User: Blue (#1565c0 border, #90caf9 background)
- Plot: Orange (#d84315 border, #ffccbc background)

#### 4.1.2 Card Selector Requirements

**Status**: DEFERRED to Phase 2+

**Current Implementation (Phase 1)**:
- Simple label display only
- No card selector UI yet
- Labels: "Character Start", "User Start", "Plot Start"

**Future Implementation**:
- Dropdown select inside START node component
- Data Source:
  - Character START: Character cards only
  - User START: Character cards only
  - Plot START: Plot cards only
- Load cards asynchronously on mount
- Persist selection to node data
- Display selected card name with checkmark icon

#### 4.1.3 Flow Editor Initialization

**Flow Creation Behavior**: When a new flow is created, automatically initialize with:
- 3 START nodes (Character, User, Plot)
- 3 END nodes (Character, User, Plot)
- No connections by default

**User Action**: Users connect START nodes to AGENT nodes and AGENT nodes to END nodes to activate trigger paths.

**Toolbar**: No START/END node creation buttons needed (nodes always present). Toolbar contains:
- AGENT node button
- IF node button
- DATA_STORE node button

### 4.2 END Node Implementation

#### 4.2.1 Visual Design Requirements

**Dimensions**: 224px width (w-56)
**Border**: 2px solid with type-specific color
**Border Radius**: 12px
**Padding**: 12px internal spacing

**Color Schemes**: Match corresponding START node colors.

#### 4.2.2 Response Design Panel Integration

**Trigger**: "Response design" button in END node
**Panel Parameter**: Pass `endType` to Response Design Panel
**Template Field Selection**:
- Character END → Edit `responseTemplate`
- User END → Edit `responseTemplateUser`
- Plot END → Edit `responseTemplatePlot`

**Auto-save**: 1000ms debounce on template changes.

#### 4.2.3 Default Response Templates

**Character END Default**:
- Display character name in bold
- Show agent output text
- Conditionally show emotion in brackets
- Conditionally show action in italics

**User END Default**:
- Display "You" in blockquote format
- Show user input
- Conditionally show system feedback in italics

**Plot END Default**:
- Display decorative header/footer lines
- Show plot name with book icon
- Display agent narration
- Conditionally show scene description with scene icon
- Conditionally iterate through lorebook entries
- Display chapter number if available in dataStore

#### 4.2.4 Flow Editor Behavior

**Note**: END nodes are automatically present in every flow (3 END nodes initialized on flow creation).

**No toolbar buttons needed** for END nodes - they are permanent fixtures of the flow structure.

**User Action**: Users create connections from AGENT/IF/DATA_STORE nodes to END nodes to complete execution paths.

### 4.3 Flow Execution System

#### 4.3.1 Execution Path Identification

**Process**:
1. Get all 3 START nodes (always present: Character, User, Plot)
2. For each START node:
   - Check if it has a valid path to its corresponding END node
   - If path exists AND card is selected: Create ExecutionPath
   - If path does NOT exist OR no card selected: Skip this trigger type
3. Execute only the active paths (those with connectivity)

**Path Determination**:
- Character START → reachable Character END = Active Character path
- User START → reachable User END = Active User path
- Plot START → reachable Plot END = Active Plot path
- Disconnected START→END = Inactive (no execution)

**ExecutionPath Structure**:
- `startNode`: Node reference
- `startType`: StartNodeType enum value
- `endNode`: Node reference
- `endType`: EndNodeType enum value
- `cardId`: UniqueEntityID of selected card
- `variables`: Execution context variables
- `isActive`: boolean (true if connected path exists)

#### 4.3.2 Context-Aware AGENT Execution

**Character/User Context**:
- Use existing character generation service
- Pass character card data
- Generate dialogue/response based on character personality

**Plot Context**:
- Use new plot execution service
- Pass plot card data including lorebook
- Generate narration/scene description
- Different prompt structure optimized for storytelling

#### 4.3.3 Path Result Merging

**Merge Strategy**:
1. Group results by END type
2. Concatenate results within same END type
3. Join sections in order: Character → User → Plot
4. Separate sections with horizontal rule divider
5. Merge variables from all paths (last write wins)
6. Flatten dataStore arrays from all paths

#### 4.3.4 Template Rendering

**Template Selection**:
- Character END → Use `flow.props.responseTemplate`
- User END → Use `flow.props.responseTemplateUser` or default
- Plot END → Use `flow.props.responseTemplatePlot` or default

**Context Variables**:
- Session context (existing)
- Agent output variables (character_name.field)
- DataStore values (field_name)
- Plot variables (plot.id, plot.name, plot.description, plot.entries)

### 4.4 Plot Variables

#### 4.4.1 Plot Variable Definitions

**plot.id**
- **Type**: string
- **Description**: Unique identifier of the plot card
- **Example**: "plot-abc123"
- **Usage**: Tracking, references, debugging

**plot.name**
- **Type**: string
- **Description**: Name of the plot card
- **Example**: "Medieval Quest"
- **Usage**: Display title, headers

**plot.description**
- **Type**: string
- **Description**: Main description of the plot
- **Example**: "A knight's journey through the kingdom"
- **Usage**: Context, summary, narration foundation

**plot.entries**
- **Type**: array of LorebookEntry objects
- **Description**: Lorebook entries for world-building
- **Structure**: Each entry contains:
  - `id`: string
  - `keys`: array of strings (trigger keywords)
  - `content`: string (lore text)
  - `priority`: number (0-100, higher = earlier insertion)
  - `enabled`: boolean
  - `position`: "before" | "after"
- **Usage**: Iterate in templates, conditional display, world-building

#### 4.4.2 Variable Availability

**Scope**: Plot variables available in all template contexts when:
1. Flow contains at least one Plot START node
2. Plot card is selected in Plot START node
3. Execution path includes Plot START node

**Access**: Available in Twig templates via `plot.*` namespace.

### 4.5 Variable Panel Changes

#### 4.5.1 Tab 1: Variables (Template Library)

**Add Plot Variables Group**:
- Group name: "Plot Variables"
- Group description: "Variables from the plot card controlling the scene"
- Variables: plot.id, plot.name, plot.description, plot.entries
- Template example provided for plot.entries iteration

**Conditional Display**: Only show plot variables group when Plot START → Plot END path exists in flow.

#### 4.5.2 Tab 2: Agent Output (Structured Output)

**Add Plot Agents Section**:
- Section header: "📖 Plot Agents"
- Display logic: Detect agents connected to Plot START nodes
- Group agents by type: "👤 Character Agents" and "📖 Plot Agents"
- Same variable display format as existing character agents

**Visual Grouping**: Add section dividers between Character and Plot agent groups.

### 4.6 Session Creation Validation

#### 4.6.1 Flow Analysis

**Analyze Flow Connectivity**:
- Check if Character START → Character END path exists (using graph traversal)
- Check if User START → User END path exists
- Check if Plot START → Plot END path exists
- Extract selected card IDs from START nodes that have active paths
- Determine which selection steps to show based on connectivity

**FlowAssetRequirements Structure**:
- `characterCards`: { required: boolean, cardIds: UniqueEntityID[] }
  - `required = true` if Character START → Character END path exists
- `userCard`: { required: boolean, cardId?: UniqueEntityID }
  - `required = true` if User START → User END path exists
- `plotCard`: { required: boolean, cardId?: UniqueEntityID }
  - `required = true` if Plot START → Plot END path exists

#### 4.6.2 Conditional Step Rendering

**Step Display Logic**:
1. Always show: Flow selection, Language, Background, Chat Styling
2. Conditionally show Character Cards step if Character START → Character END path exists
3. Conditionally show User Card step if User START → User END path exists
4. Conditionally show Plot Card step if Plot START → Plot END path exists

**Example**:
- Flow with only Character path connected: Show only Character Cards step
- Flow with Character + Plot paths connected: Show Character Cards and Plot Card steps
- Flow with no connections: Show no card selection steps (invalid flow)

#### 4.6.3 Validation Rules

**Character Cards Validation**:
- Must include all card IDs specified in Character START nodes
- Minimum count = number of Character START nodes
- Display error if required cards not selected

**User Card Validation**:
- Required if User START node exists
- If START node specifies card ID, must match
- Display error if not selected

**Plot Card Validation**:
- Required if Plot START node exists
- If START node specifies card ID, must match
- Display error if not selected

#### 4.6.4 UI Feedback

**Flow Requirements Display**:
- Show after flow selection
- List required card types with counts
- Visual indicators (checkmarks) as requirements met

**Step Headers**:
- Display required count: "Select 2 character cards (1/2 selected)"
- Show which START node requires the card
- Disable "Next" button until validation passes

---

## 5. Implementation Phases

### Overall Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | ✅ COMPLETED | Node type definitions & visual styling |
| Phase 2 | ✅ COMPLETED | Flow initialization with 6 permanent nodes |
| Phase 3 | ✅ COMPLETED | Context-aware execution |
| Phase 4 | ✅ COMPLETED | Plot variables |
| Phase 5 | ⏭️ SKIPPED | Session creation validation (deferred) |
| Phase 6 | 🔄 NEXT | Testing & Polish |

**Completed**: 4/6 phases (~67%)

---

### Phase 1: START & END Node Types (Week 1-2) ✅ COMPLETED

**Deliverables**:
- ✅ StartNodeType enum with 3 types (character_start, user_start, plot_start)
- ✅ EndNodeType enum with 3 types (character_end, user_end, plot_end)
- ✅ Updated start-node.tsx component with visual styling (NO card selector yet - deferred)
- ✅ Updated end-node.tsx component with visual styling
- ✅ Visual styling for all 3 types (colors, icons, labels)
- ✅ Added responseTemplateUser and responseTemplatePlot fields to FlowProps
- ⏸️ Unit tests for node rendering (deferred)
- ⏸️ Integration tests (deferred)

**Acceptance Criteria**:
- ✅ Each START node displays correct color/icon/label for its type
- ✅ Each END node displays correct color/icon/label for its type
- ✅ Backward compatible (existing flows display as Character type)
- ✅ No TypeScript compilation errors

**Implementation Notes**:
- Card selector deferred to future phase - current implementation uses simple labels only
- Labels: "Character Start", "User Start", "Plot Start" / "Character End", "User End", "Plot End"

### Phase 2: Flow Initialization with 3 START + 3 END Nodes (Week 2-3) ✅ COMPLETED

**Deliverables**:
- ✅ Updated create-flow.ts to initialize 6 permanent nodes
- ✅ 3 START nodes (Character, User, Plot) positioned on left side
- ✅ 3 END nodes (Character, User, Plot) positioned on right side
- ✅ All nodes marked as non-deletable
- ✅ Default connection: Character START → AGENT → Character END
- ✅ Backward compatible node IDs (Character START uses "start", Character END uses "end")
- ⏸️ Unit tests (deferred)
- ⏸️ Integration tests (deferred)

**Acceptance Criteria**:
- ✅ New flows automatically contain 6 nodes (3 START + 3 END)
- ✅ Nodes positioned correctly (left/middle/right layout)
- ✅ Only Character path connected by default (User and Plot disconnected)
- ✅ All nodes are non-deletable
- ✅ Backward compatible node IDs maintained
- ✅ No TypeScript compilation errors

**Implementation Details**:
- Character START: `id: "start"` (backward compatible)
- Character END: `id: "end"` (backward compatible)
- User START: `id: "start-user"` (new)
- User END: `id: "end-user"` (new)
- Plot START: `id: "start-plot"` (new)
- Plot END: `id: "end-plot"` (new)
- Default edges: `start → agent → end` (Character path active)

### Phase 3: Context-Aware Execution (Week 3-5) - ✅ COMPLETE

**Architectural Decision**: Created utility-only service (multi-path-execution-service.ts) that provides helper functions. Actual execution logic stays in session-play-service.ts for easier integration.

**Deliverables**:
- ✅ Plot execution service placeholder (plot-execution-service.ts)
- ✅ Multi-path utility service (multi-path-execution-service.ts) with:
  - ✅ `hasPathBetweenNodes()` - DFS path detection with cycle prevention
  - ✅ `identifyActivePaths()` - Detects which START→END paths are connected
  - ✅ `selectTemplate()` - Maps END node type to correct template field
  - ✅ `getDefaultTemplate()` - Fallback templates for each END type
  - ✅ `getStartNodeIds()` / `getEndNodeIds()` - Node ID constants
  - ✅ `shouldUseMultiPath()` - Backward compatibility check
- ✅ Full multi-path execution in session-play-service.ts:
  - ✅ Added multi-path detection at flow execution start
  - ✅ Logs which paths are active (Character/User/Plot)
  - ✅ For loop executes each active path (Character, User, Plot)
  - ✅ Each path executes from its START to END node
  - ✅ AGENT, IF, and DATA_STORE nodes execute correctly in each path
  - ✅ Template selection per path based on END node type
  - ✅ Yields intermediate results per path
  - ✅ Merges all path results with separator ("---")
  - ✅ Yields final merged content
- ⏸️ Unit tests for execution path logic (deferred to Phase 6)
- ⏸️ Integration tests for multi-path flows (deferred to Phase 6)
- ⏸️ End-to-end tests for Character, User, and Plot flows (deferred to Phase 6)

**Acceptance Criteria**:
- ✅ Graph traversal correctly identifies connected paths
- ✅ Multi-path detection logs appear when User or Plot paths active
- ✅ Backward compatible with existing Character-only flows
- ✅ Single connected START→END path executes correctly
- ✅ Multiple connected START→END paths execute and merge correctly
- ✅ Disconnected START→END pairs are skipped (not executed)
- ✅ AGENT nodes execute in each path (Character, User, Plot)
- ✅ Correct template applied based on END type (selectTemplate)
- ✅ Variables accumulated from all paths
- ⏸️ Performance testing (deferred to Phase 6)

### Phase 4: Plot Variables (Week 5-6) - ✅ COMPLETED

**Deliverables**:
- ✅ Plot variables added to RenderContext type (shared/prompt/domain/renderable.ts)
- ✅ Plot variables populated in makeContext (session-play-service.ts)
  - ✅ plot.id - Plot card ID
  - ✅ plot.description - Plot card description
  - ✅ plot.entries - Activated lorebook entries from plot card
- ✅ Plot variables added to Variable Panel UI (shared/prompt/domain/variable.ts)
  - ✅ Plot group added to VariableGroup enum
  - ✅ Plot group label and description
  - ✅ plot.id, plot.description, plot.entries in variableList
  - ✅ Template example for plot.entries iteration
- ⏸️ Variable panel agent detection (deferred - not critical)
- ⏸️ Unit tests for plot variable rendering (deferred to Phase 6)
- ⏸️ Integration tests for variable insertion (deferred to Phase 6)

**Acceptance Criteria**:
- ✅ Plot variables available when plotCard exists in session
- ✅ plot.id, plot.description render correctly in templates
- ✅ plot.entries accessible as array in templates
- ✅ Lorebook entry iteration works (uses session.plot_entries mechanism)
- ✅ Plot variables visible in Variable Panel UI
- ⏸️ Variable panel agent grouping (deferred - not critical)

### Phase 5: Session Creation Validation (Week 6-7) - ⏭️ SKIPPED (DEFERRED)

**Status**: Deferred to future release

**Rationale**: Current session creation flow works adequately. Flow-based card validation adds complexity that can be addressed in a future iteration after core trigger system is stable and tested.

**Deliverables** (for future implementation):
- ⏭️ Flow asset analyzer utility
- ⏭️ Updated create-session-page.tsx with conditional steps
- ⏭️ Updated step components with validation logic
- ⏭️ Flow requirements display UI
- ⏭️ Step header count displays
- ⏭️ Unit tests for flow analysis
- ⏭️ Integration tests for validation logic
- ⏭️ End-to-end tests for session creation flows

**Acceptance Criteria** (for future implementation):
- ⏭️ Steps show/hide based on flow structure
- ⏭️ Required card count displayed accurately
- ⏭️ Validation prevents invalid configurations
- ⏭️ User cannot proceed without required cards
- ⏭️ Flow requirements clearly communicated
- ⏭️ No regression in existing session creation

### Phase 6: Testing & Documentation (Week 7-8)

**Deliverables**:
- Comprehensive integration test suite
- Edge case testing (no cards, invalid flows, etc.)
- Performance testing and optimization
- User documentation updates
- Developer documentation (architecture, APIs)
- Migration guide (if needed)
- QA sign-off

**Acceptance Criteria**:
- Test coverage ≥80% for new features
- All integration tests pass
- Performance within acceptable limits
- Documentation complete and reviewed
- No critical bugs
- User acceptance testing completed

---

## 6. Technical Constraints

### 6.1 Backward Compatibility

**Requirements**:
- Existing flows must work without modification
- Existing START nodes become Character START nodes
- Existing END nodes become Character END nodes
- Existing responseTemplate field remains functional
- No data migration required for current users

**Node ID Strategy (CRITICAL for Backward Compatibility)**:
- Character START uses `id: "start"` (existing ID, no breaking change)
- Character END uses `id: "end"` (existing ID, no breaking change)
- User START uses `id: "start-user"` (new)
- User END uses `id: "end-user"` (new)
- Plot START uses `id: "start-plot"` (new)
- Plot END uses `id: "end-plot"` (new)

**Rationale**: Existing flows have edges referencing `source: "start"` and `target: "end"`. By keeping these IDs, all existing connections continue to work without modification.

**Migration Strategy for Existing Flows**:
1. On flow load, check if flow has 3 START nodes:
   - If NO: Add User START (`id: "start-user"`) and Plot START (`id: "start-plot"`) as disconnected nodes
   - If YES: Flow already migrated
   - Existing START node (`id: "start"`) automatically becomes Character START via default startType
2. On flow load, check if flow has 3 END nodes:
   - If NO: Add User END (`id: "end-user"`) and Plot END (`id: "end-plot"`) as disconnected nodes
   - If YES: Flow already migrated
   - Existing END node (`id: "end"`) automatically becomes Character END via default endType
3. New optional fields:
   - `responseTemplateUser` (defaults to default User template if undefined)
   - `responseTemplatePlot` (defaults to default Plot template if undefined)

**Backward Compatibility Guarantee**:
- ✅ Existing flows continue to execute identically (Character START → Character END path active)
- ✅ User START and Plot START added as disconnected (inactive) until user connects them
- ✅ No change to existing behavior unless user explicitly connects new paths
- ✅ No edge re-mapping required (IDs preserved)

### 6.2 Performance Requirements

**Execution Time**:
- Multi-path execution must not exceed 5% increase over single-path
- Template rendering must remain under 50ms per template
- Variable panel updates must complete under 100ms

**Memory**:
- No memory leaks during flow execution
- Variable context must not exceed 10MB per session
- Lorebook entries must be efficiently serialized

### 6.3 Data Integrity

**Validation**:
- START nodes must validate card selection before execution
- END nodes must validate template syntax before save
- Flow structure must be validated before session creation

**Error Handling**:
- Missing card selection: Display clear error, prevent execution
- Invalid template syntax: Display error in Response Design Panel
- Unreachable END nodes: Warning in flow validation panel

---

## 7. User Interface Requirements

### 7.1 Flow Editor Requirements

**Node Toolbar**:
- No START/END node buttons (nodes are permanent fixtures)
- Only AGENT, IF, DATA_STORE node buttons needed
- Toolbar space simplified

**Node Canvas**:
- 6 permanent nodes always visible (3 START + 3 END)
- START/END nodes cannot be deleted (disable delete button/option)
- START/END nodes can be repositioned for visual organization
- Visual feedback on card selection (checkmark, card name)
- Clear connection lines showing START→AGENT→END paths
- Sufficient z-index management for overlapping nodes

**Initial Layout** (suggested default positions):
- Left side: 3 START nodes stacked vertically
- Right side: 3 END nodes stacked vertically
- Middle: Empty space for AGENT/IF/DATA_STORE nodes

**Response Design Panel**:
- Panel title must indicate which END type being edited
- Template examples/documentation accessible in panel
- Real-time syntax validation feedback

### 7.2 Variable Panel Requirements

**Variables Tab**:
- Plot variables group collapsible
- Consistent styling with existing variable groups
- Click-to-insert functionality maintained

**Agent Output Tab**:
- Clear section headers for Character vs Plot agents
- Consistent variable card styling
- Agent color coding maintained (if applicable)

### 7.3 Session Creation Requirements

**Flow Selection Step**:
- Display flow requirements prominently
- Visual indicators (icons) for required card types
- Clear messaging about what the flow needs

**Card Selection Steps**:
- Display required count in step header
- Progress indicator (1/2 selected)
- Visual feedback on which cards satisfy requirements
- Disable "Next" when validation fails

---

## 8. Success Metrics

### 8.1 Functional Metrics

- [ ] 100% of START nodes render with correct styling
- [ ] 100% of END nodes render with correct styling
- [ ] 100% of card selections persist through save/load
- [ ] 100% of execution paths complete successfully
- [ ] 100% of template renders produce valid output
- [ ] 100% of plot variables accessible in templates
- [ ] 100% of session validations prevent invalid states

### 8.2 Quality Metrics

- [ ] Test coverage ≥80% for new code
- [ ] Zero critical bugs in production
- [ ] Zero data loss or corruption incidents
- [ ] Performance regression <5% for flow execution
- [ ] Code review approval from 2+ team members
- [ ] FSD architecture compliance maintained

### 8.3 User Experience Metrics

- [ ] User can create multi-trigger flow without documentation
- [ ] Visual distinction clear without tooltips
- [ ] Session creation validation messages understandable
- [ ] No user-reported confusion about node types
- [ ] Positive feedback on plot variable utility

---

## 9. Risk Assessment

### 9.1 High Risk

**Risk**: Path merging complexity in multi-path flows
**Impact**: Incorrect variable merging, lost data, execution failures
**Mitigation**: Extensive integration testing, namespace variables by path if needed, sequential execution before parallel optimization
**Contingency**: Rollback to single-path execution, add warnings for complex flows

### 9.2 Medium Risk

**Risk**: Template syntax errors breaking rendering
**Impact**: User sees blank or error messages instead of content
**Mitigation**: Real-time syntax validation, template sandbox testing, fallback to default templates
**Contingency**: Provide template reset button, log errors for debugging

**Risk**: UI complexity with 6 new node types
**Impact**: User confusion, incorrect node usage, support burden
**Mitigation**: Clear tooltips, visual distinction (colors/icons), user documentation
**Contingency**: Add onboarding tutorial, provide flow templates

### 9.3 Low Risk

**Risk**: Variable panel performance with many variables
**Impact**: Slow rendering, UI lag
**Mitigation**: Virtualization for long lists, debounced search
**Contingency**: Pagination, reduce variable descriptions

**Risk**: Session creation validation too strict
**Impact**: Users blocked from creating valid sessions
**Mitigation**: Clear error messages, allow manual override (with warning)
**Contingency**: Add "advanced mode" bypass

---

## 10. Dependencies

### 10.1 Internal Dependencies

**Required Components**:
- Flow editor (flow-multi)
- Session play service
- Card service
- Template renderer (Twig)
- Variable library

**Required Data**:
- Flow entity with nodes/edges
- Card entities (Character, Plot types)
- Session entity with card references
- Lorebook data structure

### 10.2 External Dependencies

**No new external dependencies required**.

**Existing Dependencies**:
- React 18.x
- TanStack Query v5
- Monaco Editor (for template editing)
- Twig.js (for template rendering)

---

## 11. Acceptance Criteria

### 11.1 Phase Completion Criteria

Each phase must meet:
- All deliverables completed and code-reviewed
- Unit tests passing with ≥80% coverage
- Integration tests passing
- No critical or high-severity bugs
- Documentation updated
- Demo to stakeholders completed

### 11.2 Project Completion Criteria

Project complete when:
- All 6 phases completed
- End-to-end testing passed
- Performance benchmarks met
- User acceptance testing passed
- Documentation complete
- Production deployment successful
- Zero critical bugs in first week of production

---

## 12. Open Questions

### 12.1 Design Decisions Pending

**Q1**: Should START/END nodes be allowed to move freely or snap to grid?
**Current Assumption**: Free movement allowed, no grid snapping required.

**Q2**: Should there be a visual indicator (e.g., color-coded edge) showing active vs inactive paths?
**Current Assumption**: Standard edges, no special active/inactive styling yet.

**Q3**: If all three paths are disconnected (invalid flow), should we prevent session creation entirely?
**Current Assumption**: Yes, require at least one connected path for valid flow.

### 12.2 Implementation Clarifications Needed

**Q1**: For flows with circular connections (e.g., END → START loop), how should path detection work?
**Current Assumption**: Use standard graph traversal with cycle detection, mark as invalid flow.

**Q2**: Should card selection be required before connecting START node, or can it be selected later?
**Current Assumption**: Can be selected at any time; validation enforces selection before session creation.

**Q3**: Should we show a warning indicator on START nodes without card selection?
**Current Assumption**: Yes, visual indicator (e.g., warning icon) on START node until card selected.

---

## 13. Glossary

**START Node**: Entry point for flow execution defining trigger context
**END Node**: Exit point for flow execution defining response format
**AGENT Node**: Processing node that executes AI generation
**Trigger Context**: The type of card (Character/User/Plot) and execution behavior
**Response Template**: Twig template string defining output format
**Execution Path**: Single traversal from START to END through flow graph
**Lorebook**: Collection of world-building entries with trigger keywords
**FSD**: Feature-Sliced Design architecture pattern

---

## 14. Appendices

### Appendix A: File Modifications Summary

**New Files Created (4/6 planned)**:
1. ✅ `entities/flow/model/start-node-types.ts` - START type enum with themes
2. ✅ `entities/flow/model/end-node-types.ts` - END type enum with themes
3. ✅ `app/services/plot-execution-service.ts` - Plot generation logic placeholder (Phase 3)
4. ✅ `app/services/multi-path-execution-service.ts` - Multi-path execution logic (Phase 3)
5. ⏸️ `features/flow/flow-multi/utils/flow-asset-analyzer.ts` - Asset analysis (Phase 5)
6. ⏸️ `shared/lib/plot-variables.ts` - Plot variables library (Phase 4)

**Modified Files (5/9 planned)**:
1. ✅ `entities/flow/domain/flow.ts` - Added 2 template fields (responseTemplateUser, responseTemplatePlot)
2. ✅ `features/flow/flow-multi/nodes/start-node.tsx` - Added startType with visual styling
3. ✅ `features/flow/flow-multi/nodes/end-node.tsx` - Added endType with visual styling
4. ✅ `entities/flow/usecases/create-flow.ts` - Initialize 6 permanent nodes
5. ✅ `app/services/session-play-service.ts` - Added multi-path detection and delegation placeholder (Phase 3)
6. ⏸️ `features/flow/flow-multi/panels/flow-panel.tsx` - Update toolbar (Phase 3)
7. ⏸️ `features/flow/flow-multi/panels/response-design/response-design-panel.tsx` - Template selection (Phase 3)
8. ⏸️ `features/flow/flow-multi/utils/flow-traversal.ts` - Multi-path validation (Phase 3)
9. ⏸️ `features/flow/flow-multi/panels/variable/variable-panel.tsx` - Plot variables (Phase 4)
10. ⏸️ `features/session/create-session-page.tsx` - Conditional validation (Phase 5)

### Appendix B: Related Documents

- `CLAUDE.md` - Development guidelines and FSD architecture
- `PWA_FSD_MIGRATION_HISTORY.md` - Migration history
- `TANSTACK_QUERY.md` - Query patterns and best practices
- `FSD.md` - Feature-Sliced Design architecture guide

---

## Document Status

**Status**: ✅ Phase 1-4 Implemented | Phase 5 Skipped | Phase 6 Ready
**Last Updated**: 2025-10-31
**Implementation Progress**: 4/6 phases complete (67%), 1 phase skipped

### Completed Work
✅ **Phase 1**: START/END node type definitions with visual styling
✅ **Phase 2**: Flow initialization with 6 permanent nodes
✅ **Phase 3**: Multi-path execution with template selection (inline implementation)
✅ **Phase 4**: Plot variables (plot.id, plot.description, plot.entries) + Variable Panel UI
✅ **Backward Compatibility**: Node ID strategy maintains compatibility with existing flows
✅ **TypeScript**: All compilation checks pass

⏭️ **Phase 5**: Session Creation Validation (deferred to future release)

### Current State
- ✅ New flows automatically created with 3 START + 3 END nodes
- ✅ Visual distinction: Green (Character), Blue (User), Orange (Plot)
- ✅ Default connection: Character START → AGENT → Character END
- ✅ User/Plot paths disconnected by default (ready to connect)
- ✅ Multi-path execution fully implemented in session-play-service.ts
- ✅ All active paths execute in parallel (Character, User, Plot)
- ✅ Each path uses correct template (responseTemplate, responseTemplateUser, responseTemplatePlot)
- ✅ Results merged with "---" separator
- ✅ Plot variables accessible in templates (plot.id, plot.description, plot.entries)
- ✅ Plot variables visible in Variable Panel UI

### Architecture Decision - Inline Implementation
**multi-path-execution-service.ts** provides utility functions:
- ✅ `hasPathBetweenNodes()` - DFS path detection with cycle prevention
- ✅ `identifyActivePaths()` - Returns which START→END paths are connected
- ✅ `selectTemplate()` - Maps END node type to template field
- ✅ `getDefaultTemplate()` - Fallback templates for each END type
- ✅ `getStartNodeIds()` / `getEndNodeIds()` - Node ID constants

**session-play-service.ts** contains execution logic:
- ✅ Calls `identifyActivePaths()` to detect active paths
- ✅ Logs which paths are active (Character/User/Plot)
- ✅ For loop executes each active path (Character, User, Plot)
- ✅ Each path executes from START to END with correct template
- ✅ AGENT, IF, DATA_STORE nodes execute in each path
- ✅ Results merged with "---" separator between paths

### Next Steps
🔄 **Phase 6: Testing & Polish**
- Integration testing for multi-path flows
- Unit tests for path detection and template selection
- UI testing for START/END node visual distinction
- Performance testing
- Documentation updates
- Bug fixes and polish

✅ **Trigger System Implementation Complete**:
1. **Manual trigger buttons**: Users can manually trigger specific START paths via UI buttons
   - Character button → triggers Character START node
   - User button → triggers User START node
   - Plot button → triggers Plot START node (displays when plot card exists)
2. **Selective execution**: Each button triggers only its corresponding path
3. **UI Integration**: Plot trigger button added to message input area (desktop version)
4. **Implementation details**:
   - `executeFlow()` accepts `triggerType` parameter ("character" | "user" | "plot")
   - `generatePlotMessage()` function creates plot-specific messages
   - Plot button uses BookOpen icon from Lucide React
