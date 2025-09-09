export interface SimpleResource {
  id: string;
  type: 'character_card' | 'plot_card' | 'flow';
  name: string;
  iconUrl?: string;
  iconAssetId?: string;
}

export interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  resourceIds?: string[];
  isProcessing?: boolean;
  sessionId?: string;
  type?: 'text' | 'edit_approval' | 'analysis_ready';
  analysis?: {
    isSimpleAnswer: boolean;
    simpleAnswer?: string;
    stepByStepPlan?: any[];
  };
  editData?: ReviewData;
  status?: 'pending' | 'approved' | 'rejected' | 'reverted' | 'generating_operations';
  // NEW: Analysis-ready specific data
  analysisReadyData?: {
    analysis: any; // VibeAnalysisResult
    estimatedOperations: number;
    processingTime: number;
    operationStatus: 'generating' | 'complete';
  };
}

export interface ReviewData {
  sessionId: string;
  resourceId: string;
  original: any;
  edited: any;
  appliedChanges: any[];
}

export interface VibePanelProps {
  className?: string;
  onToggle?: () => void;
  isCollapsed?: boolean;
  // New props for local panel context
  resourceId?: string;
  resourceType?: 'card' | 'flow';
  isLocalPanel?: boolean;
}