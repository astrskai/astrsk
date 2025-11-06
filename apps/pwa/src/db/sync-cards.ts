/**
 * Electric Sync for Cards
 *
 * Syncs 3 tables bidirectionally between Postgres and PGlite:
 * - cards (main card data)
 * - character_cards (character-specific data)
 * - plot_cards (plot-specific data)
 */

import { PGliteInterface } from "@electric-sql/pglite";
import { logger } from "@/shared/lib/logger";
import { queryClient } from "@/shared/api/query-client";
import { cardQueries } from "@/entities/card/api/card-queries";

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000/v1/shape';

export async function initCardSync(db: PGliteInterface) {
  // Skip if Electric URL not configured
  if (!import.meta.env.VITE_ELECTRIC_URL && !import.meta.env.DEV) {
    logger.warn('Electric sync skipped: VITE_ELECTRIC_URL not set');
    return null;
  }

  try {
    logger.info('Starting Electric sync for cards...');

    // Sync all 3 card tables together
    // Electric handles conflicts automatically using primary key (UPSERT behavior)
    const sync = await db.electric.syncShapesToTables({
      shapes: {
        cards: {
          shape: { url: ELECTRIC_URL, params: { table: 'cards' } },
          table: 'cards',
          primaryKey: ['id'],
        },
        character_cards: {
          shape: { url: ELECTRIC_URL, params: { table: 'character_cards' } },
          table: 'character_cards',
          primaryKey: ['id'],
        },
        plot_cards: {
          shape: { url: ELECTRIC_URL, params: { table: 'plot_cards' } },
          table: 'plot_cards',
          primaryKey: ['id'],
        },
      },
      key: 'cards-sync',
      onInitialSync: () => {
        logger.info('Cards synced from cloud');
        queryClient.invalidateQueries({ queryKey: cardQueries.all() });
      },
    });

    logger.info('Electric sync active');

    // Poll for changes every 2 seconds to detect Electric sync updates
    // (db.live.changes only detects local changes, not Electric syncs)
    let lastCardCount = 0;
    let lastCardIds = new Set<string>();
    let lastUpdateTimestamps = new Map<string, number>();

    const pollForChanges = async () => {
      try {
        // Get count, IDs, and updated_at timestamps (only non-deleted cards)
        const countResult = await db.query('SELECT COUNT(*) as count FROM cards WHERE deleted_at IS NULL');
        const idsResult = await db.query('SELECT id, updated_at FROM cards WHERE deleted_at IS NULL');

        // Also check total count including deleted (for debugging)
        const totalResult = await db.query('SELECT COUNT(*) as count FROM cards');
        const totalCount = parseInt(totalResult.rows[0].count);

        const currentCount = parseInt(countResult.rows[0].count);
        const currentIds = new Set(idsResult.rows.map((row: any) => row.id));
        const currentTimestamps = new Map(
          idsResult.rows.map((row: any) => [
            row.id,
            new Date(row.updated_at).getTime()
          ])
        );

        // Detect changes (count change OR different IDs = additions/deletions)
        const countChanged = lastCardCount > 0 && currentCount !== lastCardCount;
        const idsChanged = lastCardIds.size > 0 && (
          currentIds.size !== lastCardIds.size ||
          ![...currentIds].every(id => lastCardIds.has(id))
        );

        // Detect updates (same IDs but different timestamps)
        let updatedIds: string[] = [];
        if (lastUpdateTimestamps.size > 0) {
          updatedIds = [...currentIds].filter(id => {
            const lastTimestamp = lastUpdateTimestamps.get(id);
            const currentTimestamp = currentTimestamps.get(id);
            return lastTimestamp && currentTimestamp && currentTimestamp > lastTimestamp;
          });
        }

        if (countChanged || idsChanged || updatedIds.length > 0) {
          const added = [...currentIds].filter(id => !lastCardIds.has(id)).length;
          const deleted = [...lastCardIds].filter(id => !currentIds.has(id)).length;
          const deletedIds = [...lastCardIds].filter(id => !currentIds.has(id));

          logger.info(
            `Detected card changes: ${lastCardCount} -> ${currentCount} ` +
            `(+${added} added, -${deleted} deleted, ${updatedIds.length} updated, total: ${totalCount}) ` +
            `Deleted IDs: ${deletedIds.join(', ') || 'none'} ` +
            `Updated IDs: ${updatedIds.join(', ') || 'none'}`
          );
          queryClient.invalidateQueries({ queryKey: cardQueries.all() });
        }

        lastCardCount = currentCount;
        lastCardIds = currentIds;
        lastUpdateTimestamps = currentTimestamps;
      } catch (error) {
        logger.error('Poll error:', error);
      }
    };

    // Initial count
    pollForChanges();

    // Poll every 2 seconds
    const pollInterval = setInterval(pollForChanges, 2000);

    // Clean up on window unload
    window.addEventListener('beforeunload', () => {
      clearInterval(pollInterval);
    });

    return sync;

  } catch (error) {
    logger.error('Electric sync failed:', error);
    return null;
  }
}
