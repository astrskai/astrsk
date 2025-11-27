import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Background } from "@/entities/background/domain";

export type ListBackgroundQuery = {
  sessionId?: UniqueEntityID;
  limit?: number;
  offset?: number;
};

export interface LoadBackgroundRepo {
  listBackgrounds(
    query: {
      sessionId?: UniqueEntityID;
      cursor?: UniqueEntityID;
      pageSize?: number;
    },
    tx?: Transaction,
  ): Promise<Result<Background[]>>;
  getBackgroundById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Background>>;
  getBackgrounds(
    query: ListBackgroundQuery,
    tx?: Transaction,
  ): Promise<Result<Background[]>>;
  getBackgroundsBySessionId(
    sessionId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Background[]>>;
}
