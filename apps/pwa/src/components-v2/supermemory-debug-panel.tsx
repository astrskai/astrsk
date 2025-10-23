/**
 * Supermemory Debug Panel
 *
 * Visualizes roleplay memory system data flow for debugging.
 * Shows: initialization, retrieval, World Agent execution, and distribution.
 */

import { X, ChevronDown, ChevronRight, Trash2, Minimize2, Maximize2, SquareDashedMousePointer } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSupermemoryDebugStore } from "@/app/stores/supermemory-debug-store";
import type { SupermemoryDebugEvent } from "@/app/stores/supermemory-debug-store";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { cn } from "@/components-v2/lib/utils";

const PANEL_SIZES = {
  small: 400,
  medium: 600,
  large: 800,
  xlarge: 1000,
};

export function SupermemoryDebugPanel() {
  const isPanelOpen = useSupermemoryDebugStore.use.isPanelOpen();
  const setIsPanelOpen = useSupermemoryDebugStore.use.setIsPanelOpen();
  const events = useSupermemoryDebugStore.use.events();
  const clearEvents = useSupermemoryDebugStore.use.clearEvents();

  const [panelWidth, setPanelWidth] = useState(PANEL_SIZES.medium);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      // Constrain width between 300px and 80% of screen width
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      setPanelWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while resizing
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  if (!isPanelOpen) return null;

  // Group events by turn number
  const eventsByTurn = events.reduce((acc, event) => {
    if (!acc[event.turnNumber]) {
      acc[event.turnNumber] = [];
    }
    acc[event.turnNumber].push(event);
    return acc;
  }, {} as Record<number, SupermemoryDebugEvent[]>);

  const turns = Object.keys(eventsByTurn).map(Number).sort((a, b) => b - a);

  return (
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 bg-background border-l border-border shadow-lg z-50 flex flex-col"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-secondary">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-text-body">
            Supermemory Debug Panel
          </div>
          <div className="text-xs text-text-secondary">
            {events.length} events
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelWidth(PANEL_SIZES.small)}
            className="h-8 w-8"
            title="Small width (400px)"
          >
            <Minimize2 className="min-h-4 min-w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelWidth(PANEL_SIZES.medium)}
            className="h-8 w-8"
            title="Medium width (600px)"
          >
            <SquareDashedMousePointer className="min-h-4 min-w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelWidth(PANEL_SIZES.large)}
            className="h-8 w-8"
            title="Large width (800px)"
          >
            <Maximize2 className="min-h-4 min-w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearEvents}
            className="h-8 w-8"
            title="Clear all events"
          >
            <Trash2 className="min-h-4 min-w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPanelOpen(false)}
            className="h-8 w-8"
          >
            <X className="min-h-4 min-w-4" />
          </Button>
        </div>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1 p-4">
        {events.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            No events recorded yet.
            <br />
            <span className="text-xs">
              Interact with a session to see memory operations.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {turns.map((turnNumber) => (
              <TurnSection
                key={turnNumber}
                turnNumber={turnNumber}
                events={eventsByTurn[turnNumber]}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TurnSection({
  turnNumber,
  events,
}: {
  turnNumber: number;
  events: SupermemoryDebugEvent[];
}) {
  const [isExpanded, setIsExpanded] = useState(turnNumber === 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Turn Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-tertiary transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="min-h-4 min-w-4 text-text-secondary" />
          ) : (
            <ChevronRight className="min-h-4 min-w-4 text-text-secondary" />
          )}
          <span className="text-sm font-semibold text-text-body">
            Turn {turnNumber}
          </span>
          <span className="text-xs text-text-secondary">
            {events.length} events
          </span>
        </div>
        <span className="text-xs text-text-info">
          {new Date(events[0].timestamp).toLocaleTimeString()}
        </span>
      </button>

      {/* Turn Events */}
      {isExpanded && (
        <div className="flex flex-col divide-y divide-border">
          {events
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: SupermemoryDebugEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const eventTypeLabel = {
    session_init: "Session Init",
    memory_recall: "Memory Recall",
    world_memory_retrieval: "World Memory Retrieval",
    world_agent_prompt: "World Agent Prompt",
    world_agent_output: "World Agent Output",
    character_memory_add: "Character Memory Add",
    world_memory_add: "World Memory Add",
    datastore_update: "DataStore Update",
    agent_prompt_with_memories: "Agent Prompt After Memory Injection",
    npc_extraction: "NPC Extraction",
    npc_speak: "NPC Speak",
  }[event.type];

  const eventTypeColor = {
    session_init: "#3B82F6", // blue-500
    memory_recall: "#A855F7", // purple-500
    world_memory_retrieval: "#EAB308", // yellow-500
    world_agent_prompt: "#F97316", // orange-500
    world_agent_output: "#EA580C", // orange-600
    character_memory_add: "#06B6D4", // cyan-500
    world_memory_add: "#6366F1", // indigo-500
    datastore_update: "#EC4899", // pink-500
    agent_prompt_with_memories: "#8B5CF6", // violet-500
    npc_extraction: "#10B981", // green-500
    npc_speak: "#14B8A6", // teal-500
  }[event.type];

  const eventTypeBgColor = {
    session_init: { bg: "rgba(59, 130, 246, 0.1)", border: "#3B82F6" },
    memory_recall: { bg: "rgba(168, 85, 247, 0.1)", border: "#A855F7" },
    world_memory_retrieval: { bg: "rgba(234, 179, 8, 0.1)", border: "#EAB308" },
    world_agent_prompt: { bg: "rgba(249, 115, 22, 0.1)", border: "#F97316" },
    world_agent_output: { bg: "rgba(234, 88, 12, 0.1)", border: "#EA580C" },
    character_memory_add: { bg: "rgba(6, 182, 212, 0.1)", border: "#06B6D4" },
    world_memory_add: { bg: "rgba(99, 102, 241, 0.1)", border: "#6366F1" },
    datastore_update: { bg: "rgba(236, 72, 153, 0.1)", border: "#EC4899" },
    agent_prompt_with_memories: { bg: "rgba(139, 92, 246, 0.1)", border: "#8B5CF6" },
    npc_extraction: { bg: "rgba(16, 185, 129, 0.1)", border: "#10B981" },
    npc_speak: { bg: "rgba(20, 184, 166, 0.1)", border: "#14B8A6" },
  }[event.type];

  return (
    <div
      className="p-3 border-l-4"
      style={{
        backgroundColor: eventTypeBgColor?.bg,
        borderLeftColor: eventTypeBgColor?.border,
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="min-h-4 min-w-4 text-text-secondary" />
          ) : (
            <ChevronRight className="min-h-4 min-w-4 text-text-secondary" />
          )}
          <span
            className="text-xs font-semibold"
            style={{ color: eventTypeColor }}
          >
            {eventTypeLabel}
          </span>
        </div>
        <span className="text-xs text-text-info">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-6 text-xs space-y-2">
          {event.type === "session_init" && (
            <SessionInitDetails data={event.data} />
          )}
          {event.type === "memory_recall" && (
            <MemoryRecallDetails data={event.data} />
          )}
          {event.type === "world_memory_retrieval" && (
            <WorldMemoryRetrievalDetails data={event.data} />
          )}
          {event.type === "world_agent_prompt" && (
            <WorldAgentPromptDetails data={event.data} />
          )}
          {event.type === "world_agent_output" && (
            <WorldAgentOutputDetails data={event.data} />
          )}
          {event.type === "character_memory_add" && (
            <CharacterMemoryAddDetails data={event.data} />
          )}
          {event.type === "world_memory_add" && (
            <WorldMemoryAddDetails data={event.data} />
          )}
          {event.type === "agent_prompt_with_memories" && (
            <AgentPromptWithMemoriesDetails data={event.data} />
          )}
        </div>
      )}
    </div>
  );
}

// Event detail components
function SessionInitDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Session ID:</span>{" "}
        <span className="text-text-body font-mono">{data.sessionId}</span>
      </div>
      <div>
        <span className="text-text-secondary">World Container:</span>{" "}
        <span className="text-text-body font-mono">{data.worldContainerTag}</span>
      </div>
      <div>
        <span className="text-text-secondary">Characters:</span>
        <div className="ml-4 mt-1 space-y-2">
          {data.characters.map((char: any, i: number) => (
            <div key={i} className="border-l-2 border-border pl-2">
              <div className="text-text-body font-semibold">{char.characterName}</div>
              <div className="text-text-info">Container: {char.containerTag}</div>
              <div className="text-text-info">
                Scenario messages: {char.scenarioMessages}, Card: {char.hasCharacterCard ? "Yes" : "No"}, Lorebook: {char.lorebookEntries} entries
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryRecallDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Character:</span>{" "}
        <span className="text-text-body">{data.characterName}</span>
      </div>
      <div>
        <span className="text-text-secondary">Container:</span>{" "}
        <span className="text-text-body font-mono">{data.containerTag}</span>
      </div>
      <div>
        <span className="text-text-secondary">Retrieved:</span>{" "}
        <span className="text-text-body">{data.retrievedCount} memories</span>
      </div>
      {data.memories && data.memories.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-text-link">View memories ({data.memories.length})</summary>
          <div className="mt-2 ml-4 space-y-1 max-h-48 overflow-y-auto">
            {data.memories.map((memory: string, i: number) => (
              <div key={i} className="text-text-info border-l-2 border-border pl-2">
                {memory}
              </div>
            ))}
          </div>
        </details>
      )}
      {data.worldContext && (
        <details className="mt-2">
          <summary className="cursor-pointer text-text-link">View world context</summary>
          <pre className="mt-2 ml-4 text-text-info whitespace-pre-wrap text-xs bg-surface-secondary p-2 rounded max-h-48 overflow-y-auto">
            {data.worldContext}
          </pre>
        </details>
      )}
    </div>
  );
}

function WorldMemoryRetrievalDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Container:</span>{" "}
        <span className="text-text-body font-mono">{data.containerTag}</span>
      </div>
      <div>
        <span className="text-text-secondary">Retrieved:</span>{" "}
        <span className="text-text-body">{data.retrievedCount} memories</span>
      </div>
      {data.query && (
        <details className="mt-2">
          <summary className="cursor-pointer text-text-link">View query</summary>
          <pre className="mt-2 ml-4 text-text-info whitespace-pre-wrap text-xs bg-surface-secondary p-2 rounded max-h-96 overflow-y-auto">
            {data.query}
          </pre>
        </details>
      )}
      {data.memories && data.memories.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-text-link">View memories ({data.memories.length})</summary>
          <div className="mt-2 ml-4 space-y-2 max-h-96 overflow-y-auto">
            {data.memories.map((memory: string, i: number) => (
              <div key={i} className="text-text-info border-l-2 border-border pl-2">
                {memory}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function WorldAgentPromptDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Speaker:</span>{" "}
        <span className="text-text-body">{data.speakerName}</span>
      </div>
      <div>
        <span className="text-text-secondary">Message:</span>
        <div className="ml-4 mt-1 text-text-info">{data.generatedMessage}</div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-text-link">View Full World Agent Prompt</summary>
        <pre className="mt-2 ml-4 text-text-info whitespace-pre-wrap text-xs bg-surface-secondary p-2 rounded max-h-96 overflow-y-auto">
          {data.prompt}
        </pre>
      </details>
    </div>
  );
}

function WorldAgentOutputDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Participants Detected:</span>{" "}
        <span className="text-text-body">{data.actualParticipants.join(", ")}</span>
      </div>
      <div>
        <span className="text-text-secondary">Time Delta:</span>{" "}
        <span className="text-text-body">{data.delta_time}</span>
      </div>
      {data.worldContextUpdates && data.worldContextUpdates.length > 0 && (
        <div>
          <span className="text-text-secondary">Context Updates:</span>
          <div className="ml-4 mt-1 space-y-2">
            {data.worldContextUpdates.map((update: any, i: number) => (
              <div key={i} className="border-l-2 border-border pl-2">
                <div className="text-text-body font-semibold">{update.characterName}</div>
                <div className="text-text-info">{update.contextUpdate}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.rawOutput?.fallback && (
        <div className="text-status-destructive-light">
          Fallback used: {data.rawOutput.reason}
          {data.rawOutput.error && (
            <div className="mt-1 text-xs font-mono">{data.rawOutput.error}</div>
          )}
        </div>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-text-secondary hover:text-text-body">
          Raw Output (click to expand)
        </summary>
        <pre className="mt-2 p-2 bg-surface-secondary rounded text-xs overflow-auto max-h-96 font-mono text-text-info">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function CharacterMemoryAddDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Character ID:</span>{" "}
        <span className="text-text-body font-mono">{data.characterId}</span>
      </div>
      <div>
        <span className="text-text-secondary">Container:</span>{" "}
        <span className="text-text-body font-mono">{data.containerTag}</span>
      </div>
      <div>
        <span className="text-text-secondary">Storage ID:</span>{" "}
        <span className="text-text-body font-mono text-xs">{data.storageId}</span>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-text-link">View enriched content</summary>
        <pre className="mt-2 ml-4 text-text-info whitespace-pre-wrap text-xs bg-surface-secondary p-2 rounded max-h-48 overflow-y-auto">
          {data.content}
        </pre>
      </details>
    </div>
  );
}

function WorldMemoryAddDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Container:</span>{" "}
        <span className="text-text-body font-mono">{data.containerTag}</span>
      </div>
      <div>
        <span className="text-text-secondary">Storage ID:</span>{" "}
        <span className="text-text-body font-mono text-xs">{data.storageId}</span>
      </div>
      <div>
        <span className="text-text-secondary">Content:</span>
        <div className="ml-4 mt-1 text-text-info">{data.content}</div>
      </div>
    </div>
  );
}

function AgentPromptWithMemoriesDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-text-secondary">Agent:</span>{" "}
        <span className="text-text-body">{data.agentName}</span>
      </div>
      {data.characterName && (
        <div>
          <span className="text-text-secondary">Character:</span>{" "}
          <span className="text-text-body">{data.characterName}</span>
        </div>
      )}
      {data.fullContext && (
        <div>
          <span className="text-text-secondary">Game Time:</span>{" "}
          <span className="text-text-body">{data.fullContext.game_time}</span>
        </div>
      )}
      {data.messages && data.messages.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-text-link">
            View full prompt ({data.messages.length} messages)
          </summary>
          <div className="mt-2 ml-4 space-y-3 max-h-96 overflow-y-auto bg-surface-secondary p-3 rounded">
            {data.messages.map((msg: any, i: number) => (
              <div key={i} className="border-l-2 border-border pl-3">
                <div className="text-text-link font-semibold text-xs uppercase mb-1">
                  {msg.role}
                </div>
                <pre className="text-text-info whitespace-pre-wrap text-xs">
                  {msg.content}
                </pre>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
