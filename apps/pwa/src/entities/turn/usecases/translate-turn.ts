import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";
import { translate } from "@/shared/lib/translate-utils";

import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { Turn } from "@/entities/turn/domain/turn";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";

type Command = {
  turnId: UniqueEntityID;
  config: TranslationConfig;
};

export class TranslateTurn implements UseCase<Command, Result<Turn>> {
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private saveTurnRepo: SaveTurnRepo,
  ) {}

  // TODO: refactor, split to private methods (https://github.com/harpychat/h2o-app-nextjs/pull/33#discussion_r1801640359)
  async execute(command: Command): Promise<Result<Turn>> {
    try {
      // Get turn
      const turnOrError = await this.loadTurnRepo.getTurnById(command.turnId);
      if (turnOrError.isFailure) {
        return formatFail("Failed to get turn", turnOrError.getError());
      }
      const turn = turnOrError.getValue();

      // If translation config is none, skip translation
      const config = command.config;
      const langs = [];
      if (config.promptLanguage !== "none") {
        langs.push(config.promptLanguage);
      }
      if (config.displayLanguage !== "none") {
        langs.push(config.displayLanguage);
      }
      if (langs.length === 0) {
        return Result.ok();
      }

      // Translate turn
      for (const lang of langs) {
        if (turn.translations?.has(lang)) {
          continue;
        }
        const translatedTurn = await translate(turn.content, lang);
        turn.translations.set(lang, translatedTurn);
      }

      // Save turn
      const savedTurnOrError = await this.saveTurnRepo.saveTurn(turn);
      return savedTurnOrError;
    } catch (error) {
      return formatFail("Failed to translate turn", error);
    }
  }
}
