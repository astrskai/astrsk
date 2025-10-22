# Panel Pattern Guide

This guide documents the clean pattern for implementing panels in the card editor. This pattern prevents infinite loops, ensures proper data synchronization, and provides a great user experience.

## Abstraction Utilities

We have created reusable abstractions to reduce boilerplate code:

### 1. `useCardPanel` Hook
Handles common card panel functionality:
- Loading card data with React Query
- Saving cards with debouncing
- Tracking initialization state

### 2. Common Components
- `CardPanelLoading` - Consistent loading state
- `CardPanelError` - Consistent error state  
- `CardPanelEmpty` - Consistent empty state

### 3. `withCardPanel` HOC (Optional)
Wraps components with loading/error handling

## Core Principles

1. **No useEffect for watching state changes** - This causes infinite loops
2. **Pass values as parameters to debounced functions** - Prevents stale closure issues
3. **Single initialization useEffect** - Only for setting initial values when switching cards
4. **Direct onChange handlers** - Update local state and trigger debounced save immediately

## Component Structure (With Abstractions)

```typescript
import { useCardPanel, CardPanelProps, CardPanelLoading, CardPanelError } from "./use-card-panel";

export function CompactPanel({ cardId }: CardPanelProps) {
  // 1. Use the abstraction hook
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<SpecificCardType>({
    cardId,
  });
  
  // 2. UI state (expansion, errors, etc.)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 3. Local form state (for immediate UI feedback)
  const [fieldValue, setFieldValue] = useState("");
  
  // 4. Additional refs if needed
  const additionalRef = useRef();
  
  // 5. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card && card instanceof SpecificCardType) {
      setFieldValue(card.props.fieldValue || "");
      lastInitializedCardId.current = cardId;
    }
  }, [cardId, card]);
  
  // 6. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () => debounce((value1: string, value2: string) => {
      if (!card || !(card instanceof SpecificCardType)) return;
      
      // Check for changes inline
      if (value1 === (card.props.field1 || "") && 
          value2 === (card.props.field2 || "")) return;
      
      const updateResult = card.update({
        field1: value1,
        field2: value2,
      });
      
      if (updateResult.isSuccess) {
        saveCard(card);
      }
    }, 300),
    [card, saveCard]  // Minimal dependencies
  );
  
  // 7. Change handlers that pass current values
  const handleField1Change = useCallback((value: string) => {
    setFieldValue1(value);
    debouncedSave(value, fieldValue2);  // Pass ALL current values
  }, [debouncedSave, fieldValue2]);
  
  // 8. Early returns using abstraction components
  if (isLoading) return <CardPanelLoading message="Loading..." />;
  if (!card || !(card instanceof SpecificCardType)) {
    return <CardPanelError message="This panel requires a specific card type" />;
  }
  
  // 9. Render
  return (
    <div>
      <Input value={fieldValue} onChange={(e) => handleFieldChange(e.target.value)} />
    </div>
  );
}
```

## Key Patterns

### 1. State Updates with Debounced Save

```typescript
// GOOD - Pass values as parameters
const handleNameChange = useCallback((value: string) => {
  setName(value);  // Update local state for immediate UI feedback
  debouncedSave(value, description, otherField);  // Pass ALL field values
}, [debouncedSave, description, otherField]);

// BAD - Don't use closures
const handleNameChange = useCallback((value: string) => {
  setName(value);
  debouncedSave();  // This captures stale values!
}, [debouncedSave]);
```

### 2. Array/Object Updates

```typescript
// For arrays like tags
const handleAddTag = useCallback(() => {
  const newTags = [...tags, newTag];
  setTags(newTags);
  debouncedSave(newTags, creator, summary);  // Pass the NEW array
}, [tags, newTag, creator, summary, debouncedSave]);

const handleRemoveTag = useCallback((tagToRemove: string) => {
  const newTags = tags.filter(tag => tag !== tagToRemove);
  setTags(newTags);
  debouncedSave(newTags, creator, summary);  // Pass the NEW array
}, [tags, creator, summary, debouncedSave]);
```

### 3. Initialization Pattern

```typescript
// Track last initialized cardId to prevent re-initialization
const lastInitializedCardId = useRef<string | null>(null);

useEffect(() => {
  // Only initialize when actually switching cards
  if (cardId !== lastInitializedCardId.current && card) {
    setFieldValue(card.props.fieldValue || "");
    lastInitializedCardId.current = cardId;
  }
}, [cardId, card]);
```

## What NOT to Do

### 1. Don't Watch State with useEffect
```typescript
// BAD - Causes infinite loops
useEffect(() => {
  if (card) {
    debouncedSave();
  }
}, [fieldValue, debouncedSave]);  // Watching state changes
```

### 2. Don't Use Cleanup useEffect
```typescript
// BAD - Can interfere with debouncing
useEffect(() => {
  return () => {
    debouncedSave.cancel();
  };
}, [debouncedSave]);
```

### 3. Don't Capture State in Closures
```typescript
// BAD - Stale closure problem
const debouncedSave = useMemo(
  () => debounce(() => {
    // This captures the current value of fieldValue
    // which may be stale when the function executes
    saveWithValue(fieldValue);
  }, 300),
  [fieldValue]  // Even with dependency, still problematic
);
```

## Benefits

1. **No Infinite Loops** - State changes don't trigger effects that cause more state changes
2. **Immediate UI Feedback** - Local state updates instantly while saves happen in background
3. **Proper Debouncing** - Changes are batched and saved efficiently
4. **Clean Data Flow** - Easy to understand: User types → State updates → Debounced save triggers
5. **Predictable Behavior** - No surprising re-renders or stale data issues

## Example Implementation

See these files for reference implementations:
- `/src/components-v2/card/panels/compact/character-info-panel-compact.tsx`
- `/src/components-v2/card/panels/compact/metadata-panel-compact.tsx`
- `/src/components-v2/card/panels/compact/plot-info-panel-compact.tsx`

## Complete Example Using Abstractions

```typescript
import { useState, useEffect, useCallback, useMemo } from "react";
import { debounce } from "lodash-es";
import { CharacterCard } from "@/modules/card/domain";
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "./use-card-panel";

export function CharacterInfoPanelCompact({ cardId }: CardPanelProps) {
  // 1. Use abstraction hook
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<CharacterCard>({
    cardId,
  });
  
  // 2. UI state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 3. Local form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // 4. Initialize when switching cards
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card && card instanceof CharacterCard) {
      setName(card.props.name || "");
      setDescription(card.props.description || "");
      lastInitializedCardId.current = cardId;
    }
  }, [cardId, card]);
  
  // 5. Debounced save with parameters
  const debouncedSave = useMemo(
    () => debounce((newName: string, newDescription: string) => {
      if (!card || !(card instanceof CharacterCard)) return;
      
      if (newName === (card.props.name || "") && 
          newDescription === (card.props.description || "")) return;
      
      const updateResult = card.update({
        name: newName,
        description: newDescription,
      });
      
      if (updateResult.isSuccess) {
        saveCard(card);
      }
    }, 300),
    [card, saveCard]
  );
  
  // 6. Change handlers with value passing
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    debouncedSave(value, description);
  }, [debouncedSave, description]);
  
  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    debouncedSave(name, value);
  }, [debouncedSave, name]);
  
  // 7. Early returns with abstractions
  if (isLoading) {
    return <CardPanelLoading message="Loading character info..." />;
  }
  
  if (!card || !(card instanceof CharacterCard)) {
    return <CardPanelError message="Character info is only available for character cards" />;
  }
  
  // 8. Render
  return (
    <div className="h-full w-full p-4 bg-background-surface-2">
      <Input 
        value={name} 
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Character name"
      />
      <Editor
        value={description}
        onChange={handleDescriptionChange}
        language="markdown"
        expandable={true}
        isExpanded={isExpanded}
        onExpandToggle={setIsExpanded}
      />
    </div>
  );
}
```

## Migration Guide

To migrate existing panels to use abstractions:

1. Replace manual React Query setup with `useCardPanel` hook
2. Remove manual `saveCard` implementation
3. Replace custom loading/error components with abstraction components
4. Keep the same initialization and debouncing patterns
5. Simplify props interface to extend `CardPanelProps`