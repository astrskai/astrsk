/**
 * Backend API Server for Card Sync
 *
 * Receives cards from PWA and saves them to cloud Postgres
 * Electric SQL then syncs them back to all connected browsers
 */

import express from 'express';
import postgres from 'postgres';
import cors from 'cors';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:54321/electric';
const PORT = process.env.PORT || 3001;

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Create Postgres connection
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * POST /api/cards
 *
 * Receives a card from the PWA and saves it to Postgres
 */
app.post('/api/cards', async (req, res) => {
  const { card } = req.body;

  // Validate request
  if (!card || !card.common) {
    return res.status(400).json({
      error: 'Invalid card data: missing card or card.common'
    });
  }

  try {
    // Start transaction
    await sql.begin(async (sql) => {
      const c = card.common;

      // Upsert cards table with timestamp-based conflict resolution
      // Only update if incoming version is newer (prevents old edits from overwriting new ones)
      await sql`
        INSERT INTO cards (
          id, title, icon_asset_id, type, tags, creator, card_summary,
          version, conceptual_origin, vibe_session_id, image_prompt,
          sync_status, deleted_at, created_at, updated_at
        ) VALUES (
          ${c.id}, ${c.title}, ${c.icon_asset_id}, ${c.type},
          ${JSON.stringify(c.tags || [])}, ${c.creator}, ${c.card_summary},
          ${c.version}, ${c.conceptual_origin}, ${c.vibe_session_id},
          ${c.image_prompt}, 'synced', ${c.deleted_at || null}, ${c.created_at}, ${c.updated_at}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          icon_asset_id = EXCLUDED.icon_asset_id,
          tags = EXCLUDED.tags,
          creator = EXCLUDED.creator,
          card_summary = EXCLUDED.card_summary,
          version = EXCLUDED.version,
          conceptual_origin = EXCLUDED.conceptual_origin,
          vibe_session_id = EXCLUDED.vibe_session_id,
          image_prompt = EXCLUDED.image_prompt,
          sync_status = 'synced',
          deleted_at = EXCLUDED.deleted_at,
          updated_at = EXCLUDED.updated_at
        WHERE cards.updated_at <= EXCLUDED.updated_at OR cards.updated_at IS NULL
      `;

      // Upsert character_cards or plot_cards with timestamp-based conflict resolution
      if (c.type === 'character' && card.character) {
        const ch = card.character;
        await sql`
          INSERT INTO character_cards (
            id, name, description, example_dialogue, lorebook,
            created_at, updated_at
          ) VALUES (
            ${ch.id}, ${ch.name}, ${ch.description}, ${ch.example_dialogue},
            ${JSON.stringify(ch.lorebook || null)}, ${ch.created_at}, ${ch.updated_at}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            example_dialogue = EXCLUDED.example_dialogue,
            lorebook = EXCLUDED.lorebook,
            updated_at = EXCLUDED.updated_at
          WHERE character_cards.updated_at <= EXCLUDED.updated_at OR character_cards.updated_at IS NULL
        `;
      } else if (c.type === 'plot' && card.plot) {
        const p = card.plot;
        await sql`
          INSERT INTO plot_cards (
            id, description, scenarios, lorebook,
            created_at, updated_at
          ) VALUES (
            ${p.id}, ${p.description}, ${JSON.stringify(p.scenarios || null)},
            ${JSON.stringify(p.lorebook || null)}, ${p.created_at}, ${p.updated_at}
          )
          ON CONFLICT (id) DO UPDATE SET
            description = EXCLUDED.description,
            scenarios = EXCLUDED.scenarios,
            lorebook = EXCLUDED.lorebook,
            updated_at = EXCLUDED.updated_at
          WHERE plot_cards.updated_at <= EXCLUDED.updated_at OR plot_cards.updated_at IS NULL
        `;
      }
    });

    console.log(`✅ Synced card ${card.common.id} (${card.common.title}) to Postgres`);

    res.json({
      success: true,
      cardId: card.common.id
    });
  } catch (error) {
    console.error('❌ Error saving card:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * DELETE /api/cards/:id
 *
 * Soft deletes a card from Postgres (sets deleted_at timestamp)
 * This allows Electric SQL to sync the deletion to all browsers
 */
app.delete('/api/cards/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete: set deleted_at timestamp
    const result = await sql`
      UPDATE cards
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'synced'
      WHERE id = ${id}
      RETURNING id, title
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Card not found'
      });
    }

    console.log(`✅ Soft deleted card ${id} (${result[0].title}) from Postgres`);

    res.json({
      success: true,
      cardId: id
    });
  } catch (error) {
    console.error('❌ Error soft deleting card:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /health
 *
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 POST endpoint: http://localhost:${PORT}/api/cards`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await sql.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await sql.end();
  process.exit(0);
});
