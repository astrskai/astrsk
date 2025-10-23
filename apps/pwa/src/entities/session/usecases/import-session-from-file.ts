import JSZip from "jszip";

import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { defaultBackgrounds } from "@/app/stores/background-store";
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
  implements UseCase<Command, Result<Session>>
{
  constructor(
    private saveSessionRepo: SaveSessionRepo,
    private importFlowWithNodes: ImportFlowWithNodes,
    private importCardFromFile: ImportCardFromFile,
    private saveFileToBackground: SaveFileToBackground,
    private addMessage: AddMessage,
  ) {}

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

      // Import flow from file with nodes
      const flowOrError = await this.importFlowWithNodes.execute({
        file,
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

  private async importCardFromZip(zip: JSZip): Promise<Map<string, string>> {
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

      // Import card from file
      const cardOrError = await this.importCardFromFile.execute(file);
      if (cardOrError.isFailure) {
        throw new Error(cardOrError.getError());
      }

      // Set new ID
      const card = cardOrError.getValue()[0];
      const oldId = fileEntry.name.split(".")[0].split("/")[1];
      idMap.set(oldId, card.id.toString());
    }

    // Return ID map
    return idMap;
  }

  private async importBackgroundFromZip(
    zip: JSZip,
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

      // Import background from file
      const backgroundOrError = await this.saveFileToBackground.execute(file);
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

      // Import flow from zip
      const flowIdMap = await this.importFlowFromZip(zip, agentModelOverrides);

      // Import cards from zip
      const cardIdMap = await this.importCardFromZip(zip);

      // Import background from zip
      const backgroundIdMap = await this.importBackgroundFromZip(zip);

      // Merge ID maps
      const idMap = new Map<string, string>([
        ...flowIdMap,
        ...cardIdMap,
        ...backgroundIdMap,
      ]);

      // Replace IDs in session
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

      // Create session
      const sessionOrError = Session.create({
        title: sessionProps.title,
        allCards:
          sessionProps.all_cards?.map((cardJson) => ({
            id: new UniqueEntityID(cardJson.id),
            type: cardJson.type as CardType,
            enabled: cardJson.enabled,
          })) ?? [],
        userCharacterCardId: sessionProps.user_character_card_id
          ? new UniqueEntityID(sessionProps.user_character_card_id)
          : undefined,
        turnIds: [],
        backgroundId: sessionProps.background_id
          ? new UniqueEntityID(sessionProps.background_id)
          : undefined,
        translation: sessionProps.translation
          ? TranslationConfig.fromJSON(sessionProps.translation).getValue()
          : undefined,
        chatStyles: sessionProps.chat_styles
          ? sessionProps.chat_styles
          : undefined,
        flowId: sessionProps.flow_id
          ? new UniqueEntityID(sessionProps.flow_id)
          : undefined,
      });
      if (sessionOrError.isFailure) {
        throw new Error(sessionOrError.getError());
      }
      const session = sessionOrError.getValue();

      // Save session
      const savedSessionOrError =
        await this.saveSessionRepo.saveSession(session);
      if (savedSessionOrError.isFailure) {
        throw new Error(savedSessionOrError.getError());
      }
      let savedSession = savedSessionOrError.getValue();

      // If session has history, Add messages
      if (
        includeHistory &&
        sessionProps.turn_ids &&
        sessionProps.turn_ids.length > 0
      ) {
        savedSession = await this.addMessageFromZip(
          zip,
          savedSession.id,
          sessionProps.turn_ids,
          cardIdMap,
        );
      }

      // Return saved session
      return Result.ok(savedSession);
    } catch (error) {
      return formatFail("Failed to import session from file", error);
    }
  }
}
