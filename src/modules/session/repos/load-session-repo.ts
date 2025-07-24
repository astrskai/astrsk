import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Session } from "@/modules/session/domain/session";

export type SearchSessionsQuery = {
  // Pagination
  cursor?: UniqueEntityID;
  pageSize?: number;

  // Search
  keyword?: string;
};

export type GetSessionsQuery = {
  // Pagination
  limit?: number;
  offset?: number;
};

export interface LoadSessionRepo {
  searchSessions(
    query: SearchSessionsQuery,
    tx?: Transaction,
  ): Promise<Result<Session[]>>;
  getSessionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session>>;

  // TODO: merge with searchSessions or remove
  getSessions(
    query: GetSessionsQuery,
    tx?: Transaction,
  ): Promise<Result<Session[]>>;

  getSessionsByCardId(
    cardId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session[]>>;
  getSessionsByFlowId(
    flowId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session[]>>;
}
