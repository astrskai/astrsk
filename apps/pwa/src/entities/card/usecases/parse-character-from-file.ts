/**
 * Parse Character From File
 *
 * Parses character data from PNG/JSON file WITHOUT saving to database.
 * Returns raw character data that can be used to create DraftCharacter.
 *
 * Used during session creation wizard for lazy character creation pattern.
 */

import { isArray } from "lodash-es";

import { Result, UseCase } from "@/shared/core";
import { readFileToString } from "@/shared/lib/file-utils";
import { PNGMetadata } from "@/shared/lib/png-metadata";
import type { LorebookEntryData } from "@/entities/character/api/mutations";

const validSpecs = [
  "chara_card_v2",
  "chara_card_v3",
];

interface ParseCharacterCommand {
  file: File;
}

/**
 * Parsed character data structure
 * Contains all data needed to create a character card later
 */
export interface ParsedCharacterData {
  name: string;
  description: string;
  tags?: string[];
  cardSummary?: string;
  exampleDialogue?: string;
  creator?: string;
  version?: string;
  conceptualOrigin?: string;
  // Image file for later upload
  imageFile?: File;
  // 1:1 Session config
  scenario?: string;
  firstMessages?: { name: string; description: string }[];
  lorebook?: LorebookEntryData[];
}

export class ParseCharacterFromFile
  implements UseCase<ParseCharacterCommand, Result<ParsedCharacterData[]>>
{
  async execute({
    file,
  }: ParseCharacterCommand): Promise<Result<ParsedCharacterData[]>> {
    try {
      let jsonData: any;
      let imageFile: File | undefined;

      if (file.type === "image/png") {
        // Handle PNG file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = PNGMetadata.extractMetadataFromImage(buffer);

        if (!result) {
          return Result.fail("No character metadata found in PNG file");
        }

        jsonData = result.metadata;

        // Check if V1 character card and convert to V2
        if (
          "spec" in jsonData === false &&
          "name" in jsonData &&
          "description" in jsonData &&
          "personality" in jsonData &&
          "scenario" in jsonData &&
          "first_mes" in jsonData &&
          "mes_example" in jsonData
        ) {
          // Convert to V2 character card
          jsonData.data = {
            ...jsonData,
          };
          jsonData.spec = "chara_card_v2";
        }

        // Check if this is a placeholder image
        const isPlaceholderImage =
          jsonData.data?.extensions?.isPlaceholderImage === true;

        // Only keep image file if it's not a placeholder
        if (!isPlaceholderImage) {
          imageFile = file;
        }
      } else {
        // Handle JSON file
        const fileText = await readFileToString(file);
        jsonData = JSON.parse(fileText);
      }

      // Check spec - only support character cards
      if ("spec" in jsonData === false || !validSpecs.includes(jsonData.spec)) {
        return Result.fail("Invalid or unsupported card file");
      }

      // Parse character card data
      const data = jsonData.data;

      // Build firstMessages array from first_mes and alternate_greetings
      let firstMessages: { name: string; description: string }[] | undefined;
      if (
        data.first_mes ||
        (data.alternate_greetings &&
          isArray(data.alternate_greetings) &&
          data.alternate_greetings.length > 0)
      ) {
        firstMessages = [];
        if (data.first_mes) {
          firstMessages.push({
            name: "firstMessage",
            description: data.first_mes,
          });
        }
        if (data.alternate_greetings && isArray(data.alternate_greetings)) {
          firstMessages = firstMessages.concat(
            data.alternate_greetings.map((greeting: string) => ({
              name: "alternateGreeting",
              description: greeting,
            })),
          );
        }
      }

      // Parse lorebook entries
      let lorebook: LorebookEntryData[] | undefined;
      if (data.character_book?.entries) {
        lorebook = data.character_book.entries.map((entry: any) => ({
          id: entry.extensions?.id || crypto.randomUUID(),
          name: entry.name,
          enabled: entry.enabled ?? true,
          keys: entry.keys || [],
          recallRange:
            entry.extensions?.recallRange ?? entry.extensions?.scanDepth ?? 100,
          content: entry.content,
        }));
      }

      const parsedCharacter: ParsedCharacterData = {
        name: data.name,
        description: data.description,
        tags: data.tags ?? data.extensions?.tags,
        cardSummary:
          data.extensions?.cardSummary ??
          data.creator_notes ??
          data.extensions?.creatorNote,
        exampleDialogue: data.mes_example,
        creator: data.creator ?? data.extensions?.creator,
        version: data.character_version ?? data.extensions?.version,
        conceptualOrigin:
          data.extensions?.conceptualOrigin ?? data.extensions?.source,
        imageFile,
        scenario: data.scenario || undefined,
        firstMessages,
        lorebook,
      };

      return Result.ok([parsedCharacter]);
    } catch (error) {
      return Result.fail<ParsedCharacterData[]>(
        `Failed to parse character from file: ${error}`,
      );
    }
  }
}
