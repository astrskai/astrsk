import {
  EditableCharacterCard,
  EditablePlotCard,
} from "vibe-shared-types";
import { Lorebook } from "@/modules/card/domain/lorebook";
import { Entry } from "@/modules/card/domain/entry";
import { CardService } from "@/app/services/card-service";
import { Operation } from "@/utils/operation-processor";

/**
 * Convert plain JSON lorebook to domain object
 */
function convertJsonToLorebookDomain(lorebookJson: any): Lorebook | undefined {
  if (!lorebookJson) return undefined;

  try {
    // If it's already a domain object, return as-is
    if (typeof lorebookJson.toJSON === "function") {
      return lorebookJson;
    }

    // Convert plain JSON to domain object
    const lorebookResult = Lorebook.fromJSON(lorebookJson);
    return lorebookResult.isSuccess ? lorebookResult.getValue() : undefined;
  } catch (error) {
    console.error("Failed to convert JSON to Lorebook domain object:", error);
    return undefined;
  }
}

/**
 * Map edited character card data from backend format to service call format
 */
export function mapCharacterEditsToUpdates(edited: EditableCharacterCard): {
  title?: string;
  name?: string;
  description?: string;
  exampleDialogue?: string;
  lorebook?: Lorebook;
} {
  return {
    title: edited.common?.title,
    name: edited.character?.name,
    description: edited.character?.description,
    exampleDialogue: edited.character?.example_dialogue,
    lorebook: convertJsonToLorebookDomain(edited.character?.lorebook),
  };
}

/**
 * Map edited plot card data from backend format to service call format
 */
export function mapPlotEditsToUpdates(edited: EditablePlotCard): {
  title?: string;
  description?: string;
  scenarios?: Array<{ name: string; description: string }>;
  lorebook?: Lorebook;
} {
  return {
    title: edited.common?.title,
    description: edited.plot?.description,
    scenarios: edited.plot?.scenarios?.map((s) => ({
      name: s.name,
      description: s.description,
    })),
    lorebook: convertJsonToLorebookDomain(edited.plot?.lorebook),
  };
}

/**
 * Apply character card updates using CardService static methods
 */
export async function applyCharacterCardUpdates(
  cardId: string,
  updates: ReturnType<typeof mapCharacterEditsToUpdates>,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { CardService } = await import("@/app/services/card-service");

  try {
    // Apply title change
    if (updates.title !== undefined) {
      const result = await CardService.updateCardTitle.execute({
        cardId,
        title: updates.title,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update title: ${result.getError()}`);
      }
    }

    // Apply character name change
    if (updates.name !== undefined) {
      const result = await CardService.updateCharacterName.execute({
        cardId,
        name: updates.name,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update character name: ${result.getError()}`);
      }
    }

    // Apply description change
    if (updates.description !== undefined) {
      const result = await CardService.updateCharacterDescription.execute({
        cardId,
        description: updates.description,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update description: ${result.getError()}`);
      }
    }

    // Apply example dialogue change
    if (updates.exampleDialogue !== undefined) {
      const result = await CardService.updateCharacterExampleDialogue.execute({
        cardId,
        exampleDialogue: updates.exampleDialogue,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update example dialogue: ${result.getError()}`);
      }
    }

    // Apply lorebook changes
    if (updates.lorebook !== undefined) {
      const result = await CardService.updateCardLorebook.execute({
        cardId,
        lorebook: updates.lorebook,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update lorebook: ${result.getError()}`);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    // Failed to apply character card updates
    return {
      success: false,
      errors: [error?.toString() || "Unknown error"],
    };
  }
}

/**
 * Apply plot card updates using CardService static methods
 */
export async function applyPlotCardUpdates(
  cardId: string,
  updates: ReturnType<typeof mapPlotEditsToUpdates>,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { CardService } = await import("@/app/services/card-service");

  try {
    // Apply title change
    if (updates.title !== undefined) {
      const result = await CardService.updateCardTitle.execute({
        cardId,
        title: updates.title,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update title: ${result.getError()}`);
      }
    }

    // Apply plot description change
    if (updates.description !== undefined) {
      const result = await CardService.updatePlotDescription.execute({
        cardId,
        description: updates.description,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update description: ${result.getError()}`);
      }
    }

    // Apply scenarios changes
    if (updates.scenarios !== undefined) {
      const result = await CardService.updateCardScenarios.execute({
        cardId,
        scenarios: updates.scenarios,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update scenarios: ${result.getError()}`);
      }
    }

    // Apply lorebook changes
    if (updates.lorebook !== undefined) {
      const result = await CardService.updateCardLorebook.execute({
        cardId,
        lorebook: updates.lorebook,
      });
      if (!result.isSuccess) {
        errors.push(`Failed to update lorebook: ${result.getError()}`);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    // Failed to apply plot card updates
    return {
      success: false,
      errors: [error?.toString() || "Unknown error"],
    };
  }
}

/**
 * Process card-specific operations
 */
export async function processCardOperations(
  resourceId: string,
  operations: Operation[],
  updatedResource: any,
): Promise<string[]> {
  const errors: string[] = [];

  // Single path for all lorebook operations: update entire lorebook via CardService
  const lorebookOperations = operations.filter((op) =>
    op.path.includes("lorebook"),
  );

  if (lorebookOperations.length > 0) {
    console.log(
      `🔄 [CARD-OPERATIONS] Processing ${lorebookOperations.length} lorebook operations (entries, fields, whole lorebook)`,
    );

    // All lorebook changes go through the same path: update entire lorebook
    const updatedLorebook =
      updatedResource.character?.lorebook || updatedResource.plot?.lorebook;

    if (updatedLorebook) {
      const lorebookDomain = convertJsonToLorebookDomain(updatedLorebook);

      if (lorebookDomain) {
        const result = await CardService.updateCardLorebook.execute({
          cardId: resourceId,
          lorebook: lorebookDomain,
        });

        if (!result.isSuccess) {
          errors.push(`Failed to update lorebook: ${result.getError()}`);
        } else {
          console.log(
            `✅ [CARD-OPERATIONS] Lorebook updated successfully with ${lorebookOperations.length} operations`,
          );
        }
      }
    }
  }

  // Handle other operations (name, description, etc.)
  const nonLorebookOperations = operations.filter(
    (op) => !op.path.includes("lorebook"),
  );

  for (const operation of nonLorebookOperations) {
    try {
      if (operation.path.includes("character.name")) {
        const result = await CardService.updateCharacterName.execute({
          cardId: resourceId,
          name: operation.value,
        });
        if (!result.isSuccess) {
          errors.push(`Failed to update name: ${result.getError()}`);
        }
      } else if (operation.path.includes("character.description")) {
        const result = await CardService.updateCharacterDescription.execute({
          cardId: resourceId,
          description: operation.value,
        });
        if (!result.isSuccess) {
          errors.push(`Failed to update description: ${result.getError()}`);
        }
      } else if (operation.path.includes("character.example_dialogue")) {
        const result =
          await CardService.updateCharacterExampleDialogue.execute({
            cardId: resourceId,
            exampleDialogue: operation.value,
          });
        if (!result.isSuccess) {
          errors.push(
            `Failed to update example dialogue: ${result.getError()}`,
          );
        }
      } else if (operation.path.includes("scenarios")) {
        // Handle plot scenario operations
        console.log(`🎯 [CARD-OPERATIONS] Processing scenario operation:`, {
          path: operation.path,
          operation: operation.operation,
          hasValue: !!operation.value,
        });

        const updatedScenarios = updatedResource.plot?.scenarios || [];
        console.log(`📊 [CARD-OPERATIONS] Updating scenarios:`, {
          currentCount: updatedScenarios.length,
          scenarios: updatedScenarios.map((s: any, i: number) => ({
            index: i,
            name: s?.name || "Unnamed",
          })),
        });

        const result = await CardService.updateCardScenarios.execute({
          cardId: resourceId,
          scenarios: updatedScenarios,
        });

        if (!result.isSuccess) {
          errors.push(`Failed to update scenarios: ${result.getError()}`);
          console.error(
            `❌ [CARD-OPERATIONS] Scenario update failed:`,
            result.getError(),
          );
        } else {
          console.log(`✅ [CARD-OPERATIONS] Scenarios updated successfully:`, {
            scenarioCount: updatedScenarios.length,
          });
        }
      }
    } catch (error) {
      errors.push(`Failed to apply operation ${operation.path}: ${error}`);
    }
  }

  return errors;
}