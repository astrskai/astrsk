import { NpcData } from "./npc-store";

/**
 * Normalize a name to an NPC ID
 * "John Doe" → "john"
 * "Mr. Smith" → "mr"
 * "Jane" → "jane"
 */
export function normalizeNameToId(name: string): string {
  // Take first word, lowercase, remove special chars
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Find NPC by any of their name aliases
 */
export function findNpcByName(
  pool: NpcData[],
  name: string,
): NpcData | undefined {
  return pool.find((npc) =>
    npc.names.some((alias: string) => alias.toLowerCase() === name.toLowerCase()),
  );
}

/**
 * Map participant names to IDs (characters + NPCs)
 * Used in world agent flow
 */
export function mapParticipantNamesToIds(
  participantNames: string[],
  characterIdToName: Record<string, string>, // charId → name
  npcPool: NpcData[],
): string[] {
  const ids: string[] = [];

  for (const name of participantNames) {
    // Check characters first (reverse lookup)
    const charId = Object.entries(characterIdToName).find(
      ([_, charName]) => charName === name,
    )?.[0];

    if (charId) {
      ids.push(charId);
      continue;
    }

    // Check NPCs (by name alias)
    const npc = findNpcByName(npcPool, name);
    if (npc) {
      ids.push(npc.id);
      continue;
    }

    // Unknown participant - skip or log warning
    console.warn(`Unknown participant: ${name}`);
  }

  return ids;
}

/**
 * Create NPC container tag
 * Format: session-id::npc-id
 */
export function createNpcContainer(sessionId: string, npcId: string): string {
  return `${sessionId}::${npcId}`;
}

/**
 * Build combined character + NPC mapping for world agent
 */
export function buildCharacterMapping(
  characterIdToName: Record<string, string>,
  npcPool: NpcData[],
): Record<string, string> {
  const mapping = { ...characterIdToName };

  // Add NPCs (use first name as primary)
  for (const npc of npcPool) {
    mapping[npc.id] = npc.names[0];
  }

  return mapping;
}
