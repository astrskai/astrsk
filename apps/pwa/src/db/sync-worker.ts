/**
 * Background Sync Worker
 *
 * Periodically syncs pending local changes to cloud Postgres
 * - Polls every 10 seconds for cards with sync_status = 'pending'
 * - Sends them to Postgres API
 * - Updates sync_status to 'synced' on success
 */

import { Drizzle } from "@/db/drizzle";
import { cards } from "@/db/schema/cards";
import { characterCards } from "@/db/schema/character-cards";
import { plotCards } from "@/db/schema/plot-cards";
import { PostgresApiClient } from "@/db/postgres-api-client";
import { SelectCard } from "@/db/schema/cards";
import { logger } from "@/shared/lib/logger";
import { eq } from "drizzle-orm";

const SYNC_INTERVAL_MS = 10000; // 10 seconds
const BATCH_SIZE = 10; // Process 10 cards per cycle

let syncIntervalId: number | null = null;

/**
 * Start the background sync worker
 */
export async function startSyncWorker(): Promise<void> {
  if (syncIntervalId !== null) {
    logger.warn('Sync worker already running');
    return;
  }

  logger.info('Starting background sync worker...');

  // Run initial sync immediately
  await syncPendingCards();

  // Then poll every 10 seconds
  syncIntervalId = window.setInterval(syncPendingCards, SYNC_INTERVAL_MS);

  // Clean up on window unload
  window.addEventListener('beforeunload', stopSyncWorker);
}

/**
 * Stop the background sync worker
 */
export function stopSyncWorker(): void {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    logger.info('Background sync worker stopped');
  }
}

/**
 * Sync all pending cards to Postgres
 */
async function syncPendingCards(): Promise<void> {
  try {
    const db = await Drizzle.getInstance();

    // Find cards with sync_status = 'pending'
    const pendingCards = await db
      .select()
      .from(cards)
      .where(eq(cards.sync_status, 'pending'))
      .limit(BATCH_SIZE);

    if (pendingCards.length === 0) {
      return; // Nothing to sync
    }

    logger.info(`Found ${pendingCards.length} pending card(s) to sync`);

    for (const cardRow of pendingCards) {
      try {
        // Fetch full card data (including character/plot specific data)
        const fullCard = await fetchFullCard(db, cardRow.id, cardRow.type);

        if (!fullCard) {
          logger.error(`Failed to fetch full card data for ${cardRow.id}`);
          continue;
        }

        // Try to sync to Postgres
        const success = await PostgresApiClient.syncCard(fullCard);

        if (success) {
          // Update sync_status to 'synced'
          await db
            .update(cards)
            .set({ sync_status: 'synced' })
            .where(eq(cards.id, cardRow.id));

          logger.info(`✅ Synced card ${cardRow.id} (${cardRow.title})`);
        } else {
          // Keep as 'pending', will retry next cycle
          logger.warn(`⏳ Failed to sync card ${cardRow.id}, will retry`);
        }
      } catch (error) {
        logger.error(`Error syncing card ${cardRow.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in syncPendingCards:', error);
  }
}

/**
 * Fetch full card data including type-specific data
 */
async function fetchFullCard(
  db: any,
  cardId: string,
  cardType: string
): Promise<SelectCard | null> {
  try {
    const [cardRow] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId));

    if (!cardRow) {
      return null;
    }

    const fullCard: SelectCard = {
      common: cardRow,
    };

    if (cardType === 'character') {
      const [characterRow] = await db
        .select()
        .from(characterCards)
        .where(eq(characterCards.id, cardId));
      fullCard.character = characterRow || undefined;
    } else if (cardType === 'plot') {
      const [plotRow] = await db
        .select()
        .from(plotCards)
        .where(eq(plotCards.id, cardId));
      fullCard.plot = plotRow || undefined;
    }

    return fullCard;
  } catch (error) {
    logger.error(`Error fetching full card ${cardId}:`, error);
    return null;
  }
}
