import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { Turn } from "@/modules/turn/domain/turn";
import { Option, DataStoreSavedField } from "@/modules/turn/domain/option";
import { PlaceholderType, getPlaceholderContent } from "@/modules/turn/domain/placeholder-type";
import { SaveTurnRepo } from "@/modules/turn/repos/save-turn-repo";
import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/modules/session/repos/save-session-repo";

type Command = {
  sessionId: UniqueEntityID;
  placeholderType: PlaceholderType;
  baseTurnId?: UniqueEntityID; // Optional: base the placeholder on a previous turn
};

type Response = Turn;

export class CreatePlaceholderTurn implements UseCase<Command, Result<Response>> {
  constructor(
    private saveTurnRepo: SaveTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
    private loadTurnRepo?: { getTurnById(id: UniqueEntityID): Promise<Result<Turn>> }
  ) {}

  async execute(command: Command): Promise<Result<Response>> {
    try {
      const { sessionId, placeholderType, baseTurnId } = command;

      // Get session
      const sessionOrError = await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionOrError.isFailure) {
        return formatFail("Failed to load session", sessionOrError.getError());
      }
      const session = sessionOrError.getValue();

      // Get base turn data if provided
      let dataStore: DataStoreSavedField[] = [];
      let characterCardId: UniqueEntityID | undefined;
      
      if (baseTurnId && this.loadTurnRepo) {
        const baseTurnOrError = await this.loadTurnRepo.getTurnById(baseTurnId);
        if (baseTurnOrError.isSuccess) {
          const baseTurn = baseTurnOrError.getValue();
          dataStore = baseTurn.dataStore || [];
          characterCardId = baseTurn.characterCardId;
        }
      } else if (session.turnIds.length > 0 && this.loadTurnRepo) {
        // Use last turn as base if no baseTurnId provided
        const lastTurnId = session.turnIds[session.turnIds.length - 1];
        const lastTurnOrError = await this.loadTurnRepo.getTurnById(lastTurnId);
        if (lastTurnOrError.isSuccess) {
          const lastTurn = lastTurnOrError.getValue();
          dataStore = lastTurn.dataStore || [];
          characterCardId = lastTurn.characterCardId;
        }
      }

      // Create placeholder content based on type
      const content = getPlaceholderContent(placeholderType);

      // Create placeholder option
      const optionOrError = Option.create({
        content,
        tokenSize: 0,
        dataStore,
        translations: new Map(),
      });

      if (optionOrError.isFailure) {
        return formatFail("Failed to create placeholder option", optionOrError.getError());
      }

      // Create placeholder turn
      // Like scenario messages, placeholder turns have no characterCardId or characterName
      // But we store the original characterCardId in a special field for reference
      const turnOrError = Turn.create({
        sessionId,
        characterCardId: undefined, // No character for placeholders
        characterName: undefined,   // No character name for placeholders
        options: [optionOrError.getValue()],
        selectedOptionIndex: 0,
      });

      if (turnOrError.isFailure) {
        return formatFail("Failed to create placeholder turn", turnOrError.getError());
      }

      const turn = turnOrError.getValue();
      
      // Store metadata about the placeholder type and original character
      // We'll use the content prefix to identify placeholder type
      // The characterCardId is stored but not displayed
      (turn as any)._placeholderType = placeholderType;
      (turn as any)._originalCharacterCardId = characterCardId;

      // Save turn to database
      const saveResult = await this.saveTurnRepo.saveTurn(turn);
      if (saveResult.isFailure) {
        return formatFail("Failed to save placeholder turn", saveResult.getError());
      }

      // Add turn to session - use addMessage method (turns are called messages in session)
      session.addMessage(turn.id);
      const saveSessionResult = await this.saveSessionRepo.saveSession(session);
      if (saveSessionResult.isFailure) {
        return formatFail("Failed to update session", saveSessionResult.getError());
      }

      return Result.ok(turn);
    } catch (error) {
      return formatFail("Failed to create placeholder turn", error);
    }
  }

  /**
   * Helper to check if a turn is a placeholder
   */
  public static isPlaceholderTurn(turn: Turn): boolean {
    // Placeholder turns have no characterCardId and no characterName
    // and their content matches our placeholder content patterns
    if (turn.characterCardId || turn.characterName) {
      return false;
    }
    
    const content = turn.selectedOption?.content || '';
    return content === getPlaceholderContent(PlaceholderType.IMAGE) || 
           content === getPlaceholderContent(PlaceholderType.VIDEO);
  }

  /**
   * Helper to get placeholder type from a turn
   */
  public static getPlaceholderType(turn: Turn): PlaceholderType | null {
    if (!this.isPlaceholderTurn(turn)) {
      return null;
    }
    
    const content = turn.selectedOption?.content || '';
    if (content === getPlaceholderContent(PlaceholderType.IMAGE)) return PlaceholderType.IMAGE;
    if (content === getPlaceholderContent(PlaceholderType.VIDEO)) return PlaceholderType.VIDEO;
    return null;
  }
}