// Shared types for vibe backend and PWA frontend
// These types match the exact Convex function signatures and schemas

// ===== CORE RESOURCE TYPES =====
export type ResourceType = 'character_card' | 'plot_card' | 'flow';

export type ChangeOperation = 'set' | 'put' | 'remove';

// ===== SESSION TYPES =====
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SessionAnalysis {
  isSimpleAnswer: boolean;
  simpleAnswer?: string;
  requestType: 'simple_answer' | 'simple_edit' | 'complex_transformation' | 'content_creation' | 'structure_modification';
  confidence: number;
  reasoning: string; // Changed from analysisDetails to match backend
  stepByStepPlan: Array<{
    step: number;
    description: string;
    targetResourceId: string;
    changeType: string;
    estimatedComplexity: 'low' | 'medium' | 'high';
  }>;
}

// ===== NODE IMPLEMENTATION TYPES (for Flow editing) =====

// Condition types for If-nodes
export type ConditionDataType = 'string' | 'number' | 'integer' | 'boolean';

export type StringOperator = 
  | 'string_exists' | 'string_not_exists' | 'string_is_empty' | 'string_is_not_empty'
  | 'string_equals' | 'string_not_equals' | 'string_contains' | 'string_not_contains'
  | 'string_starts_with' | 'string_not_starts_with' | 'string_ends_with' | 'string_not_ends_with'
  | 'string_matches_regex' | 'string_not_matches_regex';

export type NumberOperator = 
  | 'number_exists' | 'number_not_exists' | 'number_is_empty' | 'number_is_not_empty'
  | 'number_equals' | 'number_not_equals' | 'number_greater_than' | 'number_less_than'
  | 'number_greater_than_or_equals' | 'number_less_than_or_equals';

export type IntegerOperator = 
  | 'integer_exists' | 'integer_not_exists' | 'integer_is_empty' | 'integer_is_not_empty'
  | 'integer_equals' | 'integer_not_equals' | 'integer_greater_than' | 'integer_less_than'
  | 'integer_greater_than_or_equals' | 'integer_less_than_or_equals';

export type BooleanOperator = 
  | 'boolean_exists' | 'boolean_not_exists' | 'boolean_is_empty' | 'boolean_is_not_empty'
  | 'boolean_is_true' | 'boolean_is_false' | 'boolean_equals' | 'boolean_not_equals';

export type ConditionOperator = StringOperator | NumberOperator | IntegerOperator | BooleanOperator;

export interface IfCondition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

// Data store field types
export type DataStoreFieldType = 'string' | 'number' | 'boolean' | 'integer';

export interface DataStoreSchemaField {
  id: string;
  name: string;
  type: DataStoreFieldType;
  initialValue: string;
  description?: string;
}

export interface DataStoreSchema {
  fields: DataStoreSchemaField[];
  version?: number;
}

export interface DataStoreField {
  id: string;
  schemaFieldId: string;
  logic?: string;
}

// Schema field types for structured output
export enum SchemaFieldType {
  String = "string",
  Integer = "integer",
  Number = "number",
  Boolean = "boolean",
  Enum = "enum",
}

// Editable schema field for structured output
export interface EditableSchemaField {
  name: string;
  description?: string;
  required: boolean;
  array: boolean;
  type: SchemaFieldType;
  // For number/integer types
  minimum?: number;
  maximum?: number;
  // For enum type
  enum?: string[];
}

// Message roles for chat completion
export type MessageRole = 'system' | 'user' | 'assistant';

// Simplified prompt block for editing
export interface EditablePromptBlock {
  id?: string;  // Optional ID for tracking
  template: string;  // The template text (source that gets rendered)
}

// Simplified prompt message for chat completion
export interface EditablePromptMessage {
  id?: string;  // Optional ID for tracking
  type: 'plain' | 'history';
  enabled: boolean;
  role?: MessageRole;  // For plain messages
  promptBlocks?: EditablePromptBlock[];  // For plain messages
  // For history messages
  historyType?: 'turns' | 'summary' | 'split';
  start?: number;
  end?: number;
  countFromEnd?: boolean;
  // History prompt blocks for different roles
  userPromptBlocks?: EditablePromptBlock[];
  assistantPromptBlocks?: EditablePromptBlock[];
  // Message roles for history
  userMessageRole?: string;
  charMessageRole?: string;
  subCharMessageRole?: string;
}

// API types
export enum ApiType {
  Chat = "chat",
  Text = "text",
}

export enum OutputFormat {
  StructuredOutput = "structured_output",
  TextOutput = "text_output",
}

// Editable Agent data (only fields that can be edited via vibe)
export interface EditableAgentData {
  id: string;  // Agent ID
  
  // Metadata
  name: string;
  description?: string;  // Optional - not typically edited by AI
  
  // API Configuration (targetApiType affects prompt structure)
  targetApiType: ApiType;
  
  // Prompts
  promptMessages?: EditablePromptMessage[];  // For chat completion
  textPrompt?: string;  // For text completion
  
  // Structured Output
  enabledStructuredOutput: boolean;
  schemaName?: string;
  schemaDescription?: string;
  schemaFields?: EditableSchemaField[];
  
  // Visual
  color?: string;  // Optional - not typically edited by AI
}

// Editable If-node data
export interface EditableIfNodeData {
  id: string;  // Node ID
  flowId: string;
  name: string;
  // color removed - frontend handles visual presentation
  logicOperator: 'AND' | 'OR';
  conditions: IfCondition[];
}

// Editable Data Store node data
export interface EditableDataStoreNodeData {
  id: string;  // Node ID
  flowId: string;
  name: string;
  color: string;
  dataStoreFields: DataStoreField[];
}

// ===== EDITABLE RESOURCE DATA TYPES (Compile-time Type Safety) =====

// Common fields shared by both character and plot cards
export interface EditableCardCommon {
  title: string;
}

// Lorebook entry structure (matches Entry domain model)
export interface LorebookEntry {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];         // Keywords that trigger this entry
  recallRange: number;     // How far back in context to search for keys
  content: string;         // The actual lorebook content
}

// Lorebook structure
export interface Lorebook {
  entries: LorebookEntry[];
}

// Character-specific editable fields
export interface EditableCharacterData {
  name: string;
  description: string;
  example_dialogue: string;
  lorebook: Lorebook;
}

// Plot scenario structure
export interface PlotScenario {
  id: string;
  name: string;
  description: string;
  lorebook_entries: string[];  // References to lorebook entry IDs
}

// Plot-specific editable fields
export interface EditablePlotData {
  description: string;
  scenarios: PlotScenario[];
  lorebook: Lorebook;
}

// Flow editable fields - includes structure for AI to understand
// The backend will map UUIDs to simple IDs for AI processing
export interface EditableFlowData {
  name: string;  // Flow title
  response_template: string;  // Response design
  data_store_schema?: DataStoreSchema;  // Data store schema
  // Include nodes/edges so AI can add/remove them
  // These contain original UUIDs - backend will simplify them
  nodes: Array<{
    id: string;  // Original UUID
    type: string;  // agent, if, dataStore, start, end
    position: { x: number; y: number };
    name?: string;  // Node name (for agent, if, dataStore nodes)
    data?: {
      agentId?: string;  // For agent nodes
      flowId?: string;   // For if/dataStore nodes
      [key: string]: any;  // Allow other properties
    };
  }>;
  edges: Array<{
    id: string;  // Original UUID
    source: string;  // Source node UUID
    target: string;  // Target node UUID
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  // Separate node data by type - this matches the export format
  agents?: Record<string, EditableAgentData>;  // Agent data keyed by node ID
  ifNodes?: Record<string, EditableIfNodeData>;  // If node data keyed by node ID  
  dataStoreNodes?: Record<string, EditableDataStoreNodeData>;  // Data store node data keyed by node ID
}

// Complete flow data for export/import (includes structure and associated data)
export interface CompleteFlowData {
  name: string;
  response_template: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    name?: string;  // Node name (for agent, if, dataStore nodes)
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  data_store_schema?: any;
  agents?: Record<string, any>; // agentId -> agent data
  ifNodes?: Array<any>; // if-node data
  dataStoreNodes?: Array<any>; // data-store node data
}

// Character Card editable data structure
export interface EditableCharacterCard {
  common: EditableCardCommon;
  character: EditableCharacterData;
  plot?: never; // Ensures type safety - character cards don't have plot data
}

// Plot Card editable data structure
export interface EditablePlotCard {
  common: EditableCardCommon;
  plot: EditablePlotData;
  character?: never; // Ensures type safety - plot cards don't have character data
}

// Union type for any editable card
export type EditableCard = EditableCharacterCard | EditablePlotCard;

// Type guard functions for runtime type checking (if needed)
export function isEditableCharacterCard(card: EditableCard): card is EditableCharacterCard {
  return 'character' in card && card.character !== undefined;
}

export function isEditablePlotCard(card: EditableCard): card is EditablePlotCard {
  return 'plot' in card && card.plot !== undefined;
}

// Resource data with proper typing based on resource type
export interface TypedResourceData<T extends ResourceType> {
  character_card: EditableCharacterCard;
  plot_card: EditablePlotCard;
  flow: EditableFlowData;
}

// Helper type to get the data type for a specific resource type
export type ResourceDataType<T extends ResourceType> = TypedResourceData<T>[T];

export interface StructuredChange {
  path: string;
  operation: ChangeOperation;
  value?: any;
  metadata?: {
    originalValue?: any;
    changeReason: string;
    confidence: number;
  };
}

// ===== SESSION MANAGEMENT TYPES =====
export type SessionStatus = 
  | 'active' 
  | 'committed' 
  | 'reverted'
  | 'restored'                // Frontend-specific: session was restored from storage
  | 'analyzing'
  | 'analysis_ready'          // NEW: Analysis complete, operations pending
  | 'planning' 
  | 'generating_operations'   // NEW: More specific than 'generating_changes'
  | 'generating_changes'      // Keep for backward compatibility
  | 'applying_changes'
  | 'completed'
  | 'error';

// Type-safe constants for session statuses
export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMMITTED: 'committed', 
  REVERTED: 'reverted',
  RESTORED: 'restored',
  ANALYZING: 'analyzing',
  ANALYSIS_READY: 'analysis_ready',
  PLANNING: 'planning',
  GENERATING_OPERATIONS: 'generating_operations',
  GENERATING_CHANGES: 'generating_changes',
  APPLYING_CHANGES: 'applying_changes',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const satisfies Record<string, SessionStatus>;

export interface EditingSession {
  sessionId: string;
  originalRequest: string;
  resourceIds: string[];
  resourceSnapshots: {
    [resourceId: string]: EditableCharacterCard | EditablePlotCard | EditableFlowData;
  };
  currentResources: {
    [resourceId: string]: EditableCharacterCard | EditablePlotCard | EditableFlowData;
  };
  appliedChanges: Record<string, StructuredChange[]>; // Record<resourceId, changes[]>
  status: SessionStatus;
  progress?: number;
  currentStep?: string;
  conversationHistory?: ConversationMessage[];
  analysis?: SessionAnalysis;
}

// ===== TWO-PHASE SESSION TYPES =====

// Phase 1: Analysis Results (available immediately after analysis)
export interface AnalysisPhaseResult {
  completedAt: number;
  analysis: VibeAnalysisResult;
  estimatedOperations: number;
  processingTimeMs: number;
}

// Phase 2: Operation Results (available after operation generation)
export interface OperationPhaseResult {
  completedAt: number;
  generatorResult: VibeGeneratorResult;
  appliedChanges: Record<string, StructuredChange[]>;
  pendingOperations: StructuredChange[];
  processingTimeMs: number;
}

// Two-phase session extends base session with phase-specific results
export interface TwoPhaseEditingSession extends EditingSession {
  // Phase 1: Analysis Results (available when status = 'analysis_ready')
  analysisPhase?: AnalysisPhaseResult;
  
  // Phase 2: Operation Results (available when status = 'completed')
  operationPhase?: OperationPhaseResult;
}

// ===== FUNCTION ARGUMENT TYPES (match exact Convex function signatures) =====

// createEditingSession mutation args with proper typing
export interface CreateEditingSessionArgs {
  sessionId: string;
  resourceIds: string[];
  resourceTypes: Record<string, ResourceType>; // resourceId -> resourceType mapping
  resourceData: {
    [resourceId: string]: EditableCharacterCard | EditablePlotCard | EditableFlowData;
  };
  originalRequest: string;
  modelId?: string; // <- new
}

// updateResourceWithChanges mutation args
export interface UpdateResourceWithChangesArgs {
  sessionId: string;
  resourceId: string;
  resourceType: ResourceType;
  changes: StructuredChange[];
}

// getEditingSession query args
export interface GetEditingSessionArgs {
  sessionId: string;
}

// commitSessionChanges mutation args
export interface CommitSessionChangesArgs {
  sessionId: string;
}

// revertSession mutation args  
export interface RevertSessionArgs {
  sessionId: string;
}

// processResourceEditingSession action args (internal)
export interface ProcessResourceEditingSessionArgs {
  sessionId: string;
}

// getCompleteResource query args
export interface GetCompleteResourceArgs {
  resourceId: string;
  resourceType: ResourceType;
}

// ===== FUNCTION RETURN TYPES =====

// updateResourceWithChanges return type
export interface UpdateResourceWithChangesResult {
  success: boolean;
  resourceId: string;
  appliedChanges: number;
  updatedResource?: any;
  error?: string;
}

// commitSessionChanges return type
export interface CommitSessionChangesResult {
  success: boolean;
  message: string;
  sessionId: string;
}

// revertSession return type
export interface RevertSessionResult {
  success: boolean;
  message: string;
  sessionId: string;
}

// ===== FRONTEND-SPECIFIC TYPES =====

// Available resource with proper typing
export interface AvailableResource<T extends ResourceType = ResourceType> {
  id: string;
  type: T;
  name: string;
  description?: string;
  data: ResourceDataType<T>;
}

// For frontend UI components
export interface VibeCodingSessionContext {
  resourceId?: string;
  resourceType?: ResourceType;
  resourceName?: string;
  resourceData?: EditableCharacterCard | EditablePlotCard | EditableFlowData;
  availableResources?: Array<AvailableResource>;
  conversationHistory?: ConversationMessage[];
}

// Frontend request format (gets transformed to backend format)
export interface StartVibeCodingRequest {
  originalRequest: string;
  userId?: string;
  context?: VibeCodingSessionContext;
  modelId?: string;
}

// Frontend session status (enriched version of EditingSession)
export interface VibeCodingSessionStatus extends EditingSession {
  canCancel?: boolean;
  pendingEdit?: {
    editId: string;
    description: string;
    reasoning: string;
    suggestedChanges: any;
    targetResourceId?: string;
    targetResourceType?: string;
  };
  pendingResourceRequest?: {
    requestId: string;
    description: string;
    resourceType: string;
    resourceId?: string;
    reasoning: string;
    currentStep: string;
  };
  results?: {
    files: any[];
    explanation: string;
    totalEdits: number;
    appliedEdits: number;
  };
  simpleAnswer?: string;
  errorMessage?: string;
}

// ===== API RESPONSE WRAPPER =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

// ===== LEGACY HTTP API TYPES (for compatibility) =====
export interface ConfirmEditRequest {
  sessionId: string;
  editId?: string;
  editedResource?: any;
}

export interface RejectEditRequest {
  sessionId: string;
  editId?: string;
  reason?: string;
}

export interface CancelSessionRequest {
  sessionId: string;
}

export interface ConfirmResourceRequest {
  sessionId: string;
  requestId: string;
  providedResource: {
    id: string;
    type: string;
    name: string;
    description?: string;
    data: any;
  };
}

export interface RejectResourceRequest {
  sessionId: string;
  requestId: string;
  reason?: string;
}

// ===== ERROR HANDLING TYPES =====
export interface ErrorContext {
  sessionId?: string;
  resourceId?: string;
  resourceType?: string;
  operation?: string;
  step?: string;
  userId?: string;
  timestamp?: string;
}

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'critical';
  context: ErrorContext;
  timestamp: string;
  resolved: boolean;
  resolution?: string;
  occurenceCount: number;
}

// ===== VIBE CODING AI RESULT TYPES =====

// Base analysis result interface
export interface BaseVibeAnalysisResult {
  isSimpleAnswer: boolean;
  simpleAnswer?: string;
  requestType: 'simple_answer' | 'simple_edit' | 'complex_transformation' | 'content_creation' | 'structure_modification';
  confidence: number;
  reasoning: string; // Changed from analysisDetails to reasoning
  warnings: string[];
  // Additional backend-specific analysis
  requestAnalysis?: {
    intent: string;
    complexity: 'low' | 'medium' | 'high';
    targetResources: string[];
    requiredChanges: string[];
  };
  resourceAnalysis?: Record<string, {
    type: 'character_card' | 'plot_card' | 'flow';
    structure: {
      fields: string[];
      nested: string[];
      arrays: string[];
    };
    editableFields: string[];
    relationships: string[];
  }>;
  conversationAnalysis?: {
    messageCount: number;
    themes: string[];
    context: string;
  };
  recommendations?: string[];
  estimatedOperations?: number;
}

// Step structure (used by both cards and flows)
export interface VibeStep {
  step: number;
  description: string;
  targetResourceId: string;
  changeType: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

// Card analysis result (uses stepByStepPlan)
export interface VibeCardAnalysisResult extends BaseVibeAnalysisResult {
  stepByStepPlan: VibeStep[];
}

// Flow analysis result (uses stepByStepPlan)
export interface VibeFlowAnalysisResult extends BaseVibeAnalysisResult {
  stepByStepPlan: VibeStep[];
  flowMappings?: any;  // ← Only flows need ID mapping
}

// Union type for analysis results
export type VibeAnalysisResult = VibeCardAnalysisResult | VibeFlowAnalysisResult;

// Type guard functions
export function isVibeFlowAnalysisResult(result: VibeAnalysisResult): result is VibeFlowAnalysisResult {
  return 'flowMappings' in result;
}

export function isVibeCardAnalysisResult(result: VibeAnalysisResult): result is VibeCardAnalysisResult {
  return !isVibeFlowAnalysisResult(result);
}

// Step with its corresponding operation result
export interface StepWithOperation {
  step: number;
  description: string;
  operation: StructuredChange;
  reasoning: string;
  confidence: number;
}

// Generator results structure - correlates steps with their operations
export interface VibeGeneratorResult {
  stepResults: StepWithOperation[];  // One per step
  overallReasoning: string;
  overallConfidence: number;
  warnings: string[];
  metadata: {
    generationTime: number;
    modelUsed: string;
    tokenUsage: number;
    processingSteps: string[];
  };
}

// ===== HELPER TYPE GUARDS =====
export function isActiveStatus(status: SessionStatus): boolean {
  return ['active', 'restored', 'analyzing', 'analysis_ready', 'planning', 'generating_operations', 'generating_changes', 'applying_changes'].includes(status);
}

export function isAnalysisReadyStatus(status: SessionStatus): boolean {
  return status === 'analysis_ready';
}

export function isGeneratingOperationsStatus(status: SessionStatus): boolean {
  return status === 'generating_operations' || status === 'generating_changes';
}

export function isCompletedStatus(status: SessionStatus): boolean {
  return ['completed', 'committed'].includes(status);
}

export function isErrorStatus(status: SessionStatus): boolean {
  return status === 'error';
}

export function isRevertedStatus(status: SessionStatus): boolean {
  return status === 'reverted';
}

export function isRestoredStatus(status: SessionStatus): boolean {
  return status === 'restored';
}

// ===== RESOURCE TRANSFORMATION HELPERS =====

// Helper to transform frontend request to backend format
export function transformToCreateEditingSessionArgs(
  request: StartVibeCodingRequest,
  sessionId: string
): CreateEditingSessionArgs {
  const resources = request.context?.availableResources || [];
  
  const resourceIds = resources.map(r => r.id);
  const resourceTypes: Record<string, ResourceType> = {};
  const resourceData: Record<string, any> = {};
  
  resources.forEach(resource => {
    resourceTypes[resource.id] = resource.type as ResourceType;
    resourceData[resource.id] = resource.data || resource;
  });
  
  return {
    sessionId,
    resourceIds,
    resourceTypes,
    resourceData,
    originalRequest: request.originalRequest,
    modelId: request.modelId, // <- forward
  };
}

// Helper to transform backend EditingSession to frontend status
export function transformToVibeCodingSessionStatus(
  session: EditingSession
): VibeCodingSessionStatus {
  return {
    ...session,
    canCancel: isActiveStatus(session.status),
    // Other fields can be added based on session data
  };
}