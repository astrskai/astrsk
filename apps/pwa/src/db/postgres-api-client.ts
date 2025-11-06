/**
 * Postgres API Client
 *
 * Sends local card changes to cloud Postgres via HTTP API
 */

import { logger } from "@/shared/lib/logger";
import { SelectCard } from "@/db/schema/cards";

const POSTGRES_API_URL = import.meta.env.VITE_POSTGRES_API_URL;

export interface SyncCardPayload {
  card: SelectCard;
}

export class PostgresApiClient {
  /**
   * Sync a card to cloud Postgres
   */
  static async syncCard(card: SelectCard): Promise<boolean> {
    if (!POSTGRES_API_URL) {
      logger.warn('VITE_POSTGRES_API_URL not configured, skipping sync');
      return false;
    }

    try {
      const response = await fetch(`${POSTGRES_API_URL}/api/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info(`Successfully synced card ${card.common.id} to Postgres`);
      return true;
    } catch (error) {
      logger.error(`Failed to sync card ${card.common.id}:`, error);
      return false;
    }
  }

  /**
   * Delete a card from cloud Postgres
   */
  static async deleteCard(cardId: string): Promise<boolean> {
    if (!POSTGRES_API_URL) {
      logger.warn('VITE_POSTGRES_API_URL not configured, skipping delete');
      return false;
    }

    try {
      const response = await fetch(`${POSTGRES_API_URL}/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info(`Successfully deleted card ${cardId} from Postgres`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete card ${cardId}:`, error);
      return false;
    }
  }
}
