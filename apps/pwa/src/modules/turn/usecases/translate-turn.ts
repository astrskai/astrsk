import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";
import { translate } from "@/shared/utils/translate-utils";

import { TranslationConfig } from "@/modules/session/domain/translation-config";
import { LoadTurnRepo } from "@/modules/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/modules/turn/repos/save-turn-repo";

type Command = {
  turnId: UniqueEntityID;
  config: TranslationConfig;
};

export class TranslateTurn implements UseCase<Command, Result<void>> {
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private saveTurnRepo: SaveTurnRepo,
  ) {}

  // TODO: refactor, split to private methods (https://github.com/harpychat/h2o-app-nextjs/pull/33#discussion_r1801640359)
  async execute(command: Command): Promise<Result<void>> {
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
      return savedTurnOrError.isSuccess
        ? Result.ok()
        : formatFail("Failed to save turn", savedTurnOrError.getError());
    } catch (error) {
      return formatFail("Failed to translate turn", error);
    }
  }
}
