/**
 * Minimal domain type definitions for Supermemory extension
 *
 * Extensions cannot import from core pwa code. This file provides
 * minimal type definitions and utilities needed by the extension.
 *
 * For actual UniqueEntityID instances, use the objects passed via extension hooks:
 * - session.id
 * - turn.id
 * - card.id
 */

/**
 * Simple UniqueEntityID implementation for extension use
 *
 * This is a minimal version. For actual domain objects, use the instances
 * passed through hook contexts (session, turn, card objects).
 */
export class UniqueEntityID {
  constructor(private id?: string) {
    this.id = id || this.generateId();
  }

  toString(): string {
    return this.id!;
  }

  equals(id?: UniqueEntityID): boolean {
    if (!id) return false;
    return this.id === id.toString();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Helper to extract ID string from various sources
   */
  static toStringId(id: UniqueEntityID | string | { id: UniqueEntityID } | { toString(): string }): string {
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null && 'id' in id) {
      const obj = id as { id: UniqueEntityID };
      return obj.id.toString();
    }
    if (typeof id === 'object' && id !== null && 'toString' in id) {
      return id.toString();
    }
    return String(id);
  }
}
