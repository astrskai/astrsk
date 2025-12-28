import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  sessionId?: string;
  type: "compress" | "retrieve";
  data: {
    agent?: string;
    prompt?: {
      message1_previousContext?: string;
      message1_compressedContext?: string;
      message2_systemInstructions?: string;
      message3_task?: string;
    };
    input?: any;
    output?: any;
    rawResponse?: {
      model: string;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      toolCall: any;
    };
    filtering?: {
      totalAnchors: number;
      accessibleAnchors: number;
      filteredOut: string[];
    };
  };
}

interface ContextEvent {
  sessionId: string;
  messageCount: number;
  type: "compressed" | "uncompressed";
  context: string;
  compressedContextXML?: string;
  characterName: string;
  userQuery?: string;
}

interface AgentContextEvent {
  sessionId: string;
  agentName: string;
  contextForRendering: any;
  fullContext: any;
  useCompressionContext: boolean;
  messages: Array<{ role: string; content: string }>;
  timestamp: Date;
}

interface SerializedLogEntry {
  id: string;
  timestamp: string;
  sessionId?: string;
  type: "compress" | "retrieve";
  data: LogEntry["data"];
}

const STORAGE_KEY_PREFIX = "compression-logs-";
const MAX_LOGS_PER_SESSION = 50;

// Helper functions for localStorage persistence
const saveLogsToStorage = (sessionId: string, logs: LogEntry[]) => {
  try {
    const serialized: SerializedLogEntry[] = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(serialized));
  } catch (error) {
    console.error("[CompressionDebugPanel] Failed to save logs to localStorage:", error);
  }
};

const loadLogsFromStorage = (sessionId: string): LogEntry[] => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
    if (!stored) return [];

    const serialized: SerializedLogEntry[] = JSON.parse(stored);
    return serialized.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("[CompressionDebugPanel] Failed to load logs from localStorage:", error);
    return [];
  }
};

export function CompressionDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [currentContext, setCurrentContext] = useState<ContextEvent | null>(null);
  const [agentContext, setAgentContext] = useState<AgentContextEvent | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load logs from localStorage when context changes (new session)
  useEffect(() => {
    if (currentContext?.sessionId && currentContext.sessionId !== currentSessionId) {
      setCurrentSessionId(currentContext.sessionId);
      const storedLogs = loadLogsFromStorage(currentContext.sessionId);
      setLogs(storedLogs);
    }
  }, [currentContext?.sessionId, currentSessionId]);

  // Subscribe to compression logs
  useEffect(() => {
    const handleCompressionLog = (event: CustomEvent<LogEntry>) => {
      const logEntry = event.detail;

      setLogs((prev) => {
        // Add sessionId from currentContext if available
        const entryWithSession = currentContext?.sessionId
          ? { ...logEntry, sessionId: currentContext.sessionId }
          : logEntry;

        const newLogs = [entryWithSession, ...prev].slice(0, MAX_LOGS_PER_SESSION);

        // Save to localStorage if we have a sessionId
        if (currentContext?.sessionId) {
          saveLogsToStorage(currentContext.sessionId, newLogs);
        }

        return newLogs;
      });
    };

    const handleContextBuilt = (event: CustomEvent<ContextEvent>) => {
      setCurrentContext(event.detail);
    };

    const handleAgentContextBuilt = (event: CustomEvent<AgentContextEvent>) => {
      setAgentContext(event.detail);
    };

    window.addEventListener("compression-log" as any, handleCompressionLog);
    window.addEventListener("compression-context-built" as any, handleContextBuilt);
    window.addEventListener("agent-context-built" as any, handleAgentContextBuilt);

    return () => {
      window.removeEventListener("compression-log" as any, handleCompressionLog);
      window.removeEventListener("compression-context-built" as any, handleContextBuilt);
      window.removeEventListener("agent-context-built" as any, handleAgentContextBuilt);
    };
  }, [currentContext]);

  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearLogs = () => {
    setLogs([]);
    setExpandedLogs(new Set());

    // Clear from localStorage
    if (currentSessionId) {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentSessionId}`);
      } catch (error) {
        console.error("[CompressionDebugPanel] Failed to clear logs from localStorage:", error);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        title="Open Compression Debug Panel"
      >
        Compression Logs ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Compression API Logs
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Agent Context (Full Context Sent to Agent) */}
      {agentContext ? (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Agent Context (Exact Input to LLM)
            </h3>
            <button
              onClick={() => setAgentContext(null)}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Agent: {agentContext.agentName}</span>
              <span className={`px-2 py-1 rounded font-medium ${
                agentContext.useCompressionContext
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              }`}>
                {agentContext.useCompressionContext ? "COMPRESSED" : "UNCOMPRESSED"}
              </span>
              <span>Messages: {agentContext.messages.length}</span>
            </div>
            <details className="text-xs" open>
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                Show Final Messages Array (Sent to LLM)
              </summary>
              <div className="bg-white dark:bg-gray-800 rounded p-2 mt-2 max-h-60 overflow-y-auto space-y-2">
                {agentContext.messages.map((msg, idx) => (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {msg.role.toUpperCase()} Message {idx + 1}
                    </div>
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                      {msg.content}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            No agent context yet. Send a message to see what goes into the agent.
          </div>
        </div>
      )}

      {/* Current Context */}
      {currentContext ? (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          {/* <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Current Context (Built by compression-context-builder)
            </h3>
            <button
              onClick={() => setCurrentContext(null)}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Clear
            </button>
          </div> */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className={`px-2 py-1 rounded font-medium ${
                currentContext.type === "compressed"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              }`}>
                {currentContext.type.toUpperCase()}
              </span>
              <span>Messages: {currentContext.messageCount}</span>
              <span>Character: {currentContext.characterName}</span>
            </div>
            {currentContext.userQuery && (
              <div className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">Query: </span>
                <span className="text-gray-700 dark:text-gray-300">{currentContext.userQuery}</span>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded p-2 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {currentContext.context}
              </pre>
            </div>
            {currentContext.compressedContextXML && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Show Compressed XML Context
                </summary>
                <div className="bg-white dark:bg-gray-800 rounded p-2 mt-2 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {currentContext.compressedContextXML}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            No context loaded yet. Send a message to see the compression context.
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No compression logs yet. Logs will appear here when compression APIs are called.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            return (
              <div
                key={log.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Log Header */}
                <button
                  onClick={() => toggleLog(log.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        log.type === "compress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {log.data.rawResponse?.usage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {log.data.rawResponse.usage.total_tokens} tokens
                    </span>
                  )}
                </button>

                {/* Log Details */}
                {isExpanded && (
                  <div className="p-3 space-y-3 bg-white dark:bg-gray-800">
                    {/* Prompt Messages */}
                    {log.data.prompt && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Prompt Messages
                        </h4>
                        <div className="space-y-2">
                          {log.data.prompt.message1_previousContext && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Message 1 (Previous Context)
                              </div>
                              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                                {log.data.prompt.message1_previousContext}
                              </pre>
                            </div>
                          )}
                          {log.data.prompt.message1_compressedContext && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Message 1 (Compressed Context)
                              </div>
                              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                                {log.data.prompt.message1_compressedContext}
                              </pre>
                            </div>
                          )}
                          {log.data.prompt.message2_systemInstructions && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Message 2 (System Instructions)
                              </div>
                              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                                {log.data.prompt.message2_systemInstructions}
                              </pre>
                            </div>
                          )}
                          {log.data.prompt.message3_task && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Message 3 (Task)
                              </div>
                              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                                {log.data.prompt.message3_task}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Input Parameters */}
                    {log.data.input && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Input Parameters
                        </h4>
                        <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2 overflow-x-auto text-gray-800 dark:text-gray-200 font-mono">
                          {JSON.stringify(log.data.input, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Output */}
                    {log.data.output && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Output
                        </h4>
                        <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2 overflow-x-auto text-gray-800 dark:text-gray-200 font-mono">
                          {JSON.stringify(log.data.output, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Filtering (Retrieve only) */}
                    {log.data.filtering && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Access Control Filtering
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 space-y-1">
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            Total Anchors: {log.data.filtering.totalAnchors}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            Accessible: {log.data.filtering.accessibleAnchors}
                          </div>
                          {log.data.filtering.filteredOut && log.data.filtering.filteredOut.length > 0 && (
                            <div className="text-xs text-gray-700 dark:text-gray-300">
                              Filtered Out: {log.data.filtering.filteredOut.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Raw Response (Model & Token Usage) */}
                    {log.data.rawResponse && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Raw Response
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 space-y-2">
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            Model: {log.data.rawResponse.model}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-xs">
                              <div className="text-gray-500 dark:text-gray-400">Prompt</div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {log.data.rawResponse.usage.prompt_tokens}
                              </div>
                            </div>
                            <div className="text-xs">
                              <div className="text-gray-500 dark:text-gray-400">Completion</div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {log.data.rawResponse.usage.completion_tokens}
                              </div>
                            </div>
                            <div className="text-xs">
                              <div className="text-gray-500 dark:text-gray-400">Total</div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {log.data.rawResponse.usage.total_tokens}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
