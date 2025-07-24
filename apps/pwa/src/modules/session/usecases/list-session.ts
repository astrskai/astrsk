import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/utils";

import { Session } from "@/modules/session/domain/session";
import {
  GetSessionsQuery,
  LoadSessionRepo,
} from "@/modules/session/repos/load-session-repo";

export class ListSession
  implements UseCase<GetSessionsQuery, Result<Session[]>>
{
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute(query: GetSessionsQuery): Promise<Result<Session[]>> {
    try {
      const sessions = await this.loadSessionRepo.getSessions(query);
      if (sessions.isFailure) {
        return Result.fail(sessions.getError());
      }
      return Result.ok<Session[]>(sessions.getValue());
    } catch (error) {
      return formatFail("Failed to list sessions", error);
    }
  }
}
