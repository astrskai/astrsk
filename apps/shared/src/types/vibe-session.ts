import type {
  VibeAnalysisResult,
  VibeGeneratorResult,
  StructuredChange,
  SessionStatus,
} from "./vibe-shared-types";

/**
 * Message types for vibe session messages
 */
export type MessageType = 'text' | 'edit_approval' | 'system' | 'analysis_ready';

export const MESSAGE_TYPE = {
  TEXT: 'text',
  EDIT_APPROVAL: 'edit_approval', 
  SYSTEM: 'system',
  ANALYSIS_READY: 'analysis_ready'
} as const satisfies Record<string, MessageType>;

/**
 * Individual resource data within a snapshot
 */
export interface SnapshotResourceData {
  resourceId: string;
  resourceType: 'character_card' | 'plot_card' | 'flow' | 'agent' | 'if-node' | 'data-store-node';
  resourceData: any; // Complete resource data at time of snapshot
}

/**
 * Resource snapshot for rollback functionality
 * Supports both single resources and resource groups (e.g., flow + all its nodes)
 */
export interface ResourceSnapshot {
  id: string; // Unique snapshot ID
  primaryResourceId: string; // ID of the primary resource (card or flow)
  primaryResourceType: 'character_card' | 'plot_card' | 'flow';
  resources: SnapshotResourceData[]; // Array of all resources in this snapshot
  description: string; // Human-readable description (e.g., "Before AI edit", "User modification #2")
  timestamp: string; // ISO string when snapshot was created
  operationId?: string; // Optional: ID of the operation that triggered this snapshot
}

/**
 * Simple message structure for vibe session persistence
 */
export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string for persistence
  resourceIds?: string[];
  isProcessing?: boolean;
  sessionId?: string;
  type?: MessageType;
  analysis?: {
    isSimpleAnswer: boolean;
    simpleAnswer?: string;
    stepByStepPlan?: any[];
  };
  editData?: {
    sessionId: string;
    resourceId: string;
    original: any;
    edited: any;
    appliedChanges: any[];
  };
  status?: 'pending' | 'approved' | 'rejected' | 'reverted' | 'generating_operations';
  // NEW: Analysis-ready specific data
  analysisReadyData?: {
    analysis: any; // VibeAnalysisResult
    estimatedOperations: number;
    processingTime: number;
    operationStatus: 'generating' | 'complete';
  };
}

/**
 * Conversation history entry for backend context
 */
export interface ConversationHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI Results from vibe processing
 */
export interface PersistedAIResults {
  analysis?: VibeAnalysisResult;
  generatorResult?: VibeGeneratorResult;
}

// Using SessionStatus from vibe-shared-types instead of local enum
// 'restored' is a frontend-specific status for UI state management

/**
 * Properties for creating a new vibe session
 */
export interface VibeSessionProps {
  sessionId: string;
  resourceId: string;
  resourceType: 'character_card' | 'plot_card' | 'flow';
  messages: PersistedMessage[];
  appliedChanges: StructuredChange[];
  aiResults?: PersistedAIResults;
  conversationHistory: ConversationHistoryEntry[];
  snapshots: ResourceSnapshot[]; // Up to 5 snapshots for rollback
  status: SessionStatus;
  createdAt: Date;
  lastActiveAt: Date;
  version?: number; // For future migrations
}

/**
 * Properties for creating a new vibe session (omitting system-set fields)
 */
export type CreateVibeSessionProps = Omit<
  VibeSessionProps, 
  'createdAt' | 'lastActiveAt' | 'version'
> & {
  createdAt?: Date;
  lastActiveAt?: Date;
  version?: number;
};

/**
 * Properties for updating a vibe session
 */
export type UpdateVibeSessionProps = Partial<CreateVibeSessionProps>;