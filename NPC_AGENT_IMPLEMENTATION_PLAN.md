# NPC Agent Implementation Plan

**Status:** ✅ Backend Implementation Complete (10/11 steps complete)
**Last Updated:** 2025-10-22
**Current Task:** Testing & Frontend Integration

### ✅ Completed
- NPC Zustand store with localStorage persistence
- NPC utilities (normalization, mapping, container creation)
- NPC extraction agent (structured output)
- NPC speak agent (chat completion)
- Container validation for NPCs
- Message pipeline integration (extraction + memory fetching)
- Memory distribution to NPC containers
- NPC button handler function
- Agent standardization with world-agent patterns
- Model upgrade to gemini-2.5-pro
- Build validation (TypeScript errors resolved)

### ⏳ Remaining
- Testing message pipeline flow
- Testing NPC button flow
- Frontend button UI integration

## Overview

Implement a fixed NPC Agent system that:
1. Auto-detects NPCs from chat history during message pipeline
2. Stores separate memory for each NPC using supermemory
3. Tracks NPC name aliases (e.g., "John Doe", "Mr. Doe" → same NPC ID "john")
4. Generates NPC responses via NPC button using their accumulated memories

## Architecture

### Storage Strategy
- **NPC Pool**: Zustand store with localStorage persistence (POC approach)
- **NPC Memory**: Supermemory containers with format `session-id::npc-id`
- **Session Scoped**: Each session has its own NPC pool

### Key Components
1. **NPC Zustand Store** - Persistent storage for NPC pools per session
2. **NPC Extraction Agent** - Detects NPCs and outputs new/updated entries
3. **NPC Speak Agent** - Generates NPC responses using their memories
4. **Message Pipeline Integration** - Extracts NPCs and distributes memories
5. **NPC Button Handler** - Frontend trigger for NPC response generation

---

## Data Structures

### NPC Data Model
```typescript
interface NpcData {
  id: string;           // Normalized lowercase single-word: "john"
  names: string[];      // All aliases: ["John Doe", "Mr. Doe", "John"]
}
```

### Zustand Store State
```typescript
interface NpcPoolState {
  // Storage: sessionId → NPC pool
  npcPools: Record<string, NpcData[]>;

  // Merge operations (handles BOTH adding new NPCs AND updating existing with new aliases)
  mergeNpc: (sessionId: string, id: string, name: string) => void;
  mergeNpcs: (sessionId: string, npcs: {id: string, name: string}[]) => void;

  // Read operations
  getNpcPool: (sessionId: string) => NpcData[];
  getNpcById: (sessionId: string, npcId: string) => NpcData | undefined;
  getNpcByName: (sessionId: string, name: string) => NpcData | undefined;

  // Maintenance
  clearSession: (sessionId: string) => void;
  clearAll: () => void;
}
```

### NPC Extraction Agent

**Input:**
```typescript
interface NpcExtractionInput {
  sessionId: string;
  message: {
    role: string;
    content: string;
    characterName?: string;
  };
  recentMessages?: Array<{  // Optional: for context
    role: string;
    content: string;
  }>;
  existingNpcPool: NpcData[];  // Current pool from Zustand
}
```

**Output (Zod Schema):**
```typescript
const npcExtractionSchema = z.object({
  npcs: z.array(
    z.object({
      name: z.string()
        .describe("Full name as mentioned in conversation (e.g., 'John Doe') from the context if that name is in the pool dont print this, but if it exists in other form print it but with same id."),
      id: z.string()
        .describe("Lowercase single-word ID into single word (e.g., 'john') if this person exists in the pool, use the exact id in there.")
    })
  ).describe("Only NEW NPCs or NEW ALIASES for existing NPCs")
});

// Output: { npcs: [{id: "john", name: "Mr. Doe"}, {id: "jane", name: "Jane Smith"}] }
```

**Behavior:**
- Receives existing NPC pool to avoid duplicates
- Only outputs NPCs not already in pool OR new aliases for existing NPCs
- Agent prompt emphasizes checking existing pool first

### NPC Speak Agent

**Input:**
```typescript
interface NpcSpeakInput {
  sessionId: string;
  npcPool: NpcData[];                      // All NPCs in session
  npcMemories: Record<string, string>;     // npcId → formatted memories
  recentMessages: Array<{
    role: string;
    content: string;
    characterName?: string;
  }>;
  worldContext?: string;
  gameTime?: number;
  gameTimeInterval?: string;
}
```

**Output:**
```typescript
// Simple string output from chat completion
type NpcSpeakOutput = string;  // The NPC's spoken message

// Example: "John Doe: Hey there, I've been looking for you!"
// Format: "{npc_name}: {message}"
```

**Behavior:**
- Agent receives ALL NPCs and their memories
- Agent chooses which NPC should speak based on context
- Output includes NPC name prefix: "John Doe: message"
- Prompt emphasizes: Move story forward, don't speak on behalf of main characters

---

## Implementation Flow

### Flow 1: Message Add Pipeline (Memory Distribution)

```
User/AI Message Added
    ↓
executeWorldAgentAndDistributeMemories() called
    ↓
┌──────────────────────────────────────────┐
│ STEP 1: Get Existing NPC Pool           │
│                                          │
│ const existingPool =                     │
│   useNpcStore.getState()                 │
│     .getNpcPool(sessionId)               │
│                                          │
│ Returns: NpcData[]                       │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 2: Execute NPC Extraction Agent    │
│                                          │
│ Input:                                   │
│   - message: current message just added  │
│   - recentMessages: last 2-3 (optional)  │
│   - existingNpcPool                      │
│                                          │
│ Agent analyzes current message and       │
│ compares with existing pool              │
│                                          │
│ Output:                                  │
│   {                                      │
│     npcs: [                              │
│       {id:"john", name:"Mr. Doe"},       │
│       {id:"jane", name:"Jane Smith"}     │
│     ]                                    │
│   }                                      │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 3: Merge NPCs to Pool               │
│ (mergeNpcs handles BOTH adding & updating)│
│                                          │
│ For each extracted NPC:                  │
│                                          │
│   IF id exists in pool:                  │
│     - Append name to names[] if new      │
│     - Skip if name already exists        │
│     (This UPDATES existing NPC)          │
│                                          │
│   ELSE (new NPC):                        │
│     - Create new entry                   │
│     - Initialize with [name]             │
│     (This ADDS new NPC)                  │
│                                          │
│ Update Zustand store:                    │
│   useNpcStore.getState()                 │
│     .mergeNpcs(sessionId, npcs)          │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 4: Build Character Mapping          │
│                                          │
│ Combine:                                 │
│   - Character cards (ID → Name)          │
│   - NPC pool (ID → Primary Name)         │
│                                          │
│ Result: Record<string, string>           │
│   {                                      │
│     "char-123": "Yui",                   │
│     "john": "John Doe",                  │
│     "jane": "Jane Smith"                 │
│   }                                      │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 5: Fetch NPC Memories for Context  │
│                                          │
│ For each NPC in pool:                    │
│   - Query supermemory container          │
│     (session-id::npc-id)                 │
│   - Use current message as query         │
│   - Fetch top 10 relevant memories       │
│                                          │
│ Format: "[NPC: John Doe]\n{memories}"    │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 6: Combine Memory Context           │
│                                          │
│ Combine:                                 │
│   - Character/world memories (existing)  │
│   - NPC memories (newly fetched)         │
│                                          │
│ Result: Combined context string for      │
│ world agent to understand full situation │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 7: Execute World Agent              │
│                                          │
│ Input:                                   │
│   - characterIdToName (chars + NPCs)     │
│   - recentMessages                       │
│   - combinedMemoryContext (chars + NPCs) │
│   - other context                        │
│                                          │
│ Output:                                  │
│   {                                      │
│     actualParticipants: [               │
│       "Yui",         ← Character         │
│       "John Doe",    ← NPC               │
│       "Jane Smith"   ← NPC               │
│     ],                                   │
│     worldContextUpdates: [...],          │
│     delta_time: 0                        │
│   }                                      │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 8: Map Participant Names to IDs    │
│                                          │
│ For each name in actualParticipants:     │
│                                          │
│   Search in characterIdToName:           │
│     "Yui" → "char-123"                   │
│     "John Doe" → "john"                  │
│                                          │
│   Also check NPC pool for aliases:       │
│     "Mr. Doe" → "john" (via names[])     │
│                                          │
│ Result: string[]                         │
│   ["char-123", "john", "jane"]           │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 9: Distribute Memories              │
│                                          │
│ Store to supermemory:                    │
│                                          │
│ 1. World container:                      │
│    session-id::world                     │
│    - Raw message                         │
│                                          │
│ 2. Character containers:                 │
│    session-id::char-123                  │
│    - Enriched message                    │
│                                          │
│ 3. NPC containers:                       │
│    session-id::john                      │
│    session-id::jane                      │
│    - Enriched messages                   │
│                                          │
│ Each stores context + game time          │
└──────────────────────────────────────────┘
```

### Flow 2: NPC Button Handler (Response Generation)

```
User Clicks NPC Button
    ↓
Backend: handleNpcSpeak(sessionId)
    ↓
┌──────────────────────────────────────────┐
│ STEP 1: Get NPC Pool                     │
│                                          │
│ const npcPool =                          │
│   useNpcStore.getState()                 │
│     .getNpcPool(sessionId)               │
│                                          │
│ Returns: NpcData[]                       │
│   [{id:"john", names:[...]},             │
│    {id:"jane", names:[...]}]             │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 2: Fetch All NPC Memories           │
│                                          │
│ For each NPC in pool:                    │
│                                          │
│   const memories =                       │
│     await retrieveCharacterMemories({    │
│       sessionId,                         │
│       characterId: npc.id,               │
│       queryText: recentContext,          │
│       topN: 20                           │
│     })                                   │
│                                          │
│ Containers queried:                      │
│   - session-id::john                     │
│   - session-id::jane                     │
│   - etc.                                 │
│                                          │
│ Result: Record<string, string>           │
│   {                                      │
│     "john": "formatted memories...",     │
│     "jane": "formatted memories..."      │
│   }                                      │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 3: Prepare Context                  │
│                                          │
│ - Stack all NPC memories                 │
│ - Get recent messages (last 5-10)        │
│ - Get world context from dataStore       │
│ - Get game time info                     │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 4: Execute NPC Speak Agent          │
│                                          │
│ Input:                                   │
│   - npcPool: [{id, names}]               │
│   - npcMemories: {id → memories}         │
│   - recentMessages                       │
│   - worldContext                         │
│   - gameTime, gameTimeInterval           │
│                                          │
│ Agent decides:                           │
│   - Which NPC should speak               │
│   - What they should say to advance story│
│   - Which name to use                    │
│                                          │
│ Prompt emphasizes:                       │
│   - Move story forward                   │
│   - Do NOT speak for main characters     │
│                                          │
│ Output (string):                         │
│   "John Doe: I've been looking for you!" │
│   Format: "{npc_name}: {message}"        │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ STEP 5: Parse Output & Create Message    │
│                                          │
│ Parse output string:                     │
│   "John Doe: I've been looking for you!" │
│   → npcName = "John Doe"                 │
│   → message = "I've been looking for you!"│
│                                          │
│ Create Turn with:                        │
│   - characterCardId: null (scenario)     │
│   - characterName: npcName               │
│   - content: message                     │
│   - metadata: mark as NPC-generated      │
│                                          │
│ Return to frontend for display           │
└──────────────────────────────────────────┘
    ↓
Message Added to Session
(Triggers Flow 1 again - NPC memory updated)
```

---

## Files to Create

### 1. NPC Zustand Store
**Path:** `apps/pwa/src/app/stores/npc-store.tsx`

```typescript
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "@/shared/utils/zustand-utils";
import { LocalPersistStorage } from "@/app/stores/local-persist-storage";

export interface NpcData {
  id: string;           // "john"
  names: string[];      // ["John Doe", "Mr. Doe"]
}

interface NpcPoolState {
  // sessionId → NpcData[]
  npcPools: Record<string, NpcData[]>;

  // Merge single NPC (handles BOTH adding new NPCs AND updating existing with new aliases)
  mergeNpc: (sessionId: string, id: string, name: string) => void;

  // Merge multiple NPCs (from extraction agent)
  mergeNpcs: (sessionId: string, npcs: { id: string; name: string }[]) => void;

  // Get pool for session
  getNpcPool: (sessionId: string) => NpcData[];

  // Get specific NPC by ID
  getNpcById: (sessionId: string, npcId: string) => NpcData | undefined;

  // Get specific NPC by any name alias
  getNpcByName: (sessionId: string, name: string) => NpcData | undefined;

  // Clear session pool
  clearSession: (sessionId: string) => void;

  // Clear all pools
  clearAll: () => void;
}

const useNpcStoreBase = create<NpcPoolState>()(
  persist(
    immer((set, get) => ({
      npcPools: {},

      mergeNpc: (sessionId, id, name) =>
        set((state) => {
          if (!state.npcPools[sessionId]) {
            state.npcPools[sessionId] = [];
          }

          const pool = state.npcPools[sessionId];
          const existing = pool.find((npc) => npc.id === id);

          if (existing) {
            // Add name if not already present
            if (!existing.names.includes(name)) {
              existing.names.push(name);
            }
          } else {
            // Create new NPC entry
            pool.push({ id, names: [name] });
          }
        }),

      mergeNpcs: (sessionId, npcs) =>
        set((state) => {
          npcs.forEach(({ id, name }) => {
            if (!state.npcPools[sessionId]) {
              state.npcPools[sessionId] = [];
            }

            const pool = state.npcPools[sessionId];
            const existing = pool.find((npc) => npc.id === id);

            if (existing) {
              if (!existing.names.includes(name)) {
                existing.names.push(name);
              }
            } else {
              pool.push({ id, names: [name] });
            }
          });
        }),

      getNpcPool: (sessionId) => {
        return get().npcPools[sessionId] || [];
      },

      getNpcById: (sessionId, npcId) => {
        const pool = get().npcPools[sessionId] || [];
        return pool.find((npc) => npc.id === npcId);
      },

      getNpcByName: (sessionId, name) => {
        const pool = get().npcPools[sessionId] || [];
        return pool.find((npc) =>
          npc.names.some((alias) => alias.toLowerCase() === name.toLowerCase()),
        );
      },

      clearSession: (sessionId) =>
        set((state) => {
          delete state.npcPools[sessionId];
        }),

      clearAll: () =>
        set((state) => {
          state.npcPools = {};
        }),
    })),
    {
      name: "npc-store",
      storage: new LocalPersistStorage<NpcPoolState>(),
    },
  ),
);

export const useNpcStore = createSelectors(useNpcStoreBase);
```

### 2. NPC Extraction Agent
**Path:** `apps/pwa/src/modules/supermemory/roleplay-memory/core/npc-extraction-agent.ts`

```typescript
import { z } from "zod";
import { NpcData } from "@/app/stores/npc-store";

// Structured output schema
const npcExtractionSchema = z.object({
  npcs: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "Lowercase single-word ID derived from first name (e.g., 'john' from 'John Doe')",
          ),
        name: z
          .string()
          .describe(
            "Full name as mentioned in the conversation (e.g., 'John Doe', 'Mr. Doe')",
          ),
      }),
    )
    .describe(
      "List of NPCs detected. Only include NEW NPCs not in existingNpcPool OR new name aliases for existing NPCs.",
    ),
});

export type NpcExtractionOutput = z.infer<typeof npcExtractionSchema>;

export interface NpcExtractionInput {
  sessionId: string;
  message: {
    role: string;
    content: string;
    characterName?: string;
  };
  recentMessages?: Array<{  // Optional: for context
    role: string;
    content: string;
  }>;
  existingNpcPool: NpcData[];
}

export async function executeNpcExtractionAgent(
  input: NpcExtractionInput,
): Promise<NpcExtractionOutput> {
  const { message, recentMessages, existingNpcPool } = input;

  // Build prompt
  const existingNpcsText = existingNpcPool.length
    ? existingNpcPool
        .map((npc) => `- ID: ${npc.id}, Names: [${npc.names.join(", ")}]`)
        .join("\n")
    : "None";

  // Build message text (current message + optional context)
  const messageText = message.characterName
    ? `${message.characterName}: ${message.content}`
    : `${message.role}: ${message.content}`;

  const contextText = recentMessages
    ? "\n\nRECENT CONTEXT:\n" + recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n")
    : "";

  const prompt = `You are an NPC extraction agent. Your job is to identify Non-Player Characters (NPCs) mentioned in conversation messages.

EXISTING NPCs in this session:
${existingNpcsText}

CURRENT MESSAGE:
${messageText}
${contextText}

INSTRUCTIONS:
1. Identify any NPCs mentioned in the messages (characters that are talked about or appear)
2. For each NPC:
   - Generate a lowercase single-word ID from their first name (e.g., "John Doe" → "john")
   - Record their full name as it appears in the conversation
3. Check against EXISTING NPCs:
   - If the ID already exists but a NEW name/alias is used, include it (e.g., "Mr. Doe" for existing "john")
   - If the ID and name both already exist, DO NOT include it
   - If it's a completely new NPC, include it
4. DO NOT include:
   - Player characters or main characters
   - Generic references like "someone", "people", "a person"
   - Characters that are clearly not NPCs

Output ONLY new NPCs or new aliases for existing NPCs.`;

  // Call LLM with structured output
  const result = await callLlmWithStructuredOutput({
    prompt,
    schema: npcExtractionSchema,
    modelId: "google/gemini-2.0-flash-exp",
    timeout: 15000,
  });

  return result;
}

// Placeholder for LLM call - will use existing infrastructure
async function callLlmWithStructuredOutput(config: {
  prompt: string;
  schema: z.ZodSchema;
  modelId: string;
  timeout: number;
}): Promise<any> {
  // TODO: Implement using existing agent execution infrastructure
  // Similar to how world-agent.ts calls the LLM
  throw new Error("Not implemented - use existing LLM infrastructure");
}
```

### 3. NPC Speak Agent
**Path:** `apps/pwa/src/modules/supermemory/roleplay-memory/core/npc-speak-agent.ts`

```typescript
import { z } from "zod";
import { NpcData } from "@/app/stores/npc-store";

// Structured output schema
const npcSpeakSchema = z.object({
  npcId: z.string().describe("The ID of the NPC who should speak"),
  npcName: z
    .string()
    .describe(
      "The name to use for this NPC (select from their known aliases)",
    ),
  message: z
    .string()
    .describe("The message the NPC speaks, in character and contextual"),
});

export type NpcSpeakOutput = z.infer<typeof npcSpeakSchema>;

export interface NpcSpeakInput {
  sessionId: string;
  npcPool: NpcData[];
  npcMemories: Record<string, string>; // npcId → formatted memory string
  recentMessages: Array<{
    role: string;
    content: string;
    characterName?: string;
  }>;
  worldContext?: string;
  gameTime?: number;
  gameTimeInterval?: string;
}

export async function executeNpcSpeakAgent(
  input: NpcSpeakInput,
): Promise<NpcSpeakOutput> {
  const {
    npcPool,
    npcMemories,
    recentMessages,
    worldContext,
    gameTime,
    gameTimeInterval,
  } = input;

  // Build NPC list with memories
  const npcListText = npcPool
    .map((npc) => {
      const memories = npcMemories[npc.id] || "No memories yet";
      return `
NPC ID: ${npc.id}
Known names: ${npc.names.join(", ")}
Memories:
${memories}
---`;
    })
    .join("\n");

  const messagesText = recentMessages
    .map((msg) =>
      msg.characterName
        ? `${msg.characterName}: ${msg.content}`
        : `${msg.role}: ${msg.content}`,
    )
    .join("\n");

  const timeText =
    gameTime !== undefined
      ? `GameTime: ${gameTime} ${gameTimeInterval || ""}`
      : "";

  const prompt = `You are an NPC response generator. Your job is to select one NPC from the available pool and generate a contextual message from their perspective.

AVAILABLE NPCs:
${npcListText}

RECENT CONVERSATION:
${messagesText}

WORLD CONTEXT:
${worldContext || "None"}

${timeText}

INSTRUCTIONS:
1. Review the recent conversation and NPC memories
2. Select the most appropriate NPC to speak next based on:
   - Relevance to the current conversation
   - What makes narrative sense
   - Their accumulated memories and past interactions
3. Generate a message that:
   - Fits their character based on memories
   - Is contextually appropriate to the conversation
   - Advances the narrative or responds naturally
   - Uses one of their known names
4. Output the NPC's ID, chosen name, and their message

The NPC should speak naturally as if they're part of the ongoing conversation.`;

  // Call LLM with structured output
  const result = await callLlmWithStructuredOutput({
    prompt,
    schema: npcSpeakSchema,
    modelId: "google/gemini-2.0-flash-exp",
    timeout: 20000,
  });

  return result;
}

// Placeholder for LLM call
async function callLlmWithStructuredOutput(config: {
  prompt: string;
  schema: z.ZodSchema;
  modelId: string;
  timeout: number;
}): Promise<any> {
  // TODO: Implement using existing agent execution infrastructure
  throw new Error("Not implemented - use existing LLM infrastructure");
}
```

### 4. NPC Utilities
**Path:** `apps/pwa/src/modules/supermemory/roleplay-memory/utils/npc-utils.ts`

```typescript
import { NpcData } from "@/app/stores/npc-store";

/**
 * Normalize a name to an NPC ID
 * "John Doe" → "john"
 * "Mr. Smith" → "mr"
 * "Jane" → "jane"
 */
export function normalizeNameToId(name: string): string {
  // Take first word, lowercase, remove special chars
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Find NPC by any of their name aliases
 */
export function findNpcByName(
  pool: NpcData[],
  name: string,
): NpcData | undefined {
  return pool.find((npc) =>
    npc.names.some(
      (alias) => alias.toLowerCase() === name.toLowerCase(),
    ),
  );
}

/**
 * Map participant names to IDs (characters + NPCs)
 * Used in world agent flow
 */
export function mapParticipantNamesToIds(
  participantNames: string[],
  characterIdToName: Record<string, string>, // charId → name
  npcPool: NpcData[],
): string[] {
  const ids: string[] = [];

  for (const name of participantNames) {
    // Check characters first (reverse lookup)
    const charId = Object.entries(characterIdToName).find(
      ([_, charName]) => charName === name,
    )?.[0];

    if (charId) {
      ids.push(charId);
      continue;
    }

    // Check NPCs (by name alias)
    const npc = findNpcByName(npcPool, name);
    if (npc) {
      ids.push(npc.id);
      continue;
    }

    // Unknown participant - skip or log warning
    console.warn(`Unknown participant: ${name}`);
  }

  return ids;
}

/**
 * Create NPC container tag
 * Format: session-id::npc-id
 */
export function createNpcContainer(
  sessionId: string,
  npcId: string,
): string {
  return `${sessionId}::${npcId}`;
}

/**
 * Build combined character + NPC mapping for world agent
 */
export function buildCharacterMapping(
  characterIdToName: Record<string, string>,
  npcPool: NpcData[],
): Record<string, string> {
  const mapping = { ...characterIdToName };

  // Add NPCs (use first name as primary)
  for (const npc of npcPool) {
    mapping[npc.id] = npc.names[0];
  }

  return mapping;
}
```

---

## Files to Modify

### 1. Containers Utility
**Path:** `apps/pwa/src/modules/supermemory/roleplay-memory/core/containers.ts`

**Changes:**
```typescript
// Add NPC container creation
export function createNpcContainer(sessionId: string, npcId: string): string {
  return `${sessionId}::${npcId}`;
}

// Add NPC container validation
export function validateNpcContainer(tag: string): boolean {
  const parts = tag.split("::");
  if (parts.length !== 2) return false;

  const [sessionId, containerId] = parts;

  // NPC containers: not "world" and not a UUID (character)
  if (containerId === "world") return false;

  // Simple check: NPCs are lowercase single words
  if (/^[a-z]+$/.test(containerId)) return true;

  return false;
}

// Update validation to handle NPCs
export function validateCharacterContainer(tag: string): boolean {
  const parts = tag.split("::");
  if (parts.length !== 2) return false;

  const [_, containerId] = parts;

  // Character containers: UUID format, not "world", not lowercase single word
  if (containerId === "world") return false;
  if (/^[a-z]+$/.test(containerId)) return false; // Exclude NPCs

  return true;
}
```

### 2. World Agent Integration
**Path:** `apps/pwa/src/app/services/session-play-service.ts`

**Function:** `executeWorldAgentAndDistributeMemories()` (lines 2873-3089)

**Add Imports:**
```typescript
import { executeNpcExtractionAgent } from "@/modules/supermemory/roleplay-memory/core/npc-extraction-agent";
import {
  buildCharacterMapping,
  mapParticipantNamesToIds,
  createNpcContainer
} from "@/modules/supermemory/roleplay-memory/utils/npc-utils";
import { retrieveCharacterMemories } from "@/modules/supermemory/roleplay-memory/core/memory-retrieval";
import { useNpcStore } from "@/app/stores/npc-store";
```

**Changes:**

```typescript
// BEFORE existing code - Add NPC extraction

// 1. Get existing NPC pool
const existingNpcPool = useNpcStore.getState().getNpcPool(sessionId.toString());

// 2. Execute NPC extraction agent
const npcExtractionResult = await executeNpcExtractionAgent({
  sessionId: sessionId.toString(),
  message: {
    role: speakerName,
    content: generatedMessage,
    characterName: speakerName,
  },
  recentMessages: recentMessages.slice(-3), // Optional: last 3 for context
  existingNpcPool,
});

// 3. Merge extracted NPCs to pool
if (npcExtractionResult.npcs.length > 0) {
  useNpcStore.getState().mergeNpcs(
    sessionId.toString(),
    npcExtractionResult.npcs,
  );
}

// 4. Build character mapping including NPCs
const updatedNpcPool = useNpcStore.getState().getNpcPool(sessionId.toString());
const characterIdToName = buildCharacterMapping(
  existingCharacterIdToName, // from current code
  updatedNpcPool,
);

// 5. Fetch NPC memories for world agent context
const npcMemoryContext: string[] = [];
for (const npc of updatedNpcPool) {
  try {
    const npcContainerTag = createNpcContainer(sessionId.toString(), npc.id);
    const memories = await retrieveCharacterMemories({
      containerTag: npcContainerTag,
      current_game_time: gameTime,
      current_game_time_interval: gameTimeInterval,
      recentMessages: recentMessages.map((msg: { role: string; content: string; game_time: number }) =>
        `${msg.role}: ${msg.content}`
      ),
      characterName: npc.names[0], // Use primary name
      limit: 10, // Top 10 relevant memories per NPC
    });
    if (memories) {
      npcMemoryContext.push(`[NPC: ${npc.names[0]}]\n${memories}`);
    }
  } catch (error) {
    console.warn(`Failed to fetch memories for NPC ${npc.id}:`, error);
  }
}

// 6. Combine character and NPC memory context
const combinedMemoryContext = [
  worldMemoryContext, // Existing character/world memories
  ...npcMemoryContext
].filter(Boolean).join("\n\n---\n\n");

// EXISTING world agent execution continues with:
// - updated characterIdToName (includes NPCs)
// - combinedMemoryContext (includes NPC memories)

// AFTER world agent execution - update memory distribution

// Map participant names to IDs (including NPCs)
const participantIds = mapParticipantNamesToIds(
  worldAgentOutput.actualParticipants,
  characterIdToName,
  updatedNpcPool,
);

// Distribute to both character AND NPC containers
for (const participantId of participantIds) {
  const containerTag = participantId.includes("-")
    ? createCharacterContainer(sessionId.toString(), participantId)
    : createNpcContainer(sessionId.toString(), participantId);

  await storeCharacterMessage({
    containerTag,
    message: enrichedMessage,
    metadata: {
      speaker: speakerCharacterId.toString(),
      participants: participantIds,
      game_time: gameTime,
      game_time_interval: gameTimeInterval,
      type: "message",
      isSpeaker: participantId === speakerCharacterId.toString(),
    },
  });
}
```

### 3. Add NPC Button Handler
**Path:** `apps/pwa/src/app/services/session-play-service.ts`

**New Function:**

```typescript
/**
 * Handle NPC button click - generate NPC response
 */
export async function handleNpcSpeak(
  sessionId: UniqueEntityID,
): Promise<Result<{ npcName: string; message: string }>> {
  try {
    // 1. Get NPC pool
    const npcPool = useNpcStore.getState().getNpcPool(sessionId.toString());

    if (npcPool.length === 0) {
      return Result.fail("No NPCs found in this session");
    }

    // 2. Fetch memories for all NPCs
    const npcMemories: Record<string, string> = {};

    for (const npc of npcPool) {
      const memories = await retrieveCharacterMemories({
        sessionId: sessionId.toString(),
        characterId: npc.id,
        queryText: "", // Can use recent context
        topN: 20,
      });

      npcMemories[npc.id] = memories;
    }

    // 3. Get recent messages and context
    const session = await loadSession(sessionId);
    const recentTurns = await loadRecentTurns(sessionId, 10);
    const dataStore = getLatestDataStore(recentTurns);

    const worldContext = dataStore.find(f => f.name === "world_context")?.value;
    const gameTime = Number(dataStore.find(f => f.name === "game_time")?.value);
    const gameTimeInterval = dataStore.find(f => f.name === "game_time_interval")?.value;

    // 4. Execute NPC speak agent
    const npcSpeakResult = await executeNpcSpeakAgent({
      sessionId: sessionId.toString(),
      npcPool,
      npcMemories,
      recentMessages: recentTurns.map(turn => ({
        role: turn.characterName || "system",
        content: turn.selectedOption.content,
        characterName: turn.characterName,
      })),
      worldContext,
      gameTime,
      gameTimeInterval,
    });

    // 5. Parse output string
    // Format: "John Doe: Hey there!"
    const colonIndex = npcSpeakResult.indexOf(":");
    if (colonIndex === -1) {
      return Result.fail("Invalid NPC speak output format");
    }

    const npcName = npcSpeakResult.substring(0, colonIndex).trim();
    const message = npcSpeakResult.substring(colonIndex + 1).trim();

    // 6. Create scenario message (Turn)
    const turn = Turn.create({
      sessionId,
      characterCardId: undefined, // Scenario message
      characterName: npcName,
      options: [
        Option.create({
          content: message,
          dataStore: [], // Will be populated by subsequent pipeline
        }),
      ],
      selectedOptionIndex: 0,
    });

    // 7. Save turn
    await addMessageUseCase.execute({
      sessionId,
      message: turn,
    });

    return Result.ok({
      npcName,
      message,
    });
  } catch (error) {
    return Result.fail(`Failed to generate NPC response: ${error.message}`);
  }
}
```

---

## Integration Checklist

### Backend Integration Points

- [x] Import NPC store in `session-play-service.ts`
- [x] Import NPC extraction agent
- [x] Import NPC speak agent
- [x] Import NPC utilities
- [x] Update `executeWorldAgentAndDistributeMemories()` function
- [x] Add `handleNpcSpeak()` function
- [x] Update container creation logic in `containers.ts`
- [x] Update memory distribution logic in `session-hooks.ts`
- [x] Add `createNpcContainer` to imports in `session-hooks.ts`
- [x] Standardize agents with world-agent patterns
- [x] Upgrade to gemini-2.5-pro model
- [x] Integrate Convex backend routing
- [x] Resolve all TypeScript build errors

### Frontend Integration Points (Future)

- [ ] Create NPC button component
- [ ] Wire button to backend handler
- [ ] Display NPC-generated messages
- [ ] Add NPC pool viewer (debug UI)
- [ ] Handle loading states

### LLM Infrastructure Integration

- [ ] Connect `executeNpcExtractionAgent()` to existing LLM caller
- [ ] Connect `executeNpcSpeakAgent()` to existing LLM caller
- [ ] Use same authentication flow as world agent
- [ ] Use same error handling patterns

---

## Testing Plan

### Unit Tests

1. **NPC Store Tests**
   - [ ] Test `mergeNpc()` with new NPC
   - [ ] Test `mergeNpc()` with existing NPC (new alias)
   - [ ] Test `mergeNpc()` with duplicate name
   - [ ] Test `getNpcPool()` for non-existent session
   - [ ] Test `clearSession()` and `clearAll()`

2. **NPC Utils Tests**
   - [ ] Test `normalizeNameToId()` with various inputs
   - [ ] Test `findNpcByName()` with aliases
   - [ ] Test `mapParticipantNamesToIds()` with mixed chars/NPCs
   - [ ] Test `buildCharacterMapping()` merging

3. **Container Tests**
   - [ ] Test `createNpcContainer()` format
   - [ ] Test `validateNpcContainer()` with valid/invalid tags

### Integration Tests

1. **Message Pipeline**
   - [ ] Add message → NPCs extracted → pool updated
   - [ ] Add message with new NPC → memory stored correctly
   - [ ] Add message with existing NPC (new alias) → names updated
   - [ ] World agent receives NPC mapping correctly
   - [ ] Memory distributed to NPC containers

2. **NPC Button Flow**
   - [ ] Click button → NPC pool retrieved
   - [ ] NPC memories fetched from supermemory
   - [ ] NPC speak agent generates valid output
   - [ ] Scenario message created and saved
   - [ ] New message triggers pipeline again

3. **Edge Cases**
   - [ ] No NPCs in session → extraction returns empty
   - [ ] No NPCs in session → button returns error
   - [ ] NPC with no memories → agent still generates
   - [ ] Multiple NPCs → all memories retrieved
   - [ ] Name collision handling

### Manual Testing Scenarios

1. **Basic Flow**
   - Start new session
   - User mentions "John Doe" in message
   - Verify NPC extracted and added to pool
   - Verify memory stored to `session-id::john`
   - Click NPC button
   - Verify John Doe responds appropriately

2. **Alias Tracking**
   - User mentions "John Doe"
   - Later mentions "Mr. Doe" referring to same person
   - Verify both names added to `john` entry
   - Verify world agent recognizes both names

3. **Multiple NPCs**
   - Mention "John", "Jane", "Bob" in conversation
   - Verify all extracted to pool
   - Verify memories separate (`::john`, `::jane`, `::bob`)
   - Click NPC button multiple times
   - Verify different NPCs respond

4. **Memory Persistence**
   - Add multiple messages with NPC
   - Reload page
   - Verify NPC pool persisted (Zustand localStorage)
   - Verify NPC memories persisted (supermemory)
   - Click NPC button
   - Verify response uses accumulated memory

---

## Future Enhancements (Post-POC)

1. **Database Migration**
   - Move NPC pool from Zustand to database table
   - Add `npc_pool` JSONB column to sessions table
   - Migration script to move localStorage data to DB

2. **Advanced Features**
   - NPC selection UI (choose which NPC speaks)
   - NPC personality profiles
   - NPC relationship tracking
   - Automatic NPC interjection (not just button)

3. **UI Improvements**
   - NPC pool viewer/manager
   - NPC memory browser
   - Visual indicators for NPC messages
   - NPC editing/merging tools

4. **Performance**
   - Cache NPC memories
   - Batch memory retrieval
   - Optimize extraction agent prompts
   - Debounce NPC extraction

---

## Notes

- **POC Focus**: Use Zustand for quick iteration, defer DB migration
- **Memory Format**: NPCs use same enriched message format as characters
- **Container Format**: `session-id::npc-id` (lowercase single word)
- **Name Normalization**: First word, lowercase, alphanumeric only
- **Extraction Timing**: After every message add, before world agent
- **NPC Memory Context**: World agent receives NPC memories alongside character memories for full context
- **Memory Fetching**: Top 10 relevant memories per NPC fetched using current message as query
- **Button Behavior**: Fetches all NPC memories, agent selects speaker
- **Scenario Messages**: NPC responses are scenario messages (no characterCardId)

---

## Bugs Found & Fixed During Implementation

### 1. ❌ Wrong retrieveCharacterMemories Interface
**Problem:** Initial plan used incorrect parameters:
```typescript
// WRONG ❌
await retrieveCharacterMemories({
  sessionId: sessionId.toString(),
  characterId: npc.id,
  queryText: generatedMessage,
  topN: 10,
});
```

**Fix:** Use actual `CharacterMemoryQueryInput` interface:
```typescript
// CORRECT ✅
const npcContainerTag = createNpcContainer(sessionId.toString(), npc.id);
await retrieveCharacterMemories({
  containerTag: npcContainerTag,
  current_game_time: gameTime,
  current_game_time_interval: gameTimeInterval,
  recentMessages: recentMessages.map((msg: { role: string; content: string; game_time: number }) =>
    `${msg.role}: ${msg.content}`
  ),
  characterName: npc.names[0],
  limit: 10,
});
```

### 2. ❌ TypeScript: Implicit 'any' Type
**Problem:** Parameter 'msg' implicitly has 'any' type in map callback
```typescript
// WRONG ❌
recentMessages.map(msg => `${msg.role}: ${msg.content}`)
```

**Fix:** Add explicit type annotation:
```typescript
// CORRECT ✅
recentMessages.map((msg: { role: string; content: string; game_time: number }) =>
  `${msg.role}: ${msg.content}`
)
```

### 3. ❌ Unnecessary Dynamic Import
**Problem:** Using `await import()` inside map callback required async function:
```typescript
// WRONG ❌
const distributionPromises = participantIds.map(async (participantId) => {
  const { createNpcContainer } = await import("../core/containers");
  // ...
});
```

**Fix:** Import at top level like other imports:
```typescript
// CORRECT ✅
// At top of file
import {
  createCharacterContainer,
  createWorldContainer,
  createNpcContainer,  // Added
} from "../core/containers";

// In function
const distributionPromises = participantIds.map((participantId) => {
  const participantContainer = participantId.includes("-")
    ? createCharacterContainer(sessionId, participantId)
    : createNpcContainer(sessionId, participantId);
  // ...
});
```

### 4. ❌ Wrong DataStore Field Access (handleNpcSpeak)
**Problem:** Used `.fieldName` instead of `.name` property:
```typescript
// WRONG ❌
const gameTimeRaw = dataStore.find((f) => f.fieldName === "game_time")?.value;
```

**Fix:** Use correct `.name` property from `DataStoreSavedField` interface:
```typescript
// CORRECT ✅
const gameTimeRaw = dataStore.find((f) => f.name === "game_time")?.value;
```

**Root Cause:** `DataStoreSavedField` interface uses `.name` not `.fieldName`:
```typescript
export interface DataStoreSavedField {
  id: string;
  name: string;    // ← Correct property name
  type: string;
  value: string;
}
```

### 5. ❌ Wrong Session Property Access (handleNpcSpeak)
**Problem:** Tried to access `session.messages` which doesn't exist on Session entity:
```typescript
// WRONG ❌
const allMessages = session.messages || [];
```

**Fix:** Use `fullContext.history` instead (matches other implementations):
```typescript
// CORRECT ✅
const recentMessages = fullContext.history?.slice(-5).map((msg: any) => ({
  role: msg.role || "user",
  content: msg.content || "",
  characterName: msg.characterName,
})) || [];
```

**Root Cause:** Session entity doesn't expose messages directly; use context history from executeFlow.

### 6. ❌ Wrong Memory Return Type (handleNpcSpeak)
**Problem:** Treated `retrieveCharacterMemories` return value as string:
```typescript
// WRONG ❌
const memories = await retrieveCharacterMemories({...});
if (memories) {
  npcMemories[npc.id] = memories;  // Type error: CharacterMemoryQueryOutput ≠ string
}
```

**Fix:** Extract memories array from result object:
```typescript
// CORRECT ✅
const memoryResult = await retrieveCharacterMemories({...});
if (memoryResult && memoryResult.memories && memoryResult.memories.length > 0) {
  npcMemories[npc.id] = memoryResult.memories.join("\n\n");
} else {
  npcMemories[npc.id] = "No memories yet";
}
```

**Root Cause:** `CharacterMemoryQueryOutput` returns `{memories: string[], count: number}`, not a string.

### 7. ❌ Provider Type Narrowing Issue
**Problem:** TypeScript couldn't infer provider type for conditional model selection:
```typescript
// ERROR ❌
const model = "chat" in provider
  ? provider.chat(parsedModelId)
  : provider.languageModel(parsedModelId);
// Error: Property 'languageModel' does not exist on type 'never'
```

**Fix:** Use direct method call since OpenAI provider always uses `languageModel`:
```typescript
// CORRECT ✅
const provider = createOpenAI({
  apiKey: "DUMMY",
  baseURL: convexBaseUrl,
});

// Create model - OpenAI provider uses languageModel method
const model = provider.languageModel(parsedModelId);
```

**Root Cause:** OpenAI provider type doesn't have `.chat()` method, only `.languageModel()`. Conditional check created type narrowing issue.

---

## Implementation Order

1. ✅ Create NPC Zustand store
2. ✅ Create NPC utilities
3. ✅ Create NPC extraction agent
4. ✅ Create NPC speak agent
5. ✅ Update containers.ts
6. ✅ Integrate extraction into message pipeline
7. ✅ Update memory distribution
8. ✅ Add NPC button handler
9. ✅ Standardize agents with world-agent patterns
10. ✅ Upgrade to gemini-2.5-pro and Convex backend
11. ⏳ Test message pipeline
12. ⏳ Test NPC button
13. ⏳ Frontend integration (button UI)

---

## Technical Improvements Implemented

### Agent Standardization
Both NPC agents were updated to match world-agent implementation patterns:

1. **Provider Setup**: Uses Convex backend routing instead of direct AstrskAi URL
   ```typescript
   // Before
   const astrskBaseUrl = import.meta.env.VITE_ASTRSK_AI_BASE_URL || "https://llm.astrsk.ai";
   const provider = createOpenAI({ baseURL: `${astrskBaseUrl}/v1` });

   // After
   const [providerSource, parsedModelId] = DEFAULT_MODEL.split(":");
   const convexBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${providerSource}`;
   const provider = createOpenAI({ baseURL: convexBaseUrl });
   ```

2. **Model Upgrade**: Changed from `gemini-2.0-flash-exp` → `gemini-2.5-pro`
   - Better quality outputs
   - More consistent structured output generation
   - Improved context understanding

3. **Enhanced Error Handling**: NPC speak agent now has graceful fallback
   ```typescript
   // Validates output format
   if (trimmedText.includes(":") && trimmedText.length > 0) {
     return trimmedText;
   } else {
     // Fallback with first NPC
     const fallbackNpc = npcPool[0];
     return `${fallbackNpc.names[0]}: ${trimmedText || "..."}`;
   }
   ```

4. **Consistent Authentication**: Both agents use same JWT pattern as world agent
   ```typescript
   const jwt = useAppStore.getState().jwt;
   const headers = jwt ? {
     Authorization: `Bearer ${jwt}`,
     "x-astrsk-credit-log": JSON.stringify({
       feature: "npc-extraction",
       sessionId: input.sessionId,
     }),
   } : undefined;
   ```

### Build Status
- ✅ All TypeScript errors resolved
- ✅ Production build successful
- ✅ No linting errors
- ✅ 7 bugs found and fixed during implementation

---

**Status:** Backend implementation complete (10/11 steps complete)
**Last Updated:** 2025-10-22
