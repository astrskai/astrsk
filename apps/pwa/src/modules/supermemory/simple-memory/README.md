# Simple Memory POC

This is the original Supermemory POC implementation that was refactored into this folder.

## Original Implementation

This POC demonstrates basic Supermemory integration:
- Store conversation turns to Supermemory
- Retrieve relevant memories for a session
- Format memories for injection into agent prompts

## Files

- `memory-service.ts` - Core memory storage and retrieval functions
- `index.ts` - Public API exports

## Usage

```typescript
import { storeConversationMemory, retrieveSessionMemories } from '@/modules/supermemory/simple-memory'

// Store conversation
await storeConversationMemory(sessionId, turns, agentId)

// Retrieve memories
const memories = await retrieveSessionMemories(sessionId, query, limit)
```

## Tag Detection

This POC uses `###SUPERMEMORY###` placeholder tag for memory injection.

## Migration Note

This POC has been refactored from the root `supermemory/` module to maintain backward compatibility while the new roleplay memory system is being developed in `roleplay-memory/`.
