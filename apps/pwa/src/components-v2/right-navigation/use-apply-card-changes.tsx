/**
 * Hook for applying vibe-edited changes to cards
 * 
 * Takes typed edited card data from vibe backend (EditableCharacterCard/EditablePlotCard)
 * and applies changes using existing mutations
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { CardService } from '@/app/services/card-service';
import { CardType, Card, Lorebook, Entry } from '@/modules/card/domain';
import { UniqueEntityID } from '@/shared/domain';
import { queryClient } from '@/app/queries/query-client';
import { cardKeys } from '@/app/queries/card/query-factory';
import { cardQueries } from '@/app/queries/card-queries';
import type { 
  EditableCharacterCard, 
  EditablePlotCard,
  LorebookEntry
} from 'vibe-shared-types';
import {
  isEditableCharacterCard,
  isEditablePlotCard
} from 'vibe-shared-types';

interface UseApplyCardChangesOptions {
  cardId: string;
  cardType: CardType;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useApplyCardChanges = ({ 
  cardId, 
  cardType,
  onSuccess,
  onError 
}: UseApplyCardChangesOptions) => {
  
  // Fetch current card data to compare with edited data
  const { data: currentCard } = useQuery({
    ...cardQueries.detail<Card>(new UniqueEntityID(cardId)),
    enabled: !!cardId
  });

  /**
   * Apply changes for character card
   */
  const applyCharacterCardChanges = useCallback(async (editedData: EditableCharacterCard) => {
    const appliedFields: string[] = [];
    const errors: string[] = [];

    try {
      // Check and apply title change
      if (editedData.common?.title && editedData.common.title !== currentCard?.props?.title) {
        const result = await CardService.updateCardTitle.execute({ 
          cardId, 
          title: editedData.common.title 
        });
        if (result.isSuccess) {
          appliedFields.push('title');
        } else {
          errors.push(`Failed to update title: ${result.getError()}`);
        }
      }

      // Check and apply character name change
      if (editedData.character?.name) {
        const currentName = (currentCard?.props as any)?.name;
        if (editedData.character.name !== currentName) {
          const result = await CardService.updateCharacterName.execute({ 
            cardId, 
            name: editedData.character.name 
          });
          if (result.isSuccess) {
            appliedFields.push('character.name');
          } else {
            errors.push(`Failed to update character name: ${result.getError()}`);
          }
        }
      }

      // Check and apply description change
      if (editedData.character?.description) {
        const currentDesc = (currentCard?.props as any)?.description;
        if (editedData.character.description !== currentDesc) {
          const result = await CardService.updateCharacterDescription.execute({ 
            cardId, 
            description: editedData.character.description 
          });
          if (result.isSuccess) {
            appliedFields.push('character.description');
          } else {
            errors.push(`Failed to update description: ${result.getError()}`);
          }
        }
      }

      // Check and apply example dialogue change
      if (editedData.character?.example_dialogue) {
        const currentDialogue = (currentCard?.props as any)?.exampleDialogue;
        if (editedData.character.example_dialogue !== currentDialogue) {
          const result = await CardService.updateCharacterExampleDialogue.execute({ 
            cardId, 
            exampleDialogue: editedData.character.example_dialogue 
          });
          if (result.isSuccess) {
            appliedFields.push('character.example_dialogue');
          } else {
            errors.push(`Failed to update example dialogue: ${result.getError()}`);
          }
        }
      }

      // Check and apply lorebook changes
      if (editedData.character?.lorebook) {
        const currentLorebook = (currentCard?.props as any)?.lorebook;
        
        // Compare lorebook entries to see if there are changes
        const hasLorebookChanges = !areLorebooksEqual(
          currentLorebook, 
          editedData.character.lorebook
        );

        if (hasLorebookChanges) {
          // Convert typed lorebook entries to domain objects
          const lorebookEntries = editedData.character.lorebook.entries.map(entry => 
            Entry.create({
              id: new UniqueEntityID(entry.id),
              name: entry.name,
              enabled: entry.enabled,
              keys: entry.keys,
              recallRange: entry.recallRange,
              content: entry.content
            }).getValue()
          );

          const lorebookResult = Lorebook.create({ entries: lorebookEntries });
          if (lorebookResult.isSuccess) {
            const result = await CardService.updateCardLorebook.execute({ 
              cardId, 
              lorebook: lorebookResult.getValue()
            });
            if (result.isSuccess) {
              appliedFields.push('character.lorebook');
            } else {
              errors.push(`Failed to update lorebook: ${result.getError()}`);
            }
          }
        }
      }

      return { success: errors.length === 0, appliedFields, errors };
    } catch (error) {
      console.error('Failed to apply character card changes:', error);
      return {
        success: false,
        appliedFields,
        errors: [error?.toString() || 'Unknown error']
      };
    }
  }, [cardId, currentCard]);

  /**
   * Apply changes for plot card
   */
  const applyPlotCardChanges = useCallback(async (editedData: EditablePlotCard) => {
    const appliedFields: string[] = [];
    const errors: string[] = [];

    try {
      // Check and apply title change
      if (editedData.common?.title && editedData.common.title !== currentCard?.props?.title) {
        const result = await CardService.updateCardTitle.execute({ 
          cardId, 
          title: editedData.common.title 
        });
        if (result.isSuccess) {
          appliedFields.push('title');
        } else {
          errors.push(`Failed to update title: ${result.getError()}`);
        }
      }

      // Check and apply plot description change
      if (editedData.plot?.description) {
        const currentDesc = (currentCard?.props as any)?.description;
        if (editedData.plot.description !== currentDesc) {
          const result = await CardService.updatePlotDescription.execute({ 
            cardId, 
            description: editedData.plot.description 
          });
          if (result.isSuccess) {
            appliedFields.push('plot.description');
          } else {
            errors.push(`Failed to update description: ${result.getError()}`);
          }
        }
      }

      // Check and apply scenarios changes
      if (editedData.plot?.scenarios) {
        const currentScenarios = (currentCard?.props as any)?.scenarios;
        const hasScenariosChanges = !areScenariosEqual(currentScenarios, editedData.plot.scenarios);

        if (hasScenariosChanges) {
          const result = await CardService.updateCardScenarios.execute({ 
            cardId, 
            scenarios: editedData.plot.scenarios.map(s => ({
              name: s.name,
              description: s.description
            }))
          });
          if (result.isSuccess) {
            appliedFields.push('plot.scenarios');
          } else {
            errors.push(`Failed to update scenarios: ${result.getError()}`);
          }
        }
      }

      // Check and apply lorebook changes (same as character)
      if (editedData.plot?.lorebook) {
        const currentLorebook = (currentCard?.props as any)?.lorebook;
        const hasLorebookChanges = !areLorebooksEqual(
          currentLorebook, 
          editedData.plot.lorebook
        );

        if (hasLorebookChanges) {
          const lorebookEntries = editedData.plot.lorebook.entries.map(entry => 
            Entry.create({
              id: new UniqueEntityID(entry.id),
              name: entry.name,
              enabled: entry.enabled,
              keys: entry.keys,
              recallRange: entry.recallRange,
              content: entry.content
            }).getValue()
          );

          const lorebookResult = Lorebook.create({ entries: lorebookEntries });
          if (lorebookResult.isSuccess) {
            const result = await CardService.updateCardLorebook.execute({ 
              cardId, 
              lorebook: lorebookResult.getValue()
            });
            if (result.isSuccess) {
              appliedFields.push('plot.lorebook');
            } else {
              errors.push(`Failed to update lorebook: ${result.getError()}`);
            }
          }
        }
      }

      return { success: errors.length === 0, appliedFields, errors };
    } catch (error) {
      console.error('Failed to apply plot card changes:', error);
      return {
        success: false,
        appliedFields,
        errors: [error?.toString() || 'Unknown error']
      };
    }
  }, [cardId, currentCard]);

  /**
   * Main apply changes function that handles both character and plot cards
   */
  const applyChanges = useCallback(async (editedData: EditableCharacterCard | EditablePlotCard) => {
    let result;

    // Determine card type from edited data structure
    if ('character' in editedData && editedData.character) {
      result = await applyCharacterCardChanges(editedData as EditableCharacterCard);
    } else if ('plot' in editedData && editedData.plot) {
      result = await applyPlotCardChanges(editedData as EditablePlotCard);
    } else {
      result = {
        success: false,
        appliedFields: [],
        errors: ['Unknown card type in edited data']
      };
    }

    // Invalidate queries to refresh UI
    await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    await queryClient.invalidateQueries({ queryKey: cardKeys.lists() });

    // Report results
    if (result.errors.length === 0) {
      toast.success(`Successfully applied ${result.appliedFields.length} changes`);
      onSuccess?.();
    } else {
      toast.warning(`Applied ${result.appliedFields.length} changes with ${result.errors.length} errors`);
      result.errors.forEach(error => console.error(error));
      if (result.appliedFields.length === 0) {
        onError?.(new Error(result.errors.join(', ')));
      }
    }

    return result;
  }, [applyCharacterCardChanges, applyPlotCardChanges, cardId, onSuccess, onError]);

  return {
    applyChanges,
  };
};

/**
 * Helper functions to compare data structures
 */
function areLorebooksEqual(current: Lorebook | undefined, edited: { entries: LorebookEntry[] }): boolean {
  if (!current && (!edited.entries || edited.entries.length === 0)) return true;
  if (!current || !edited) return false;

  const currentEntries = current.entries || [];
  const editedEntries = edited.entries || [];

  if (currentEntries.length !== editedEntries.length) return false;

  return currentEntries.every((currentEntry, index) => {
    const editedEntry = editedEntries[index];
    return (
      currentEntry.id.toString() === editedEntry.id &&
      currentEntry.name === editedEntry.name &&
      currentEntry.enabled === editedEntry.enabled &&
      JSON.stringify(currentEntry.keys) === JSON.stringify(editedEntry.keys) &&
      currentEntry.recallRange === editedEntry.recallRange &&
      currentEntry.content === editedEntry.content
    );
  });
}

function areScenariosEqual(
  current: Array<{ name: string; description: string }> | undefined, 
  edited: Array<{ id: string; name: string; description: string; lorebook_entries: string[] }>
): boolean {
  if (!current && (!edited || edited.length === 0)) return true;
  if (!current || !edited) return false;
  if (current.length !== edited.length) return false;

  return current.every((currentScenario, index) => {
    const editedScenario = edited[index];
    return (
      currentScenario.name === editedScenario.name &&
      currentScenario.description === editedScenario.description
    );
  });
}

/**
 * Extract card fields from vibe response data
 * The vibe response should already be in EditableCharacterCard or EditablePlotCard format
 */
export const extractCardFields = (vibeData: any): EditableCharacterCard | EditablePlotCard => {
  // The data should already be properly structured from backend
  // Just ensure it's not double-nested
  return vibeData.data || vibeData;
};