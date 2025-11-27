import { useState, useCallback, useEffect, useRef } from 'react';
import { toastError, toastSuccess } from '@/shared/ui/toast';
import { SimpleMessage, ReviewData } from '../types';
import { UniqueEntityID } from '@/shared/domain';
import { VibeSessionService } from '@/app/services/vibe-session-service';
import { CreateVibeSessionProps, MESSAGE_TYPE } from '@/entities/vibe-session/domain/vibe-session';
import type { SessionStatus } from 'vibe-shared-types';
import { SESSION_STATUS } from 'vibe-shared-types';

const INITIAL_MESSAGES: SimpleMessage[] = [];

interface UseMessageHistoryProps {
  resourceId?: string;
  resourceType?: 'character_card' | 'plot_card' | 'flow';
}

export function useMessageHistory(props?: UseMessageHistoryProps) {
  const [displayMessages, setDisplayMessages] = useState<SimpleMessage[]>(INITIAL_MESSAGES);
  const [isRestored, setIsRestored] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved session on resource change
  useEffect(() => {
    const loadSession = async () => {
      // Clear messages first when switching resources
      setDisplayMessages(INITIAL_MESSAGES);
      setIsRestored(false);
      
      // If no resource is selected, just clear and return
      if (!props?.resourceId || !props?.resourceType) {
        console.log("🧹 [MESSAGE-HISTORY] No resource selected, cleared messages");
        return;
      }

      try {
        const result = await VibeSessionService.restoreSession(props.resourceId, props.resourceType);
        
        if (result.isSuccess && result.getValue()) {
          const session = result.getValue()!;
          // Convert persisted messages to SimpleMessages  
          const restoredMessages: SimpleMessage[] = session.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            resourceIds: msg.resourceIds,
            sessionId: msg.sessionId,
            type: msg.type,
            editData: msg.editData,
            status: msg.status,
            analysis: msg.analysis,
            isProcessing: msg.isProcessing,
          }));
          setDisplayMessages(restoredMessages);
          setIsRestored(true);
        }
      } catch (error) {
        console.error("❌ [MESSAGE-HISTORY] Failed to restore session:", error);
      }
    };

    loadSession();
  }, [props?.resourceId, props?.resourceType]);

  // Save session whenever messages change (with debouncing)
  useEffect(() => {
    // Don't save if no resource context, no messages, or only processing messages
    if (!props?.resourceId || !props?.resourceType || displayMessages.length === 0) return;
    
    // Don't save if we only have processing messages (temporary states)
    const substantiveMessages = displayMessages.filter(msg => !msg.isProcessing);
    if (substantiveMessages.length === 0) return;

    const saveSession = async () => {
      try {
        // Convert SimpleMessages to PersistedMessages
        const persistedMessages = displayMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          resourceIds: msg.resourceIds,
          sessionId: msg.sessionId,
          type: msg.type,
          editData: msg.editData,
          status: msg.status,
          analysis: msg.analysis,
          isProcessing: msg.isProcessing,
        }));

        const sessionData: CreateVibeSessionProps = {
          sessionId: new UniqueEntityID().toString(),
          resourceId: props.resourceId!,
          resourceType: props.resourceType!,
          messages: persistedMessages,
          appliedChanges: [], // TODO: Add applied changes tracking
          conversationHistory: displayMessages.filter(msg => 
            !msg.isProcessing && (msg.role === 'user' || msg.role === 'assistant')
          ).slice(-200).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          snapshots: [], // Initialize empty snapshots array
          status: SESSION_STATUS.ACTIVE,
        };

        const result = await VibeSessionService.saveSession(
          props.resourceId!,
          props.resourceType!,
          sessionData
        );

        if (result.isFailure) {
          console.error("❌ [MESSAGE-HISTORY] Failed to save session:", result.getError());
        }
      } catch (error) {
        console.error("❌ [MESSAGE-HISTORY] Failed to save session:", error);
      }
    };

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operations
    saveTimeoutRef.current = setTimeout(saveSession, 1000);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [displayMessages, props?.resourceId, props?.resourceType]);

  const addUserMessage = useCallback((content: string, resourceIds?: string[]) => {
    
    const newMessage: SimpleMessage = {
      id: new UniqueEntityID().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      resourceIds,
    };
    
    setDisplayMessages(prev => {
      // Check for duplicate content in recent messages to prevent StrictMode duplicates
      const recentMessage = prev[prev.length - 1];
      if (recentMessage && 
          recentMessage.role === 'user' && 
          recentMessage.content === content && 
          Date.now() - recentMessage.timestamp.getTime() < 100) {
        return prev;
      }
      
      return [...prev, newMessage];
    });
    return newMessage;
  }, []);

  const addAssistantMessage = useCallback((content: string, sessionId?: string) => {
    
    const newMessage: SimpleMessage = {
      id: new UniqueEntityID().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      sessionId,
    };
    
    
    setDisplayMessages(prev => {
      // Check for duplicate content in recent messages to prevent StrictMode duplicates
      const recentMessage = prev[prev.length - 1];
      if (recentMessage && 
          recentMessage.role === 'assistant' && 
          recentMessage.content === content && 
          Date.now() - recentMessage.timestamp.getTime() < 100) {
        return prev;
      }
      
      return [...prev, newMessage];
    });
    return newMessage;
  }, []);

  // const addProcessingMessage = useCallback((sessionId: string) => {
  //   const processingMessage: SimpleMessage = {
  //     id: `processing-${sessionId}`,
  //     role: 'assistant',
  //     content: 'Processing your request...',
  //     timestamp: new Date(),
  //     isProcessing: true,
  //     sessionId,
  //   };
    
  //   setDisplayMessages(prev => [...prev, processingMessage]);
  //   return processingMessage;
  // }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<SimpleMessage>) => {
    setDisplayMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setDisplayMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const clearHistory = useCallback(() => {
    setDisplayMessages(INITIAL_MESSAGES);
    setIsRestored(false);
  }, []);

  const clearSession = useCallback(async () => {
    // Cancel any pending save operations to prevent race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Clear UI immediately
    setDisplayMessages(INITIAL_MESSAGES);
    setIsRestored(false);

    // Delete session from database if resource context exists
    if (props?.resourceId && props?.resourceType) {
      try {
        const result = await VibeSessionService.clearSession(props.resourceId, props.resourceType);
        if (result.isSuccess) {
          toastSuccess("Chat history cleared and session deleted");
        } else {
          toastError("Failed to delete session from database");
        }
      } catch (error) {
        toastError("Failed to delete session from database");
      }
    } else {
      // Just show success for UI clearing when no resource context
      toastSuccess("Chat history cleared");
    }
  }, [props?.resourceId, props?.resourceType]);

  const addEditApprovalMessage = useCallback((content: string, editData: ReviewData, sessionId?: string, analysis?: any) => {
    const newMessage: SimpleMessage = {
      id: new UniqueEntityID().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: MESSAGE_TYPE.EDIT_APPROVAL,
      editData,
      sessionId,
      status: 'pending',
      analysis,
    };
    
    setDisplayMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // NEW: Add analysis-ready message
  const addAnalysisReadyMessage = useCallback((content: string, analysisReadyData: any, sessionId?: string) => {
    const newMessage: SimpleMessage = {
      id: new UniqueEntityID().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: MESSAGE_TYPE.ANALYSIS_READY,
      analysisReadyData,
      sessionId,
      status: 'generating_operations',
    };
    
    setDisplayMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const getConversationHistory = useCallback(() => {
    // Get user, assistant, analysis_ready, and edit_approval messages (not system or processing)
    // Limit to last 200 messages
    return displayMessages
      .filter(msg => !msg.isProcessing && (msg.role === 'user' || msg.role === 'assistant'))
      .slice(-200)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }, [displayMessages]);

  return {
    messages: displayMessages,
    addUserMessage,
    addAssistantMessage,
    // addProcessingMessage,
    addEditApprovalMessage,
    addAnalysisReadyMessage,
    updateMessage,
    removeMessage,
    clearHistory,
    clearSession,
    getConversationHistory,
    isRestored,
  };
}