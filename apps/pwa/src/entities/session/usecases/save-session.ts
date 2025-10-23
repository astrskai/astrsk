import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Session } from "@/entities/session/domain/session";
import { SaveSessionRepo } from "@/entities/session/repos";

type Command = {
  session: Session;
};

export class SaveSession implements UseCase<Command, Result<Session>> {
  constructor(private saveSessionRepo: SaveSessionRepo) {}

  async execute({ session }: Command): Promise<Result<Session>> {
    try {
      // Save session
      const saveSessionResult = await this.saveSessionRepo.saveSession(session);
      return saveSessionResult;
    } catch (error) {
      return formatFail("Failed to save session", error);
    }
  }
}
