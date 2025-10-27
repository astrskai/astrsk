# Lorebook Extension - Architecture

## Overview

The Lorebook extension automatically detects lorebook-worthy information in conversations and allows users to add them to character lorebooks through an extension-controlled dialog system.

## Key Components

### 1. Extension Plugin (`lorebook-plugin.ts`)
**Responsibilities:**
- Hooks into `message:afterGenerate` to analyze new messages
- Extracts lorebook-worthy information using AI
- **Directly shows confirmation dialogs** using extension UI API
- Handles user responses (add/reject/defer)
- Manages lorebook state through zustand store

**Key Feature:** Extension controls the UI flow directly, no polling required.

```typescript
// Extension shows dialog and waits for response
const userResponse = await client.api.ui.showDialog({
  title: "Add to Character's Lorebook?",
  description: "Review this information",
  content: "...",  // HTML content
  buttons: [
    { label: "Decide Later", variant: "outline", value: "later" },
    { label: "Skip", variant: "ghost", value: "skip" },
    { label: "Add", variant: "default", value: "add" },
  ],
});

if (userResponse === "add") {
  // Add to lorebook
} else if (userResponse === "skip") {
  // Add to rejected list
}
```

### 2. Extension Client UI API (`extension-client.ts`)
**Provides:**
- `client.api.ui.showDialog(config)` - Shows dialog and returns promise
- Secure API boundary - extensions can't access credentials
- Clean abstraction over UI system

### 3. Dialog Manager (`dialog-manager.ts`)
**Responsibilities:**
- Global zustand store for extension-triggered dialogs
- Manages dialog state (open/closed, config, promise resolution)
- `showExtensionDialog(config)` returns promise that resolves to button value

### 4. Dialog Renderer (`extension-dialog-renderer.tsx`)
**Responsibilities:**
- React component that monitors dialog store
- Renders dialogs using reusable `PlainDialog` component
- Placed in `SessionPage` component tree

### 5. Lorebook Store (`lorebook-store.ts`)
**State Management:**
- `entries` - Successfully added lorebook entries
- `rejectedEntries` - User-rejected entries (prevents re-suggesting)
- ~~`pendingEntries`~~ - **No longer used** (dialogs are synchronous now)
- LocalStorage persistence

### 6. Lorebook Extraction Agent (`lorebook-extraction-agent.ts`)
**Responsibilities:**
- AI-powered extraction using simplified schema
- Only outputs `{ name, content }` - plugin generates rest
- Receives existing + rejected entries as context
- Uses secure extension AI API

## Architecture Flow

```
1. User sends message
   ↓
2. Message:afterGenerate hook fires
   ↓
3. Lorebook plugin:
   - Loads character cards from session
   - Loads existing + rejected entries
   - Calls AI extraction agent
   ↓
4. For each extracted entry:
   - Auto-generate entry name and keywords
   - Check not duplicate/rejected
   - Call client.api.ui.showDialog()  ← BLOCKS HERE
   ↓
5. Extension UI system:
   - Updates dialog store
   - Dialog renderer shows PlainDialog
   - User clicks button
   - Promise resolves with button value
   ↓
6. Plugin handles response:
   - "add" → Save to entries store
   - "skip" → Save to rejected store
   - "later" → Do nothing
```

## Key Differences from Original Plan

### Original (Polling Hook):
- ❌ Hook polls every 2s for pending entries
- ❌ Separate UI component manages state
- ❌ Complex synchronization between extension and UI
- ❌ pendingEntries store required

### Final (Extension-Controlled):
- ✅ Extension directly calls dialog API (synchronous)
- ✅ No polling - event-driven
- ✅ Simple promise-based API
- ✅ No pendingEntries needed
- ✅ Extension has full control over UX flow

## Benefits

1. **Clean Separation:** Extension controls logic, UI system handles rendering
2. **Reusable:** `PlainDialog` + Extension UI API can be used by any extension
3. **Type-Safe:** Promise-based API with well-defined button values
4. **No Polling:** Event-driven, no performance impact
5. **Simple State:** Only need entries + rejected, no pending complexity

## Extension Client APIs Used

### 1. Adding Lorebook Entries
```typescript
// Extensions cannot import domain objects directly
// Use the exposed API instead:
const result = await client.api.addLorebookEntryToCard({
  cardId: "character-id",
  name: "Entry Name",
  keys: ["keyword1", "keyword2"],
  content: "Lorebook content",
  enabled: true,
  recallRange: 2,
});

if (result.isSuccess) {
  const entryId = result.entryId; // ID of created entry
}
```

### 2. Showing Dialogs
```typescript
// Any extension can show dialogs:
const result = await client.api.ui.showDialog({
  title: "Confirm Action",
  description: "Are you sure?",
  content: "<p>This will do something important</p>",
  buttons: [
    { label: "Cancel", variant: "outline", value: "cancel" },
    { label: "Confirm", variant: "default", value: "confirm" },
  ],
});

if (result === "confirm") {
  // User confirmed
}
```

## Files Created/Modified

### New Files:
- `apps/pwa/src/modules/extensions/ui/dialog-manager.ts` - Dialog state
- `apps/pwa/src/modules/extensions/ui/extension-dialog-renderer.tsx` - Dialog renderer
- `apps/pwa/src/components-v2/ui/plain-dialog.tsx` - Reusable dialog component
- `apps/extensions/lorebook/*` - Full lorebook extension

### Modified Files:
- `apps/pwa/src/modules/extensions/core/extension-client.ts` - Added UI API + `addLorebookEntryToCard` API
- `apps/pwa/src/components-v2/session/session-page.tsx` - Added dialog renderer
- `apps/pwa/src/modules/extensions/bootstrap.ts` - Registered lorebook plugin

## Next Steps

1. Test end-to-end flow with real messages
2. Add lorebook entries to memory retrieval context
3. Consider batch confirmation (show all at once vs one-by-one)
4. Add lorebook management UI (view/edit existing entries)
