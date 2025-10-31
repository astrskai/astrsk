# Supermemory Extension

Semantic memory system for long-term roleplay context in Astrsk sessions.

## Overview

The Supermemory extension integrates with the [Supermemory](https://supermemory.ai) semantic memory service to provide long-term context retention for roleplay sessions. It automatically stores, recalls, and manages conversation memories using vector embeddings for semantic search.

## Features

- **Automatic Memory Storage**: Stores messages in semantic memory containers after each turn
- **Intelligent Recall**: Retrieves relevant memories before message generation using semantic search
- **Container System**: Separate memory containers for world context and individual characters
- **Memory Updates**: Synchronizes memory entries when messages are edited
- **Memory Cleanup**: Automatically removes memories when turns are deleted
- **World Agent Integration**: Enriches character memories with world state context

## Architecture

### Memory Containers

1. **World Container**: Stores shared world state and events
2. **Character Containers**: One per character, stores character-specific memories

### Memory Flow

```
Session Created
    ↓
Initialize Containers (session:afterCreate)
    ↓
Message Generation Begins (message:beforeGenerate)
    ↓
Recall Relevant Memories
    ↓
Inject Memories into Prompt
    ↓
Message Generated
    ↓
Store New Memory (turn:afterCreate)
    ↓
Update Memory (turn:beforeUpdate)
    |
Delete Memory (turn:afterDelete)
```

## File Structure

```
supermemory/
├── supermemory-extension.ts     # Main extension class with hook handlers
├── index.ts                     # Public exports
│
├── roleplay-memory/
│   ├── core/
│   │   ├── containers.ts        # Memory container creation/validation
│   │   ├── memory-storage.ts    # Memory CRUD operations
│   │   ├── memory-retrieval.ts  # Semantic search and recall
│   │   └── world-agent.ts       # World context enrichment
│   │
│   ├── integration/
│   │   └── session-hooks.ts     # Session lifecycle integration helpers
│   │
│   ├── utils/
│   │   └── world-context.ts     # World context parsing utilities
│   │
│   ├── debug/
│   │   └── debug-helpers.ts     # Debug utilities
│   │
│   └── index.ts                 # Public roleplay memory API
│
└── shared/
    ├── client.ts                # Supermemory API client initialization
    ├── types.ts                 # Shared TypeScript types
    └── utils.ts                 # Shared utility functions
```

## Usage

The extension is automatically loaded by the extension system at bootstrap. No manual initialization is required.

### Extension Hooks

The extension listens to these lifecycle hooks:

- `session:afterCreate`: Initialize memory containers
- `message:beforeGenerate`: Recall and inject relevant memories
- `turn:afterCreate`: Store new message in memory
- `turn:beforeUpdate`: Update existing memory entry
- `turn:afterDelete`: Clean up deleted memory

### Configuration

Memory storage requires a Supermemory API key. Configure via environment variables:

```bash
SUPERMEMORY_API_KEY=your_api_key
```

## Development

### Adding New Memory Operations

To add new memory operations, extend the `supermemory-extension.ts` class with new hook handlers:

```typescript
private handleCustomHook = async (context: HookContext): Promise<void> => {
  // Your memory operation logic
};
```

### Debugging

The extension logs all operations to the console with the `🧠 [Supermemory Extension]` prefix. Enable debug mode for detailed logging:

```typescript
console.log("[Supermemory Extension] Debug info:", data);
```

## Dependencies

- `supermemory` - Official Supermemory JavaScript client
- Extension System APIs via `IExtensionClient`

## Integration Points

The extension integrates with these Astrsk systems:

1. **Session System**: Creates containers on session initialization
2. **Turn System**: Stores and updates memories on turn changes
3. **Message Generation**: Injects recalled memories into prompts
4. **World Agent**: Enriches memories with world context

## Future Enhancements

- [ ] Memory importance scoring
- [ ] Automatic memory consolidation
- [ ] Character-specific memory preferences
- [ ] Memory search UI component
- [ ] Memory analytics dashboard
- [ ] Cross-session memory sharing

## License

Same as main Astrsk project.
