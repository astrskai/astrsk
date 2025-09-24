# Supermemory Integration

This module provides integration with Supermemory API to persist and retrieve conversation history for agents with history messages enabled.

## Overview

The Supermemory integration allows agents to:
1. **Store conversation turns** - Automatically save user/assistant message pairs after each interaction
2. **Retrieve relevant memories** - Load previous conversations when starting new sessions
3. **Inject context** - Add retrieved memories to the agent's system prompt for continuity

## How It Works

### 1. Memory Storage

When an agent with history messages completes a response, the system:
- Captures the last user message and assistant response
- Formats them as a conversation turn pair
- Stores them to Supermemory with agent and session metadata

```typescript
// Automatically triggered in executeAgentNode after response generation
await storeConversationMemory(
  agentId,
  [
    { role: 'user', content: 'User message' },
    { role: 'assistant', content: 'Agent response' }
  ],
  sessionId
);
```

### 2. Memory Retrieval

When an agent with history messages starts processing:
- Retrieves top 3-5 relevant memories for the agent
- Formats them as context
- Injects into the system prompt

```typescript
// Automatically triggered in executeAgentNode before message rendering
const memories = await retrieveAgentMemories(agentId);
const context = formatMemoriesForPrompt(memories);
// Context is injected into the first system message
```

### 3. Configuration

Set these environment variables in your `.env` file:

```env
VITE_SUPERMEMORY_API_KEY=your_api_key_here
VITE_SUPERMEMORY_BASE_URL=https://api.supermemory.ai  # Optional
```

## Features

- **Automatic detection** - Only processes agents with history messages enabled
- **Graceful degradation** - Continues working even if Supermemory is unavailable
- **Efficient storage** - Stores conversation pairs (2 messages at a time)
- **Semantic search** - Retrieves relevant memories based on context
- **Simple integration** - No changes needed to existing agent configurations

## Usage

### Enable for an Agent

Agents automatically use Supermemory when they have history messages configured:

```typescript
// In your agent configuration
{
  promptMessages: [
    { type: 'system', content: 'You are a helpful assistant' },
    { type: 'history' },  // This enables Supermemory integration
    { type: 'user', content: '{input}' }
  ]
}
```

### Manual Usage

You can also manually use the memory service:

```typescript
import { 
  storeConversationMemory, 
  retrieveAgentMemories 
} from '@/modules/supermemory/memory-service';

// Store a conversation
await storeConversationMemory(
  'agent-123',
  [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ],
  'session-456'
);

// Retrieve memories
const memories = await retrieveAgentMemories('agent-123');
```

## Testing

Run tests with:

```bash
npm test src/modules/supermemory
```

## Architecture

```
session-play-service.ts
    ↓
executeAgentNode()
    ↓
    ├─→ retrieveAgentMemories() [Before inference]
    │      ↓
    │   Inject into system prompt
    │
    ├─→ [Agent inference happens]
    │
    └─→ storeConversationMemory() [After inference]
           ↓
        Save to Supermemory
```

## Error Handling

- All errors are logged but not thrown
- Service continues without memory features if unavailable
- No user-facing errors for memory operations

## Limitations

- Stores only the last 2 messages (user + assistant)
- Retrieves maximum 3-5 memories per session
- Requires API key configuration
- No user-specific memory isolation (uses agent ID as context)

## Future Enhancements

- [ ] Batch storage for multiple turn pairs
- [ ] Configurable memory retention policies
- [ ] User-specific memory contexts
- [ ] Memory management UI
- [ ] Local caching for frequently accessed memories
- [ ] Advanced search with filters