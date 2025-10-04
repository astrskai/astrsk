# Product Requirements Document: Supermemory Integration for Multi-Character Roleplay System

## 1. Overview

### 1.1 Purpose
Integrate Supermemory as the memory backend for an existing multi-character roleplay system that supports group conversations with private character memories and intelligent world state tracking.

### 1.2 Scope
This PRD defines the high-level requirements for integrating Supermemory into an existing roleplay system to provide:
- Private memory storage per character using Supermemory containers
- Session-wide world memory for context tracking using Supermemory containers
- Intelligent memory distribution via World Agent that queries and stores in Supermemory
- Temporal awareness (game day progression) using Supermemory metadata
- Character-specific knowledge enrichment at memory storage time

### 1.3 System Context (Already implemented we are adding memory agent with supermemory)
The roleplay system has: 
- Agent-based workflow (START node → MIDDLE agents → END node)
- Data store for session state (participants, gameTime) (We already have global data store per session, so we introduce fixed data store is Participants and GameTime here GameTime can be defined with desired interval)
- Multi-character group chat functionality
- Character card + lorebooks and plot card + lorebooks 

Supermemory provides:
- Container-based memory isolation (hard boundaries via `containerTag`)
- Metadata-based filtering (soft indexing within containers)
- Semantic search and retrieval
- Add/query API for memory operations ( we already have poc integration in the project )

---

## 2. Core Architecture Requirements

### 2.1 Container Structure

**REQ-2.1.1: Character Containers**
- Each character MUST have an isolated private memory container
- Container naming format: `{sessionId}-{characterId}`
  - Example: `"session-uuid-character-uuid"` (uuid from the session data and character data)
- Characters can NEVER access other characters' containers (hard boundary)
- Each container stores memories relevant only to that character

**REQ-2.1.2: World Memory Container**
- Each session MUST have ONE world memory container
- Container naming format: `{sessionId}-world`
  - Example: `"session-uuid-world"` (uuid from the session data)
- World container stores ALL messages from ALL characters
- World container stores ALL world state updates
- World container is queried ONLY by the World Agent

**REQ-2.1.3: Container Isolation**
- `containerTag` represents HARD separation (cannot cross boundaries)
- `metadata` represents SOFT indexing (searchable within container)
- Character containers are private and isolated
- World container has global session visibility

---

## 3. Memory Flow Requirements

### 3.1 Character Turn Flow

**REQ-3.1.1: START Node - Memory Recall**
- Character queries ONLY their own private container
- Query format MUST include:
  - `###Current time###` section with game day
  - `###Recent messages###` section with last 1-3 messages formatted as: (if exists) ( we need to test number of messages truely have impact if not just one is fine )
    - `Message: {char_name}: {content} GameDay: {gameDay}`
    - `What are the relevant memories that are not in the recent three messages to construct {character}'s message?`
- Character receives memories ONLY from their private container
- ❌ Character does NOT query world memory
- ❌ Character does NOT see other characters' memories

**REQ-3.1.2: MIDDLE Nodes - Agent Flow**
- Agents receive memories from START node (character's private container)
- Only agents with "memory enabled" setting receive memory context ( we have plain message and history message in our system already, using plain message if it has ###SUPERMEORY### text in content then we consider that as enabling factor )
- Agents with memory disabled do NOT receive memories 
- Memory injection uses placeholder format (e.g., `###SUPERMEORY###`)
- ❌ Agents do NOT have access to world memory

**REQ-3.1.3: END Node - Memory Distribution**
- World Agent MUST be invoked at END node
- World Agent processes:
  1. Query world memory container for session context
  2. Analyze generated message
  3. Analyze data store ( Previous Participant, GameTime, etc.)
  4. Determine `actualParticipants` (who was in the conversation)
  5. Produce character-specific `worldKnowledge` for each participant
  6. Store raw message in world memory container
  7. Store enriched message in each participant's container

---

## 4. World Agent Requirements

### 4.1 World Agent Capabilities

**REQ-4.1.1: Participant Determination**
- World Agent MUST analyze message to determine who participated
- Inputs:
  - `worldContainerTag`: World memory container
  - `message`: Generated message from agent flow
  - `recentMessages`: Last 1-3 messages for context (test will show)
  - `dataStore`: Previous participants, gameDay, etc.
- Structured Output:
  - `actualParticipants`: Array of character IDs who were in conversation
  - `worldKnowledge`: Character-specific world knowledge
- Logic: Semantic analysis, name mentions, "we"/"us" detection

**REQ-4.1.2: World Knowledge Production**
- World Agent MUST produce character-specific world knowledge
- Queries world memory to extract relevant information per character
- Output format:
  ```javascript
  {
    "character-alice": "Relevant world updates for Alice...",
    "character-bob": "Relevant world updates for Bob...",
    // Different knowledge per character
  }
  ```
- Knowledge should include:
  - Recent world state changes
  - Character-specific updates (items acquired, status changes)
  - Other characters' actions relevant to this character

**REQ-4.1.3: Metadata Production**
- World Agent MUST produce structured metadata for storage
- Metadata includes:
  - `speaker`: Character ID who spoke (Given at start)
  - `participants`: Array of actual participant IDs
  - `GameTime`: Current game day (from data store)

---

## 5. Message Storage Requirements

### 5.1 World Memory Storage

**REQ-5.1.1: Store Raw Message**
- World Agent stores RAW message in world container
- Format: `Message: {char_name}: {content} GameDay: {gameDay}`
- Metadata: Data produced by World Agent (participants, location, gameDay, type, etc.)

**REQ-5.1.2: Store World State Updates**
- When data store changes (location, etc.), World Agent stores update in world container
- Format: `{Description of change}. GameDay: {gameDay}`
- Example: `"The party moved from the tavern to the Dragon's Lair. GameDay: 6"`
- Metadata type: `"world_state_update"`

**REQ-5.1.3: Store Character Updates**
- When character state changes, World Agent stores in world container
- Format: `{Character} {action}. GameDay: {gameDay}`
- Example: `"Alice acquired the Sacred Sword. GameDay: 7"`
- Metadata type: `"character_update"`

### 5.2 Character Container Storage

**REQ-5.2.1: Enriched Content Format**
- Messages stored in character containers MUST be enriched with three sections:
  ```
  ###Current time###
  Game Day: {gameDay}

  ###Message###
  Message: {char_name}:s {content} GameDay: {gameDay}

  ###Newly discovered world knowledge###
  {worldKnowledge specific to this character}
  ```

**REQ-5.2.2: Character-Specific Enrichment**
- Each participant receives the SAME message
- Each participant receives DIFFERENT world knowledge (character-specific)
- If no world knowledge, store message without `###Newly discovered world knowledge###` section

**REQ-5.2.3: Metadata for Character Containers**
- `speaker`: Character ID who spoke
- `participants`: Array of actual participant IDs (from World Agent)
- `isSpeaker`: Boolean (true if this container's character spoke)
- `location`: Current location (string metadata, searchable)
- `gameDay`: Current game day (numeric metadata, filterable)
- `timestamp`: Real-world timestamp

---

## 6. Data Store Requirements

### 6.1 Session State

**REQ-6.1.1: Required Data Store Values**
- `currentScene` (string): e.g., "tavern", "dragon_lair"
- `participants` (array): All character IDs in session
  - Example: `["character-alice", "character-bob", "character-charlie"]`
- `gameDay` (number): Story progression day (not real-world date)

**REQ-6.1.2: Optional Data Store Values**
- Time of day (morning, evening, night)
- Active quest/objective
- World state flags
- Character relationships
- Session history (turn count, total messages)

---

## 7. Initialization Requirements

### 7.1 Phase 0: Session Setup

**REQ-7.1.1: Plot Card Storage**
- Store user-selected plot/scenario in each character's container
- Content: Full scenario text
- Metadata: `type: "plot"`, `permanent: true`

**REQ-7.1.2: Character Card Storage**
- Store character description in character's container
- Content: Combined description (name, role, personality)
- Format: TBD (single block or structured)
- Metadata: `type: "character_card"`, `permanent: true`

**REQ-7.1.3: Example Dialog Storage**
- Store character example dialog in character's container
- Format: TBD (one memory or multiple)
- Metadata: `type: "example_dialog"`, `permanent: true`

**REQ-7.1.4: Lorebook Storage**
- Store lore entries in character's container
- Each entry as separate memory
- Metadata: `type: "lore"`, `loreKey: "{key}"`, `permanent: true`

**REQ-7.1.5: Initial Container State**
- After initialization, each character container has ~5 memories:
  1. Plot Card
  2. Character Card
  3. Example Dialog
  4-5. Lore Entries

---

## 8. Temporal Requirements

### 8.1 Game Day Tracking

**REQ-8.1.1: Message Format with GameDay**
- ALL messages stored MUST include GameDay in content
- Format: `Message: {content} GameDay: {gameDay}`
- GameDay is ALSO stored in metadata as numeric field (for filtering)

**REQ-8.1.2: Query Format with Current Time**
- Queries MUST include `###Current time###` section
- Format:
  ```
  ###Current time###
  Game Day: {currentGameDay}

  ###Recent messages###
  {formatted messages}

  {query text}
  ```

**REQ-8.1.3: Recent Messages Format**
- Recent messages MUST include GameDay
- Format: `Message: {char_name}: {content} GameDay: {gameDay}`

---

## 9. Metadata & Filtering Requirements

### 9.1 Metadata Strategy

**REQ-9.1.1: Embedded in Content**
- `gameDay`: MUST be embedded in message content AND stored in metadata

**REQ-9.1.2: Metadata Only**
- `speaker`: Character ID (metadata only)
- `participants`: Array of character IDs (metadata only)
- `isSpeaker`: Boolean (metadata only)
- `location`: String (metadata only)
- `type`: Memory type (metadata only)
- `timestamp`: Real timestamp (metadata only)

**REQ-9.1.3: Filter Support**
- String filters: Exact match on metadata fields
  - Example: `location = "tavern"`
- Numeric filters: Operators (>=, <=, ==, >, <) on numeric metadata
  - Example: `gameDay >= 5`
- Combined filters: Multiple filters in AND array

---

## 10. Agent Integration Requirements

### 10.1 Memory-Enabled Agents

**REQ-10.1.1: Agent Configuration**
- Each agent node MUST have "memory enabled" setting (boolean)
- If enabled: Agent receives memory context in prompt
- If disabled: Agent does NOT receive memory context

**REQ-10.1.2: Memory Placeholder**
- Memory injection uses placeholder in agent prompt
- Format: TBD (`{{memories}}` or `{{retrieved_memories}}`)
- Memories formatted as: TBD (raw text, JSON, numbered list)

**REQ-10.1.3: Permanent Memories**
- Decision needed: Should permanent memories (plot, character card) be auto-included?

---

## 11. Information Flow Summary

### 11.1 START Node Flow
```
Character Container (private)
  ↓
Memory Recall Query (with current time + recent messages)
  ↓
Retrieved Memories
  ↓
Passed to MIDDLE agents (if memory enabled)
```

### 11.2 END Node Flow
```
Generated Message
  ↓
World Agent analyzes message + queries world memory
  ↓
World Agent determines: actualParticipants + worldKnowledgePerCharacter
  ↓
Store raw message in World Container
  ↓
For each participant:
  - Enrich message with current time + message + world knowledge
  - Store enriched message in participant's container
```

### 11.3 Key Principle
- **World memory is used ONLY at END node for distribution**
- **Characters query ONLY their private containers at START node**
- **World Agent bridges world memory and character containers**

---

## 12. Open Design Decisions

### 12.1 Initialization Content
- Exact format for plot card, character card, example dialog, lore entries
- Single block vs multiple entries per type
- Text format vs structured fields

### 12.2 Data Store Values
- Complete list of required vs optional session state variables
- How to track character relationships, world flags, quest states

### 12.3 Agent Memory Integration
- Placeholder format for memory injection
- Memory formatting (raw text vs JSON vs numbered list)
- Permanent memory auto-inclusion policy

### 12.4 Metadata Embedding
- Should `location` be embedded in message content?
- Should `speaker` be embedded (already in message as "{char_name}: ...")?
- Balance between semantic search and metadata filtering

### 12.5 Message Format Standardization
- Field order in message content
- Speaker name format (character ID vs display name)
- Multi-line message handling

### 12.6 World Agent Implementation
- Participant detection algorithm (LLM vs rule-based)
- World knowledge extraction strategy
- Confidence scoring for participant determination
- Default behavior when uncertain

### 12.7 Memory Retrieval Strategy
- Number of memories to retrieve (top 5? top 10? configurable?)
- Permanent memory handling (auto-include vs retrieve)
- Retrieval prioritization (recent vs semantic relevance)
- Re-ranking after retrieval

---

## 13. Success Criteria

### 13.1 Privacy & Isolation
- ✅ Characters can NEVER access other characters' memories
- ✅ World container is NEVER queried by character recall
- ✅ Each character only sees memories distributed to them

### 13.2 Memory Distribution Accuracy
- ✅ World Agent correctly identifies conversation participants
- ✅ Only actual participants receive memories
- ✅ Each participant receives character-specific world knowledge

### 13.3 Temporal Coherence
- ✅ Queries include current game day context
- ✅ Messages include game day information
- ✅ Retrieval respects temporal progression

### 13.4 World State Tracking
- ✅ World memory captures all session events
- ✅ World state updates stored in world container
- ✅ Character updates tracked in world container

### 13.5 Agent Integration
- ✅ Memory-enabled agents receive correct memory context
- ✅ Memory-disabled agents receive no memory context
- ✅ Memory injection works seamlessly in agent prompts

---

## 14. Implementation Priorities

### Phase 1: Core Infrastructure
1. Container structure (character + world containers)
2. World Agent skeleton (participant determination)
3. Basic message storage (raw in world, simple in character)
4. Data store integration (gameDay, location, participants)

### Phase 2: Memory Enrichment
1. World knowledge extraction
2. Character-specific enrichment
3. Three-section message format (###Current time###, ###Message###, ###Newly discovered world knowledge###)
4. World state update tracking

### Phase 3: Advanced Features
1. Metadata filtering (string + numeric)
2. Permanent memory handling (plot, character card, lore)
3. Agent memory integration (placeholder, formatting)
4. Temporal query optimization

### Phase 4: Polish & Optimization
1. World Agent confidence scoring
2. Memory retrieval tuning
3. Re-ranking strategies
4. Performance optimization for large sessions

---

## 15. Constraints & Assumptions

### 15.1 Constraints
- Supermemory API supports containerTag-based isolation
- Supermemory supports metadata with string and numeric fields
- Supermemory supports complex filters (AND, numeric operators)
- Agent flow system supports memory injection via placeholders

### 15.2 Assumptions
- Characters do NOT need to see all session history (only their relevant memories)
- World Agent has sufficient context from world memory to make participant decisions
- Character-specific world knowledge enhances memory quality
- Game day progression is sufficient for temporal tracking (no need for real-world time)

---

## 16. Future Considerations

### 16.1 Scalability
- Long-running sessions (100+ days, 1000+ messages)
- Memory pruning strategies
- Summarization for very old memories

### 16.2 Advanced Features
- Character memory sharing (explicit knowledge transfer)
- Private character thoughts vs spoken messages
- Nested world states (location hierarchies)
- Relationship dynamics tracking

### 16.3 Developer Experience
- Debug tools to inspect world memory
- Visualization of memory distribution
- Testing utilities for World Agent decisions

---

## Appendix A: Terminology

- **Character Container**: Private memory container for a single character (`{sessionId}-{characterId}`)
- **World Container**: Session-wide memory container (`{sessionId}-world`)
- **World Agent**: Agent that analyzes messages, determines participants, and enriches memories
- **containerTag**: Hard boundary identifier (cannot cross)
- **metadata**: Soft indexing within container (searchable, filterable)
- **gameDay**: Story progression day (numeric, not real-world date)
- **actualParticipants**: Character IDs determined by World Agent as being in conversation
- **worldKnowledge**: Character-specific information extracted from world memory
- **Enriched Content**: Message with three sections (current time, message, world knowledge)
- **Permanent Memory**: Initialization memories (plot, character card, dialog, lore) marked permanent

## Appendix B: Example Flows

### B.1 Simple Message Flow
1. Alice's turn starts
2. START: Alice queries `rp-session-123-character-alice` for memories
3. MIDDLE: Agents generate "Bob and I agreed to find the Sacred Sword!"
4. END: World Agent analyzes message
   - Determines participants: [Alice, Bob]
   - Extracts world knowledge for Alice: "Party moved to Dragon's Lair"
   - Extracts world knowledge for Bob: "Alice acquired leadership role"
5. END: Store raw message in `rp-session-123-world`
6. END: Store enriched message in `rp-session-123-character-alice`
7. END: Store enriched message in `rp-session-123-character-bob`
8. Charlie receives nothing (not a participant)

### B.2 World State Update Flow
1. Data store changes: `location` from "tavern" to "dragon_lair"
2. World Agent stores in world container:
   - Content: "The party moved from the tavern to the Dragon's Lair. GameDay: 6"
   - Metadata: `type: "world_state_update"`, `location: "dragon_lair"`, `previousLocation: "tavern"`
3. On next character turn, World Agent includes this in relevant world knowledge

### B.3 Character Update Flow
1. Alice acquires item (from agent flow or game logic)
2. World Agent stores in world container:
   - Content: "Alice acquired the Sacred Sword. GameDay: 7"
   - Metadata: `type: "character_update"`, `characterId: "character-alice"`, `updateType: "item_acquired"`
3. On next turn, World Agent includes this in relevant world knowledge for participants

---

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Draft - Pending Implementation Details
