import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { formatFail } from "@/shared/utils/error-utils";

import { Session } from "@/modules/session/domain/session";
import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";

export class GetSession implements UseCase<UniqueEntityID, Result<Session>> {
  constructor(private loadSessionRepo: LoadSessionRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Session>> {
    try {
      return this.loadSessionRepo.getSessionById(id);
    } catch (error) {
      return formatFail("Failed to load session", error);
    }
  }
}
