import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { formatFail } from "@/shared/lib/error-utils";

import { Session } from "@/entities/session/domain/session";
import { LoadSessionRepo } from "@/entities/session/repos/load-session-repo";

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
