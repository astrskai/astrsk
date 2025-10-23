/**
 * Path Processor Factory
 * 
 * Regex-based path-to-function mapping system organized like TanStack Query factory pattern.
 * This provides:
 * - Flexible regex-based path matching
 * - Hierarchical operation handlers
 * - Type-safe path resolution
 * - Co-location of path patterns and processors
 */

export interface PathMatchResult {
  matches: boolean;
  groups: Record<string, string>;
  indices: number[];
  keys: string[];
}

export interface OperationContext {
  path: string;
  operation: 'set' | 'put' | 'remove';
  value?: any;
  pathParts: string[];
  resource: any; // The full resource object being modified
  flowId?: string; // Optional flowId for service layer operations
}

export interface PathProcessor {
  pattern: RegExp;
  description: string;
  handler: (context: OperationContext, match: PathMatchResult) => any | Promise<any>;
}

/**
 * Path Pattern Factory
 * 
 * Hierarchical structure for path patterns:
 * - character: /^character\./
 *   - lorebook: /^character\.lorebook/
 *     - entries: /^character\.lorebook\.entries$/
 *     - entry: /^character\.lorebook\.entries\[(\d+)\]$/
 * - agents: /^agents\.(.+)/
 *   - promptMessages: /^agents\.(.+)\.promptMessages/
 *     - append: /^agents\.(.+)\.promptMessages$/
 *     - indexed: /^agents\.(.+)\.promptMessages\[(\d+)\]/
 *       - messages: /^agents\.(.+)\.promptMessages\[(\d+)\]\.messages/
 *         - blocks: /^agents\.(.+)\.promptMessages\[(\d+)\]\.messages\[(\d+)\]\.blocks$/
 */

export const pathPatterns = {
  // Character patterns
  character: {
    base: /^character\.(.+)$/,
    lorebook: {
      base: /^character\.lorebook$/,
      entries: {
        append: /^character\.lorebook\.entries$/,
        indexed: /^character\.lorebook\.entries\[(\d+)\]$/,
        field: /^character\.lorebook\.entries\[(\d+)\]\.([^.]+)$/,
      }
    },
    fields: {
      name: /^character\.name$/,
      description: /^character\.description$/,
      greeting: /^character\.greeting$/,
      exampleDialogue: /^character\.example_dialogue$/,
    }
  },

  // Plot patterns
  plot: {
    base: /^plot\.(.+)$/,
    lorebook: {
      base: /^plot\.lorebook$/,
      entries: {
        append: /^plot\.lorebook\.entries$/,
        indexed: /^plot\.lorebook\.entries\[(\d+)\]$/,
        field: /^plot\.lorebook\.entries\[(\d+)\]\.([^.]+)$/,
      }
    },
    scenarios: {
      append: /^plot\.scenarios$/,
      indexed: /^plot\.scenarios\[(\d+)\]$/,
      field: /^plot\.scenarios\[(\d+)\]\.([^.]+)$/,
    }
  },

  // Agent patterns
  agents: {
    base: /^agents\.([^.]+)$/,
    field: /^agents\.([^.]+)\.([^.[]+)$/,
    promptMessages: {
      append: /^agents\.([^.]+)\.promptMessages$/,
      indexed: /^agents\.([^.]+)\.promptMessages\[(\d+)\]$/,
      field: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.([^.[]+)$/,
      messages: {
        append: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.messages$/,
        indexed: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.messages\[(\d+)\]$/,
        field: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.messages\[(\d+)\]\.([^.[]+)$/,
        blocks: {
          append: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.messages\[(\d+)\]\.blocks$/,
          indexed: /^agents\.([^.]+)\.promptMessages\[(\d+)\]\.messages\[(\d+)\]\.blocks\[(\d+)\]$/,
        }
      }
    },
    schemaFields: {
      append: /^agents\.([^.]+)\.schemaFields$/,
      indexed: /^agents\.([^.]+)\.schemaFields\[(\d+)\]$/,
      field: /^agents\.([^.]+)\.schemaFields\[(\d+)\]\.([^.[]+)$/
    }
  },

  // Flow patterns
  flow: {
    base: /^flow\.(.+)$/,
    fields: {
      name: /^flow\.name$/,
      response_template: /^flow\.response_template$/,
      data_store_schema: /^flow\.data_store_schema$/,
    },
    dataStoreSchema: {
      base: /^flow\.data_store_schema$/,
      fields: /^flow\.data_store_schema\.fields$/,
      field: /^flow\.data_store_schema\.fields\[(\d+)\]$/,
      fieldProperty: /^flow\.data_store_schema\.fields\[(\d+)\]\.([^.]+)$/,
    },
    nodes: {
      append: /^flow\.nodes$/,                      // flow.nodes (add complete node)
      indexed: /^flow\.nodes\[(\d+)\]$/,            // flow.nodes[0] (remove complete node)
    },
    edges: {
      // DEPRECATED: Edge patterns now handled in flow-operations.ts during approval phase
      // These patterns kept for compatibility but no longer have active processors
      append: /^flow\.edges$/,                      // flow.edges (add complete edge)  
      indexed: /^flow\.edges\[(\d+)\]$/,            // flow.edges[0] (remove complete edge)
    }
  },

  // Data Store Node patterns (moved out of flow)
  dataStoreNodes: {
    base: /^dataStoreNodes\.([^.]+)$/,
    field: /^dataStoreNodes\.([^.]+)\.([^.[]+)$/,
    dataStoreFields: {
      append: /^dataStoreNodes\.([^.]+)\.dataStoreFields$/,
      indexed: /^dataStoreNodes\.([^.]+)\.dataStoreFields\[(\d+)\]$/,
    }
  },

  // IF Node patterns (moved out of flow)  
  ifNodes: {
    base: /^ifNodes\.([^.]+)$/,
    field: /^ifNodes\.([^.]+)\.([^.[]+)$/,
    conditions: {
      append: /^ifNodes\.([^.]+)\.conditions$/,
      indexed: /^ifNodes\.([^.]+)\.conditions\[(\d+)\]$/,
      // Removed individual field paths - backend works with entire condition objects
    }
  },

  // Common patterns
  common: {
    base: /^common\.(.+)$/,
    fields: {
      title: /^common\.title$/,
    },
    arrayIndex: /\[(\d+)\]/g,
    objectKey: /([^.[\]]+)/g,
    arrayAppend: /^(.+)\.([^.[]+)$/, // path.entries (no index)
    arrayIndexed: /^(.+)\.([^.[]+)\[(\d+)\]$/, // path.entries[0]
  }
} as const;

/**
 * Path matching utilities
 */
export function matchPath(path: string, pattern: RegExp): PathMatchResult {
  const match = path.match(pattern);
  
  if (!match) {
    return {
      matches: false,
      groups: {},
      indices: [],
      keys: []
    };
  }

  // Extract named groups and indices
  const groups: Record<string, string> = {};
  const indices: number[] = [];
  const keys: string[] = [];

  // Get all array indices from path
  const arrayMatches = [...path.matchAll(/\[(\d+)\]/g)];
  arrayMatches.forEach(m => indices.push(parseInt(m[1])));

  // Get all object keys (non-index parts)
  const keyMatches = [...path.matchAll(/([^.[\]]+)/g)];
  keyMatches.forEach(m => {
    if (!/^\d+$/.test(m[1])) { // Skip pure numbers (indices)
      keys.push(m[1]);
    }
  });

  // Extract regex groups
  if (match.groups) {
    Object.assign(groups, match.groups);
  }
  
  // Extract positional groups as named groups
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      groups[`group${i}`] = match[i];
    }
  }

  return {
    matches: true,
    groups,
    indices,
    keys
  };
}

/**
 * Parse path into components
 */
export function parsePath(path: string): {
  parts: string[];
  objectKeys: string[];
  arrayIndices: number[];
  segments: Array<{ type: 'key' | 'index', value: string | number }>;
} {
  // Split by dots and handle array notation
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalized.split('.').filter(p => p !== '');
  
  const objectKeys: string[] = [];
  const arrayIndices: number[] = [];
  const segments: Array<{ type: 'key' | 'index', value: string | number }> = [];

  parts.forEach(part => {
    const isIndex = /^\d+$/.test(part);
    if (isIndex) {
      const index = parseInt(part);
      arrayIndices.push(index);
      segments.push({ type: 'index', value: index });
    } else {
      objectKeys.push(part);
      segments.push({ type: 'key', value: part });
    }
  });

  return {
    parts,
    objectKeys,
    arrayIndices,
    segments
  };
}

/**
 * Navigate to a path in an object, creating missing structures
 */
export function navigateToPath(
  obj: any, 
  pathSegments: Array<{ type: 'key' | 'index', value: string | number }>,
  createMissing: boolean = true
): { target: any; parent: any; lastKey: string | number } {
  let current = obj;
  let parent = null;
  let lastKey: string | number = '';

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const nextSegment = pathSegments[i + 1];
    
    parent = current;
    lastKey = segment.value;

    if (segment.type === 'index') {
      // Array index
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at index ${segment.value}, got ${typeof current}`);
      }
      
      // Extend array if needed (ensure segment.value is a number for array indexing)
      const index = typeof segment.value === 'number' ? segment.value : parseInt(String(segment.value));
      while (current.length <= index) {
        const nextIsIndex = nextSegment?.type === 'index';
        current.push(nextIsIndex ? [] : {});
      }
      
      current = current[index];
    } else {
      // Object key
      if (current[segment.value] === undefined && createMissing) {
        const nextIsIndex = nextSegment?.type === 'index';
        current[segment.value] = createStructureForKey(segment.value as string, nextIsIndex);
      }
      
      current = current[segment.value];
    }
  }

  return { target: current, parent, lastKey };
}

/**
 * Create appropriate structure based on key name and next segment type
 */
function createStructureForKey(key: string, nextIsIndex?: boolean): any {
  // Special cases for known structures
  if (key === 'lorebook') {
    return { entries: [] };
  }
  
  if (key === 'agents') { 
    return {}; // Object to hold agent IDs as keys
  }
  
  if (['promptMessages', 'messages', 'entries', 'blocks', 'scenarios', 'fields'].includes(key)) {
    return []; // Arrays for collections
  }
  
  // Default: create array if next is index, object otherwise
  return nextIsIndex ? [] : {};
}