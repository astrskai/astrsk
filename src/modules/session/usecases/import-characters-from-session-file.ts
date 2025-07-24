import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { formatFail, logger, readFileToString } from "@/shared/utils";

type CharacterListItem = {
  name: string;
  isUser: boolean;
};

export class ImportCharactersFromSessionFile
  implements UseCase<File, Result<CharacterListItem[]>>
{
  async execute(file: File): Promise<Result<CharacterListItem[]>> {
    // Check file extension
    const ext = file.name.split(".").pop();
    if (ext !== "jsonl") {
      return formatFail("Invalid file type", ext);
    }

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

    // Make character list
    const characterMap = new Map<string, CharacterListItem>();
    for (const line of lines) {
      const {
        name = "",
        is_group = false,
        is_user = false,
        is_system = false,
        user_name = "",
        character_name = "",
      } = line as Record<string, any>;
      // Skip groups and systems
      if (is_group || is_system) {
        continue;
      }

      // Header
      if (user_name && character_name) {
        characterMap.set(user_name, { name: user_name, isUser: true });
        characterMap.set(character_name, {
          name: character_name,
          isUser: false,
        });
        continue;
      }

      // Messages
      if (!name) {
        continue;
      }
      if (is_user) {
        characterMap.set(name, { name, isUser: true });
      } else {
        characterMap.set(name, { name, isUser: false });
      }
    }

    return Result.ok(Array.from(characterMap.values()));
  }
}
