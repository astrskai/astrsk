import { Result } from "@/shared/core/result";
import { ValueObject } from "@/shared/domain";
import type {
  VibeAnalysisResult,
  VibeGeneratorResult,
  StructuredChange,
  SessionStatus,
} from "vibe-shared-types";
import { SESSION_STATUS } from "vibe-shared-types";

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

/**
 * Vibe Session Value Object - represents persistent session data
 */
export class VibeSession extends ValueObject<VibeSessionProps> {
  
  private constructor(props: VibeSessionProps) {
    super(props);
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get resourceId(): string {
    return this.props.resourceId;
  }

  get resourceType(): 'character_card' | 'plot_card' | 'flow' {
    return this.props.resourceType;
  }

  get messages(): PersistedMessage[] {
    return this.props.messages;
  }

  get appliedChanges(): StructuredChange[] {
    return this.props.appliedChanges;
  }

  get aiResults(): PersistedAIResults | undefined {
    return this.props.aiResults;
  }

  get conversationHistory(): ConversationHistoryEntry[] {
    return this.props.conversationHistory;
  }

  get snapshots(): ResourceSnapshot[] {
    return this.props.snapshots;
  }

  get status(): SessionStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastActiveAt(): Date {
    return this.props.lastActiveAt;
  }

  get version(): number {
    return this.props.version || 1;
  }

  /**
   * Check if session is active (can be restored and continued)
   */
  public isActive(): boolean {
    return this.props.status === SESSION_STATUS.ACTIVE || 
           this.props.status === SESSION_STATUS.RESTORED;
  }

  /**
   * Check if session is completed (read-only, shows results)
   */
  public isCompleted(): boolean {
    return this.props.status === SESSION_STATUS.COMPLETED;
  }

  /**
   * Check if session has error state
   */
  public hasError(): boolean {
    return this.props.status === SESSION_STATUS.ERROR;
  }

  /**
   * Get the number of user messages in the session
   */
  public getUserMessageCount(): number {
    return this.props.messages.filter(m => m.role === 'user').length;
  }

  /**
   * Get the number of pending approvals in the session
   */
  public getPendingApprovalCount(): number {
    return this.props.messages.filter(m => m.status === 'pending' && m.type === 'edit_approval').length;
  }

  /**
   * Check if session is stale (hasn't been active for a long time)
   */
  public isStale(thresholdHours: number = 24): boolean {
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    return Date.now() - this.props.lastActiveAt.getTime() > thresholdMs;
  }

  /**
   * Create a new vibe session
   */
  public static create(props: CreateVibeSessionProps): Result<VibeSession> {
    // Validation
    if (!props.sessionId || props.sessionId.trim() === '') {
      return Result.fail('Session ID is required');
    }

    if (!props.resourceId || props.resourceId.trim() === '') {
      return Result.fail('Resource ID is required');
    }

    if (!props.resourceType) {
      return Result.fail('Resource type is required');
    }

    // Ensure arrays are initialized
    const messages = props.messages || [];
    const appliedChanges = props.appliedChanges || [];
    const conversationHistory = props.conversationHistory || [];
    const snapshots = props.snapshots || [];

    // Set timestamps
    const now = new Date();
    const createdAt = props.createdAt || now;
    const lastActiveAt = props.lastActiveAt || now;

    const vibeSession = new VibeSession({
      ...props,
      messages,
      appliedChanges,
      conversationHistory,
      snapshots,
      createdAt,
      lastActiveAt,
      version: props.version || 1,
    });

    return Result.ok(vibeSession);
  }

  /**
   * Update session with new data
   */
  public update(props: UpdateVibeSessionProps): Result<VibeSession> {
    try {
      // Filter out undefined values
      const filteredProps = Object.entries(props).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const updatedProps = {
        ...this.props,
        ...filteredProps,
        lastActiveAt: new Date(),
      };

      const updatedSession = new VibeSession(updatedProps);
      return Result.ok(updatedSession);
    } catch (error) {
      return Result.fail(`Failed to update vibe session: ${error}`);
    }
  }

  /**
   * Mark session as restored
   */
  public markAsRestored(): Result<VibeSession> {
    return this.update({
      status: SESSION_STATUS.RESTORED,
    });
  }

  /**
   * Mark session as completed
   */
  public markAsCompleted(): Result<VibeSession> {
    return this.update({
      status: SESSION_STATUS.COMPLETED,
    });
  }

  /**
   * Mark session as error
   */
  public markAsError(): Result<VibeSession> {
    return this.update({
      status: SESSION_STATUS.ERROR,
    });
  }

  /**
   * Add a new message to the session
   */
  public addMessage(message: PersistedMessage): Result<VibeSession> {
    const updatedMessages = [...this.props.messages, message];
    return this.update({ messages: updatedMessages });
  }

  /**
   * Update conversation history
   */
  public updateConversationHistory(history: ConversationHistoryEntry[]): Result<VibeSession> {
    return this.update({ conversationHistory: history });
  }

  /**
   * Set AI results
   */
  public setAIResults(results: PersistedAIResults): Result<VibeSession> {
    return this.update({ aiResults: results });
  }

  /**
   * Set applied changes
   */
  public setAppliedChanges(changes: StructuredChange[]): Result<VibeSession> {
    return this.update({ appliedChanges: changes });
  }

  /**
   * Add a new snapshot (keeps only the 5 most recent)
   */
  public addSnapshot(snapshot: ResourceSnapshot): Result<VibeSession> {
    const updatedSnapshots = [...this.props.snapshots, snapshot];
    
    // Keep only the 5 most recent snapshots
    if (updatedSnapshots.length > 5) {
      // Sort by timestamp (newest first) and take first 5
      updatedSnapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      updatedSnapshots.splice(5); // Remove items beyond index 5
    }
    
    return this.update({ snapshots: updatedSnapshots });
  }

  /**
   * Get snapshot by ID
   */
  public getSnapshot(snapshotId: string): ResourceSnapshot | null {
    return this.props.snapshots.find(s => s.id === snapshotId) || null;
  }

  /**
   * Get the most recent snapshot
   */
  public getLatestSnapshot(): ResourceSnapshot | null {
    if (this.props.snapshots.length === 0) return null;
    
    // Find the most recent by timestamp
    return this.props.snapshots.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
    });
  }

  /**
   * Remove snapshot by ID
   */
  public removeSnapshot(snapshotId: string): Result<VibeSession> {
    const updatedSnapshots = this.props.snapshots.filter(s => s.id !== snapshotId);
    return this.update({ snapshots: updatedSnapshots });
  }

  /**
   * Clear all snapshots
   */
  public clearSnapshots(): Result<VibeSession> {
    return this.update({ snapshots: [] });
  }

  /**
   * Convert to JSON for persistence
   */
  public toJSON(): any {
    return {
      sessionId: this.props.sessionId,
      resourceId: this.props.resourceId,
      resourceType: this.props.resourceType,
      messages: this.props.messages,
      appliedChanges: this.props.appliedChanges,
      aiResults: this.props.aiResults,
      conversationHistory: this.props.conversationHistory,
      snapshots: this.props.snapshots,
      status: this.props.status,
      createdAt: this.props.createdAt.toISOString(),
      lastActiveAt: this.props.lastActiveAt.toISOString(),
      version: this.props.version,
    };
  }

  /**
   * Create from JSON (for restoration from persistence)
   */
  public static fromJSON(json: any): Result<VibeSession> {
    try {
      const props: VibeSessionProps = {
        sessionId: json.sessionId,
        resourceId: json.resourceId,
        resourceType: json.resourceType,
        messages: json.messages || [],
        appliedChanges: json.appliedChanges || [],
        aiResults: json.aiResults,
        conversationHistory: json.conversationHistory || [],
        snapshots: json.snapshots || [],
        status: json.status || SESSION_STATUS.ACTIVE,
        createdAt: new Date(json.createdAt),
        lastActiveAt: new Date(json.lastActiveAt),
        version: json.version || 1,
      };

      const vibeSession = new VibeSession(props);
      return Result.ok(vibeSession);
    } catch (error) {
      return Result.fail(`Failed to create VibeSession from JSON: ${error}`);
    }
  }

  /**
   * Create summary for display purposes
   */
  public getSummary(): {
    messageCount: number;
    userMessageCount: number;
    pendingApprovals: number;
    lastActivity: string;
    isStale: boolean;
  } {
    return {
      messageCount: this.props.messages.length,
      userMessageCount: this.getUserMessageCount(),
      pendingApprovals: this.getPendingApprovalCount(),
      lastActivity: this.props.lastActiveAt.toISOString(),
      isStale: this.isStale(),
    };
  }
}