import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session } from "@/entities/session/domain/session";
import { LoadSessionRepo } from "@/entities/session/repos/load-session-repo";

type Command = {
  cardId: UniqueEntityID;
};

export class ListSessionByCard implements UseCase<Command, Result<Session[]>> {
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute({ cardId }: Command): Promise<Result<Session[]>> {
    try {
      const sessionsOrError =
        await this.loadSessionRepo.getSessionsByCardId(cardId);
      if (sessionsOrError.isFailure) {
        throw new Error(sessionsOrError.getError());
      }
      return Result.ok<Session[]>(sessionsOrError.getValue());
    } catch (error) {
      return formatFail("Failed to list sessions by card", error);
    }
  }
}
