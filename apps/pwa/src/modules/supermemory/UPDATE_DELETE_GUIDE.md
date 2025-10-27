# Supermemory Update & Delete Operations Guide

> Implementation of Supermemory v3 update and delete operations for the roleplay memory system

## Table of Contents

- [Overview](#overview)
- [Client Layer](#client-layer)
- [Storage Layer](#storage-layer)
- [Session Layer](#session-layer)
- [Usage Examples](#usage-examples)

## Overview

This implementation provides full support for Supermemory v3's update and delete operations, including:

- **Direct Updates** - Update memories by ID
- **Upserts with customId** - Idempotent operations
- **Single Delete** - Delete individual memories
- **Bulk Delete** - Delete multiple memories or entire containers
- **Get Operations** - Retrieve specific memories

## Client Layer

### Location
`apps/pwa/src/modules/supermemory/shared/client.ts`

### Available Methods

```typescript
// Get memory by ID
const memory = await memoryClient.memories.get(memoryId);

// Update memory by ID
const result = await memoryClient.memories.update(memoryId, {
  content: 'Updated content',
  metadata: { version: 2 }
});

// Delete single memory
const result = await memoryClient.memories.delete(memoryId);

// Bulk delete by IDs
const result = await memoryClient.memories.bulkDelete({
  ids: ['memory_id_1', 'memory_id_2', 'memory_id_3']
});

// Bulk delete by container tags
const result = await memoryClient.memories.bulkDelete({
  containerTags: ['session_123::world', 'session_123::character_456']
});
```

### Upserts with customId

For idempotent operations, use `customId` when adding memories:

```typescript
// First call creates memory
const created = await memoryClient.memories.add({
  containerTag: 'session_123::character_456',
  content: 'Initial content',
  customId: 'user-note-001',
  metadata: { version: 1 }
});

// Second call with same customId updates existing memory
const updated = await memoryClient.memories.add({
  containerTag: 'session_123::character_456',
  content: 'Updated content',
  customId: 'user-note-001',  // Same customId = upsert
  metadata: { version: 2 }
});

// Both operations return the same memory ID
console.log(created.id === updated.id); // true
```

## Storage Layer

### Location
`apps/pwa/src/modules/supermemory/roleplay-memory/core/memory-storage.ts`

### Available Functions

#### Get Operations

```typescript
import { getMemoryById } from '@/modules/supermemory/roleplay-memory';

// Get memory by ID
const memory = await getMemoryById('memory_id_123');
if (memory) {
  console.log('Memory content:', memory.content);
  console.log('Memory metadata:', memory.metadata);
  console.log('Container tag:', memory.containerTag);
}
```

#### Update Operations

```typescript
import {
  updateMemoryById,
  updateCharacterMessage,
  updateWorldMessage
} from '@/modules/supermemory/roleplay-memory';

// Generic update (works for any memory type)
const result = await updateMemoryById(
  'memory_id_123',
  'Updated content',
  { version: 2, updated: true }
);

// Update character message (enriched content)
const charResult = await updateCharacterMessage(
  'memory_id_456',
  'Updated enriched content',
  { game_time: 5 }
);

// Update world message (raw content)
const worldResult = await updateWorldMessage(
  'memory_id_789',
  'Updated world message',
  { participants: ['char_1', 'char_2'] }
);

if (result.success) {
  console.log('Memory updated:', result.id);
  console.log('Processing status:', result.status); // "queued"
}
```

#### Delete Operations

```typescript
import {
  deleteMemoryById,
  deleteCharacterMessage,
  deleteWorldMessage,
  deleteByContainer,
  bulkDeleteByIds
} from '@/modules/supermemory/roleplay-memory';

// Delete single memory
const result = await deleteMemoryById('memory_id_123');
if (result.success) {
  console.log('Memory deleted');
}

// Delete character message
await deleteCharacterMessage('memory_id_456');

// Delete world message
await deleteWorldMessage('memory_id_789');

// Delete entire container (all memories in a character or world container)
const containerResult = await deleteByContainer('session_123::character_456');
console.log(`Deleted ${containerResult.deletedCount} memories`);

// Bulk delete by IDs (max 100 per request)
const bulkResult = await bulkDeleteByIds([
  'memory_id_1',
  'memory_id_2',
  'memory_id_3'
]);
console.log(`Deleted ${bulkResult.deletedCount} memories`);
```

## Session Layer

### Location
`apps/pwa/src/modules/supermemory/roleplay-memory/integration/session-hooks.ts`

### Available Hooks

These are the recommended high-level functions for session management:

```typescript
import {
  getMemory,
  updateMemory,
  deleteMemory,
  deleteContainerMemories,
  bulkDeleteMemories
} from '@/modules/supermemory/roleplay-memory';

// Get memory
const memory = await getMemory('memory_id_123');

// Update memory
const result = await updateMemory(
  'memory_id_123',
  'Updated content',
  { game_time: 5 }
);

// Delete single memory
await deleteMemory('memory_id_123');

// Delete all memories in a character container
await deleteContainerMemories('session_123', 'character_456');

// Delete all memories in world container
await deleteContainerMemories('session_123');

// Bulk delete by IDs
await bulkDeleteMemories([
  'memory_id_1',
  'memory_id_2',
  'memory_id_3'
]);
```

## Usage Examples

### Example 1: Update Character Memory After Edit

```typescript
import { getMemory, updateMemory } from '@/modules/supermemory/roleplay-memory';

async function editCharacterMemory(memoryId: string, newContent: string) {
  // Get existing memory to preserve metadata
  const existing = await getMemory(memoryId);
  if (!existing) {
    console.error('Memory not found');
    return;
  }

  // Update with new content, preserving metadata
  const result = await updateMemory(
    memoryId,
    newContent,
    {
      ...existing.metadata,
      updated_at: Date.now()
    }
  );

  if (result.success) {
    console.log('Memory updated successfully');
  }
}
```

### Example 2: Delete Old Memories Before Game Time

```typescript
import { memoryClient } from '@/modules/supermemory/shared/client';
import { bulkDeleteMemories } from '@/modules/supermemory/roleplay-memory';

async function cleanupOldMemories(containerTag: string, beforeGameTime: number) {
  // Search for old memories
  const searchResult = await memoryClient.search.memories({
    q: `GameTime before ${beforeGameTime}`,
    containerTag,
    limit: 100
  });

  // Extract memory IDs from search results
  const oldMemoryIds = searchResult.results
    .filter(r => r.metadata?.game_time < beforeGameTime)
    .map(r => r.id);

  if (oldMemoryIds.length === 0) {
    console.log('No old memories to delete');
    return;
  }

  // Bulk delete old memories
  const result = await bulkDeleteMemories(oldMemoryIds);
  console.log(`Deleted ${result.deletedCount} old memories`);
}
```

### Example 3: Clear All Session Memories

```typescript
import { deleteContainerMemories } from '@/modules/supermemory/roleplay-memory';

async function clearSessionMemories(sessionId: string, characterIds: string[]) {
  // Delete world container
  const worldResult = await deleteContainerMemories(sessionId);
  console.log(`Deleted ${worldResult.deletedCount} world memories`);

  // Delete all character containers
  for (const characterId of characterIds) {
    const charResult = await deleteContainerMemories(sessionId, characterId);
    console.log(`Deleted ${charResult.deletedCount} memories for character ${characterId}`);
  }
}
```

### Example 4: Soft Delete Pattern

If you need recoverable deletes, implement soft delete using metadata:

```typescript
import { updateMemory, memoryClient } from '@/modules/supermemory/roleplay-memory';

async function softDeleteMemory(memoryId: string, userId: string) {
  // Mark as deleted using metadata
  await updateMemory(memoryId, undefined, {
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: userId
  });
}

async function getActiveMemories(containerTag: string) {
  // Search excluding deleted memories
  const result = await memoryClient.search.memories({
    q: 'NOT deleted:true',
    containerTag,
    limit: 100
  });
  return result;
}

async function restoreMemory(memoryId: string) {
  // Remove deleted flag
  await updateMemory(memoryId, undefined, {
    deleted: false,
    restoredAt: new Date().toISOString()
  });
}
```

### Example 5: Batch Update with Retry

```typescript
import { updateMemory } from '@/modules/supermemory/roleplay-memory';

async function batchUpdateMemories(
  updates: Array<{ id: string; content?: string; metadata?: any }>
) {
  const results = [];

  for (const update of updates) {
    try {
      const result = await updateMemory(
        update.id,
        update.content,
        update.metadata
      );
      results.push({ id: update.id, success: result.success });
    } catch (error) {
      console.error(`Failed to update memory ${update.id}:`, error);
      results.push({ id: update.id, success: false, error });
    }

    // Brief delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Updated ${successCount} of ${updates.length} memories`);
  return results;
}
```

## Types

### Request/Response Types

```typescript
// Get Memory
interface GetMemoryResponse {
  id: string;
  containerTag: string;
  content: string;
  metadata: MemoryMetadata;
  customId?: string;
  status?: string;
}

// Update Memory
interface UpdateStorageResult {
  id: string | null;
  success: boolean;
  status?: string; // "queued" for reprocessing
  error?: string;
}

// Delete Memory
interface DeleteStorageResult {
  success: boolean;
  error?: string;
  deletedCount?: number;
}

// Bulk Delete
interface BulkDeleteResponse {
  success: boolean;
  deletedCount: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
  containerTags?: string[];
}
```

## Best Practices

### 1. Always Check Success Status

```typescript
const result = await updateMemory(memoryId, content);
if (!result.success) {
  console.error('Update failed:', result.error);
  // Handle error appropriately
}
```

### 2. Preserve Metadata When Updating

```typescript
// Get existing memory first
const existing = await getMemory(memoryId);

// Update while preserving important metadata
await updateMemory(memoryId, newContent, {
  ...existing.metadata,
  version: (existing.metadata.version || 0) + 1
});
```

### 3. Use Bulk Operations for Multiple Deletes

```typescript
// Instead of multiple single deletes:
for (const id of ids) {
  await deleteMemory(id); // ❌ Slow
}

// Use bulk delete:
await bulkDeleteMemories(ids); // ✅ Fast
```

### 4. Handle Rate Limits for Large Batches

```typescript
// Process in batches of 100 with delays
const batchSize = 100;
for (let i = 0; i < allIds.length; i += batchSize) {
  const batch = allIds.slice(i, i + batchSize);
  await bulkDeleteMemories(batch);

  // Brief delay between batches
  if (i + batchSize < allIds.length) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 5. Consider Soft Delete for Important Data

Hard deletes are permanent with no recovery mechanism. For user data or important memories, implement soft delete patterns using metadata flags.

## API Endpoints

All operations use the following Supermemory v3 endpoints:

- `GET /api/documents/{id}` - Get memory
- `PATCH /api/documents/{id}` - Update memory
- `DELETE /api/documents/{id}` - Delete memory
- `DELETE /api/documents/bulk` - Bulk delete
- `POST /api/documents` - Add/upsert memory (with customId)

## Error Handling

All operations return structured results with success/error information:

```typescript
try {
  const result = await updateMemory(memoryId, content);
  if (!result.success) {
    // Handle expected failures
    console.error('Update failed:', result.error);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Logging

All operations include debug logging using the app's logger:

- `[Memory Storage] Retrieved memory: {id}`
- `[Memory Storage] Updated memory: {id}`
- `[Memory Storage] Deleted memory: {id}`
- `[Memory Storage] Deleted {count} memories from container: {tag}`

Check console logs for operation details and troubleshooting.
