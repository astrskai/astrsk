import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Transaction } from "@/db/transaction";
import { Session } from "@/entities/session/domain/session";
import { LoadSessionRepo, SaveSessionRepo } from "@/entities/session/repos";
import { Turn } from "@/entities/turn/domain/turn";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { compressTurn } from "@/entities/turn/usecases/compress-turn";

type Command = {
  sessionId: UniqueEntityID;
  message: Turn;
  tx?: Transaction;
};

type SessionAndMessage = {
  session: Session;
  message: Turn;
};

export class AddMessage implements UseCase<Command, Result<SessionAndMessage>> {
  constructor(
    private saveMessageRepo: SaveTurnRepo,
    private loadTurnRepo: LoadTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
  ) {}

  async execute(command: Command): Promise<Result<SessionAndMessage>> {
    try {
      const { sessionId, message, tx } = command;

      // Get session
      const sessionOrError = await this.loadSessionRepo.getSessionById(
        sessionId,
        tx,
      );
      if (sessionOrError.isFailure) {
        return formatFail("Failed to load session", sessionOrError.getError());
      }

      // Save message
      const savedMessageOrError = await this.saveMessageRepo.saveTurn(
        message,
        tx,
      );
      if (savedMessageOrError.isFailure) {
        return formatFail(
          "Failed to save message",
          savedMessageOrError.getError(),
        );
      }

      // Add message to session
      const session = sessionOrError.getValue();
      const savedMessage = savedMessageOrError.getValue();
      session.addMessage(savedMessage.id);

      // Track last non-user character for user fallback
      if (
        savedMessage.characterCardId &&
        !savedMessage.characterCardId.equals(session.userCharacterCardId)
      ) {
        session.setConfig({
          lastNonUserCharacterId: savedMessage.characterCardId.toString(),
        });
      }

      const savedSesssionOrError = await this.saveSessionRepo.saveSession(
        session,
        tx,
      );
      if (savedSesssionOrError.isFailure) {
        return formatFail(
          "Failed to save session",
          savedSesssionOrError.getError(),
        );
      }

      // Compress message if compression is enabled for this session
      const compressedMessageOrError = await compressTurn({
        turnId: savedMessage.id,
        sessionId: sessionId,
        loadTurnRepo: this.loadTurnRepo,
        saveTurnRepo: this.saveMessageRepo,
        tx,
      });

      if (compressedMessageOrError.isFailure) {
        // Log compression failure but don't fail the entire operation
        console.warn(
          "[AddMessage] Compression failed:",
          compressedMessageOrError.getError()
        );
      }

      const finalMessage = compressedMessageOrError.isSuccess
        ? compressedMessageOrError.getValue()
        : savedMessage;

      return Result.ok({
        session: savedSesssionOrError.getValue(),
        message: finalMessage,
      });
    } catch (error) {
      return formatFail("Failed to add message", error);
    }
  }
}
