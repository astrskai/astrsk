import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail, logger, readFileToString } from "@/shared/utils";

import { defaultBackgrounds } from "@/app/stores/background-store";
import { Drizzle } from "@/db/drizzle";
import { CharacterCard } from "@/modules/card/domain";
import { GetCard } from "@/modules/card/usecases";
import { Session } from "@/modules/session/domain/session";
import { SaveSessionRepo } from "@/modules/session/repos";
import { AddMessage } from "@/modules/session/usecases/add-message";
import { ImportCharactersFromSessionFile } from "@/modules/session/usecases/import-characters-from-session-file";
import { Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";

type Command = {
  file: File;
  characterNameCardIdMap: Map<string, UniqueEntityID>;
};

export class ImportSessionFromFileV1
  implements UseCase<Command, Result<Session>>
{
  constructor(
    private importCharactersFromSessionFile: ImportCharactersFromSessionFile,
    private getCard: GetCard,
    private saveSessionRepo: SaveSessionRepo,
    private addMessage: AddMessage,
  ) {}

  async execute({
    file,
    characterNameCardIdMap,
  }: Command): Promise<Result<Session>> {
    try {
      const drizzle = await Drizzle.getInstance();
      return await drizzle.transaction(async (tx) => {
        // Get characters
        const charactersOrError =
          await this.importCharactersFromSessionFile.execute(file);
        if (charactersOrError.isFailure) {
          throw new Error(charactersOrError.getError());
        }
        const characters = charactersOrError.getValue();

        // Check characters length matched
        if (characters.length !== characterNameCardIdMap.size) {
          throw new Error("Characters length did not match");
        }

        // Check user character exists
        const userCharacter = characters.find((c) => c.isUser);
        if (!userCharacter) {
          throw new Error("User character not found");
        }

        // Get character cards
        const characterNameCardMap = new Map<string, CharacterCard>();
        for (const character of characters) {
          // Get card id
          const cardId = characterNameCardIdMap.get(character.name);
          if (!cardId) {
            throw new Error(`Card not found for character ${character.name}`);
          }

          // Get character card
          const characterCardOrError = await this.getCard.execute(cardId);
          if (characterCardOrError.isFailure) {
            throw new Error(characterCardOrError.getError());
          }
          const characterCard = characterCardOrError.getValue();

          // Add to map and list
          characterNameCardMap.set(character.name, characterCard);
        }

        // Create session
        const sessionOrError = Session.create({
          title: file.name.replace(/\.jsonl$/, ""),
          allCards: Array.from(characterNameCardMap.entries()).map(
            ([name, card]) => ({
              id: card.id,
              type: card.props.type,
              enabled: true,
            }),
          ),
          userCharacterCardId: characterNameCardMap.get(userCharacter.name)?.id,
          backgroundId: defaultBackgrounds[0].id,
        });
        if (sessionOrError.isFailure) {
          throw new Error(sessionOrError.getError());
        }
        let session = sessionOrError.getValue();

        // Save session
        const savedSessionOrError = await this.saveSessionRepo.saveSession(
          session,
          tx,
        );
        if (savedSessionOrError.isFailure) {
          throw new Error(savedSessionOrError.getError());
        }
        session = savedSessionOrError.getValue();

        // Read file content
        const fileText = await readFileToString(file);
        const lines = fileText
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch (error) {
              logger.error("Failed to parse line", line, error);
              return {};
            }
          });

        // Remove header line
        lines.shift();

        // Add messages
        for (const line of lines) {
          const {
            name = "",
            mes = "",
            swipe_id = 0,
            swipes = [],
            is_system = false,
          } = line as Record<string, any>;

          // Skip system message
          if (is_system) {
            continue;
          }

          // Get character card
          const characterCard = characterNameCardMap.get(name);

          // Create message
          const options =
            swipes.length > 0
              ? swipes.map((swipe: string) =>
                  Option.create({ content: swipe, tokenSize: 0 }).getValue(),
                )
              : [Option.create({ content: mes, tokenSize: 0 }).getValue()];
          const selectedOptionIndex = swipe_id;
          const messageOrError = Turn.create({
            sessionId: session.id,
            characterCardId: characterCard?.id,
            characterName: characterCard?.props.name,
            options: options,
            selectedOptionIndex: selectedOptionIndex,
          });
          if (messageOrError.isFailure) {
            throw new Error(messageOrError.getError());
          }
          const message = messageOrError.getValue();

          // Add message
          const addMessageResult = await this.addMessage.execute({
            sessionId: session.id,
            message: message,
            tx: tx,
          });
          if (addMessageResult.isFailure) {
            throw new Error(addMessageResult.getError());
          }
          session = addMessageResult.getValue().session;
        }

        // Return imported session
        return Result.ok(session);
      });
    } catch (error) {
      return formatFail("Failed to import session", error);
    }
  }
}
