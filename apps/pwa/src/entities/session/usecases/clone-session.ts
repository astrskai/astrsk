import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session, CardListItem } from "@/entities/session/domain/session";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { LoadSessionRepo, SaveSessionRepo } from "@/entities/session/repos";
import { AddMessage } from "@/entities/session/usecases/add-message";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { AutoReply } from "@/shared/stores/session-store";
import { CloneCard } from "@/entities/card/usecases/clone-card";
import { CloneFlow } from "@/entities/flow/usecases/clone-flow";
import { CloneAsset } from "@/entities/asset/usecases/clone-asset";
import { CloneBackground } from "@/entities/background/usecases/clone-background";
import { getDefaultBackground } from "@/entities/background/api/query-factory";

type Command = {
  sessionId: UniqueEntityID;
  includeHistory?: boolean;
  /** Optional predefined ID for the cloned session (used for cloud export to avoid popup blockers) */
  clonedSessionId?: UniqueEntityID;
};

export class CloneSession implements UseCase<Command, Result<Session>> {
  constructor(
    private saveSessionRepo: SaveSessionRepo,
    private loadSessionRepo: LoadSessionRepo,
    private loadMessageRepo: LoadTurnRepo,
    private addMessage: AddMessage,
    private cloneCard?: CloneCard,
    private cloneFlow?: CloneFlow,
    private cloneAsset?: CloneAsset,
    private cloneBackground?: CloneBackground,
  ) { }

  async execute({
    sessionId,
    includeHistory = false,
    clonedSessionId,
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

    // Use predefined ID if provided, otherwise generate new ID
    const newSessionId = clonedSessionId ?? new UniqueEntityID();

    // Clone cover asset first (no foreign key to session)
    let clonedCoverId: string | null = null;
    if (originalSession.props.coverId) {
      if (!this.cloneAsset) {
        return formatFail(
          "Cannot clone resources",
          "CloneAsset dependency not provided",
        );
      }

      const clonedCoverResult = await this.cloneAsset.execute({
        assetId: originalSession.props.coverId,
      });

      if (clonedCoverResult.isFailure) {
        return formatFail(
          "Failed to clone cover asset",
          clonedCoverResult.getError(),
        );
      }

      clonedCoverId = clonedCoverResult.getValue().id.toString();
    }

    // Create session FIRST with empty cards and no flow (needed for foreign key constraints)
    // Flow has a foreign key to session, so session must exist before cloning flow
    const insertSession = SessionDrizzleMapper.toPersistence(originalSession);
    const clonedSession = SessionDrizzleMapper.toDomain({
      ...insertSession,
      id: newSessionId.toValue(),
      title: `Copy of ${originalSession.props.name}`,
      name: `Copy of ${originalSession.props.name}`,
      tags: insertSession.tags || [],
      summary: insertSession.summary ?? null,
      all_cards: [], // Start with empty cards, will update after cloning
      user_character_card_id: null, // Will update after cloning cards
      turn_ids: [],
      background_id: null, // Temporarily null, will update after cloning background
      cover_id: clonedCoverId,
      translation: insertSession.translation ?? null,
      chat_styles: insertSession.chat_styles ?? null,
      flow_id: null, // Will update after cloning flow
      auto_reply: insertSession.auto_reply ?? AutoReply.Random,
      data_schema_order: insertSession.data_schema_order ?? [],
      widget_layout: insertSession.widget_layout ?? null,
      is_play_session: insertSession.is_play_session ?? false,
      config: insertSession.config ?? {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Save session FIRST (so it exists for foreign key constraints on flow and cards)
    const saveClonedSessionResult =
      await this.saveSessionRepo.saveSession(clonedSession);
    if (saveClonedSessionResult.isFailure) {
      return formatFail(
        "Failed to save cloned session",
        saveClonedSessionResult.getError(),
      );
    }

    // NOW clone flow (session exists in DB, foreign key constraint will pass)
    let clonedFlowId: string | null = null;
    if (originalSession.props.flowId) {
      if (!this.cloneFlow) {
        return formatFail(
          "Cannot clone resources",
          "CloneFlow dependency not provided",
        );
      }

      const clonedFlowResult = await this.cloneFlow.execute({
        flowId: originalSession.props.flowId,
        sessionId: newSessionId, // Create session-local copy (hidden from global workflows list)
        shouldRename: false, // Don't rename for export
      });

      if (clonedFlowResult.isFailure) {
        return formatFail(
          "Failed to clone flow",
          clonedFlowResult.getError(),
        );
      }

      clonedFlowId = clonedFlowResult.getValue().id.toString();

      // Update session with cloned flow ID
      clonedSession.update({ flowId: new UniqueEntityID(clonedFlowId) });

      const updateFlowResult = await this.saveSessionRepo.saveSession(clonedSession);
      if (updateFlowResult.isFailure) {
        return formatFail(
          "Failed to update session with flow",
          updateFlowResult.getError(),
        );
      }
    }

    // Now clone all cards with session reference (session exists in DB now)
    const clonedCardIds: CardListItem[] = [];
    const cardIdMapping = new Map<string, UniqueEntityID>(); // old ID -> new ID

    for (const card of originalSession.props.allCards) {
      if (!this.cloneCard) {
        return formatFail(
          "Cannot clone resources",
          "CloneCard dependency not provided",
        );
      }

      const clonedCardResult = await this.cloneCard.execute({
        cardId: card.id,
        sessionId: newSessionId, // Create session-local copy (hidden from global lists)
      });

      if (clonedCardResult.isFailure) {
        return formatFail(
          `Failed to clone card ${card.id.toString()}`,
          clonedCardResult.getError(),
        );
      }

      const clonedCard = clonedCardResult.getValue();
      cardIdMapping.set(card.id.toString(), clonedCard.id);

      clonedCardIds.push({
        id: clonedCard.id,
        type: card.type,
        enabled: card.enabled,
      });
    }

    // Update user_character_card_id to the cloned card ID
    let clonedUserCharacterCardId: UniqueEntityID | undefined = undefined;
    if (originalSession.props.userCharacterCardId) {
      const newUserCardId = cardIdMapping.get(
        originalSession.props.userCharacterCardId.toString()
      );
      if (newUserCardId) {
        clonedUserCharacterCardId = newUserCardId;
      }
    }

    // Update session with cloned cards
    clonedSession.update({
      allCards: clonedCardIds,
      userCharacterCardId: clonedUserCharacterCardId,
    });

    const updateCardsResult = await this.saveSessionRepo.saveSession(clonedSession);
    if (updateCardsResult.isFailure) {
      return formatFail(
        "Failed to update session with cloned cards",
        updateCardsResult.getError(),
      );
    }

    // Clone background AFTER session is saved (unless it's a default background)
    if (originalSession.props.backgroundId) {
      // Check if it's a default background (astrsk-provided)
      const defaultBackground = getDefaultBackground(originalSession.props.backgroundId);

      if (defaultBackground) {
        // Default backgrounds are just CDN references, reuse the same ID
        clonedSession.update({ backgroundId: originalSession.props.backgroundId });

        const updateSessionResult = await this.saveSessionRepo.saveSession(clonedSession);
        if (updateSessionResult.isFailure) {
          return formatFail(
            "Failed to update session with background",
            updateSessionResult.getError(),
          );
        }
      } else {
        // User-uploaded background, needs to be cloned
        if (!this.cloneBackground) {
          return formatFail(
            "Cannot clone resources",
            "CloneBackground dependency not provided",
          );
        }

        const clonedBackgroundResult = await this.cloneBackground.execute({
          backgroundId: originalSession.props.backgroundId,
          sessionId: newSessionId, // Now session exists in DB
        });

        if (clonedBackgroundResult.isFailure) {
          return formatFail(
            "Failed to clone background",
            clonedBackgroundResult.getError(),
          );
        }

        const clonedBackgroundId = clonedBackgroundResult.getValue().id.toString();

        // Update session with cloned background ID
        clonedSession.update({ backgroundId: new UniqueEntityID(clonedBackgroundId) });

        const updateSessionResult = await this.saveSessionRepo.saveSession(clonedSession);
        if (updateSessionResult.isFailure) {
          return formatFail(
            "Failed to update session with background",
            updateSessionResult.getError(),
          );
        }
      }
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
