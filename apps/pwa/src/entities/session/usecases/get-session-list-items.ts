import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { LoadSessionRepo, SessionListItem } from "@/entities/session/repos";

type Query = {
  isPlaySession?: boolean;
  pageSize?: number;
};

export class GetSessionListItems implements UseCase<Query, Result<SessionListItem[]>> {
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute(query: Query): Promise<Result<SessionListItem[]>> {
    try {
      return await this.loadSessionRepo.getSessionListItems(query);
    } catch (error) {
      return formatFail("Failed to get session list items", error);
    }
  }
}
