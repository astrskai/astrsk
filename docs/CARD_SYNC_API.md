# Card Sync API Documentation

## Overview

The PWA now has **bidirectional sync** between local PGlite and cloud Postgres:

```
Cloud Postgres ← Electric SQL → PGlite (Browser)
       ↑                           ↓
       └──── HTTP API ←──── Background Sync Worker
```

## Flow

1. **Cloud → Local** (READ): Electric SQL syncs Postgres to PGlite automatically
2. **Local → Cloud** (CREATE/UPDATE): Background worker POSTs local changes to your API
3. **Local → Cloud** (DELETE): Instant DELETE request when card is deleted

---

## Required Backend API Endpoints

### POST /api/cards

**Purpose**: Receive locally created/updated cards from the PWA and save them to Postgres

**Request Body**:
```json
{
  "card": {
    "common": {
      "id": "uuid",
      "title": "Card Title",
      "icon_asset_id": "uuid | null",
      "type": "character | plot",
      "tags": ["tag1", "tag2"],
      "creator": "string | null",
      "card_summary": "string | null",
      "version": "string | null",
      "conceptual_origin": "string | null",
      "vibe_session_id": "uuid | null",
      "image_prompt": "string | null",
      "sync_status": "pending | synced | failed",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "character": {  // Only if type === 'character'
      "id": "uuid",
      "name": "Character Name",
      "description": "string | null",
      "example_dialogue": "string | null",
      "lorebook": { "entries": [...] } | null,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "plot": {  // Only if type === 'plot'
      "id": "uuid",
      "description": "string | null",
      "scenarios": [...] | null,
      "lorebook": { "entries": [...] } | null,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Expected Behavior**:
1. Upsert card data into `cards` table
2. Upsert type-specific data into `character_cards` or `plot_cards`
3. Set `sync_status = 'synced'` in Postgres
4. Return 200 OK on success

**Example Response** (200 OK):
```json
{
  "success": true,
  "cardId": "uuid"
}
```

**Example Error** (400/500):
```json
{
  "error": "Error message"
}
```

### DELETE /api/cards/:id

**Purpose**: Delete a card from Postgres (triggered immediately when user deletes locally)

**Request**: No body required, card ID in URL path

**Expected Behavior**:
1. Delete from `character_cards` or `plot_cards` (foreign key)
2. Delete from `cards` table
3. Return 200 OK on success

**Example Response** (200 OK):
```json
{
  "success": true,
  "cardId": "uuid"
}
```

**Example Error** (400/500):
```json
{
  "error": "Error message"
}
```

---

## Backend Implementation Example (Node.js/Express)

```javascript
import express from 'express';
import pg from 'pg';

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

app.post('/api/cards', async (req, res) => {
  const { card } = req.body;

  if (!card || !card.common) {
    return res.status(400).json({ error: 'Invalid card data' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Upsert cards table
    await client.query(`
      INSERT INTO cards (
        id, title, icon_asset_id, type, tags, creator, card_summary,
        version, conceptual_origin, vibe_session_id, image_prompt,
        sync_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
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
        updated_at = EXCLUDED.updated_at
    `, [
      card.common.id,
      card.common.title,
      card.common.icon_asset_id,
      card.common.type,
      JSON.stringify(card.common.tags),
      card.common.creator,
      card.common.card_summary,
      card.common.version,
      card.common.conceptual_origin,
      card.common.vibe_session_id,
      card.common.image_prompt,
      'synced', // Always set to synced
      card.common.created_at,
      card.common.updated_at
    ]);

    // Upsert character_cards or plot_cards
    if (card.common.type === 'character' && card.character) {
      await client.query(`
        INSERT INTO character_cards (
          id, name, description, example_dialogue, lorebook,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          example_dialogue = EXCLUDED.example_dialogue,
          lorebook = EXCLUDED.lorebook,
          updated_at = EXCLUDED.updated_at
      `, [
        card.character.id,
        card.character.name,
        card.character.description,
        card.character.example_dialogue,
        JSON.stringify(card.character.lorebook),
        card.character.created_at,
        card.character.updated_at
      ]);
    } else if (card.common.type === 'plot' && card.plot) {
      await client.query(`
        INSERT INTO plot_cards (
          id, description, scenarios, lorebook,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description,
          scenarios = EXCLUDED.scenarios,
          lorebook = EXCLUDED.lorebook,
          updated_at = EXCLUDED.updated_at
      `, [
        card.plot.id,
        card.plot.description,
        JSON.stringify(card.plot.scenarios),
        JSON.stringify(card.plot.lorebook),
        card.plot.created_at,
        card.plot.updated_at
      ]);
    }

    await client.query('COMMIT');

    res.json({ success: true, cardId: card.common.id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving card:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.listen(3001, () => {
  console.log('API server running on http://localhost:3001');
});
```

---

## Testing

1. **Start your backend API** on http://localhost:3001
2. **Create a card in the PWA**
3. **Watch browser console** for sync logs:
   ```
   [INFO] Found 1 pending card(s) to sync
   [INFO] ✅ Synced card abc-123 (Card Title)
   ```
4. **Verify in Postgres**:
   ```sql
   SELECT id, title, sync_status FROM cards ORDER BY created_at DESC LIMIT 5;
   ```
5. **Open another browser** - card should appear automatically via Electric sync!

---

## Environment Variables

Make sure these are set in `.env.local`:

```bash
VITE_ELECTRIC_URL=http://localhost:3000/v1/shape
VITE_POSTGRES_API_URL=http://localhost:3001
```

---

## How It Works

1. **User creates a card** → Saved to PGlite with `sync_status = 'pending'`
2. **Background worker** (every 10s) finds pending cards
3. **POSTs to your API** at `${VITE_POSTGRES_API_URL}/api/cards`
4. **API saves to Postgres** with `sync_status = 'synced'`
5. **Electric detects change** in Postgres
6. **Electric syncs back** to PGlite (now with `sync_status = 'synced'`)
7. **Polling detects update** → UI refreshes
8. **Card appears in all browsers** automatically!

---

## Next Steps

1. ✅ Create the backend API endpoint (see example above)
2. ✅ Start your API server
3. ✅ Test creating a card locally
4. ✅ Verify it syncs to Postgres
5. ✅ Open another browser and see it appear automatically!
