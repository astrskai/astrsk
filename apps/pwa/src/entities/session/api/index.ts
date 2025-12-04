/**
 * Session API
 *
 * Exports the complete session query factory and mutation system
 * following FSD architecture patterns.
 */

// Query factory
export { sessionQueries, fetchSession } from "./query-factory";

// Types
export type { SessionListItem } from "@/entities/session/repos";

// Mutation hooks
export {
  useSaveSession,
  useAddMessage,
  useDeleteMessage,
  useDeleteSession,
  useCloneSession,
} from "./mutations";

// Custom query hooks
export { useSessionsWithCharacterMetadata } from "./use-sessions-with-character-metadata";
export type { SessionWithCharacterMetadata, CharacterMetadata } from "./use-sessions-with-character-metadata";
