import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Session } from "@/modules/session/domain/session";
import {
  LoadSessionRepo,
  SearchSessionsQuery,
} from "@/modules/session/repos/load-session-repo";

export class SearchSession
  implements UseCase<SearchSessionsQuery, Result<Session[]>>
{
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute(query: SearchSessionsQuery): Promise<Result<Session[]>> {
    try {
      const sessionsOrError = await this.loadSessionRepo.searchSessions(query);
      if (sessionsOrError.isFailure) {
        throw new Error(sessionsOrError.getError());
      }
      return Result.ok(sessionsOrError.getValue());
    } catch (error) {
      return formatFail("Failed to search session", error);
    }
  }
}
