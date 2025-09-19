import { Entry } from '@/modules/card/domain/entry';
import { Lorebook } from '@/modules/card/domain/lorebook';
import { UniqueEntityID } from '@/shared/domain';

/**
 * Check if path is for lorebook entries
 */
export function isLorebookEntryPath(path: string): boolean {
  return path.includes('lorebook.entries') || path.endsWith('lorebook.entries');
}

/**
 * Check if path is for lorebook structure (not individual entries)
 */
export function isLorebookPath(path: string): boolean {
  return path.includes('lorebook') && !path.includes('lorebook.entries');
}

/**
 * Check if path is for lorebook entries array
 */
export function isLorebookEntriesPath(path: string): boolean {
  return path.endsWith('lorebook.entries');
}

/**
 * Create a proper lorebook entry from raw data using domain objects
 * This ensures the entry has all required fields and proper structure
 */
export function createLorebookEntryFromData(data: any): any {
  // Create Entry domain object with proper validation
  const entryResult = Entry.create({
    id: data.id ? new UniqueEntityID(data.id) : new UniqueEntityID(),
    name: data.name || 'New Entry',
    enabled: data.enabled ?? true,
    keys: Array.isArray(data.keys) ? data.keys : [],
    recallRange: typeof data.recallRange === 'number' ? data.recallRange : 2,
    content: data.content || ''
  });
  
  if (entryResult.isFailure) {
    console.error('Failed to create lorebook entry:', entryResult.getError());
    // Fallback to plain object if domain object creation fails
    return {
      id: data.id || new UniqueEntityID().toString(),
      name: data.name || 'New Entry',
      enabled: data.enabled ?? true,
      keys: Array.isArray(data.keys) ? data.keys : [],
      recallRange: typeof data.recallRange === 'number' ? data.recallRange : 2,
      content: data.content || ''
    };
  }
  
  // Return the JSON representation of the Entry domain object
  return entryResult.getValue().toJSON();
}

/**
 * Create a proper lorebook structure from raw data using domain objects
 */
export function createLorebookFromData(data: any): any {
  // If data has entries, process them
  let entries: any[] = [];
  if (data.entries && Array.isArray(data.entries)) {
    entries = data.entries.map((entryData: any) => {
      if (typeof entryData === 'object' && entryData !== null) {
        return createLorebookEntryFromData(entryData);
      }
      return entryData; // Keep as-is if not an object
    });
  }
  
  // Create Lorebook domain object with proper validation
  const lorebookData = {
    entries: entries.map((entryJson: any) => {
      // Convert JSON back to Entry domain object for Lorebook creation
      const entryResult = Entry.fromJSON(entryJson);
      return entryResult.isSuccess ? entryResult.getValue() : null;
    }).filter((entry): entry is Entry => entry !== null) // Remove any null entries with proper type guard
  };
  
  const lorebookResult = Lorebook.create(lorebookData);
  
  if (lorebookResult.isFailure) {
    console.error('Failed to create lorebook:', lorebookResult.getError());
    // Fallback to plain object structure
    return {
      entries: entries
    };
  }
  
  // Return the JSON representation of the Lorebook domain object
  return lorebookResult.getValue().toJSON();
}

/**
 * Create an empty lorebook entries array
 */
export function createEmptyLorebookEntries(): any[] {
  return [];
}

/**
 * Process lorebook-specific put operations
 * Handles proper index extraction from path for array operations
 */
export function processLorebookPutOperation(
  current: any,
  pathParts: string[],
  value: any,
  lastPart: string
): void {
  const pathString = pathParts.join('.');
  
  // Handle lorebook entries array operations
  if (isLorebookEntriesPath(pathString)) {
    if (Array.isArray(value)) {
      // SET/PUT with array: replace entire entries array
      const processedEntries = value.map(entryData => {
        if (typeof entryData === 'object' && entryData !== null) {
          return createLorebookEntryFromData(entryData);
        }
        return entryData;
      });
      current[lastPart] = processedEntries;
    } else if (value && typeof value === 'object') {
      // PUT with single entry object: append to entries array
      if (!current[lastPart] || !Array.isArray(current[lastPart])) {
        current[lastPart] = createEmptyLorebookEntries();
      }
      const processedEntry = createLorebookEntryFromData(value);
      current[lastPart].push(processedEntry);
    } else {
      // No value or null: create empty entries array
      current[lastPart] = createEmptyLorebookEntries();
    }
    return;
  }
  
  // Handle lorebook structure creation
  if (isLorebookPath(pathString) && lastPart === 'lorebook') {
    if (typeof value === 'object' && value !== null) {
      current[lastPart] = createLorebookFromData(value);
    } else {
      // Create empty lorebook structure
      current[lastPart] = createLorebookFromData({ entries: [] });
    }
    return;
  }
  
  // Handle individual lorebook entries
  if (isLorebookEntryPath(pathString) && typeof value === 'object' && value !== null) {
    const processedValue = createLorebookEntryFromData(value);
    
    // Extract index from the path - look for array index patterns
    const index = extractIndexFromPath(pathParts, lastPart);
    
    if (index !== null) {
      // Array operation for lorebook entries
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at path, found ${typeof current}`);
      }
      
      // PUT operation with index should INSERT at that position, shifting items right
      current.splice(index, 0, processedValue);
    } else {
      // Object operation
      current[lastPart] = processedValue;
    }
    return;
  }
  
  // Standard put operation handling
  const index = extractIndexFromPath(pathParts, lastPart);
  
  if (index !== null) {
    // Array operation
    if (!Array.isArray(current)) {
      throw new Error(`Expected array at path, found ${typeof current}`);
    }
    
    // PUT operation with index should INSERT at that position, shifting items right
    current.splice(index, 0, value);
  } else {
    // Object operation
    current[lastPart] = value;
  }
}

/**
 * Extract index from path parts, handling both numeric strings and original bracket notation
 * Returns null if not an array index
 */
function extractIndexFromPath(pathParts: string[], lastPart: string): number | null {
  // Check if lastPart is a numeric string (from parsed [index] notation)
  const numericIndex = Number(lastPart);
  if (!isNaN(numericIndex) && isFinite(numericIndex)) {
    return numericIndex;
  }
  
  // Check if this looks like an array entry path by examining the full context
  // For paths like "lorebook.entries[0]" or "agents.agent1.promptMessages[2]"
  const fullPath = pathParts.join('.');
  const arrayIndexMatch = fullPath.match(/\[(\d+)\]$/);
  if (arrayIndexMatch) {
    return parseInt(arrayIndexMatch[1], 10);
  }
  
  return null;
}