# Flow System Development Requirements

## 1. Node Types

### Currently Implemented
- **Start Node** (single instance)
- **End Node** (single instance)
- **Agent Node** (already defined)

### New Nodes to Implement
- **Data Store Node**
- **If Node** (conditional logic gate)

## 2. Node Features

### Data Store Node
- **Title field** - for node identification
- **Edit button** - opens Data Fields Panel
- **Variables list** - displayed below the edit button, showing all variables defined in this store node

### If Node
- **Title field** - for node identification
- **Edit button** - opens If Node Panel
- **One input handle** - receives flow from previous node
- **Two output handles**:
  - **True handle** (green) - path taken when conditions are met
  - **False handle** (red) - path taken when conditions are not met
- Visual indication of the branching logic with color-coded outputs

## 3. Panel System

### Global Schema Panel (Flow-level)
- **Purpose**: Manages structured output schemas at the flow level, providing a centralized view and management of all schema definitions across the entire flow
- **Scope**: Flow-level (applies to all agents in the flow)
- **Location**: Accessible from the flow editor toolbar or via dedicated panel button

#### Panel Structure
The Global Schema Panel follows the same two-column layout as the Output Panel:

##### Left Column - Schema Fields List
- **Add Field button** - Creates new schema fields for the flow
- **Schema field items** - Sortable list showing all defined fields with:
  - Field name display
  - Data type indicator (String, Integer, Number, Boolean, Enum, Array types)
  - Required/Optional status badge
  - Drag handle for reordering fields
  - Selection state highlighting
- **Empty state** - Shows "No fields configured" message with "Add Field" prompt when no schemas exist

##### Right Column - Field Configuration
When a field is selected:
- **Delete button** (trash icon) - Top-right corner for field removal
- **Name field** - Editable text input for field identifier
- **Data type selector** - Dropdown with options:
  - String / String (Array)
  - Integer / Integer (Array)
  - Number / Number (Array)
  - Boolean / Boolean (Array)
  - Enum / Enum (Array)
- **Type-specific options**:
  - For Integer/Number: Minimum and Maximum value inputs
  - For Enum: Dynamic list of enum options with add/remove controls
- **Description editor** - Full Monaco editor with:
  - Markdown syntax support
  - Variable insertion capability (tracks cursor position)
  - Expand/collapse toggle for fullscreen editing
  - Auto-save on content changes

#### Key Features
- **Drag-and-drop reordering** - Fields can be rearranged via drag handles
- **Real-time validation** - Immediate feedback on invalid configurations
- **Auto-save** - Changes are automatically persisted with debouncing
- **Variable references** - Schema fields can be referenced as `{{flow.schema.fieldname}}` throughout the flow
- **Inheritance model** - Individual agents can inherit or override flow-level schemas
- **Schema composition** - Supports combining multiple schema definitions
- **Export/Import** - Ability to save and load schema configurations

#### Integration Points
- **Agent nodes** - Can reference and use global schema definitions
- **Output panels** - Individual agent outputs can extend or override global schemas
- **Validation system** - Global schemas participate in flow-wide validation
- **Preview system** - Schema fields are available in the preview generator

#### Visual Indicators
- **Active selection** - Highlighted background for selected field
- **Validation errors** - Red border and error messages for invalid configurations
- **Required fields** - Special badge or indicator for mandatory fields
- **Array types** - Visual distinction for array-type fields
- **Enum options** - Numbered list display for enum values

### Data Fields Panel (Node-specific)
- **Purpose**: Configures data storage fields and their logic for a specific Data Store Node
- **Trigger**: Opens when clicking edit button on **Data Store Node**
- **Scope**: Node-specific (applies only to the selected Data Store Node)

#### Panel Structure
Two-column layout:

##### Left Column - Fields List
- **Add Field button** - Creates new data fields for the store
- **Field items** - List of all defined fields showing:
  - Field name
  - Data type (String, Number, Boolean, Object, Array)
  - Delete button for each field
  - Selection highlighting for active field
- **Empty state** - Shows "No fields defined" with prompt to add fields

##### Right Column - Logic Field
- **Logic editor** - Monaco editor for defining field computation logic
- **Features**:
  - Full code editing capabilities
  - Syntax highlighting for expressions
  - Variable reference support (access to other fields and flow variables)
  - Auto-completion for available variables
  - Real-time validation of logic expressions
- **Logic types supported**:
  - Simple value assignments
  - Computed expressions using other fields
  - Conditional logic (if/then/else)
  - Array and object manipulations
  - Function calls and transformations

### If Node Panel (Node-specific)
- Opens when clicking edit button on **If Node**
- Features:
  - **Logic operator dropdown** (AND/OR) - applies globally to ALL conditions:
    - When **AND** is selected: condition1 AND condition2 AND condition3...
    - When **OR** is selected: condition1 OR condition2 OR condition3...
  - **Add condition button** - to add new condition rows
  - **Multiple condition rows**, each containing:
    - **Value1 field** - first operand
    - **Operator dropdown** - (is equal to, lower than, contains, etc.)
    - **Value2 field** - second operand
    - **Delete button (X)** - to remove individual conditions
  - **Logic operator labels** - displayed between each condition (all show AND or all show OR based on dropdown selection)
- Supports building conditional logic where all conditions use the same logical operator

## 4. Implementation Notes
*To be added as development progresses*

## 5. Technical Specifications
*To be added*

## 6. Dependencies and Integration Points
*To be added*