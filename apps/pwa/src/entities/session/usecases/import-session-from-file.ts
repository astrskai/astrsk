import JSZip from "jszip";

import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { defaultBackgrounds } from "@/shared/stores/background-store";
import { InsertSession } from "@/db/schema/sessions";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
import { CardType } from "@/entities/card/domain/card";
import { ImportCardFromFile } from "@/entities/card/usecases/import-card-from-file";
import { ImportFlowWithNodes } from "@/entities/flow/usecases/import-flow-with-nodes";
import { Session } from "@/entities/session/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { SaveSessionRepo } from "@/entities/session/repos";
import { AddMessage } from "@/entities/session/usecases/add-message";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { ApiSource } from "@/entities/api/domain";

interface Command {
  file: File;
  includeHistory?: boolean;
  agentModelOverrides?: Map<
    string,
    {
      apiSource: string;
      modelId: string;
      modelName: string;
    }
  >;
}

export class ImportSessionFromFile
  implements UseCase<Command, Result<Session>> {
  constructor(
    private saveSessionRepo: SaveSessionRepo,
    private importFlowWithNodes: ImportFlowWithNodes,
    private importCardFromFile: ImportCardFromFile,
    private saveFileToBackground: SaveFileToBackground,
    private addMessage: AddMessage,
  ) { }

  private async importSessionFromZip(
    zip: JSZip,
  ): Promise<Partial<InsertSession>> {
    // Get session.json file
    const sessionFile = zip.file("session.json");
    if (!sessionFile) {
      throw new Error("Invalid session file: missing session.json");
    }

    // Read and parse session.json
    const sessionJsonContent = await sessionFile.async("text");
    return JSON.parse(sessionJsonContent);
  }

  private async importFlowFromZip(
    zip: JSZip,
    sessionId: UniqueEntityID,
    agentModelOverrides?: Command["agentModelOverrides"],
  ): Promise<Map<string, string>> {
    // Make ID map
    const idMap = new Map<string, string>();

    // Get prompts folder
    const folder = zip.folder("flows");
    if (!folder) {
      return idMap;
    }

    // Get all files in the folder
    const fileEntries = folder.filter(() => true);
    for (const fileEntry of fileEntries) {
      // Read file
      const fileBlob = await fileEntry.async("blob");
      const file = new File([fileBlob], fileEntry.name);

      // Import flow from file with nodes (as session-local)
      const flowOrError = await this.importFlowWithNodes.execute({
        file,
        sessionId, // Import directly as session-local
        agentModelOverrides,
      });
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }

      // Set new ID
      const flow = flowOrError.getValue();
      const oldId = fileEntry.name.split(".")[0].split("/")[1];
      idMap.set(oldId, flow.id.toString());
    }

    // Return ID map
    return idMap;
  }

  private async importCardFromZip(
    zip: JSZip,
    sessionId: UniqueEntityID,
  ): Promise<Map<string, string>> {
    // Make ID map
    const idMap = new Map<string, string>();

    // Get cards folder
    const folder = zip.folder("cards");
    if (!folder) {
      return idMap;
    }

    // Get all files in the folder
    const fileEntries = folder.filter(() => true);
    for (const fileEntry of fileEntries) {
      // Read file
      const fileBlob = await fileEntry.async("blob");
      const file = new File([fileBlob], fileEntry.name, {
        type: "image/png",
      });
      // Import card from file (as session-local)
      const cardOrError = await this.importCardFromFile.execute({
        file,
        sessionId, // Import directly as session-local
      });
      if (cardOrError.isFailure) {
        throw new Error(cardOrError.getError());
      }

      // Handle ALL cards returned (PNG can contain character + scenario)
      const cards = cardOrError.getValue();
      const oldId = fileEntry.name.split(".")[0].split("/")[1];

      // Map the first card (main card from filename)
      if (cards.length > 0) {
        idMap.set(oldId, cards[0].id.toString());
      }

      // TODO: Handle embedded scenario cards (second card)
      // Need to determine how to map scenario IDs when they're embedded in character cards
    }

    // Return ID map
    return idMap;
  }

  private async importBackgroundFromZip(
    zip: JSZip,
    sessionId: UniqueEntityID,
  ): Promise<Map<string, string>> {
    // Make ID map
    const idMap = new Map<string, string>(
      defaultBackgrounds.map((bg) => [bg.id.toString(), bg.id.toString()]),
    );

    // Get backgrounds folder
    const folder = zip.folder("backgrounds");
    if (!folder) {
      return idMap;
    }

    // Get all files in the folder
    const fileEntries = folder.filter(() => true);
    for (const fileEntry of fileEntries) {
      // Read file
      const fileBlob = await fileEntry.async("blob");
      const file = new File([fileBlob], fileEntry.name);

      // Import background from file (as session-local)
      const backgroundOrError = await this.saveFileToBackground.execute({
        file,
        sessionId, // Pass sessionId for session-local background
      });
      if (backgroundOrError.isFailure) {
        throw new Error(backgroundOrError.getError());
      }

      // Set new ID
      const background = backgroundOrError.getValue();
      const oldId = fileEntry.name.split(".")[0].split("/")[1];
      idMap.set(oldId, background.id.toString());
    }

    // Return ID map
    return idMap;
  }

  private async addMessageFromZip(
    zip: JSZip,
    sessionId: UniqueEntityID,
    turnIds: string[],
    cardIdMap: Map<string, string>,
  ): Promise<Session> {
    // Get turns folder
    const folder = zip.folder("turns");
    if (!folder) {
      throw new Error("Turns folder not found in zip");
    }

    // Import turn and add to session
    let session: Session | null = null;
    for (const turnId of turnIds) {
      // Get turn file
      const turnFile = folder.file(`${turnId}.astrsk.turn`);
      if (!turnFile) {
        throw new Error(`Turn file ${turnId} not found in zip`);
      }

      // Read and parse turn file
      const turnJsonContent = await turnFile.async("text");
      const turnJson = JSON.parse(turnJsonContent);

      // Map character card ID if it exists
      let mappedCharacterCardId = turnJson.character_card_id;
      if (turnJson.character_card_id) {
        mappedCharacterCardId = cardIdMap.get(turnJson.character_card_id);
        if (!mappedCharacterCardId) {
          throw new Error(
            `Character card ID ${turnJson.character_card_id} not found in imported cards`,
          );
        }
      }

      // Ensure dates are properly formatted
      const turnData = {
        ...turnJson,
        id: new UniqueEntityID().toString(),
        session_id: sessionId.toString(),
        character_card_id: mappedCharacterCardId,
        created_at: turnJson.created_at
          ? new Date(turnJson.created_at)
          : new Date(),
        updated_at: turnJson.updated_at
          ? new Date(turnJson.updated_at)
          : new Date(),
      };

      const turn = TurnDrizzleMapper.toDomain(turnData);

      // Add message to session
      const addMessageOrError = await this.addMessage.execute({
        sessionId: sessionId,
        message: turn,
      });
      if (addMessageOrError.isFailure) {
        throw new Error(addMessageOrError.getError());
      }
      session = addMessageOrError.getValue().session;
    }

    // Return session
    if (!session) {
      throw new Error("Session not found");
    }
    return session;
  }

  async execute({
    file,
    includeHistory,
    agentModelOverrides,
  }: Command): Promise<Result<Session>> {
    try {
      // Load zip file
      const zipData = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(zipData);

      // Import session from zip
      const sessionProps = await this.importSessionFromZip(zip);

      // Create new session ID for session-local imports
      const newSessionId = new UniqueEntityID();

      // Parse translation if it exists
      let translationConfig;
      if (sessionProps.translation) {
        const translationResult = TranslationConfig.fromJSON(sessionProps.translation);
        if (translationResult.isSuccess) {
          translationConfig = translationResult.getValue();
        }
      }

      // Create session FIRST (without flows/cards) so it exists in database
      const sessionOrError = Session.create({
        title: sessionProps.title,
        allCards: [], // Will be updated after importing cards
        userCharacterCardId: undefined, // Will be updated after importing cards
        turnIds: [],
        backgroundId: undefined, // Will be updated after importing background
        translation: translationConfig,
        chatStyles: sessionProps.chat_styles
          ? sessionProps.chat_styles
          : undefined,
        flowId: undefined, // Will be updated after importing flow
      }, newSessionId);
      if (sessionOrError.isFailure) {
        throw new Error(sessionOrError.getError());
      }
      const session = sessionOrError.getValue();

      // Save session to database FIRST (so foreign keys will work)
      const savedSessionOrError =
        await this.saveSessionRepo.saveSession(session);
      if (savedSessionOrError.isFailure) {
        throw new Error(savedSessionOrError.getError());
      }
      let savedSession = savedSessionOrError.getValue();

      // NOW import flows and cards with the saved session ID
      // Import flow from zip (as session-local)
      const flowIdMap = await this.importFlowFromZip(zip, savedSession.id, agentModelOverrides);

      // Import cards from zip (as session-local)
      const cardIdMap = await this.importCardFromZip(zip, savedSession.id);

      // Import background from zip (as session-local)
      const backgroundIdMap = await this.importBackgroundFromZip(zip, savedSession.id);

      // Merge ID maps
      const idMap = new Map<string, string>([
        ...flowIdMap,
        ...cardIdMap,
        ...backgroundIdMap,
      ]);

      // Replace IDs in session props
      if (sessionProps.flow_id) {
        const newFlowId = idMap.get(sessionProps.flow_id);
        if (!newFlowId) {
          throw new Error(
            `Flow ID ${sessionProps.flow_id} not found in ID map`,
          );
        }
        sessionProps.flow_id = newFlowId;
      }
      if (sessionProps.all_cards && sessionProps.all_cards.length > 0) {
        sessionProps.all_cards = sessionProps.all_cards.map((item) => {
          const newCardId = idMap.get(item.id);
          if (!newCardId) {
            throw new Error(`Card ID ${item.id} not found in ID map`);
          }
          return {
            ...item,
            id: newCardId,
          };
        });
      }
      if (sessionProps.user_character_card_id) {
        const newCardId = idMap.get(sessionProps.user_character_card_id);
        if (!newCardId) {
          throw new Error(
            `User character card ID ${sessionProps.user_character_card_id} not found in ID map`,
          );
        }
        sessionProps.user_character_card_id = newCardId;
      }
      if (sessionProps.background_id) {
        const newBackgroundId = idMap.get(sessionProps.background_id);
        if (!newBackgroundId) {
          throw new Error(
            `Background ID ${sessionProps.background_id} not found in ID map`,
          );
        }
        sessionProps.background_id = newBackgroundId;
      }

      // Update session with imported resources
      const updateResult = savedSession.update({
        allCards:
          sessionProps.all_cards?.map((cardJson) => ({
            id: new UniqueEntityID(cardJson.id),
            type: cardJson.type as CardType,
            enabled: cardJson.enabled,
          })) ?? [],
        userCharacterCardId: sessionProps.user_character_card_id
          ? new UniqueEntityID(sessionProps.user_character_card_id)
          : undefined,
        backgroundId: sessionProps.background_id
          ? new UniqueEntityID(sessionProps.background_id)
          : undefined,
        flowId: sessionProps.flow_id
          ? new UniqueEntityID(sessionProps.flow_id)
          : undefined,
      });
      if (updateResult.isFailure) {
        throw new Error(updateResult.getError());
      }

      // Save updated session with all resources
      const updatedSavedSessionOrError =
        await this.saveSessionRepo.saveSession(savedSession);
      if (updatedSavedSessionOrError.isFailure) {
        throw new Error(updatedSavedSessionOrError.getError());
      }
      savedSession = updatedSavedSessionOrError.getValue();

      // If session has history, Add messages
      // cardIdMap already contains session-local IDs since we imported directly
      if (
        includeHistory &&
        sessionProps.turn_ids &&
        sessionProps.turn_ids.length > 0
      ) {
        savedSession = await this.addMessageFromZip(
          zip,
          savedSession.id,
          sessionProps.turn_ids,
          cardIdMap, // Use cardIdMap directly (already has session-local IDs)
        );
      }

      // Return saved session
      return Result.ok(savedSession);
    } catch (error) {
      return formatFail("Failed to import session from file", error);
    }
  }
}
