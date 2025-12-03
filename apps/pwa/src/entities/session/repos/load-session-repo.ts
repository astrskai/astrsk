import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Session } from "@/entities/session/domain/session";
import { SortOptionValue } from "@/shared/config/sort-options";

/**
 * Lightweight session data for sidebar list
 * Only contains fields needed for display, not full session data
 */
export type SessionListItem = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: Date;
};

export type SearchSessionsQuery = {
  // Pagination
  cursor?: UniqueEntityID;
  pageSize?: number;

  // Search
  keyword?: string;

  // Sort
  sort?: SortOptionValue;

  // Filter by play session
  isPlaySession?: boolean;
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

  /**
   * Get lightweight session list items for sidebar
   * Only fetches id, title, message count, and updatedAt
   */
  getSessionListItems(
    query: { isPlaySession?: boolean; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<SessionListItem[]>>;
}
