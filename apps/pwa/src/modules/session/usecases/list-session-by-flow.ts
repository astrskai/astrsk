import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session } from "@/modules/session/domain/session";
import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";

type Command = {
  flowId: UniqueEntityID;
};

export class ListSessionByFlow implements UseCase<Command, Result<Session[]>> {
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute({ flowId }: Command): Promise<Result<Session[]>> {
    try {
      const sessionsOrError =
        await this.loadSessionRepo.getSessionsByFlowId(flowId);
      if (sessionsOrError.isFailure) {
        throw new Error(sessionsOrError.getError());
      }
      return Result.ok<Session[]>(sessionsOrError.getValue());
    } catch (error) {
      return formatFail("Failed to list sessions by flow", error);
    }
  }
}
