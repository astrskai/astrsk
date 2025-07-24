# CardPanel Migration Plan

## Overview
This document outlines the safe migration of CardPanel feature from the non-temp folder to avoid service initialization errors.

## Migration Steps (In Order)

### Phase 1: Foundation Setup
1. **Add CardPanel to Page enum** in app-store
   - Add `CardPanel: "card_panel"` to Page enum
   - Add `selectedCardId: string | null` to store state
   - Add `setSelectedCardId` setter method

2. **Install dockview dependency**
   - Add dockview-core to package.json
   - Import dockview CSS in index.css

### Phase 2: Core Components Migration
3. **Create base directory structure**
   - Create `/src/components-v2/card/panels/` directory
   - Start with empty index files to test imports

4. **Reuse existing hooks instead of duplicating**
   - Use existing `useCardSave` from `/src/components-v2/card/hooks/useCardSave.ts`
   - Use existing `useCardEditor` and `useCardManagement` as needed
   - No need to create duplicate hooks

5. **Migrate panel components (one by one)**
   - Start with `card-info-panel.tsx` (simplest)
   - Then `variables-panel.tsx`
   - Then `lorebook-panel.tsx`
   - Then `character-info-panel.tsx`
   - Finally `card-panel.tsx` (most complex)

### Phase 3: Main Orchestrator
6. **Migrate CardPanelMain**
   - Copy `card-panel-main.tsx`
   - Ensure all imports are available
   - Add service initialization checks

### Phase 4: Integration
7. **Update App.tsx**
   - Add CardPanel case to page rendering
   - Import CardPanelMain component

8. **Update navigation**
   - Modify card-list.tsx to handle card selection
   - Add CardPanel navigation logic

### Phase 5: Testing & Validation
9. **Test service initialization**
   - Verify CardService is initialized before use
   - Add defensive checks where needed

10. **Test panel functionality**
    - Card loading
    - Image uploads
    - Form editing
    - Panel switching

## Critical Safety Checks

### Service Initialization Guards
Add these checks in components that use services:

```typescript
// In use-card-save.ts and other hooks
if (!CardService.saveCard?.execute) {
  console.warn("CardService not initialized yet, skipping operation");
  return;
}
```

### Query Client Setup
Ensure QueryClient is available:

```typescript
const queryClient = useQueryClient();
if (!queryClient) {
  console.error("QueryClient not available");
  return null;
}
```

### Dockview Lifecycle Management
- Properly dispose of panels on unmount
- Handle React 18 StrictMode double-mounting

## Known Issues to Avoid

1. **Service Not Initialized Error**
   - Root cause: Component renders before service init
   - Solution: Add initialization checks in hooks

2. **Missing Dockview Styles**
   - Root cause: CSS not imported
   - Solution: Import in index.css

3. **Panel State Synchronization**
   - Root cause: Multiple QueryClient instances
   - Solution: Share QueryClient via context

4. **Memory Leaks**
   - Root cause: Panels not properly disposed
   - Solution: Cleanup in useEffect return

## Implementation Order

1. Foundation (Steps 1-2)
2. Test that app still works
3. Core Components (Steps 3-5)
4. Test each component in isolation
5. Main Orchestrator (Step 6)
6. Integration (Steps 7-8)
7. Full testing (Steps 9-10)

## Success Criteria

- No "service not initialized" errors
- All panels load and display correctly
- Card data saves properly
- No memory leaks
- Smooth navigation between pages