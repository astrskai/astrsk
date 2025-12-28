/**
 * Session configuration stored in sessions.config JSONB field
 *
 * This interface provides type safety for known config options while
 * allowing arbitrary additional properties via index signature.
 */
export interface SessionConfig extends Record<string, unknown> {
  // Compression settings
  characterRegistry?: Record<string, string>; // Normalized name → Display name mapping

  // Add other known config options here as they're discovered
  // The Record<string, unknown> base type ensures backward compatibility
}
