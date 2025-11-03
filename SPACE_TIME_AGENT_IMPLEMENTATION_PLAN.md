# Space-Time Agent Implementation Plan

## Overview
Replace the `game_time` system with a **Space-Time Agent** that tracks WHERE and WHEN conversations happen using "scenes" (plain English descriptions of location + time).

## Architecture Changes

### Current System (To Remove)
- ❌ `game_time` (number)
- ❌ `game_time_interval` (string)
- ❌ `delta_time` (World Agent output)
- ❌ `actualParticipants` (World Agent output)
- ❌ World Agent detects participants from message content alone

### New System
- ✅ `scene_pool` (array of scene strings, max 20, FIFO)
- ✅ `selected_scene` (current scene string)
- ✅ `character_scenes` (map of characterName → scene) - NEW: World Agent output
- ✅ Space-Time Agent (selects/creates scenes BEFORE World Agent)
- ✅ World Agent assigns `character_scenes` for ALL mentioned characters
- ✅ **Participants = derived from `character_scenes[charName] === selected_scene`**

### Key Decision: No actualParticipants Output
**Participants are now DERIVED, not detected:**
- World Agent outputs: `characterSceneUpdates` only
- System derives participants: `filter(character_scenes, scene === selected_scene)`
- Cleaner separation of concerns: World Agent tracks location, system handles logic

---

## Implementation Steps

### ✅ Phase 1: Space-Time Agent Core (COMPLETED)

**File:** `/apps/extensions/supermemory/roleplay-memory/core/space-time-agent.ts`

**Status:** DONE
- Created Space-Time Agent with structured output
- Zod schema with `action: "select" | "new"` and `scene: string`
- Validation logic with retry (max 2 attempts)
- Falls back to "new" if agent says "select" but scene not in pool

---

### 🔄 Phase 2: World Agent Updates (IN PROGRESS)

**File:** `/apps/extensions/supermemory/roleplay-memory/core/world-agent.ts`

**Changes Needed:**

1. **Update Input Interface:**
```typescript
interface WorldAgentInput {
  generatedMessage: string;
  recentMessages: Array<{role, content}>;
  dataStore: {
    sessionId: string;
    selectedScene: string;           // NEW: From Space-Time Agent
    characterScenes: Record<string, string>;  // NEW: {charId: scene}
    participants: string[];          // Keep for output
    worldContext: string;
  };
  speakerCharacterId: string;
  speakerName: string;
  // ... other fields
}
```

2. **Update Output Schema:**
```typescript
const worldAgentSchema = z.object({
  worldContextUpdates: z.array(z.object({
    characterName: z.string(),
    contextUpdate: z.string(),
  })),
  characterSceneUpdates: z.record(z.string()).describe(
    "Map of ALL character names to their scenes. " +
    "Include speaker + anyone they interact with/mention. " +
    "Use selectedScene if they're in current scene. " +
    "Use different scene if they moved elsewhere. " +
    "Use 'none' if location unknown."
  ),
});
```

3. **Update Prompt:**
   - Remove `delta_time` and `actualParticipants` detection
   - Explain Space-Time Agent already selected the scene
   - World Agent's job: Assign characters to scenes based on message analysis
   - Include ALL mentioned characters in `characterSceneUpdates`
   - Explain: Participants will be derived from `scene === selectedScene`

4. **Update Participant Derivation Logic (in supermemory-extension):**
```typescript
// Derive participants from characterScenes
const participantNames = Object.entries(updatedCharacterScenes)
  .filter(([name, scene]) => scene === selectedScene)
  .map(([name]) => name);

// Ensure speaker is always included
if (!participantNames.includes(speakerName)) {
  participantNames.push(speakerName);
  updatedCharacterScenes[speakerName] = selectedScene;
}
```

5. **Update Validation:**
   - Remove validation for `actualParticipants` and `delta_time`
   - Add validation for `characterSceneUpdates` (must include speaker)

**Estimated Time:** 1-2 hours

---

### Phase 3: Memory Storage Updates

#### 3.1 Update Types

**File:** `/apps/extensions/supermemory/shared/types.ts`

**Changes:**
```typescript
// REMOVE these interfaces/fields:
- game_time: number
- game_time_interval: string
- delta_time: number

// ADD to MemoryMetadata:
export interface MemoryMetadata {
  scene: string;                     // NEW: "Classroom Morning Day 1"
  speaker: string;
  participants: string[];
  isSpeaker?: boolean;
  type: "message" | "scenario" | "init";
  permanent?: boolean;
}

// UPDATE EnrichedMessageSections:
export interface EnrichedMessageSections {
  scene: string;                     // CHANGED: was "currentTime"
  participants?: string;
  message: string;
  worldContext?: string;
}

// UPDATE WorldAgentOutput:
export interface WorldAgentOutput {
  actualParticipants: string[];
  worldContextUpdates: Array<{
    characterName: string;
    contextUpdate: string;
  }>;
  characterSceneUpdates: Record<string, string>;  // NEW
  // REMOVE: delta_time
}
```

**Estimated Time:** 30 minutes

---

#### 3.2 Update Memory Storage Functions

**File:** `/apps/extensions/supermemory/roleplay-memory/core/memory-storage.ts`

**Changes:**

1. **Update `buildEnrichedMessage`:**
```typescript
export function buildEnrichedMessage(
  sections: EnrichedMessageSections,
): string {
  const parts: string[] = [];

  // Section 1: Scene (was "Current time")
  parts.push(sections.scene);  // e.g., "###Scene###\nClassroom Morning Day 1"

  // Section 2: Participants (optional)
  if (sections.participants && sections.participants.trim()) {
    parts.push(sections.participants);
  }

  // Section 3: Message (required)
  parts.push(sections.message);

  // Section 4: World context (optional)
  if (sections.worldContext && sections.worldContext.trim()) {
    parts.push(sections.worldContext);
  }

  return parts.join("\n\n");
}
```

2. **Update `storeWorldMessage`:**
```typescript
// Change metadata structure:
await memoryClient.memories.add({
  containerTag,
  content,
  metadata: {
    scene: metadata.scene,           // NEW (was game_time + game_time_interval)
    speaker: metadata.speaker,
    participants: metadata.participants,
    type: metadata.type,
    permanent: metadata.permanent,
  },
});
```

3. **Update `storeCharacterMessage`:**
```typescript
// Change metadata structure (same as above)
```

4. **Update validation functions:**
   - Remove checks for `game_time` and `game_time_interval`
   - Add checks for `scene` field

**Estimated Time:** 1 hour

---

#### 3.3 Update Memory Distribution

**File:** `/apps/extensions/supermemory/roleplay-memory/integration/session-hooks.ts`

**Changes:**

1. **Update `distributeMemories` interface:**
```typescript
export async function distributeMemories(input: {
  sessionId: string;
  speakerCharacterId: string;
  speakerName: string;
  message: string;
  scene: string;                    // NEW (was game_time, game_time_interval)
  dataStore: {
    sessionId: string;
    selectedScene: string;
    characterScenes: Record<string, string>;
    participants: string[];
    worldContext: string;
  };
  worldAgentOutput: WorldAgentOutput;
  getCard: Function;
  session: any;
}): Promise<string[]>
```

2. **Update world message format:**
```typescript
// OLD: formatMessageWithGameTime(speakerName, message, game_time, game_time_interval)
// NEW:
const worldMessageContent = `Scene: ${scene}\nMessage: ${speakerName}: ${message}`;
```

3. **Update world message metadata:**
```typescript
const worldStoreResult = await storeWorldMessage(worldContainer, worldMessageContent, {
  scene: scene,                     // NEW
  speaker: speakerCharacterId,
  participants: participantIds,
  type: "message",
});
```

4. **Update character message sections:**
```typescript
const distributionPromises = participantIds.map((participantId) => {
  // Build enriched message sections
  const sceneSection = `###Scene###\n${scene}`;  // NEW (was currentTime)

  const participantsSection = actualParticipants.length > 0
    ? `###Participants###\n${actualParticipants.join(", ")}`
    : undefined;

  const messageSection = `###Message###\nMessage: ${speakerName}: ${message}`;

  // ... rest of the code

  const enrichedContent = buildEnrichedMessage({
    scene: sceneSection,             // CHANGED
    participants: participantsSection,
    message: messageSection,
    worldContext: worldContextSection,
  });

  return storeCharacterMessage(participantContainer, enrichedContent, {
    scene: scene,                    // NEW
    speaker: speakerCharacterId,
    participants: participantIds,
    isSpeaker: participantId === speakerCharacterId,
    type: "message",
  });
});
```

5. **Update `storeScenarioMessages`:**
```typescript
// Change from game_time to scene for scenario storage
await memoryClient.memories.add({
  containerTag: worldContainer,
  content: `[Scenario] ${message.content}`,
  metadata: {
    scene: "Scenario Initial",      // NEW (was game_time: 0, game_time_interval: "Day")
    type: "scenario",
    permanent: true,
  },
});
```

**Estimated Time:** 2 hours

---

### Phase 4: Memory Retrieval Updates

**File:** `/apps/extensions/supermemory/roleplay-memory/core/memory-retrieval.ts`

**Changes:**

1. **Update `recallCharacterMemories` interface:**
```typescript
export async function recallCharacterMemories(input: {
  sessionId: string;
  characterId: string;
  characterName: string;
  current_scene: string;            // NEW (was current_game_time, current_game_time_interval)
  recentMessages: Array<{role, content}>;
  limit?: number;
  worldContext?: string;
  getCard: Function;
}): Promise<string | null>
```

2. **Update query format:**
```typescript
// Build query string
const queryString = `###Scene###
Scene: ${current_scene}

###Recent messages###
${formattedMessages}

What are the relevant memories that are not in the recent messages
to construct ${characterName}'s next message?`;
```

3. **Update search calls:**
   - No metadata filtering changes needed (we don't filter by time)
   - Just update the query string format

**Estimated Time:** 30 minutes

---

### Phase 5: Supermemory Extension Updates

**File:** `/apps/extensions/supermemory/supermemory-extension.ts`

**Changes:**

1. **Update `handleTurnAfterCreate` (PARTIALLY DONE):**
   - ✅ Import Space-Time Agent
   - ✅ Execute Space-Time Agent
   - ✅ Update scene pool logic
   - ✅ Execute World Agent with scene context
   - ⚠️ Update `distributeMemories` call to use scene
   - ⚠️ Update dataStore saving logic

2. **Update distributeMemories call:**
```typescript
const memoryIds = await distributeMemories({
  sessionId,
  speakerCharacterId,
  speakerName,
  message,
  scene: selectedScene,              // NEW (was game_time, game_time_interval)
  dataStore: {
    sessionId,
    selectedScene: selectedScene,
    characterScenes: updatedCharacterScenes,
    participants: worldAgentOutput.actualParticipants || [],
    worldContext: worldAgentOutput.worldContextUpdates?.[0]?.contextUpdate || "",
  },
  worldAgentOutput,
  getCard: this.client.api.getCard.bind(this.client.api),
  session,
});
```

3. **Update dataStore saving:**
```typescript
// 1. Save memory IDs (keep as is)
if (memoryIds.length > 0) {
  // ... existing code
}

// 2. Save scene_pool (NEW)
const scenePoolField = turn.dataStore.find((f) => f.name === 'scene_pool');
if (scenePoolField) {
  scenePoolField.value = JSON.stringify(updatedScenePool);
} else {
  turn.dataStore.push({
    id: 'scene_pool',
    name: 'scene_pool',
    type: 'string',
    value: JSON.stringify(updatedScenePool),
  });
}
dataStoreUpdated = true;

// 3. Save selected_scene (NEW)
const selectedSceneField = turn.dataStore.find((f) => f.name === 'selected_scene');
if (selectedSceneField) {
  selectedSceneField.value = selectedScene;
} else {
  turn.dataStore.push({
    id: 'selected_scene',
    name: 'selected_scene',
    type: 'string',
    value: selectedScene,
  });
}
dataStoreUpdated = true;

// 4. Save character_scenes (NEW - from World Agent output)
if (worldAgentOutput.characterSceneUpdates && Object.keys(worldAgentOutput.characterSceneUpdates).length > 0) {
  // Merge with existing character_scenes
  const updatedCharacterScenes = { ...characterScenes, ...worldAgentOutput.characterSceneUpdates };

  const characterScenesField = turn.dataStore.find((f) => f.name === 'character_scenes');
  if (characterScenesField) {
    characterScenesField.value = JSON.stringify(updatedCharacterScenes);
  } else {
    turn.dataStore.push({
      id: 'character_scenes',
      name: 'character_scenes',
      type: 'string',
      value: JSON.stringify(updatedCharacterScenes),
    });
  }
  dataStoreUpdated = true;
}

// 5. Update participants (keep as is)
if (worldAgentOutput.actualParticipants && worldAgentOutput.actualParticipants.length > 0) {
  // ... existing code
}

// 6. Update world_context (keep as is)
if (worldAgentOutput.worldContextUpdates && worldAgentOutput.worldContextUpdates.length > 0) {
  // ... existing code
}

// REMOVE: game_time update logic (lines 562-578)
```

4. **Update `handlePromptAfterRender`:**
```typescript
// Update the memory recall call
const formattedMemories = await recallCharacterMemories({
  sessionId,
  characterId: speakerId,
  characterName: speakerName,
  current_scene: current_selected_scene,    // NEW (was current_game_time, current_game_time_interval)
  recentMessages,
  limit: 20,
  worldContext,
  getCard: this.client!.api.getCard.bind(this.client!.api),
});
```

5. **Update `updateTurnMemories`:**
```typescript
// Update memory update call
const scene = dataStore.find((f) => f.name === 'selected_scene')?.value || "Unknown Scene";

const updatePromises = memoryIds.map(async (memoryId: string) => {
  try {
    const metadata: any = {
      scene: scene,                  // NEW (was game_time, game_time_interval)
    };

    if (participants.length > 0) {
      metadata.participants = participants;
    }

    await updateMemory(
      memoryId,
      turn.content,
      metadata
    );
  } catch (error) {
    console.warn(`[Supermemory Extension] Failed to update memory ${memoryId}:`, error);
  }
});
```

**Estimated Time:** 2 hours

---

### Phase 6: Session Data Schema

**File:** `/apps/extensions/supermemory/supermemory-extension.ts`

**Update `handleSessionAfterCreate`:**
```typescript
// Register Supermemory data schema fields
const existingOrder = session.dataSchemaOrder || [];
const newFields = [
  'memory_ids',
  'participants',
  'world_context',
  'scene_pool',          // NEW
  'selected_scene',      // NEW
  'character_scenes',    // NEW
];

// ... rest of registration logic
```

**Estimated Time:** 15 minutes

---

### Phase 7: Cleanup - Remove game_time

**Files to update:**

1. **Remove from dataStore inheritance:**
   - `/apps/pwa/src/components-v2/session/session-messages-and-user-inputs.tsx`
   - `/apps/pwa/src/app/services/session-play-service.ts`
   - Filter out `game_time` and `game_time_interval` alongside `memory_ids`

2. **Update turn history queries:**
   - Remove `game_time` from turn history map functions
   - Update any queries that reference game_time

3. **Remove from UI (if any):**
   - Check for any UI components displaying game_time
   - Remove or replace with scene display

**Estimated Time:** 1 hour

---

### Phase 8: Migration & Backward Compatibility

**Considerations:**

1. **Existing sessions have `game_time` but no `scene_pool`:**
   - On first message after update, Space-Time Agent creates initial scene
   - Empty scene_pool is valid - agent will create first scene

2. **Existing memories have `game_time` metadata:**
   - Don't need to migrate old memories
   - New memories use scene format
   - Retrieval still works (no metadata filtering by time)

3. **Data schema registration:**
   - Sessions created before update won't have new fields
   - `handleSessionAfterCreate` adds fields on next session open

**No breaking changes - system degrades gracefully**

---

## Testing Strategy

### Unit Tests

1. **Space-Time Agent:**
   - Test scene selection from pool
   - Test new scene creation
   - Test validation & retry logic
   - Test fallback behavior

2. **World Agent:**
   - Test character_scenes update logic
   - Test participant filtering by scene
   - Test scene-based participant detection

3. **Memory Storage:**
   - Test enriched message format with scene
   - Test metadata storage with scene
   - Test validation

### Integration Tests

1. **Full message flow:**
   - Create first message → Space-Time Agent creates scene
   - Create second message in same location → Agent selects existing scene
   - Create message with location change → Agent creates new scene
   - Verify scene_pool FIFO (test with 21+ scenes)

2. **Participant flow:**
   - Character A speaks in "Classroom"
   - Character B speaks in "Park"
   - Character C speaks in "Classroom"
   - Verify only A and C get memories for Classroom messages

3. **Memory recall:**
   - Store memories with scenes
   - Recall memories with current scene
   - Verify correct formatting

### Manual Testing Checklist

- [ ] First message creates scene
- [ ] Continued conversation selects existing scene
- [ ] Scene pool grows correctly
- [ ] Scene pool caps at 20 (FIFO)
- [ ] Characters in different scenes don't get memories
- [ ] Memory format shows scene instead of time
- [ ] Regeneration works with scenes
- [ ] User messages work with scenes
- [ ] Memory recall works with scenes

---

## Files Modified (Summary)

### New Files
1. ✅ `/apps/extensions/supermemory/roleplay-memory/core/space-time-agent.ts`

### Modified Files
2. `/apps/extensions/supermemory/roleplay-memory/core/world-agent.ts`
3. `/apps/extensions/supermemory/shared/types.ts`
4. `/apps/extensions/supermemory/roleplay-memory/core/memory-storage.ts`
5. `/apps/extensions/supermemory/roleplay-memory/integration/session-hooks.ts`
6. `/apps/extensions/supermemory/roleplay-memory/core/memory-retrieval.ts`
7. `/apps/extensions/supermemory/supermemory-extension.ts` (partially done)
8. `/apps/pwa/src/components-v2/session/session-messages-and-user-inputs.tsx` (filter game_time)
9. `/apps/pwa/src/app/services/session-play-service.ts` (filter game_time)

---

## Estimated Total Time

- **Phase 1:** Space-Time Agent Core - ✅ DONE
- **Phase 2:** World Agent Updates - 1-2 hours
- **Phase 3:** Memory Storage Updates - 3.5 hours
- **Phase 4:** Memory Retrieval Updates - 0.5 hours
- **Phase 5:** Supermemory Extension Updates - 2 hours
- **Phase 6:** Session Data Schema - 0.25 hours
- **Phase 7:** Cleanup game_time - 1 hour
- **Phase 8:** Testing - 2 hours

**Total: ~10-12 hours of implementation**

---

## Next Steps

1. Review this plan
2. Decide on implementation approach:
   - All at once (long session)
   - Phase by phase (multiple sessions)
   - Pair programming approach
3. Start with Phase 2 (World Agent updates)

---

## Questions for Review

1. **Character scene initialization:** When a new character is added to session, what should their initial scene be?
   - Same as current selected_scene?
   - "none" until World Agent assigns them?

2. **Scenario storage:** Should scenario messages get a scene, or stay as "Scenario Initial"?

3. **Scene naming validation:** Should we enforce format (e.g., must contain "Day #")?

4. **UI changes:** Should we display current scene somewhere in the UI?

5. **Character scene UI:** Should users be able to manually set character_scenes, or only via World Agent?
