import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { DeleteSessionRepo } from "@/entities/session/repos/delete-session-repo";
import { LoadSessionRepo } from "@/entities/session/repos/load-session-repo";
import { DeleteTurnRepo } from "@/entities/turn/repos/delete-turn-repo";

export class DeleteSession implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private loadSessionRepo: LoadSessionRepo,
    private deleteMessageRepo: DeleteTurnRepo,
    private deleteSessionRepo: DeleteSessionRepo,
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // Get session
      const sessionOrError = await this.loadSessionRepo.getSessionById(id);
      if (sessionOrError.isFailure) {
        return Result.fail<void>(
          `Failed to get session: ${sessionOrError.getError()}`,
        );
      }

      // Delete messages
      const session = sessionOrError.getValue();
      if (session.props.turnIds.length > 0) {
        const bulkDeleteResult =
          await this.deleteMessageRepo.bulkDeleteTurnByIds(
            session.props.turnIds,
          );
        if (bulkDeleteResult.isFailure) {
          return Result.fail<void>(
            `Failed to delete messages: ${bulkDeleteResult.getError()}`,
          );
        }
      }

      // Delete session
      const deleteSessionResult =
        await this.deleteSessionRepo.deleteSessionById(id);
      if (deleteSessionResult.isFailure) {
        return Result.fail<void>(
          `Failed to delete session: ${deleteSessionResult.getError()}`,
        );
      }

      return Result.ok<void>();
    } catch (error) {
      return formatFail("Failed to delete session", error);
    }
  }
}
