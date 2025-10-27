/**
 * Lorebook Extension
 *
 * Automatically extracts lorebook-worthy information from conversations
 * and suggests adding entries to character lorebooks.
 */

export { LorebookPlugin } from "./lorebook-plugin";
export { executeLorebookExtractionAgent } from "./lorebook-extraction-agent";
export { useLorebookStore } from "./lorebook-store";
export type { LorebookEntryData, RejectedLorebookEntry } from "./lorebook-store";
export type { LorebookExtractionOutput, LorebookExtractionInput } from "./lorebook-extraction-agent";
