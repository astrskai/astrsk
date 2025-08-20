/**
 * Card Query System
 * 
 * Exports the complete card query factory and mutation system
 * following the same patterns as the flow query system.
 */

// Query factory
export { cardKeys, cardQueries } from './query-factory';
export type { CardListFilters, CardMetadata, CardContent } from './query-factory';

// Mutation hooks
export {
  useUpdateCardTitle,
  useUpdateCardSummary,
  useUpdateCardVersion,
  useUpdateCardConceptualOrigin,
  useUpdateCharacterName,
  useUpdateCharacterDescription,
  useUpdateCharacterExampleDialogue,
  useUpdateCardTags,
  useUpdateCardCreator,
  useUpdateCardLorebook,
  useUpdateCardScenarios,
  useUpdatePlotDescription,
  useDeleteCard,
  useCloneCard
} from './mutations';