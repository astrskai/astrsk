import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session } from "@/entities/session/domain/session";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { LoadSessionRepo, SaveSessionRepo } from "@/entities/session/repos";
import { AddMessage } from "@/entities/session/usecases/add-message";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { AutoReply } from "@/shared/stores/session-store";

type Command = {
  sessionId: UniqueEntityID;
  includeHistory?: boolean;
};

export class CloneSession implements UseCase<Command, Result<Session>> {
  constructor(
    private saveSessionRepo: SaveSessionRepo,
    private loadSessionRepo: LoadSessionRepo,
    private loadMessageRepo: LoadTurnRepo,
    private addMessage: AddMessage,
  ) {}

  async execute({
    sessionId,
    includeHistory = false,
  }: Command): Promise<Result<Session>> {
    // Fetch the original session
    const originalSessionResult =
      await this.loadSessionRepo.getSessionById(sessionId);
    if (originalSessionResult.isFailure) {
      return formatFail(
        "Failed to load session",
        originalSessionResult.getError(),
      );
    }
    const originalSession = originalSessionResult.getValue();

    // Clone the session using mapper
    const insertSession = SessionDrizzleMapper.toPersistence(originalSession);
    const clonedSession = SessionDrizzleMapper.toDomain({
      ...insertSession,
      id: new UniqueEntityID().toValue(),
      title: `Copy of ${originalSession.props.title}`,
      name: insertSession.name ?? null,
      tags: insertSession.tags || [],
      summary: insertSession.summary ?? null,
      user_character_card_id: insertSession.user_character_card_id ?? null,
      turn_ids: [],
      background_id: insertSession.background_id ?? null,
      cover_id: insertSession.cover_id ?? null,
      translation: insertSession.translation ?? null,
      chat_styles: insertSession.chat_styles ?? null,
      flow_id: insertSession.flow_id ?? null,
      auto_reply: insertSession.auto_reply ?? AutoReply.Random,
      data_schema_order: insertSession.data_schema_order ?? [],
      widget_layout: insertSession.widget_layout ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Save cloned session
    const saveClonedSessionResult =
      await this.saveSessionRepo.saveSession(clonedSession);
    if (saveClonedSessionResult.isFailure) {
      return formatFail(
        "Failed to save cloned session",
        saveClonedSessionResult.getError(),
      );
    }

    // Get message ids to clone
    const messageIdsToClone = includeHistory
      ? originalSession.props.turnIds.slice()
      : [];

    // Clone messages
    for (const messageIdToClone of messageIdsToClone) {
      // Get message
      const message = await this.loadMessageRepo.getTurnById(messageIdToClone);
      if (message.isFailure) {
        return formatFail("Failed to load message", message.getError());
      }

      // Clone message
      const messageDocument = TurnDrizzleMapper.toPersistence(
        message.getValue(),
      );
      const clonedMessage = TurnDrizzleMapper.toDomain({
        ...messageDocument,
        id: new UniqueEntityID().toValue(),
        session_id: clonedSession.id.toString(),
        character_card_id: messageDocument.character_card_id ?? null,
        character_name: messageDocument.character_name ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Add message to cloned session
      const addMessageResult = await this.addMessage.execute({
        sessionId: clonedSession.id,
        message: clonedMessage,
      });
      if (addMessageResult.isFailure) {
        return formatFail("Failed to add message", addMessageResult.getError());
      }
    }

    // Get cloned session
    return this.loadSessionRepo.getSessionById(clonedSession.id);
  }
}
