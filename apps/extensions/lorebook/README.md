# Lorebook Auto-Extraction Extension

Automatically detects lorebook-worthy information in conversations and suggests adding entries to character lorebooks.

## Overview

The Lorebook Extension runs **asynchronously** alongside the NPC extraction plugin, analyzing messages for important character information that should be saved to character lorebooks. It uses AI to extract relevant information, tracks what's already been added or rejected, and presents suggestions to the user for confirmation.

## Features

- **🤖 Intelligent Extraction**: Uses AI to identify lorebook-worthy information
- **📚 Context-Aware**: Considers existing lorebook entries and rejected suggestions
- **👤 Character-Specific**: Tracks lorebook entries per character
- **✅ User Confirmation**: Requires user approval before adding entries
- **🚫 Rejection Tracking**: Remembers what user declined to avoid re-suggesting
- **⚡ Async Processing**: Doesn't block message generation

## What is Lorebook-Worthy?

The AI looks for:
- **Character abilities/powers**: "ren: can cast fireball magic"
- **Character backstory**: "victor: grew up in an orphanage"
- **Character traits**: "yui: extremely loyal to her friends"
- **Character relationships**: "ren: childhood friends with yui"
- **Important events**: "victor: witnessed the great fire 10 years ago"
- **Character knowledge/skills**: "ren: studied at the magic academy"
- **Physical characteristics**: "victor: has a scar on his left arm"
- **World lore**: "world: magic is forbidden in the capital city"

## Architecture

### Files

```
lorebook/
├── lorebook-plugin.ts              # Main plugin class
├── lorebook-extraction-agent.ts    # AI extraction logic
├── lorebook-entry-creation.ts      # Entry creation functions
├── lorebook-store.ts               # Zustand state management
├── index.ts                        # Exports
└── README.md                       # This file
```

### State Management (lorebook-store.ts)

The store tracks three types of entries:

1. **Existing Entries** (`LorebookEntryData[]`)
   - Lorebook entries that have been confirmed and added to character cards
   - Used to avoid duplicate suggestions

2. **Rejected Entries** (`RejectedLorebookEntry[]`)
   - Entries that the user declined to add
   - AI won't suggest these again

3. **Pending Entries** (`PendingLorebookEntry[]`)
   - New suggestions awaiting user confirmation
   - Shown in UI for user to accept/reject

### Extraction Agent (lorebook-extraction-agent.ts)

Similar to NPC extraction, the agent:
- Receives current message + recent context
- Gets existing lorebook entries per character
- Gets rejected entries per character
- Analyzes for lorebook-worthy information
- Returns only NEW suggestions (not duplicates or rejected)

**Prompt Structure:**
```
CHARACTERS WITH THEIR LOREBOOKS:
CHARACTER: Ren (ID: ren-123)
  Existing Lorebook Entries:
    * Ren's Magic: ren: can use fire magic [keys: fire, magic, fireball]
  Rejected Lorebook Entries:
    * Ren's Age: ren: is 16 years old (rejected: too trivial)

CURRENT MESSAGE:
Victor: Victor closed his eyes and lifted the cup with his mind.

WORLD CONTEXT:
1. Magic is common in this world...
```

### Entry Creation (lorebook-entry-creation.ts)

Functions to manage the lorebook lifecycle:

- `addLorebookEntryToCharacter()`: Add entry to character card's lorebook
- `confirmPendingLorebookEntry()`: User accepted - add to card and move to existing
- `rejectPendingLorebookEntry()`: User declined - move to rejected

## Integration Points

### 1. Extension Bootstrap

```typescript
// apps/pwa/src/modules/extensions/bootstrap.ts
const { LorebookPlugin } = await import("@extensions/lorebook/lorebook-plugin");
const lorebookPlugin = new LorebookPlugin();
await extensionRegistry.register(lorebookPlugin);
```

### 2. Memory Retrieval (Future)

Lorebook entries will be included in memory context:

```typescript
// memory-retrieval.ts
export async function retrieveCharacterMemories(input) {
  // Get v3/v4 memories...

  // Get lorebook entries
  const lorebookEntries = await retrieveLorebookEntries({
    characterId: input.characterId,
    recentMessages: input.recentMessages,
  });

  return {
    memories: [...v4Results, ...lorebookEntries],
    count: v4Results.length + lorebookEntries.length,
  };
}
```

### 3. User Confirmation UI (TODO)

Need to create UI component to show pending entries:

```typescript
// components/lorebook-confirmation-toast.tsx
export function LorebookConfirmationToast({ entry }) {
  return (
    <Toast>
      <div>📚 Add to {entry.characterName}'s lorebook?</div>
      <div>{entry.content}</div>
      <button onClick={() => confirmPendingLorebookEntry(client, entry.id)}>
        Add
      </button>
      <button onClick={() => rejectPendingLorebookEntry(entry.id)}>
        Skip
      </button>
    </Toast>
  );
}
```

## Example Flow

**1. Message Generated:**
```
Victor: *Victor closed his eyes and lifted his hand. The cup on the table began to float.*
```

**2. AI Extraction:**
```json
{
  "entries": [
    {
      "characterName": "Victor",
      "characterId": "victor-123",
      "name": "Victor's Telekinesis",
      "keys": ["telekinesis", "psychic", "levitate", "mind"],
      "content": "victor: has telekinetic abilities and can move objects with his mind"
    }
  ]
}
```

**3. Added to Pending:**
Entry added to `pendingEntries` in store.

**4. User Confirmation:**
UI shows: "📚 Add to Victor's lorebook? victor: has telekinetic abilities..."

**5. User Clicks "Add":**
- Entry added to Victor's character card lorebook
- Moved from `pendingEntries` to `entries` in store
- Future mentions of "telekinesis" will include this in context

**OR User Clicks "Skip":**
- Entry moved from `pendingEntries` to `rejectedEntries`
- AI won't suggest this again

## Usage in Code

```typescript
// Get pending entries for a session
const pending = useLorebookStore.getState().getPendingEntriesBySession(sessionId);

// Confirm an entry
await confirmPendingLorebookEntry(client, pendingId, sessionId);

// Reject an entry
rejectPendingLorebookEntry(pendingId, "Not important enough");

// Get character's existing lorebook entries
const entries = useLorebookStore.getState().getEntriesByCharacter(characterId, sessionId);
```

## Benefits

✅ **Automatic Knowledge Capture**: Never lose important character details
✅ **User Control**: User decides what gets added
✅ **Duplicate Prevention**: Tracks existing and rejected entries
✅ **Context Enhancement**: Lorebook entries enrich future AI responses
✅ **Character-Specific**: Each character maintains their own lore
✅ **Non-Blocking**: Runs async, doesn't slow down conversations

## Future Enhancements

- [ ] UI component for pending entry confirmations
- [ ] Bulk confirm/reject multiple entries
- [ ] Edit lorebook entries from UI
- [ ] Export/import lorebook entries
- [ ] Auto-confirm for certain patterns (if user enables)
- [ ] Integration with memory retrieval system
- [ ] World lorebook for setting-wide lore
