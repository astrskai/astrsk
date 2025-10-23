# NPC as Character System - Design Document

## Overview

This document outlines the architectural design for treating NPCs (Non-Player Characters) as first-class characters in the roleplay memory system. NPCs will have individual UI buttons, character cards, and participate in agent execution flows just like main characters, but with dynamically generated content from their accumulated memories.

## Core Principle

**NPCs = Auto-Generated Persistent Character Cards**

NPCs are emergent entities that become real character cards:
- Are automatically detected from conversations
- Get real CharacterCard created in database with unique ID (on first mention)
- Added to session as regular character cards
- Build up memories over time through interactions
- Have their character descriptions AI-generated at card creation time
- Use the same agent execution flow as main characters
- **NPC Pool serves as permanent audit trail and deduplication check**

## Architecture Components

### 1. NPC Data Model (✅ SIMPLIFIED)

**Implementation**: `NpcData` in `npc-store.ts`

```typescript
export interface NpcData {
  id: string;                    // Lowercase single-word ID (e.g., "tanaka")
  names: string[];               // All known names/aliases (e.g., ["Tanaka-sensei", "Tanaka"])
  sessionId: string;             // Parent session
  characterCardId?: string;      // UUID of the created CharacterCard
  createdAt: number;             // Timestamp of first detection
  lastSeenAt: number;            // Last mentioned in conversation
}
```

**Purpose of NPC Pool**:
The NPC pool is a **permanent audit trail** that serves these purposes:
1. **Permanent Detection Record**: All NPCs ever mentioned in the session (NEVER deleted)
2. **Deduplication Check**: Prevents creating duplicate cards for same NPC (using simple ID like "tanaka")
3. **Bi-directional Card Mapping**:
   - NPC ID → Character Card ID (`getNpcById`)
   - Character Card ID → NPC ID (`getNpcByCardId`)
4. **Flow Execution Support**: Maps npcId to cardId when user clicks character button or flow execution needs NPC context

**Key Insight**: Pool entries are NEVER deleted. They serve as a permanent audit trail of all NPCs ever detected.

**Simplified Behavior**:
- **NPC detected for first time** → Add to pool, create card, add to session
- **NPC mentioned again** → Update pool entry (names/lastSeenAt), no card changes
- **User removes card from session** → Normal character removal (no NPC-specific logic)
- **User deletes card entirely** → Normal card deletion; pool persists; new card created if mentioned again

**Store Methods**:
```typescript
// Get NPC by npcId (e.g., "tanaka")
getNpcById(npcId: string, sessionId: string): NpcData | undefined

// Get NPC by character card ID (e.g., "uuid-123")
getNpcByCardId(cardId: string, sessionId: string): NpcData | undefined

// Add or update NPC
addNpc(npc: NpcData): void
updateNpc(npcId: string, sessionId: string, updates: Partial<NpcData>): void

// NOTE: No removeNpc() - pool is permanent record of all detected NPCs
// Use removedByUser flag to control session membership instead
```

**Container Pattern (Unified - No Special Cases!)**:

**Always use**: `{sessionId}::{characterCardId}` for ALL memories

**Flow**:
1. **NPC Detected** → Immediately create CharacterCard with UUID
2. **All Memories** → Stored in `{sessionId}::{characterCardId}` from the start
3. **No Migration** → No temporary containers, no migration needed

**Why This Approach?**
- **Maximum Simplicity**: No migration logic, no temporary containers
- **Immediate Consistency**: NPCs use same container pattern as regular characters from day 1
- **No Special Cases**: Memory storage code is identical for all characters
- **Create Card Early**: Card created on first detection (with initial description from memories)
- **All Future Info in Memories**: Description set once, ongoing character development tracked in memories

**Container Pattern**:
- NPC containers: `{sessionId}::{characterCardId}` (e.g., "uuid::card-uuid-123")
- Character containers: `{sessionId}::{characterCardId}` (e.g., "uuid::card-uuid-456")
- World containers: `{sessionId}::world`

**What About npcId?**
- NpcId only exists in **NPC Pool** for:
  - UI display (NPC buttons show "Tanaka" not "uuid-123")
  - Detection tracking (have we seen "tanaka" before?)
  - `npcId → characterCardId` mapping (for UI/flow execution)
- **NEVER** used for memory storage

### 2. NPC Detection & Description Pipeline (⚠️ NEEDS ENHANCEMENT)

**Current Components**:
- `npc-extraction-agent.ts` - Detects NPCs from conversation using AI structured output
- ~~`npc-speak-agent.ts`~~ - NOT USED (NPCs speak via flow execution instead)
- Integration in `session-play-service.ts` message pipeline

**Current Features**:
- Main character exclusion (with descriptions for alias detection)
- Duplicate detection and name merging
- Debug event recording

**Enhanced NPC Extraction Agent (NEW!)**:

The extraction agent should be enhanced to:
1. **Receive world memory context** (from `{sessionId}::world` container)
2. **Detect NPCs** from conversation (existing functionality)
3. **Generate descriptions for each detected NPC**:
   - Based on message history
   - Using world memory context
   - Including relationships with other characters
   - 2-3 paragraph coherent description
4. **Output structured data**:
   ```typescript
   {
     npcId: string;
     names: string[];
     description: string; // NEW: AI-generated description
   }
   ```

**Benefits**:
- ✅ Single AI call instead of two separate calls
- ✅ More coherent (same context for detection and description)
- ✅ More efficient (no need for separate description generation step)
- ✅ Includes relationship context from world memory

**New Requirements (Immediate Card Creation)**:

After NPC extraction in the message pipeline:
1. **Check if NPC already exists in pool** (using simple ID like "tanaka")
2. **If NPC exists in pool**:
   - Update names/aliases if new ones detected
   - Update `lastSeenAt` timestamp
   - Skip card creation (already exists)
3. **If NPC is new (not in pool)**:
   - Add to NPC pool
   - **Create real CharacterCard** in database with **AI-generated description from extraction agent**
   - Store `characterCardId` in NPC pool
   - Add card to session character list
   - **All future memories use** `{sessionId}::{characterCardId}`

**Key Insight**: The only check needed is "does this NPC ID exist in the pool?" Card removal is handled by normal character card operations.

**Note**: NPC dialogue is generated via flow execution (same as when user clicks NPC button), not via a separate NPC speak agent.

### 3. NPC Memory System (✅ NO CHANGES NEEDED!)

**Storage Pattern**: **Exactly the same as regular character memories**
- Container tag: `{sessionId}::{characterCardId}` (NPC's card UUID)
- Enriched messages with three sections: Current Time + Message + World Context
- Metadata: speaker, participants, game_time, isSpeaker, type

**Retrieval Pattern**:
- Uses Supermemory semantic search with card ID
- Returns formatted memory strings for agent context
- **No NPC-specific retrieval code needed** - same as regular characters

**Implementation**:
- Since card is created immediately on detection, memory storage works automatically
- Pass `characterCardId` to memory functions (same as regular characters)
- No special logic for NPCs - they're just regular characters with auto-generated content!

### 4. Real CharacterCard Creation (⚠️ TO BE IMPLEMENTED)

#### Purpose

Create **real persistent CharacterCard** entities in the database for NPCs immediately on first detection.

**Key Design**: Card created with **AI-generated description** from the extraction agent. The extraction agent provides both NPC detection AND description in one call.

#### Implementation Location

**New File**: `npc-card-creation.ts`

```typescript
import { CardService } from "@/app/services/card-service";
import { useNpcStore } from "@/app/stores/npc-store";

export interface NpcCardCreationInput {
  npcId: string;
  sessionId: string;
  description: string;  // From NPC extraction agent
}

export interface NpcCardCreationResult {
  cardId: string;           // UUID of created card
  wasCreated: boolean;      // true if new card, false if already existed
}

/**
 * Creates a real persistent CharacterCard for an NPC
 * - Receives AI-generated description from NPC extraction agent
 * - Description includes relationships and context from world memory
 * - Description set once, all future info tracked in memories
 * - Idempotent: Returns existing card if already created
 */
export async function createNpcCharacterCard(
  input: NpcCardCreationInput
): Promise<NpcCardCreationResult> {
  // 1. Get NPC data from store
  const npc = useNpcStore.getState().getNpcById(input.npcId, input.sessionId);
  if (!npc) {
    throw new Error(`NPC not found: ${input.npcId}`);
  }

  // 2. Check if card already exists (idempotent)
  if (npc.characterCardId) {
    return {
      cardId: npc.characterCardId,
      wasCreated: false,
    };
  }

  // 3. Determine primary name
  const primaryName = npc.names[0] || input.npcId;

  // 4. Create REAL CharacterCard in database with AI-generated description
  // Description comes from NPC extraction agent (includes world context & relationships)
  const createdCard = await CardService.createCard.execute({
    title: primaryName,
    name: primaryName,
    description: input.description, // AI-generated from extraction agent
    // Optional fields can be added later by user
    personality: undefined,
    scenario: undefined,
    firstMessage: undefined,
    exampleDialogue: undefined,
    systemPrompt: undefined,
    postHistoryInstructions: undefined,
    tags: [`npc`, `auto-generated`, `session:${input.sessionId}`],
    creatorNotes: `Auto-generated NPC card. NPC ID: ${input.npcId}`,
  });

  // 6. Store card ID in NPC pool
  useNpcStore.getState().updateNpc(input.npcId, input.sessionId, {
    characterCardId: createdCard.id,
    createdAt: Date.now(),
  });

  console.log(`[NPC Card] Created card ${createdCard.id} for NPC ${input.npcId}`);

  return {
    cardId: createdCard.id,
    wasCreated: true,
  };
}
```

**Note**: Description is AI-generated once by the extraction agent during card creation. All future character information comes from memories, not from regenerating the description field.

#### Key Differences from Fake Cards

| Aspect | Fake Cards (Old) | Real Cards (New) |
|--------|------------------|------------------|
| **Persistence** | Temporary, GC'd after use | Persistent in database |
| **ID** | Uses npcId (lowercase) | Real UUID |
| **Editability** | Not editable | Fully editable by user |
| **Features** | Minimal fields only | All card features available |
| **Performance** | Created JIT every time | Created once, reused |
| **User Control** | No control | Can edit, delete, customize |

### 6. NPC Addition Logic (⚠️ TO BE IMPLEMENTED)

#### Purpose

Add NPCs to the pool and create character cards when they're first detected. Removing NPCs is handled by normal character card removal (no special logic needed).

#### Key Insight

**Only one check is needed**: When adding an NPC to the pool, verify if it's truly new by checking the simple ID (e.g., "tanaka" from "Tanaka Sansei").

**Character card removal** from session is just a normal operation - no special NPC handling required.

#### Implementation Location

**Integration in Message Pipeline** (e.g., `session-play-service.ts` or NPC extraction integration point)

```typescript
import { useNpcStore } from "@/app/stores/npc-store";
import { createNpcCharacterCard } from "./npc-card-creation";
import { SessionService } from "@/app/services/session-service";

/**
 * Handle NPC extraction result from NPC extraction agent
 * Called after NPC extraction in message pipeline
 */
export async function handleNpcDetection(
  extractedNpcs: Array<{ npcId: string; names: string[]; description: string }>,
  sessionId: string
): Promise<void> {
  for (const extracted of extractedNpcs) {
    const { npcId, names, description } = extracted;

    // 1. Check if NPC already exists in pool
    const existingNpc = useNpcStore.getState().getNpcById(npcId, sessionId);

    if (existingNpc) {
      // NPC already in pool - just update names/aliases if new ones found
      const newNames = names.filter(name => !existingNpc.names.includes(name));
      if (newNames.length > 0) {
        useNpcStore.getState().updateNpc(npcId, sessionId, {
          names: [...existingNpc.names, ...newNames],
          lastSeenAt: Date.now(),
        });
      }

      // Skip card creation - already exists
      console.log(`[NPC] ${npcId} already exists in pool`);
      continue;
    }

    // 2. NPC is NEW - add to pool
    useNpcStore.getState().addNpc({
      id: npcId,
      names,
      sessionId,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    // 3. Create CharacterCard for this NPC
    const { cardId } = await createNpcCharacterCard({
      npcId,
      sessionId,
      description,
    });

    // 4. Add card to session character list
    await SessionService.addCharacterToSession({
      sessionId,
      characterId: cardId,
    });

    console.log(`[NPC] Created and added ${npcId} (${cardId}) to session`);
  }
}
```

#### Why No Special Removal Logic?

**Removing NPC from session** is just removing a character card - no different from removing any other character:
- User clicks "remove" on the NPC character card
- Session service removes the card from the session's character list
- That's it - no NPC-specific handling needed

**If user wants to re-add the NPC later**:
- They can manually add the character card back (same as any character)
- The NPC pool entry persists (permanent audit trail)
- All memories are preserved in `{sessionId}::{characterCardId}`

**If user deletes the CharacterCard entirely from library**:
- Card and memories are deleted (normal card deletion)
- NPC pool entry persists (permanent audit trail)
- If NPC is mentioned again, a NEW card would be created (treated as new NPC)
- User can prevent this by not mentioning the NPC or manually deleting new cards

#### Simplified Data Model

```typescript
export interface NpcData {
  id: string;                    // Lowercase single-word ID (e.g., "tanaka")
  names: string[];               // All known names/aliases
  sessionId: string;             // Parent session
  characterCardId?: string;      // UUID of the created CharacterCard
  createdAt: number;             // Timestamp of first detection
  lastSeenAt: number;            // Last mentioned in conversation
}
```

**Removed fields** (no longer needed):
- ❌ `addedToSession` - Not needed, can check session character list instead
- ❌ `removedByUser` - Not needed, card removal is normal operation

#### Integration Points

**When to Call `handleNpcDetection()`**:
- **After NPC Detection**: In message pipeline, after extraction agent identifies NPCs
- Runs for each message that mentions characters

**User Flow Examples**:

**Scenario 1: First NPC Mention**
```
User mentions "Tanaka" → NPC extraction agent detects
  → handleNpcDetection() called
  → Check pool: No existing NPC with id "tanaka"
  → Add to pool: {id: "tanaka", names: ["Tanaka Sansei"], ...}
  → createNpcCharacterCard() (new card with AI description)
  → SessionService.addCharacterToSession()
  → NPC now appears in session as a regular character card
```

**Scenario 2: NPC Mentioned Again**
```
User mentions "Tanaka-sensei" → NPC extraction agent detects
  → handleNpcDetection() called
  → Check pool: Found existing NPC with id "tanaka"
  → Update names: ["Tanaka Sansei", "Tanaka-sensei"]
  → Skip card creation (already exists)
  → No session changes needed
```

**Scenario 3: User Removes NPC from Session**
```
User removes Tanaka character card from session
  → Normal character removal (no NPC-specific logic)
  → Card removed from session character list
  → CharacterCard remains in database
  → NPC pool entry unchanged
  → User can re-add manually if desired
```

**Scenario 4: User Deletes CharacterCard Entirely**
```
User deletes Tanaka CharacterCard from card library
  → Normal card deletion (no NPC-specific logic)
  → CharacterCard and memories DELETED from database
  → NPC pool entry PERSISTS (audit trail)

Later: User mentions "Tanaka" again
  → handleNpcDetection() called
  → Check pool: Found existing NPC but characterCardId is invalid/deleted
  → Creates NEW CharacterCard (treated as first mention)
  → User gets fresh card if they want to track NPC again
```

### 7. NPC UI Integration (✅ NO CHANGES NEEDED!)

#### Key Insight

**NPCs use existing character buttons** - no separate NPC UI needed!

Since NPCs have real CharacterCards and are added to the session as regular characters, they automatically appear in the existing character button UI.

#### Current State

- Character buttons display all characters in the session
- Located in `session-messages-and-user-inputs.tsx` (around lines 1121-1168)

#### Target State

**No changes needed!** NPCs will:
- Appear alongside regular characters in the existing character buttons
- Use the same button component
- Show their avatar (from CharacterCard)
- Click to speak as that NPC (same flow execution as regular characters)

#### Optional Cleanup

If there's a **generic "Users" button** (lines 1034-1072) that was meant for NPCs, it can be removed since:
1. NPCs now have individual CharacterCards
2. NPCs appear in regular character list
3. No need for a separate "all NPCs" button

### 8. Agent Execution Integration (✅ NO CHANGES NEEDED!)

**Key Insight**: Since NPCs have **real CharacterCards with UUIDs** and are added to the session as regular characters, the existing `makeContext()` flow works as-is!

#### How It Works

`makeContext()` in `session-play-service.ts`:
1. Receives character IDs from session (already UUIDs, including NPC cards)
2. Fetches CharacterCard from CardService (works for both regular and NPC cards)
3. Builds RenderContext with Character objects
4. Passes to Agent.renderMessages() → TemplateRenderer

**No modifications needed!** NPCs are indistinguishable from regular characters at this point:
- ✅ Both have real CharacterCards with UUIDs
- ✅ Both are in the session's character list
- ✅ Both use the same CardService.getCard() call
- ✅ Both render with same templates ({{char.name}}, {{char.description}}, etc.)

The only difference is the `npc` tag in the CharacterCard metadata, which doesn't affect flow execution.

## Data Flow Diagrams

### Flow 1: Message Generation (Automatic - During Conversation)

This flow happens automatically when messages are sent during normal conversation. It builds up knowledge about NPCs AND creates their character cards.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. NPC Detection (NPC Extraction Agent)                         │
│                                                                   │
│  User Message → NPC Extraction Agent                            │
│                      ↓                                           │
│              Extract NPCs from message                           │
│              (with AI-generated descriptions)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. NPC Card Creation & Session Addition                         │
│                                                                   │
│  handleNpcDetection(extractedNpcs, sessionId)                   │
│     ↓                                                            │
│  For each NPC:                                                   │
│     Check: Does NPC ID exist in pool?                           │
│        ↓ NO                          ↓ YES                       │
│     Add to pool                   Update names/aliases           │
│        ↓                              ↓                          │
│     createNpcCharacterCard()       Skip (card exists)            │
│     - Create CharacterCard with AI description                  │
│     - Store cardId in pool                                      │
│     - Add to session character list                             │
│        ↓                                                         │
│     SessionService.addCharacterToSession()                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. World Agent & Participants Detection                         │
│                                                                   │
│  World Agent runs (NPCs now in session as CharacterCards!)      │
│     ↓                                                            │
│  Participants Detection (includes NPCs)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Memory Accumulation                                          │
│                                                                   │
│  Message → Memory Enrichment → Store in Container               │
│              (gameTime + message + worldContext)                 │
│              Container: {sessionId}::{characterCardId}           │
│                                                                   │
│  ALWAYS uses cardId - same as regular characters!               │
│  All memories stored in character containers from the start     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- Step 1: NPC Extraction Agent detects NPCs and generates descriptions
- Step 2: Create CharacterCards IMMEDIATELY (before World Agent runs)
- Step 3: World Agent runs with NPCs already in session as CharacterCards
- Step 4: Memories stored in character containers (same as regular characters)
- **No migration** - cardId used from the start for all memories
- Same container pattern as regular characters from day 1

### Flow 2: Flow Execution (Handles All NPC Dialogue)

This flow happens when NPCs need to generate dialogue - **no different from regular characters!**

```
┌─────────────────────────────────────────────────────────────────┐
│ Flow Execution Trigger                                          │
│         ↓                                                        │
│ Flow Execution Request with Character IDs (from session)        │
│ (Both regular characters AND NPCs - all are UUIDs)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Flow Execution (Same for ALL Characters!)                       │
│                                                                   │
│  makeContext() receives characterIds (all UUIDs)                 │
│       ↓                                                          │
│  CardService.getCard.execute(cardId) → Get CharacterCard        │
│       ↓                                                          │
│  Build RenderContext with card data                             │
│       ↓                                                          │
│  Agent.renderMessages() → TemplateRenderer → {{char.name}}      │
│                                               {{char.description}}│
│       ↓                                                          │
│  Execute Flow → Generate Response                               │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- NPCs use **real CharacterCards** - no fake cards!
- **No special NPC handling** - NPCs and regular characters use identical code path
- Session character list already contains NPC card UUIDs (added in Flow 1)
- makeContext() receives UUIDs for both NPCs and regular characters
- Card description contains AI-generated content from extraction agent
- User can edit NPC cards manually for more control

### Separation of Concerns

**Flow 1 (Message Generation)** is responsible for:
- Detecting NPCs from conversations (NPC Extraction Agent)
- **Creating persistent CharacterCards** for new NPCs (with AI-generated descriptions)
- **Adding NPC cards to session** character list
- Accumulating memories in character containers (`{sessionId}::{characterCardId}`)
- Running in the background during normal chat
- **Simple deduplication**: Check if NPC ID exists in pool before creating card

**Flow 2 (Flow Execution)** is responsible for:
- **All character dialogue generation** (NPCs and regular characters - identical code!)
- **Using real CharacterCards** (same as regular characters)
- Executing flows with card data from session
- No NPC-specific logic needed

**Why This Architecture?**
- **Persistent Cards**: NPCs are real entities that users can edit and customize
- **User Control**: Can remove unwanted NPCs, edit descriptions, add personality traits
- **Maximum Simplicity**: No migration, no special NPC handling, same container pattern from day 1
- **Flexibility**: Users can promote NPCs to "main characters" by editing their cards
- **Unified System**: Same memory containers for all characters (`{sessionId}::{cardId}`)
- **Predictable Behavior**: NPCs behave like regular characters in all respects

## Implementation Phases

### Phase 0: Update NPC Data Model (CRITICAL - DO FIRST)
**Files to Modify**:
- `npc-store.tsx` - Update `NpcData` interface with new fields

**New Fields**:
```typescript
characterCardId?: string;      // UUID of created card
createdAt: number;             // First detection timestamp
lastSeenAt: number;            // Last mentioned timestamp
```

**Removed Fields** (simplified approach):
```typescript
// ❌ addedToSession - Not needed, can check session character list
// ❌ removedByUser - Not needed, card removal is normal operation
```

**Acceptance Criteria**:
- NpcData interface updated with simplified fields
- Store methods support new fields (addNpc, updateNpc)
- Existing NPCs migrated (if any)

### Phase 1: Enhance NPC Extraction Agent (HIGH PRIORITY)
**Files to Modify**:
- `npc-extraction-agent.ts` - Enhance to generate descriptions
- Caller site (message pipeline) - Pass world memory context

**Implementation Steps**:

**Step 1.1: Update NPC Extraction Schema**
Add `description` field to the schema output:

```typescript
const npcExtractionSchema = z.object({
  npcs: z
    .array(
      z.object({
        name: z.string().describe("Full name as mentioned in conversation..."),
        id: z.string().describe("Lowercase single-word ID..."),
        description: z
          .string()
          .describe(
            "2-3 paragraph AI-generated character description including appearance, personality, role, and relationships with other characters based on message history and world context. If insufficient context, provide minimal description.",
          ),
      }),
    )
    .describe("Only NEW NPCs or NEW ALIASES for existing NPCs"),
});
```

**Step 1.2: Update Input Interface**
Add `worldMemoryContext` parameter to `NpcExtractionInput`:

```typescript
export interface NpcExtractionInput {
  sessionId: string;
  message: { role: string; content: string; characterName?: string };
  recentMessages?: Array<{ role: string; content: string }>;
  existingNpcPool: NpcData[];
  mainCharacterNames: string[];
  mainCharacterDescriptions?: string[];
  worldMemoryContext?: string[]; // NEW: World memory for relationship context
}
```

**Step 1.3: Enhance Prompt**
Add world context section and description generation instructions to the prompt:

```typescript
// Build world context text
const worldContextText = input.worldMemoryContext?.length
  ? "\n\nWORLD CONTEXT (for generating character descriptions):\n" +
    input.worldMemoryContext.map((mem, i) => `${i + 1}. ${mem}`).join("\n")
  : "";

const prompt = `You are an NPC extraction agent. Your job is to identify Non-Player Characters (NPCs) mentioned in conversation messages AND generate detailed character descriptions for them.

MAIN CHARACTERS in this session (DO NOT EXTRACT THESE):
${mainCharactersText}

EXISTING NPCs in this session:
${existingNpcsText}

CURRENT MESSAGE:
${messageText}
${contextText}
${worldContextText}

INSTRUCTIONS:
1. Identify any NPCs mentioned in the messages (characters that are talked about or appear)
2. For each NPC:
   - Generate a lowercase single-word ID from their first name (e.g., "John Doe" → "john")
   - Record their full name as it appears in the conversation
   - Generate a 2-3 paragraph character description including:
     * Physical appearance (if mentioned or can be inferred)
     * Personality traits and mannerisms
     * Role in the story/relationship to main characters
     * Any relevant background or context from world memories
     * If insufficient context available, provide minimal description: "[Name] is a character in the story."
3. Check against MAIN CHARACTERS list:
   - NEVER extract any character listed in MAIN CHARACTERS as an NPC
   - Use the character descriptions to identify if a mentioned name is an alias/variation of a main character
   - Examples: If "Sakuraba Yui" is a main character, then "Sakuraba-san", "Yui-chan", "Sakuraba" are aliases, NOT NPCs
   - This includes honorifics (san, kun, chan, sensei, sama), last names, first names, or nicknames
4. Check against EXISTING NPCs:
   - If the ID already exists but a NEW name/alias is used, include it WITH the same ID and generate description
   - If the ID and name both already exist, DO NOT include it
   - If it's a completely new NPC, include it with generated description
5. DO NOT include:
   - Main characters or their aliases (listed above)
   - Generic references like "someone", "people", "a person"
   - Characters that are clearly not NPCs

Output ONLY new NPCs or new aliases for existing NPCs, each with their AI-generated description.`;
```

**Step 1.4: Retrieve World Memory Before Calling Agent**
In the message pipeline integration point (where `executeNpcExtractionAgent` is called):

```typescript
import { retrieveWorldMemories } from "../core/memory-retrieval";

// Before calling NPC extraction agent
const worldContainerTag = `${sessionId}::world`;
const worldMemoryResult = await retrieveWorldMemories({
  containerTag: worldContainerTag,
  query: "What characters, NPCs, and relationships exist in this story?",
  limit: 15, // Get enough context for descriptions
});

// Call extraction agent with world context
const extractionResult = await executeNpcExtractionAgent({
  sessionId,
  message,
  recentMessages,
  existingNpcPool,
  mainCharacterNames,
  mainCharacterDescriptions,
  worldMemoryContext: worldMemoryResult.memories, // NEW: Pass world context
});
```

**Acceptance Criteria**:
- ✅ Schema includes `description: string` field
- ✅ Input interface includes `worldMemoryContext?: string[]` parameter
- ✅ Prompt enhanced with world context section and description generation instructions
- ✅ Caller retrieves world memory before invoking agent
- ✅ World memory passed to extraction agent
- ✅ Detects NPCs from conversation (existing functionality preserved)
- ✅ Generates AI-powered descriptions for each detected NPC in single AI call
- ✅ Description includes appearance, personality, role, relationships when available
- ✅ Falls back to minimal description if insufficient context: "[Name] is a character in the story."
- ✅ Output structured data includes `description` field for each NPC
- ✅ Single AI call for both detection and description (efficient!)
- ✅ Temperature remains at 0.7 for creative descriptions

### Phase 2: Real Card Creation (HIGH PRIORITY)
**Files to Create**:
- `npc-card-creation.ts` - Create real CharacterCards for NPCs

**Dependencies**: Phase 0, Phase 1 complete

**Acceptance Criteria**:
- Creates **real persistent CharacterCard** in database
- Receives AI-generated description from extraction agent (Phase 1)
- Uses description directly from extraction agent output
- Returns card UUID
- Idempotent (checks if card already exists)
- Stores cardId in NPC pool
- Card has tags: `npc`, `auto-generated`, `session:{sessionId}`
- **NO migration needed** - card created before first memory

### Phase 3: NPC Detection Handler (HIGH PRIORITY)
**Implementation Location**: Message pipeline integration point

**Dependencies**: Phase 2 complete

**Acceptance Criteria**:
- `handleNpcDetection()` processes extraction results
- Checks if NPC exists in pool (by simple ID)
- Creates card for new NPCs only
- Updates names/aliases for existing NPCs
- Adds new cards to session
- Idempotent and safe to call multiple times

### Phase 4: Integrate into Message Pipeline (HIGH PRIORITY)
**Files to Modify**:
- `session-play-service.ts` or NPC extraction integration point

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- After NPC extraction, calls `handleNpcDetection()`
- NPCs automatically get cards created (first mention only)
- Cards automatically added to session
- Duplicate NPCs detected via pool lookup

### Phase 5: Flow Execution Integration (✅ NO CHANGES NEEDED!)
**Files to Modify**: None

**Dependencies**: Phase 4 complete (NPCs need to be in session as CharacterCards)

**Acceptance Criteria**:
- NPCs appear in session character list (via Phase 4)
- makeContext() receives NPC card UUIDs (same as regular characters)
- Real CharacterCards fetched via CardService (existing code)
- Templates render correctly with {{char.name}}, {{char.description}} (existing code)
- Flow execution works for NPCs same as regular characters (no special logic needed)

### Phase 6: Update NPC Store Methods (HIGH PRIORITY)
**Files to Modify**:
- `npc-store.tsx` - Add `getNpcByCardId()` method

**Dependencies**: Phase 0 complete

**Acceptance Criteria**:
- `getNpcByCardId(cardId, sessionId)` returns NpcData | undefined
- Searches through NPCs to find matching characterCardId
- Efficient lookup (consider indexing by cardId if needed)
- Works alongside existing `getNpcById()` method

## Edge Cases and Considerations

### 1. NPC Removal Behavior (✅ SIMPLIFIED)

**When User Removes NPC from Session**:
- ✅ NPC pool entry: KEPT (permanent audit trail)
- ✅ CharacterCard: KEPT in database (can be manually re-added)
- ✅ Memories: KEPT in Supermemory container (`{sessionId}::{cardId}`)
- ✅ Session membership: REMOVED (normal character removal)
- ✅ No special NPC logic needed

**When NPC is Re-added Later**:
- ✅ Same CharacterCard used (same UUID)
- ✅ All memories still intact
- ✅ User manually adds via normal character add flow

**When User Deletes CharacterCard Entirely** (from card library):
- ⚠️ CharacterCard: DELETED from database (normal card deletion)
- ⚠️ Memories: DELETED from Supermemory (container deleted)
- ✅ NPC pool entry: KEPT (permanent audit trail)
- ✅ `characterCardId`: Still references deleted card (invalid reference)
- ℹ️ If NPC mentioned again: NEW card created (treated as first mention)
- ✔️ User gets fresh start with that NPC if they choose to keep the new card

### 2. Fallback Strategies

**If Supermemory query fails or returns no results**:
1. Return minimal description: "{npc_name} is a character in the story."
2. Log error but don't break execution
3. Flow execution continues with minimal card

**If real card creation fails**:
1. Return minimal CharacterCard with just name
2. Description: "An NPC in the story"
3. Allow conversation to continue

### 2. Performance Considerations

**Query Performance**:
- Supermemory semantic search with limit: 40 is fast enough for JIT
- No caching needed - queries are efficient
- Each NPC response requires one Supermemory query

**Multiple NPCs**:
- If multiple NPCs in same flow execution, queries run sequentially
- Could optimize with parallel queries if needed (future enhancement)

### 3. Query Optimization

**Semantic Query Design**:
- Natural language question format works best
- Example: "What is the description and personality of {npc_name}? What are their relationships with other characters?"
- Supermemory returns most semantically relevant memories
- Limit: 40 provides good balance of context vs. token usage

**Query Tuning**:
- Could adjust limit based on NPC importance
- Could include recent message context in query for more relevant results
- Could use different queries for different scenarios (manual vs automatic)

### 4. Template Rendering Compatibility

**Current Templates Use**:
- `{{char}}` - Main character being prompted
- `{{user}}` - User character
- `{{cast.all}}` - All characters in scene

**NPC Requirements**:
- NPCs should be accessible in `{{cast.all}}`
- When prompting AS an NPC, they become `{{char}}`
- Their real card provides all needed template variables

**Validation Needed**:
- Test templates render correctly with real NPC cards
- Ensure no template errors when NPC is `{{char}}`

## Testing Strategy

### Unit Tests
- `retrieveCharacterDescription()` - Mock Supermemory query, test formatting
- `createNpcCharacterCard()` - Test real card creation with mock NPC data
- Container validation - Test NPC ID detection (lowercase vs UUID)

### Integration Tests
- End-to-end: Message → NPC extraction → Memory accumulation → Flow execution with real card
- Test with multiple NPCs in same conversation
- Test NPC participant detection in world agent
- Test real card in makeContext() and template rendering

### Manual Testing Scenarios
1. **New NPC Introduction**: Introduce new character in conversation, verify extraction
2. **NPC Memory Accumulation**: Have multiple interactions with NPC, verify memories stored
3. **NPC Flow Execution**: Click NPC button, execute flow, verify real card with description
4. **NPC in Agent Context**: Verify AI responses reference NPC description correctly
5. **Performance**: Test with 5+ NPCs in session, verify card creation timing

## Metrics and Monitoring

### Debug Events
- Existing: `npc_extraction` - Track NPC detection
- Could add: `npc_description_retrieval` - Track Supermemory query timing

### Performance Metrics
- Supermemory query time (should be < 500ms for description updates)
- Real card creation time (should be < 500ms for minimal description)
- Flow execution time with NPC cards (should be same as regular characters)

### Quality Metrics
- NPC detection accuracy (false positives/negatives)
- Memory retrieval relevance (manual review of descriptions)
- Template rendering success rate with NPCs

## Future Enhancements

### 1. NPC Avatars
- Generate avatars from NPC descriptions using AI image generation
- Or use deterministic avatar generation from name hash

### 2. NPC Personality Evolution
- Track personality changes over time in descriptions
- Show "relationship status" with main characters

### 3. NPC Dialogue Examples
- Extract example dialogues from NPC speak history
- Add to real character card as `exampleDialogue`

### 4. NPC Lorebook Entries
- Auto-generate lorebook entries for NPCs
- Include important facts, relationships, backstory

### 5. NPC Management UI
- Debug panel section to view all NPCs
- Manually edit NPC descriptions
- Merge/split NPCs
- Archive inactive NPCs

## Open Questions

1. **Query Limit**: Is 40 memories optimal for NPC descriptions, or should it vary based on NPC importance?
2. **Query Optimization**: Should we include recent message context in the semantic query for more relevant results?
3. **NPC Persistence**: Should NPCs persist across sessions, or only within session?
4. **NPC Hierarchy**: Should there be "major" vs "minor" NPCs with different query limits?
5. **User Control**: Should users be able to manually edit NPC descriptions or promote NPCs to full characters?
6. **Caching**: Is JIT always acceptable, or should we cache for performance in some scenarios (e.g., same NPC speaking multiple times in row)?

## Conclusion

This design transforms NPCs from simple name entities into **real persistent character cards** with full CharacterCard capabilities. This is a significant upgrade from the original "fake card" approach.

### Key Architectural Decisions

**1. Real Persistent CharacterCards**
- NPCs get actual database entries with UUIDs
- Fully editable by users (description, personality, etc.)
- Can be promoted to "main characters" by adding more fields
- Respects user control and preferences

**2. Immediate Card Creation (No Migration)**
- Card created IMMEDIATELY on first NPC detection
- Minimal description: "{name} is a character in the story."
- All memories use `{sessionId}::{characterCardId}` from the start
- No temporary containers, no migration needed
- Maximum simplicity

**3. NPC Pool as Permanent Audit Trail**
- **NEVER deleted** - permanent record of all NPCs ever detected
- Maintains `npcId → characterCardId` mapping
- Simple deduplication check via lowercase ID (e.g., "tanaka")
- Supports bi-directional lookup (`getNpcById`, `getNpcByCardId`)
- NPCs appear in UI via their CharacterCards (same as regular characters)

**4. Simplified Card Lifecycle**
- When NPC first detected: create card and add to session
- When user removes NPC from session: normal character removal (no NPC-specific logic)
- When user deletes card entirely: normal card deletion (pool persists as audit trail)
- If deleted NPC mentioned again: new card created (treated as first mention)
- No special flags or complex state tracking needed

### Benefits of This Approach

**For Users:**
- ✅ Full control over NPC cards (edit, delete, customize)
- ✅ NPCs feel like "real" characters in the system
- ✅ Can promote important NPCs to main characters
- ✅ Automatic NPC detection and card creation
- ✅ Simple, predictable behavior (no hidden flags or complex state)

**For Developers:**
- ✅ Unified code path for all characters (minimal special-casing)
- ✅ Same memory system for NPCs and regular characters from day 1
- ✅ Clear separation of concerns (pool vs cards vs memories)
- ✅ No migration logic needed - immediate card creation
- ✅ **One simple check**: "Is this NPC ID already in the pool?"
- ✅ No complex removal/deletion state tracking
- ✅ Easier to maintain and extend

**Trade-offs:**
- ❌ More database writes (one card per NPC on first detection)
- ❌ Need to track NPC pool separately from cards
- ✅ BUT: Maximum simplicity - no temporary containers or migration
- ✅ Cleaner architecture with fewer special cases

### Implementation Priority

**Critical Path (Phases 0-4)**:
1. Phase 0: Update NPC data model (simplified fields)
2. Phase 1: Enhance NPC extraction agent (add description generation)
3. Phase 2: Create real card creation logic (with AI-generated description)
4. Phase 3: Implement NPC detection handler (`handleNpcDetection`)
5. Phase 4: Integrate into message pipeline

**No Changes Needed (Phase 5)**:
- Phase 5: Flow execution works automatically (NPCs use same code path as regular characters)

**Enhancement Path (Phase 6)**:
1. Phase 6: Bi-directional store methods (`getNpcByCardId`)

**No UI Changes Needed**: NPCs automatically appear in existing character buttons since they use real CharacterCards!

The phased implementation approach ensures core functionality is completed first, with UI enhancements and user control features following.
